'use client';

import { statuses } from '../../constants';
import {
  getCodeEmoji,
  formatCA,
  formatDateTimeWhatsApp,
  getDelayTimes,
} from '../../utils/formatters';

export default function PdfReportModal({
  isOpen,
  onClose,
  dateText,
  shift,
  team,
  workshop,
  supervisor,
  executors,
  conclusion,
  appointments = [],
  stopped = [],
  operating = [],
  fleetSummary,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-container">
        {/* Toolbar superior (não aparece na impressão) */}
        <div className="modal-toolbar no-print">
          <div>
            <h2>Ficha de Turno Oficial Sotreq CAT</h2>
            <p>Layout padronizado para impressão e download em PDF.</p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className="primary"
              onClick={() => window.print()}
            >
              🖨️ Imprimir / Salvar em PDF
            </button>
            <button type="button" className="secondary" onClick={onClose}>
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo da Ficha Oficial para Impressão */}
        <div className="modal-content">
          <article className="pdf-sheet">
            <div className="pdf-border-frame">
              <header className="pdf-header">
                <div>
                  <h1 className="pdf-title">
                    RELATÓRIO DE TURNO – MANUTENÇÃO CORRETIVA
                  </h1>
                  <p className="pdf-subtitle">{workshop || 'Oficina N4WN'}</p>
                </div>
                <div className="pdf-brand">
                  <img
                    src="/logo-sotreq.png"
                    alt="Sotreq CAT"
                    className="pdf-logo"
                  />
                </div>
              </header>

              <table className="pdf-table shift-table">
                <tbody>
                  <tr>
                    <td className="pdf-th">📅 Data:</td>
                    <td>
                      <strong>{dateText}</strong>
                    </td>
                    <td className="pdf-th">🕒 Turno:</td>
                    <td>
                      <strong>{shift}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="pdf-th">👥 Turma:</td>
                    <td>
                      <strong>{team || 'Não informada'}</strong>
                    </td>
                    <td className="pdf-th">🏢 Oficina / Local:</td>
                    <td>
                      <strong>{workshop || 'Oficina N4WN'}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="pdf-th">👤 Supervisor:</td>
                    <td colSpan={3}>
                      <strong>{supervisor || 'Não informado'}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="pdf-th">👨‍🔧 Executantes:</td>
                    <td colSpan={3} className="pdf-pre-wrap">
                      {executors || 'Não informado'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pdf-yellow-bar">
                ATENDIMENTO DOS ATIVOS EM MANUTENÇÃO
              </div>

              {appointments.length === 0 ? (
                <div
                  style={{
                    padding: '12px 14px',
                    color: '#64748b',
                    fontStyle: 'italic',
                    fontSize: '0.82rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    marginBottom: '14px',
                    textAlign: 'center',
                  }}
                >
                  RELATORIO DE ATUALIZAÇÃO DE FROTA
                </div>
              ) : (
                appointments.map((item, idx) => (
                  <div className="pdf-appointment-box" key={idx}>
                    <div className="pdf-asset-subbar">
                      <div className="pdf-asset-tag">
                        {getCodeEmoji(item.code)}{' '}
                        <strong>
                          {formatCA(item.asset) || 'Ativo não informado'}
                        </strong>
                        {(item.startTime || item.endTime) && (
                          <span className="pdf-time">
                            ⏰{' '}
                            {item.startTime && item.endTime
                              ? `${formatDateTimeWhatsApp(item.startTime)} às ${formatDateTimeWhatsApp(item.endTime)}`
                              : item.startTime
                                ? `Início: ${formatDateTimeWhatsApp(item.startTime)}`
                                : `Fim: ${formatDateTimeWhatsApp(item.endTime)}`}
                          </span>
                        )}
                      </div>
                      <div className="pdf-asset-code">
                        <span
                          className="pdf-badge"
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                          }}
                        >
                          <strong>{item.code}</strong>
                        </span>
                      </div>
                    </div>

                    {item.delays &&
                      item.delays.filter((d) => d.justification).length > 0 && (
                        <div className="pdf-delays-box">
                          <div className="pdf-delays-header">
                            🕘{' '}
                            <strong>Justificativas de Atraso / Eventos:</strong>
                          </div>
                          <div className="pdf-delays-list">
                            {(() => {
                              const delaysList = (item.delays || [])
                                .map((d, dIdx) => ({
                                  ...d,
                                  justification:
                                    dIdx === 0
                                      ? d.justification || 'AG ATENDIMENTO'
                                      : d.justification,
                                }))
                                .filter((d) => d.justification);
                              return delaysList.map((d, dIdx) => {
                                const { effectiveStart, effectiveEnd } =
                                  getDelayTimes(
                                    delaysList,
                                    dIdx,
                                    item.startTime,
                                  );
                                const tStr =
                                  effectiveStart && effectiveEnd
                                    ? `${formatDateTimeWhatsApp(effectiveStart)} às ${formatDateTimeWhatsApp(effectiveEnd)}`
                                    : effectiveStart
                                      ? `Início: ${formatDateTimeWhatsApp(effectiveStart)}`
                                      : effectiveEnd
                                        ? `Fim: ${formatDateTimeWhatsApp(effectiveEnd)}`
                                        : '';
                                const icon = d.justification.startsWith('EXEC')
                                  ? '🔧'
                                  : '🕘';
                                return (
                                  <div
                                    key={dIdx}
                                    className="pdf-delay-row-item"
                                  >
                                    <span className="pdf-delay-name">
                                      {icon} <strong>{d.justification}</strong>
                                    </span>
                                    {tStr && (
                                      <span className="pdf-delay-time">
                                        ⏰ {tStr}
                                      </span>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                    <div className="pdf-grid-two">
                      <div className="pdf-box">
                        <div className="pdf-box-header">❌ CLASSE DA FALHA</div>
                        <div className="pdf-box-content">
                          {[
                            item.system,
                            item.component,
                            item.subcomponent,
                            item.cause,
                            item.faultSolution,
                          ]
                            .filter(Boolean)
                            .map((lvl, lIdx) => (
                              <div key={lIdx} className="pdf-fault-level">
                                {lvl}
                              </div>
                            ))}
                          {![
                            item.system,
                            item.component,
                            item.subcomponent,
                            item.cause,
                            item.faultSolution,
                          ].some(Boolean) && (
                            <span style={{ color: '#888' }}>Não informada</span>
                          )}
                        </div>
                      </div>
                      <div className="pdf-box">
                        <div className="pdf-box-header">⚠️ CAUSA</div>
                        <div className="pdf-box-content pdf-pre-wrap">
                          {item.operationalCause ||
                            item.cause ||
                            'Não informada'}
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

                    {(() => {
                      const effectiveStatus =
                        item.endTime &&
                        item.endTime.trim() &&
                        item.status === 'Aguardando recurso'
                          ? 'Liberado'
                          : item.status || 'Liberado';
                      return (
                        <div className="pdf-status-row">
                          <span>
                            📌 <strong>STATUS FINAL:</strong>
                          </span>
                          {statuses.map((st) => {
                            const isChecked = effectiveStatus === st;
                            return (
                              <span
                                key={st}
                                className={`pdf-status-opt ${isChecked ? 'checked' : ''} ${isChecked && st === 'Liberado' ? 'liberado' : ''}`}
                              >
                                ({isChecked ? 'X' : ' '}) {st}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}

              {conclusion && (
                <div className="pdf-section-block">
                  <div className="pdf-gray-bar">📄 OBSERVAÇÕES / CONCLUSÃO</div>
                  <div className="pdf-section-content pdf-pre-wrap">
                    {conclusion}
                  </div>
                </div>
              )}

              <div className="pdf-section-block">
                <div className="pdf-gray-bar">
                  🚚 EQUIPAMENTOS PARADOS (DESCRIÇÃO EM MANUTENÇÃO)
                </div>
                <table className="pdf-table simple">
                  <thead>
                    <tr style={{ background: '#f1f5f9', fontSize: '0.74rem' }}>
                      <th
                        style={{
                          padding: '6px 10px',
                          textAlign: 'left',
                          border: '1px solid #cbd5e1',
                          width: '18%',
                        }}
                      >
                        Ativo
                      </th>
                      <th
                        style={{
                          padding: '6px 10px',
                          textAlign: 'left',
                          border: '1px solid #cbd5e1',
                          width: '25%',
                        }}
                      >
                        Código / Evento
                      </th>
                      <th
                        style={{
                          padding: '6px 10px',
                          textAlign: 'left',
                          border: '1px solid #cbd5e1',
                          width: '22%',
                        }}
                      >
                        Início da Parada
                      </th>
                      <th
                        style={{
                          padding: '6px 10px',
                          textAlign: 'left',
                          border: '1px solid #cbd5e1',
                          width: '35%',
                        }}
                      >
                        Motivo / Descrição
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stopped
                      .filter((s) => s.asset.trim())
                      .map((s, sIdx) => {
                        const codeShort = (s.code || '').split('–')[0].trim();
                        const subCode = s.subCode || 'EXEC MANUT';
                        return (
                          <tr key={sIdx}>
                            <td style={{ fontWeight: 800 }}>
                              {getCodeEmoji(s.code)} {formatCA(s.asset)}
                            </td>
                            <td>
                              <strong>{codeShort}</strong> - {subCode}
                            </td>
                            <td>
                              {s.startTime ? (
                                formatDateTimeWhatsApp(s.startTime)
                              ) : (
                                <span style={{ color: '#94a3b8' }}>
                                  Não informado
                                </span>
                              )}
                            </td>
                            <td>
                              {s.reason || s.discipline ? (
                                s.reason || s.discipline
                              ) : (
                                <span style={{ color: '#94a3b8' }}>
                                  Não informado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {stopped.filter((s) => s.asset.trim()).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            color: '#888',
                            fontStyle: 'italic',
                            textAlign: 'center',
                          }}
                        >
                          Nenhum equipamento parado informado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pdf-section-block">
                <div
                  className="pdf-gray-bar"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>🚚 EQUIPAMENTOS OPERANDO AUTÔNOMO</span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#166534',
                    }}
                  >
                    🟢 {operating.length} caminhões operando autônomo
                  </span>
                </div>
                {operating.filter((o) => o.asset.trim()).length > 0 ? (
                  <div className="pdf-chips-grid">
                    {operating
                      .filter((o) => o.asset.trim())
                      .map((o, oIdx) => (
                        <span key={oIdx} className="pdf-operating-chip">
                          🟢 {formatCA(o.asset)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '8px 10px',
                      color: '#888',
                      fontStyle: 'italic',
                      fontSize: '0.78rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                    }}
                  >
                    Nenhum equipamento operando autônomo (toda a frota está em
                    manutenção)
                  </div>
                )}
              </div>

              <div className="pdf-section-block">
                <div className="pdf-gray-bar">
                  📊 RESUMO DA FROTA & DISPONIBILIDADE OPERACIONAL
                </div>
                <div className="pdf-summary-cards">
                  <div className="pdf-summary-card total">
                    <span className="pdf-summary-card-title">
                      Total da Frota
                    </span>
                    <strong
                      style={{
                        fontSize: '1.15rem',
                        color: '#ffffff',
                        lineHeight: 1,
                      }}
                    >
                      {fleetSummary.totalTrucks} caminhões
                    </strong>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#4ade80', marginTop: '4px' }}
                    >
                      <span>🟢 Operando:</span>
                      <span>
                        {fleetSummary.totalAuto} ({fleetSummary.percTotalAuto})
                      </span>
                    </div>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#f87171' }}
                    >
                      <span>🔴 Manutenção:</span>
                      <span>
                        {fleetSummary.totalMaint} ({fleetSummary.percTotalMaint}
                        )
                      </span>
                    </div>
                    <div
                      className="fleet-progress-bar"
                      style={{ height: '4px', marginTop: '4px' }}
                    >
                      <div
                        className="fleet-progress-auto"
                        style={{
                          width: `${fleetSummary.numPercTotalAuto}%`,
                        }}
                      />
                      <div
                        className="fleet-progress-maint"
                        style={{
                          width: `${fleetSummary.numPercTotalMaint}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pdf-summary-card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span className="pdf-summary-card-title">
                        CAT 797F (CA55xx)
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        {fleetSummary.total797F} cam.
                      </span>
                    </div>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#166534', marginTop: '4px' }}
                    >
                      <span>🟢 Operando:</span>
                      <span>
                        {fleetSummary.count797F_Auto} (
                        {fleetSummary.perc797F_Auto})
                      </span>
                    </div>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#991b1b' }}
                    >
                      <span>🔴 Manutenção:</span>
                      <span>
                        {fleetSummary.count797F_Maint} (
                        {fleetSummary.perc797F_Maint})
                      </span>
                    </div>
                    <div
                      className="fleet-progress-bar"
                      style={{ height: '4px', marginTop: '4px' }}
                    >
                      <div
                        className="fleet-progress-auto"
                        style={{
                          width: `${fleetSummary.numPerc797F_Auto}%`,
                        }}
                      />
                      <div
                        className="fleet-progress-maint"
                        style={{
                          width: `${fleetSummary.numPerc797F_Maint}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pdf-summary-card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <span className="pdf-summary-card-title">
                        CAT 794 AC (CA57xx)
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          fontWeight: 700,
                        }}
                      >
                        {fleetSummary.total794AC} cam.
                      </span>
                    </div>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#166534', marginTop: '4px' }}
                    >
                      <span>🟢 Operando:</span>
                      <span>
                        {fleetSummary.count794AC_Auto} (
                        {fleetSummary.perc794AC_Auto})
                      </span>
                    </div>
                    <div
                      className="pdf-summary-stat-row"
                      style={{ color: '#991b1b' }}
                    >
                      <span>🔴 Manutenção:</span>
                      <span>
                        {fleetSummary.count794AC_Maint} (
                        {fleetSummary.perc794AC_Maint})
                      </span>
                    </div>
                    <div
                      className="fleet-progress-bar"
                      style={{ height: '4px', marginTop: '4px' }}
                    >
                      <div
                        className="fleet-progress-auto"
                        style={{
                          width: `${fleetSummary.numPerc794AC_Auto}%`,
                        }}
                      />
                      <div
                        className="fleet-progress-maint"
                        style={{
                          width: `${fleetSummary.numPerc794AC_Maint}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <footer className="pdf-footer">
                <div className="pdf-footer-pillars">
                  <div className="pdf-pillar">
                    <div className="pdf-pillar-icon">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="#ffcd00"
                      >
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
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="#ffcd00"
                      >
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
                      <svg
                        width="30"
                        height="24"
                        viewBox="0 0 32 26"
                        fill="#ffcd00"
                      >
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
                      <span className="pdf-pillar-sub">
                        QUE GERA RESULTADOS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pdf-footer-brand-cut">
                  <img
                    src="/logo-sotreq.png"
                    alt="Sotreq CAT"
                    className="pdf-footer-logo"
                  />
                </div>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
