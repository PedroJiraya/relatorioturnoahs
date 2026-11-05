'use client';

import { useState, useEffect } from 'react';
import faultTree from '../src/data/fault-tree.json';

const STORAGE_KEY = 'relatorio_turno_ahs_draft_v1';

const codes = ['HMC – 9200', 'MPS – 9600', 'MPNS – 9100', 'HAC – 9700', 'Operando autônomo'];
const statuses = ['Liberado', 'Em manutenção', 'Aguardando recurso', 'Aguardando componente'];
const systems = Object.keys(faultTree);
const emoji = {
  clipboard: '📋', calendar: '📅', clock: '⏰', worker: '👷', compass: '🧭',
  mechanic: '👨‍🔧', cross: '❌', tools: '🛠️', check: '✅',
  pin: '📌', noEntry: '🚫',
};

function getCodeEmoji(code = '') {
  if (code.includes('Operando')) return '🟢';
  if (code.includes('MPNS')) return '🟠';
  if (code.includes('MPS')) return '🟡';
  if (code.includes('HMC') || code.includes('HAC')) return '🔴';
  return '⚙️';
}

function formatCM(val = '') {
  if (!val) return '';
  const clean = val.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return '';
  const digitsOrSuffix = clean.replace(/^(CM)+/i, '');
  return digitsOrSuffix ? `CM${digitsOrSuffix}` : 'CM';
}

function normalizeAssetInput(raw, prev = '') {
  let val = raw.toUpperCase().replace(/\s+/g, '');
  if (val === 'CM' && prev.length > 2) {
    return '';
  }
  if (/^\d/.test(val)) {
    val = `CM${val}`;
  }
  return val;
}

function getTruckModel(asset = '') {
  const clean = formatCM(asset).toUpperCase();
  if (/^CM55|^55/.test(clean)) return '797F';
  if (/^CM57|^57/.test(clean)) return '794 AC';
  return 'Outros';
}

function getFleetSummary(stopped = [], operating = [], appointments = []) {
  const maintFromAppointments = appointments
    .filter((a) => a.status && a.status !== 'Liberado')
    .map((a) => formatCM(a.asset))
    .filter((tag) => tag.length > 2);

  const maintList = [
    ...stopped.map((item) => formatCM(item.asset)).filter((tag) => tag.length > 2),
    ...maintFromAppointments,
  ];
  const uniqueMaint = Array.from(new Set(maintList));

  const autoList = operating
    .map((item) => formatCM(item.asset))
    .filter((tag) => tag.length > 2);
  const uniqueAuto = Array.from(new Set(autoList));

  const allTrucks = Array.from(new Set([...uniqueMaint, ...uniqueAuto]));

  const count797F_Maint = uniqueMaint.filter((t) => getTruckModel(t) === '797F').length;
  const count797F_Auto = uniqueAuto.filter((t) => getTruckModel(t) === '797F').length;

  const count794AC_Maint = uniqueMaint.filter((t) => getTruckModel(t) === '794 AC').length;
  const count794AC_Auto = uniqueAuto.filter((t) => getTruckModel(t) === '794 AC').length;

  return {
    totalTrucks: allTrucks.length,
    count797F_Maint,
    count797F_Auto,
    count794AC_Maint,
    count794AC_Auto,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia!';
  if (hour >= 12 && hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}

function blankAppointment() {
  return {
    asset: '',
    code: codes[0],
    startTime: '',
    endTime: '',
    system: '',
    component: '',
    subcomponent: '',
    cause: '',
    operationalCause: '',
    faultSolution: '',
    diagnosis: '',
    solution: '',
    status: 'Liberado',
  };
}

function branches(item) {
  const system = faultTree[item.system] || {};
  const component = system[item.component] || {};
  const subcomponent = component[item.subcomponent] || {};
  return {
    components: Object.keys(system),
    subcomponents: Object.keys(component),
    causes: Object.keys(subcomponent),
    solutions: subcomponent[item.cause] || [],
  };
}

function Field({ label, value, onChange, onBlur, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} placeholder={placeholder} />
      )}
    </label>
  );
}

