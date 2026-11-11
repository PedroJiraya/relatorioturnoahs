import { formatCA, getDelayTimes } from './formatters';

export function downloadCsv({
  date,
  dateText,
  shift,
  team,
  workshop,
  supervisor,
  executors,
  appointments = [],
  stopped = [],
}) {
  const removeEmojis = (str = '') =>
    String(str || '')
      .replace(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu,
        '',
      )
      .trim();

  const rows = [];

  // 1. DADOS DO TURNO
  rows.push(['DADOS DO TURNO']);
  rows.push([
    'Data',
    'Turno',
    'Turma',
    'Oficina / Local',
    'Supervisor',
    'Executantes',
  ]);
  rows.push([
    dateText,
    shift,
    team || 'Não informado',
    workshop || 'Oficina N4WN',
    supervisor || 'Não informado',
    executors ? executors.replace(/\r?\n/g, ' | ') : 'Não informado',
  ]);
  rows.push([]);

  // 2. ATENDIMENTOS DOS ATIVOS EM MANUTENÇÃO
  rows.push(['ATENDIMENTOS DOS ATIVOS EM MANUTENÇÃO']);
  rows.push([
    'Item',
    'Ativo',
    'Código',
    'Horário Início Atendimento',
    'Horário Fim Atendimento',
    'Tipo de Atraso',
    'Justificativa do Atraso',
    'Horário Início Atraso',
    'Horário Fim Atraso',
    'Sistema',
    'Conjunto',
    'Item (Falha)',
    'Problema',
    'Solução',
    'Causa Operacional',
    'Diagnóstico Executado',
    'Solução Aplicada',
    'Status Final',
  ]);

  appointments.forEach((item, idx) => {
    const effectiveStatus =
      item.endTime &&
      item.endTime.trim() &&
      item.status === 'Aguardando recurso'
        ? 'Liberado'
        : item.status || 'Liberado';

    const delaysList = (item.delays || [])
      .map((d, dIdx) => ({
        ...d,
        justification:
          dIdx === 0 ? d.justification || 'AG ATENDIMENTO' : d.justification,
      }))
      .filter((d) => d.justification);

    if (delaysList.length === 0) {
      rows.push([
        String(idx + 1),
        formatCA(item.asset) || 'Ativo não informado',
        item.code || '',
        item.startTime || '',
        item.endTime || '',
        'Principal (Mãe)',
        'AG ATENDIMENTO',
        item.startTime || '',
        item.endTime || '',
        item.system || '',
        item.component || '',
        item.subcomponent || '',
        item.cause || '',
        item.faultSolution || '',
        item.operationalCause || '',
        item.diagnosis || '',
        item.solution || '',
        effectiveStatus,
      ]);
    } else {
      delaysList.forEach((d, dIdx) => {
        const { effectiveStart, effectiveEnd } = getDelayTimes(
          delaysList,
          dIdx,
          item.startTime,
        );
        const tipoAtraso =
          dIdx === 0 ? 'Principal (Mãe)' : 'Subsequente (Filho)';

        rows.push([
          String(idx + 1),
          formatCA(item.asset) || 'Ativo não informado',
          item.code || '',
          item.startTime || '',
          item.endTime || '',
          tipoAtraso,
          d.justification,
          effectiveStart,
          effectiveEnd,
          item.system || '',
          item.component || '',
          item.subcomponent || '',
          item.cause || '',
          item.faultSolution || '',
          item.operationalCause || '',
          item.diagnosis || '',
          item.solution || '',
          effectiveStatus,
        ]);
      });
    }
  });

  // 3. EQUIPAMENTOS PARADOS
  const stoppedList = stopped.filter((item) => item.asset.trim());
  rows.push([]);
  rows.push(['EQUIPAMENTOS PARADOS (DESCRIÇÃO EM MANUTENÇÃO)']);
  rows.push([
    'Ativo',
    'Código',
    'Subcódigo / Evento',
    'Início da Parada',
    'Motivo / Descrição',
  ]);
  if (stoppedList.length === 0) {
    rows.push(['Nenhum equipamento parado informado']);
  } else {
    stoppedList.forEach((s) => {
      rows.push([
        formatCA(s.asset),
        s.code || '',
        s.subCode || 'EXEC MANUT',
        s.startTime || '',
        s.reason || s.discipline || '',
      ]);
    });
  }

  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const cleanCell = removeEmojis(String(cell ?? ''));
            return `"${cleanCell.replace(/"/g, '""')}"`;
          })
          .join(';'),
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileDate = date ? date.replace(/-/g, '') : 'turno';
  link.setAttribute('download', `relatorio_turno_ahs_${fileDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
