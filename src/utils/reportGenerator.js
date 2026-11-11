import { emoji } from '../constants';
import {
  getGreeting,
  getCodeEmoji,
  formatCA,
  formatDateTimeWhatsApp,
  getDelayTimes,
  getFleetSummary,
  path,
} from './formatters';

export function generateWhatsAppReport({
  dateText,
  shift,
  team,
  supervisor,
  executors,
  workshop,
  conclusion,
  appointments = [],
  stopped = [],
  operating = [],
}) {
  const greeting = getGreeting();
  const appointmentText = appointments
    .map((item) => {
      const assetFormatted = formatCA(item.asset) || 'Ativo não informado';
      const timeLine =
        item.startTime && item.endTime
          ? `\n⏰ Horário: ${formatDateTimeWhatsApp(item.startTime)} às ${formatDateTimeWhatsApp(item.endTime)}`
          : item.startTime
            ? `\n⏰ Início MineStar: ${formatDateTimeWhatsApp(item.startTime)}`
            : item.endTime
              ? `\n⏰ Fim: ${formatDateTimeWhatsApp(item.endTime)}`
              : '';

      const causeLine = item.operationalCause
        ? `\n\n⚠️ CAUSA\n${item.operationalCause}`
        : '';

      const delaysList = (item.delays || [])
        .map((d, dIdx) => ({
          ...d,
          justification:
            dIdx === 0 ? d.justification || 'AG ATENDIMENTO' : d.justification,
        }))
        .filter((d) => d.justification);
      const delaysBlock =
        delaysList.length > 0
          ? `\n\n⏳ JUSTIFICATIVAS DE ATRASO:\n` +
            delaysList
              .map((d, dIdx) => {
                const { effectiveStart, effectiveEnd } = getDelayTimes(
                  delaysList,
                  dIdx,
                  item.startTime,
                );

                const timeText =
                  effectiveStart && effectiveEnd
                    ? ` (${formatDateTimeWhatsApp(effectiveStart)} às ${formatDateTimeWhatsApp(effectiveEnd)})`
                    : effectiveStart
                      ? ` (Início: ${formatDateTimeWhatsApp(effectiveStart)})`
                      : effectiveEnd
                        ? ` (Fim: ${formatDateTimeWhatsApp(effectiveEnd)})`
                        : '';
                const icon = d.justification.startsWith('EXEC') ? '🔧' : '🕘';
                return `${icon} ${d.justification}${timeText}`;
              })
              .join('\n')
          : '';

      const effectiveStatus =
        item.endTime &&
        item.endTime.trim() &&
        item.status === 'Aguardando recurso'
          ? 'Liberado'
          : item.status || 'Liberado';

      return `${getCodeEmoji(item.code)} ${assetFormatted} | ${item.code}${timeLine}${delaysBlock}\n\n${emoji.cross} CLASSE DA FALHA\n${path(item)}${causeLine}\n\n${emoji.tools} DIAGNÓSTICO EXECUTADO\n${item.diagnosis || 'Não informado'}\n\n${emoji.check} SOLUÇÃO APLICADA\n${item.solution || 'Não informada'}\n\n${emoji.pin} STATUS FINAL: ${effectiveStatus}`;
    })
    .join('\n\n____________________________________\n\n');

  const conclusionBlock = conclusion?.trim()
    ? `\n\n____________________________________\n\n📝 OBSERVAÇÕES / CONCLUSÃO\n${conclusion.trim()}`
    : '';

  const stoppedList = stopped.filter((item) => item.asset.trim());
  const stoppedText =
    stoppedList.length > 0
      ? stoppedList
          .map((item) => {
            const codeName = (item.code || '').split('–')[0].trim();
            const subCodeText = item.subCode
              ? ` - ${item.subCode}`
              : ' - EXEC MANUT';
            const line1 = `${getCodeEmoji(item.code)} ${formatCA(item.asset)} – ${codeName}${subCodeText}`;
            const timeFormatted = item.startTime
              ? formatDateTimeWhatsApp(item.startTime)
              : 'Não informado';
            const line2 = `INÍCIO: ${timeFormatted}`;
            const reasonText =
              item.reason || item.discipline || 'Não informado';
            const line3 = `MOTIVO: ${reasonText}`;
            return `${line1}\n\n${line2}\n${line3}`;
          })
          .join('\n\n')
      : 'Nenhum equipamento informado';

  const operatingList = operating.filter((item) => item.asset.trim());
  const operatingText =
    operatingList.length > 0
      ? operatingList
          .map((item) => `🟢 ${formatCA(item.asset)} | Operando autônomo`)
          .join('\n')
      : 'Nenhum equipamento informado';

  const summary = getFleetSummary(stopped, operating, appointments);
  const summaryText = `\n\n____________________________________\n\n📊 RESUMO DA FROTA (DISPONIBILIDADE OPERACIONAL)\nTotal da Frota: ${summary.totalTrucks} caminhões\n🟢 Operando Autônomo: ${summary.totalAuto} (${summary.percTotalAuto})\n🔴 Em Manutenção: ${summary.totalMaint} (${summary.percTotalMaint})\n\n🚚 Visão por Frota:\n• CAT 797F : 🔴 ${summary.count797F_Maint} manutenção (${summary.perc797F_Maint})\n• CAT 794 AC : 🔴 ${summary.count794AC_Maint} manutenção (${summary.perc794AC_Maint})`;

  const stoppedSection =
    stoppedList.length > 0
      ? `🚚 EQUIPAMENTOS PARADOS\n\nDESCRIÇÃO EM MANUTENÇÃO\n\n${stoppedText}`
      : `🚚 EQUIPAMENTOS PARADOS\n${stoppedText}`;

  const appointmentsSection = appointmentText
    ? `ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO\n\n${appointmentText}`
    : `RELATORIO DE ATUALIZAÇÃO DE FROTA`;

  return `${greeting}\n\n${emoji.clipboard} RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA\n🏢 Local: ${workshop || 'Oficina N4WN'}\n\n${emoji.calendar} Data: ${dateText}\n${emoji.clock} Turno: ${shift}\n${emoji.worker} Turma: ${team || 'Não informado'}\n${emoji.compass} Supervisor: ${supervisor || 'Não informado'}\n${emoji.mechanic} Executantes:\n${executors || 'Não informado'}\n\n____________________________________\n\n${appointmentsSection}${conclusionBlock}\n\n____________________________________\n\n${stoppedSection}\n\n____________________________________\n\n🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO\n${operatingText}${summaryText}`;
}