function SelectField({ label, value, values, onChange, disabled = false, getOptionLabel }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Selecione</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Appointment({ item, index, total, update, remove }) {
  const branch = branches(item);
  const change = (key, value) => {
    const resets = {
      system: ['component', 'subcomponent', 'cause', 'faultSolution'],
      component: ['subcomponent', 'cause', 'faultSolution'],
      subcomponent: ['cause', 'faultSolution'],
      cause: ['faultSolution'],
    };
    update(index, { [key]: value, ...Object.fromEntries((resets[key] || []).map((field) => [field, ''])) });
  };
  return (
    <article className="appointment">
      <div className="section-title">
        <h3>{getCodeEmoji(item.code)} Atendimento {index + 1} {item.asset ? `• ${formatCM(item.asset)}` : ''}</h3>
        {total > 1 && <button type="button" className="remove" onClick={() => remove(index)}>Remover</button>}
      </div>
      <div className="grid four">
        <Field
          label="Ativo / CM"
          value={item.asset}
          onChange={(value) => update(index, { asset: normalizeAssetInput(value, item.asset) })}
          onBlur={() => update(index, { asset: formatCM(item.asset) })}
          placeholder="Ex.: CM5516"
        />
        <SelectField
          label="Código de manutenção"
          value={item.code}
          values={codes}
          onChange={(value) => update(index, { code: value })}
          getOptionLabel={(code) => `${getCodeEmoji(code)} ${code}`}
        />
        <Field label="Horário Início" type="time" value={item.startTime || ''} onChange={(value) => update(index, { startTime: value })} />
        <Field label="Horário Fim" type="time" value={item.endTime || ''} onChange={(value) => update(index, { endTime: value })} />
      </div>
      <div className="grid five">
        <SelectField label="1. Sistema" value={item.system} values={systems} onChange={(value) => change('system', value)} />
        <SelectField label="2. Componente" value={item.component} values={branch.components} onChange={(value) => change('component', value)} disabled={!item.system} />
        <SelectField label="3. Subcomponente" value={item.subcomponent} values={branch.subcomponents} onChange={(value) => change('subcomponent', value)} disabled={!item.component} />
        <SelectField label="4. Causa" value={item.cause} values={branch.causes} onChange={(value) => change('cause', value)} disabled={!item.subcomponent} />
        <SelectField label="5. Solução" value={item.faultSolution} values={branch.solutions} onChange={(value) => update(index, { faultSolution: value })} disabled={!item.cause} />
      </div>
      <Field
        label="Causa operacional (detalhes do sintoma / falha)"
        type="textarea"
        value={item.operationalCause || ''}
        onChange={(value) => update(index, { operationalCause: value })}
        placeholder="Ex.: Evento ativo de taxa de atualização anormal do sensor de medição inercial traseiro"
      />
      <div className="grid two">
        <Field label="Diagnóstico executado" type="textarea" value={item.diagnosis} onChange={(value) => update(index, { diagnosis: value })} placeholder="Verificações e testes realizados" />
        <Field label="Solução aplicada / Continuação" type="textarea" value={item.solution} onChange={(value) => update(index, { solution: value })} placeholder="Serviço realizado" />
      </div>
      <div className="status-grid">
        {statuses.map((status) => (
          <label className="status-option" key={status}>
            <input type="radio" name={`status-${index}`} checked={item.status === status} onChange={() => update(index, { status })} />
            <span>{status}</span>
          </label>
        ))}
      </div>
    </article>
  );
}

export default function Page() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('06:00 às 18:00');
  const [team, setTeam] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [executors, setExecutors] = useState('');
  const [workshop, setWorkshop] = useState('Oficina N4WN');
  const [conclusion, setConclusion] = useState('');
  const [appointments, setAppointments] = useState([blankAppointment()]);
  const [stopped, setStopped] = useState([{ asset: '', code: codes[0] }]);
  const [operating, setOperating] = useState([{ asset: '' }]);
  const [report, setReport] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega rascunho persistido ao abrir ou recarregar a página
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date !== undefined) setDate(data.date);
        if (data.shift !== undefined) setShift(data.shift);
        if (data.team !== undefined) setTeam(data.team);
        if (data.supervisor !== undefined) setSupervisor(data.supervisor);
        if (data.executors !== undefined) setExecutors(data.executors);
        if (data.workshop !== undefined) setWorkshop(data.workshop);
        if (data.conclusion !== undefined) setConclusion(data.conclusion);
        if (Array.isArray(data.appointments) && data.appointments.length > 0) setAppointments(data.appointments);
        if (Array.isArray(data.stopped) && data.stopped.length > 0) setStopped(data.stopped);
        if (Array.isArray(data.operating) && data.operating.length > 0) setOperating(data.operating);
        if (data.report !== undefined) {
          if (data.report.includes('🚫 EQUIPAMENTOS PARADOS') || data.report.includes('🚚 🔴') || data.report.includes('🚚 🟢')) {
            setReport('');
          } else {
            setReport(data.report);
          }
        }
      }
    } catch (err) {
      console.error('Erro ao recuperar rascunho do relatório:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Salva automaticamente qualquer alteração no localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const draft = {
        date,
        shift,
        team,
        supervisor,
        executors,
        workshop,
        conclusion,
        appointments,
        stopped,
        operating,
        report,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (err) {
      console.error('Erro ao salvar rascunho do relatório:', err);
    }
  }, [date, shift, team, supervisor, executors, workshop, conclusion, appointments, stopped, operating, report, isLoaded]);

  const updateAppointment = (index, changes) => setAppointments((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const dateText = date ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`)) : '-';
  const path = (item) => [item.system, item.component, item.subcomponent, item.cause, item.faultSolution].filter(Boolean).join(' > ') || 'Não informada';
  const fleetSummary = getFleetSummary(stopped, operating, appointments);

  const makeReport = () => {
    const greeting = getGreeting();
    const appointmentText = appointments.map((item) => {
      const assetFormatted = formatCM(item.asset) || 'Ativo não informado';
      const timeLine = (item.startTime && item.endTime)
        ? `\n⏰ Horário: ${item.startTime} às ${item.endTime}`
        : (item.startTime ? `\n⏰ Início: ${item.startTime}` : (item.endTime ? `\n⏰ Fim: ${item.endTime}` : ''));

      const causeLine = item.operationalCause ? `\n\n⚠️ CAUSA\n${item.operationalCause}` : '';

      return `${getCodeEmoji(item.code)} ${assetFormatted} | Código: ${item.code}${timeLine}\n\n${emoji.cross} CLASSE DA FALHA\n${path(item)}${causeLine}\n\n${emoji.tools} DIAGNÓSTICO EXECUTADO\n${item.diagnosis || 'Não informado'}\n\n${emoji.check} SOLUÇÃO APLICADA\n${item.solution || 'Não informada'}\n\n${emoji.pin} STATUS FINAL: ${item.status}`;
    }).join('\n\n____________________________________\n\n');

    const conclusionBlock = conclusion.trim()
      ? `\n\n____________________________________\n\n📝 OBSERVAÇÕES / CONCLUSÃO\n${conclusion.trim()}`
      : '';

    const stoppedList = stopped.filter((item) => item.asset.trim());
    const stoppedText = stoppedList.length > 0
      ? stoppedList.map((item) => `${getCodeEmoji(item.code)} ${formatCM(item.asset)} | Código: ${item.code}`).join('\n')
      : 'Nenhum equipamento informado';

    const operatingList = operating.filter((item) => item.asset.trim());
    const operatingText = operatingList.length > 0
      ? operatingList.map((item) => `🟢 ${formatCM(item.asset)} | Operando autônomo`).join('\n')
      : 'Nenhum equipamento informado';

    const summary = getFleetSummary(stopped, operating, appointments);
    const summaryText = `\n\n____________________________________\n\n📊 RESUMO DA FROTA\nTotal: ${summary.totalTrucks} caminhões\n• 797F: ${summary.count797F_Maint} em manutenção e ${summary.count797F_Auto} em operação autônoma\n• 794 AC: ${summary.count794AC_Maint} em manutenção e ${summary.count794AC_Auto} em operação autônoma`;

    return `${greeting}\n\n${emoji.clipboard} RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA\n🏢 Local: ${workshop || 'Oficina N4WN'}\n\n${emoji.calendar} Data: ${dateText}\n${emoji.clock} Turno: ${shift}\n${emoji.worker} Turma: ${team || 'Não informado'}\n${emoji.compass} Supervisor: ${supervisor || 'Não informado'}\n${emoji.mechanic} Executantes:\n${executors || 'Não informado'}\n\n____________________________________\n\nATENDIMENTO DOS ATIVOS EM MANUTENÇÃO\n\n${appointmentText}${conclusionBlock}\n\n____________________________________\n\n🚚 EQUIPAMENTOS PARADOS\n${stoppedText}\n\n____________________________________\n\n🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO\n${operatingText}${summaryText}`;
  };

  const clear = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o relatório do turno? Esta ação apagará as informações salvas no navegador.')) {
      setDate(new Date().toISOString().slice(0, 10));
      setShift('06:00 às 18:00');
      setTeam('');
      setSupervisor('');
      setExecutors('');
      setWorkshop('Oficina N4WN');
      setConclusion('');
      setAppointments([blankAppointment()]);
      setStopped([{ asset: '', code: codes[0] }]);
      setOperating([{ asset: '' }]);
      setReport('');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Erro ao limpar rascunho:', err);
      }
    }
  };

  const downloadCsv = () => {
    const removeEmojis = (str = '') => String(str || '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '')
      .trim();

    const fleet = getFleetSummary(stopped, operating, appointments);
    const rows = [];

    // 1. DADOS DO TURNO
    rows.push(['DADOS DO TURNO']);
    rows.push(['Data', 'Turno', 'Turma', 'Oficina / Local', 'Supervisor', 'Executantes']);
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
      'Horário Início',
      'Horário Fim',
      'Sistema',
      'Componente',
      'Subcomponente',
      'Causa (Falha)',
      'Solução (Falha)',
      'Causa Operacional',
      'Diagnóstico Executado',
      'Solução Aplicada',
      'Status Final',
    ]);

    appointments.forEach((item, idx) => {
      rows.push([
        String(idx + 1),
        formatCM(item.asset) || 'Ativo não informado',
        item.code || '',
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
        item.status || '',
      ]);
    });
    rows.push([]);

    // 3. EQUIPAMENTOS PARADOS
    rows.push(['EQUIPAMENTOS PARADOS']);
    rows.push(['Ativo', 'Código']);
    const stoppedFiltered = stopped.filter((item) => item.asset.trim());
    if (stoppedFiltered.length > 0) {
      stoppedFiltered.forEach((item) => {
        rows.push([formatCM(item.asset), item.code]);
      });
    } else {
      rows.push(['Nenhum equipamento parado informado', '']);
    }
    rows.push([]);

    // 4. EQUIPAMENTOS OPERANDO AUTÔNOMO
    rows.push(['EQUIPAMENTOS OPERANDO AUTÔNOMO']);
    rows.push(['Ativo', 'Status']);
    const operatingFiltered = operating.filter((item) => item.asset.trim());
    if (operatingFiltered.length > 0) {
      operatingFiltered.forEach((item) => {
        rows.push([formatCM(item.asset), 'Operando autônomo']);
      });
    } else {
      rows.push(['Nenhum equipamento autônomo informado', '']);
    }
    rows.push([]);

    // 5. RESUMO DA FROTA
    rows.push(['RESUMO DA FROTA']);
    rows.push(['Total de Caminhões', '797F Manutenção', '797F Autônomo', '794 AC Manutenção', '794 AC Autônomo']);
    rows.push([
      String(fleet.totalTrucks),
      String(fleet.count797F_Maint),
      String(fleet.count797F_Auto),
      String(fleet.count794AC_Maint),
      String(fleet.count794AC_Auto),
    ]);
    rows.push([]);

    // 6. OBSERVAÇÕES / CONCLUSÃO
    if (conclusion && conclusion.trim()) {
      rows.push(['OBSERVAÇÕES / CONCLUSÃO']);
      rows.push([conclusion.trim()]);
    }

    const csvContent = '\uFEFF' + rows.map((row) => row.map((cell) => {
      const cleanCell = removeEmojis(String(cell ?? ''));
      return `"${cleanCell.replace(/"/g, '""')}"`;
    }).join(';')).join('\r\n');

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
  };

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Manutenção corretiva</p>
          <h1>Relatório de turno</h1>
          <p className="subtitle">Preencha os atendimentos e gere WhatsApp ou ficha PDF.</p>
        </div>
        <div className="brand-container">
          <img src="/logo-sotreq.png" alt="Sotreq CAT" className="brand-logo" />
        </div>
      </header>
      <form className="card" onSubmit={(event) => { event.preventDefault(); setReport(makeReport()); }}>
        <section>
          <h2>Dados do turno</h2>
          <div className="grid four">
            <Field label="Data" type="date" value={date} onChange={setDate} />
            <SelectField label="Turno" value={shift} values={['06:00 às 18:00', '18:00 às 06:00']} onChange={setShift} />
            <Field label="Turma" value={team} onChange={setTeam} placeholder="Ex.: B" />
            <Field label="Oficina / Local" value={workshop} onChange={setWorkshop} placeholder="Ex.: Oficina N4WN" />
          </div>
          <div className="grid two">
            <Field label="Supervisor" value={supervisor} onChange={setSupervisor} placeholder="Nome do supervisor" />
            <Field label="Executantes" type="textarea" value={executors} onChange={setExecutors} placeholder="Um nome por linha" />
          </div>
        </section>
        <section><div className="section-title"><h2>Ativos em manutenção</h2><button type="button" className="small primary" onClick={() => setAppointments((items) => [...items, blankAppointment()])}>+ Adicionar atendimento</button></div><p className="hint">Adicione outro atendimento quando houver mais de um equipamento trabalhado no turno.</p>{appointments.map((item, index) => <Appointment key={index} item={item} index={index} total={appointments.length} update={updateAppointment} remove={(removeIndex) => setAppointments((items) => items.filter((_, itemIndex) => itemIndex !== removeIndex))} />)}</section>
        <section><h2>Observações / conclusão</h2><Field label="Informações adicionais" type="textarea" value={conclusion} onChange={setConclusion} placeholder="Observações gerais do turno" /></section>
        <section><div className="section-title"><h2>🚚 Equipamentos parados</h2><button type="button" className="small primary" onClick={() => setStopped((items) => [...items, { asset: '', code: codes[0] }])}>+ Adicionar equipamento</button></div>{stopped.map((item, index) => <div className="stopped-row" key={index}><input value={item.asset} onChange={(event) => setStopped((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, asset: normalizeAssetInput(event.target.value, entry.asset) } : entry))} onBlur={() => setStopped((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, asset: formatCM(entry.asset) } : entry))} placeholder="Ex.: CM5516" /><select value={item.code} onChange={(event) => setStopped((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, code: event.target.value } : entry))}>{codes.map((code) => <option key={code} value={code}>{getCodeEmoji(code)} {code}</option>)}</select><button type="button" className="remove" onClick={() => setStopped((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</section>
        <section>
          <div className="section-title">
            <h2>🚚 Equipamentos operando autônomo</h2>
            <button type="button" className="small primary" onClick={() => setOperating((items) => [...items, { asset: '' }])}>+ Adicionar equipamento</button>
          </div>
          <p className="hint">Insira os caminhões que estão liberados e operando na rota autônoma.</p>
          {operating.map((item, index) => (
            <div className="operating-row" key={index}>
              <input
                value={item.asset}
                onChange={(event) => setOperating((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, asset: normalizeAssetInput(event.target.value, entry.asset) } : entry))}
                onBlur={() => setOperating((items) => items.map((entry, entryIndex) => entryIndex === index ? { ...entry, asset: formatCM(entry.asset) } : entry))}
                placeholder="Ex.: CM5501"
              />
              <div className="operating-badge">
                <span>🟢</span> Operando autônomo
              </div>
              <button type="button" className="remove" onClick={() => setOperating((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
            </div>
          ))}
        </section>
        <section className="summary-section">
          <h2>📊 Resumo da Frota</h2>
          <div className="summary-cards">
            <div className="summary-card total">
              <span className="summary-label">Total da Frota</span>
              <span className="summary-value">{fleetSummary.totalTrucks}</span>
              <span className="summary-sub">caminhões monitorados</span>
            </div>
            <div className="summary-card">
              <span className="summary-label">CAT 797F (CM55xx)</span>
              <div className="summary-split">
                <span className="maint">🔴 {fleetSummary.count797F_Maint} Manutenção</span>
                <span className="auto">🟢 {fleetSummary.count797F_Auto} Autônomo</span>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-label">CAT 794 AC (CM57xx)</span>
              <div className="summary-split">
                <span className="maint">🔴 {fleetSummary.count794AC_Maint} Manutenção</span>
                <span className="auto">🟢 {fleetSummary.count794AC_Auto} Autônomo</span>
              </div>
            </div>
          </div>
        </section>
        <div className="actions">
          <span className="auto-save-pill">💾 Rascunho salvo</span>
          <div className="btn-group">
            <button type="button" className="secondary" onClick={clear}>Limpar</button>
            <button type="button" className="outline" onClick={downloadCsv}>Baixar CSV</button>
            <button type="button" className="outline" onClick={() => setShowPdfModal(true)}>📄 Gerar Ficha PDF</button>
            <button type="submit" className="primary">Gerar WhatsApp</button>
          </div>
        </div>
      </form>
      {report && <section className="card preview"><div className="preview-heading"><div><p className="eyebrow">Saída WhatsApp</p><h2>Mensagem do relatório</h2></div><button type="button" className="close" onClick={() => setReport('')}>×</button></div><pre>{report}</pre><div className="preview-actions"><button type="button" className="outline" onClick={downloadCsv}>Baixar CSV</button><button type="button" className="outline" onClick={() => navigator.clipboard.writeText(report)}>Copiar mensagem</button><button type="button" className="primary" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(report)}`, '_blank', 'noopener,noreferrer')}>Abrir no WhatsApp</button></div></section>}
      {showPdfModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowPdfModal(false); }}>
          <div className="modal-container">
            <div className="modal-toolbar no-print">
              <div>
                <h2>Ficha de Turno Oficial Sotreq CAT</h2>
                <p>Layout padronizado para impressão e download em PDF.</p>
              </div>
              <div className="btn-group">
                <button type="button" className="primary" onClick={() => window.print()}>🖨️ Imprimir / Salvar em PDF</button>
                <button type="button" className="secondary" onClick={() => setShowPdfModal(false)}>✕ Fechar</button>
              </div>
            </div>
            <div className="modal-content">
              <article className="pdf-sheet">
                <div className="pdf-border-frame">
                  <header className="pdf-header">
                    <div>
                      <h1 className="pdf-title">RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA</h1>
                      <p className="pdf-subtitle">{workshop || 'Oficina N4WN'}</p>
                    </div>
                    <div className="pdf-brand">
                      <img src="/logo-sotreq.png" alt="Sotreq CAT" className="pdf-logo" />
                    </div>
                  </header>

                  <table className="pdf-table shift-table">
                    <tbody>
                      <tr>
                        <td className="pdf-th">📅 Data:</td>
                        <td>{dateText}</td>
                      </tr>
                      <tr>
                        <td className="pdf-th">🕒 Turno:</td>
                        <td>{shift}</td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👥 Turma:</td>
                        <td>{team || 'Não informado'}</td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👤 Supervisor:</td>
                        <td>{supervisor || 'Não informado'}</td>
                      </tr>
                      <tr>
                        <td className="pdf-th">👥 Executantes:</td>
                        <td className="pdf-pre-wrap">{executors || 'Não informado'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pdf-yellow-bar">
                    ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO
                  </div>

                  {appointments.map((item, idx) => (
                    <div className="pdf-appointment-box" key={idx}>
                      <div className="pdf-asset-subbar">
                        <div className="pdf-asset-tag">
                          {getCodeEmoji(item.code)} <strong>{formatCM(item.asset) || 'Ativo não informado'}</strong>
                          {item.startTime && item.endTime && <span className="pdf-time">⏰ {item.startTime} às {item.endTime}</span>}
                        </div>
                        <div className="pdf-asset-code">
                          Código: <strong>{item.code}</strong>
                        </div>
                      </div>

                      <div className="pdf-grid-two">
                        <div className="pdf-box">
                          <div className="pdf-box-header">
                            ❌ CLASSE DA FALHA
                          </div>
                          <div className="pdf-box-content">
                            {[item.system, item.component, item.subcomponent, item.cause, item.faultSolution].filter(Boolean).map((lvl, lIdx) => (
                              <div key={lIdx} className="pdf-fault-level">{lvl}</div>
                            ))}
                            {![item.system, item.component, item.subcomponent, item.cause, item.faultSolution].some(Boolean) && (
                              <span style={{ color: '#888' }}>Não informada</span>
                            )}
                          </div>
                        </div>
                        <div className="pdf-box">
                          <div className="pdf-box-header">
                            ⚠️ CAUSA
                          </div>
                          <div className="pdf-box-content pdf-pre-wrap">
                            {item.operationalCause || item.cause || 'Não informada'}
                          </div>
                        </div>
                      </div>

                      <div className="pdf-grid-two">
                        <div className="pdf-box">
                          <div className="pdf-box-header">
                            🔍 SOLUÇÃO / DIAGNÓSTICO EXECUTADO
                          </div>
                          <div className="pdf-box-content pdf-pre-wrap">
                            {item.diagnosis || 'Não informado'}
                          </div>
                        </div>
                        <div className="pdf-box">
                          <div className="pdf-box-header">
                            🔧 CONTINUAÇÃO DO DIAGNÓSTICO / SOLUÇÃO APLICADA
                          </div>
                          <div className="pdf-box-content pdf-pre-wrap">
                            {item.solution || 'Não informada'}
                          </div>
                        </div>
                      </div>

                      <div className="pdf-status-row">
                        <span>📌 <strong>STATUS FINAL:</strong></span>
                        {statuses.map((st) => (
                          <span key={st} className={`pdf-status-opt ${item.status === st ? 'checked' : ''}`}>
                            ({item.status === st ? 'X' : ' '}) {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {conclusion && (
                    <div className="pdf-section-block">
                      <div className="pdf-gray-bar">
                        📄 OBSERVAÇÕES / CONCLUSÃO
                      </div>
                      <div className="pdf-section-content pdf-pre-wrap">
                        {conclusion}
                      </div>
                    </div>
                  )}

                  <div className="pdf-section-block">
                    <div className="pdf-gray-bar">
                      🚚 EQUIPAMENTOS PARADOS
                    </div>
                    <table className="pdf-table simple">
                      <tbody>
                        {stopped.filter((s) => s.asset.trim()).map((s, sIdx) => (
                          <tr key={sIdx}>
                            <td style={{ width: '40%' }}>
                              {getCodeEmoji(s.code)} <strong>{formatCM(s.asset)}</strong>
                            </td>
                            <td>Código: {s.code}</td>
                          </tr>
                        ))}
                        {stopped.filter((s) => s.asset.trim()).length === 0 && (
                          <tr><td colSpan={2} style={{ color: '#888' }}>Nenhum equipamento parado informado</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pdf-section-block">
                    <div className="pdf-gray-bar">
                      🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO
                    </div>
                    <table className="pdf-table simple">
                      <tbody>
                        {operating.filter((o) => o.asset.trim()).map((o, oIdx) => (
                          <tr key={oIdx}>
                            <td style={{ width: '40%' }}>
                              🟢 <strong>{formatCM(o.asset)}</strong>
                            </td>
                            <td>Operando autônomo</td>
                          </tr>
                        ))}
                        {operating.filter((o) => o.asset.trim()).length === 0 && (
                          <tr><td colSpan={2} style={{ color: '#888' }}>Nenhum equipamento autônomo informado</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="pdf-section-block">
                    <div className="pdf-gray-bar">
                      📊 RESUMO DA FROTA
                    </div>
                    <div className="pdf-summary-row">
                      <span><strong>Total:</strong> {fleetSummary.totalTrucks} caminhões</span>
                      <span>• <strong>797F:</strong> {fleetSummary.count797F_Maint} manutenção / {fleetSummary.count797F_Auto} autônomo</span>
                      <span>• <strong>794 AC:</strong> {fleetSummary.count794AC_Maint} manutenção / {fleetSummary.count794AC_Auto} autônomo</span>
                    </div>
                  </div>

                  <footer className="pdf-footer">
                    <div className="pdf-footer-pillars">
                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffcd00">
                            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                            <path d="M21.2 10.6l-1.8-.3c-.2-.6-.4-1.2-.7-1.7l1.1-1.5c.3-.4.2-1-.2-1.4l-1.3-1.3c-.4-.4-1-.5-1.4-.2l-1.5 1.1c-.5-.3-1.1-.5-1.7-.7l-.3-1.8C13.3 2.2 12.8 2 12 2s-1.3.2-1.4.8l-.3 1.8c-.6.2-1.2.4-1.7.7L7.1 4.2c-.4-.3-1-.2-1.4.2L4.4 5.7c-.4.4-.5 1-.2 1.4l1.1 1.5c-.3.5-.5 1.1-.7 1.7l-1.8.3C2.2 10.7 2 11.2 2 12s.2 1.3.8 1.4l1.8.3c.2.6.4 1.2.7 1.7l-1.1 1.5c-.3.4-.2 1 .2 1.4l1.3 1.3c.4.4 1 .5 1.4.2l1.5-1.1c.5.3 1.1.5 1.7.7l.3 1.8c.1.6.6.8 1.4.8s1.3-.2 1.4-.8l.3-1.8c.6-.2 1.2-.4 1.7-.7l1.5 1.1c.4.3 1 .2 1.4-.2l1.3-1.3c.4-.4.5-1 .2-1.4l-1.1-1.5c.3-.5.5-1.1.7-1.7l1.8-.3c.6-.1.8-.6.8-1.4s-.2-1.3-.8-1.4zM12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">DISCIPLINA</span>
                          <span className="pdf-pillar-sub">EM CADA DETALHE</span>
                        </div>
                      </div>

                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffcd00">
                            <rect x="2" y="14" width="5" height="9" rx="0.5" />
                            <rect x="9.5" y="8" width="5" height="15" rx="0.5" />
                            <rect x="17" y="2" width="5" height="21" rx="0.5" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">CONFIABILIDADE</span>
                          <span className="pdf-pillar-sub">EM CADA OPERAÇÃO</span>
                        </div>
                      </div>

                      <div className="pdf-pillar">
                        <div className="pdf-pillar-icon">
                          <svg width="30" height="24" viewBox="0 0 32 26" fill="#ffcd00">
                            <circle cx="7" cy="7" r="4.5" />
                            <path d="M1 23c0-4 3.5-7 8-7 1.5 0 2.9.3 4.1 1-.8 1.6-1.1 3.4-1.1 5.5v0.5H1z" />
                            <circle cx="25" cy="7" r="4.5" />
                            <path d="M20 23v-.5c0-2.1-.3-3.9-1.1-5.5 1.2-.7 2.6-1 4.1-1 4.5 0 8 3 8 7H20z" />
                            <circle cx="16" cy="6" r="5" />
                            <path d="M8 24c0-4.5 3.5-8 8-8s8 3.5 8 8H8z" />
                          </svg>
                        </div>
                        <div className="pdf-pillar-text">
                          <span className="pdf-pillar-title">PARCERIA</span>
                          <span className="pdf-pillar-sub">QUE GERA RESULTADOS</span>
                        </div>
                      </div>
                    </div>

                    <div className="pdf-footer-brand-cut">
                      <img src="/logo-sotreq.png" alt="Sotreq CAT" className="pdf-footer-logo" />
                    </div>
                  </footer>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
