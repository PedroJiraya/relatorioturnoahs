'use client';

import Field from '../common/Field';
import SelectField from '../common/SelectField';
import faultTree from '../../data/fault-tree.json';
import {
  codes,
  statuses,
  fleetEquipments,
  delayJustifications,
  systems,
} from '../../constants';
import {
  formatCA,
  getTag,
  getCodeEmoji,
  getLocalDatetimeString,
  branches,
} from '../../utils/formatters';

export default function AppointmentItem({
  item,
  index,
  total,
  update,
  remove,
}) {
  const branch = branches(item);

  const change = (key, value) => {
    const resets = {
      system: ['component', 'subcomponent', 'cause', 'faultSolution'],
      component: ['subcomponent', 'cause', 'faultSolution'],
      subcomponent: ['cause', 'faultSolution'],
      cause: ['faultSolution'],
    };

    const nextUpdates = {
      [key]: value,
      ...Object.fromEntries((resets[key] || []).map((field) => [field, ''])),
    };

    // Ao selecionar o Problema (cause), se houver apenas 1 solução associada na taxonomia oficial, já preenche automaticamente:
    if (key === 'cause') {
      const currentSystem = faultTree[item.system] || {};
      const currentComp = currentSystem[item.component] || {};
      const currentSub = currentComp[item.subcomponent] || {};
      const sols = currentSub[value] || [];
      if (sols.length === 1) {
        nextUpdates.faultSolution = sols[0];
      } else {
        nextUpdates.faultSolution = '';
      }
    }

    update(index, nextUpdates);
  };

  return (
    <article className="appointment">
      <div className="section-title">
        <h3>
          {getCodeEmoji(item.code)} Atendimento {index + 1}{' '}
          {item.asset ? `• ${formatCA(item.asset)}` : ''}
        </h3>
        {total > 1 && (
          <button
            type="button"
            className="remove"
            onClick={() => remove(index)}
          >
            Remover
          </button>
        )}
      </div>
      <div className="grid four">
        <SelectField
          label="Ativo / Equipamento"
          value={formatCA(item.asset)}
          values={fleetEquipments}
          onChange={(value) => update(index, { asset: value })}
          getOptionLabel={(eq) => getTag(eq)}
          allowCustom={true}
        />
        <SelectField
          label="Código de manutenção"
          value={item.code}
          values={codes}
          onChange={(value) => update(index, { code: value })}
          getOptionLabel={(code) => `${getCodeEmoji(code)} ${code}`}
        />
        <Field
          label="Horário Início MineStar"
          type="datetime-local"
          value={item.startTime || ''}
          onChange={(value) => {
            const currentDelays = item.delays || [];
            if (currentDelays.length > 0) {
              const updatedDelays = [...currentDelays];
              updatedDelays[0] = {
                ...updatedDelays[0],
                startTime: value,
              };
              update(index, { startTime: value, delays: updatedDelays });
            } else {
              update(index, { startTime: value });
            }
          }}
        />
        <Field
          label="Horário Fim Technician"
          type="datetime-local"
          value={item.endTime || ''}
          disabled={item.status !== 'Liberado'}
          title={
            item.status !== 'Liberado'
              ? "Bloqueado: marque o Status Final como 'Liberado' para preencher o término"
              : 'Horário Fim Technician'
          }
          style={
            item.status !== 'Liberado'
              ? {
                  background: '#f1f5f9',
                  color: '#94a3b8',
                  cursor: 'not-allowed',
                }
              : {}
          }
          onChange={(value) => {
            const changes = { endTime: value };
            // Sincroniza sempre com o término do último atraso (subcódigo filho):
            const currentDelays = item.delays || [];
            if (currentDelays.length > 0) {
              const updatedDelays = [...currentDelays];
              const lastIdx = updatedDelays.length - 1;
              updatedDelays[lastIdx] = {
                ...updatedDelays[lastIdx],
                endTime: value,
              };
              changes.delays = updatedDelays;
            }
            update(index, changes);
          }}
        />
      </div>
      <div
        className="delays-section"
        style={{
          margin: '14px 0',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 14px',
        }}
      >
        <div className="section-title" style={{ marginBottom: '8px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: '0.92rem',
              color: '#334155',
              fontWeight: 800,
            }}
          >
            Atrasos da Manutenção (Subcódigos Filhos)
          </h4>
          <button
            type="button"
            className="small outline"
            onClick={() => {
              const currentDelays = item.delays || [];
              const lastDelay =
                currentDelays.length > 0
                  ? currentDelays[currentDelays.length - 1]
                  : null;
              const nextStart =
                currentDelays.length === 0
                  ? item.startTime || ''
                  : lastDelay?.endTime || '';

              const newDelay = {
                justification:
                  currentDelays.length === 0 ? 'AG ATENDIMENTO' : '',
                startTime: nextStart,
                endTime: '',
              };
              update(index, { delays: [...currentDelays, newDelay] });
            }}
            title="Adicionar subcódigo filho de atraso ou execução de manutenção"
            style={{
              fontSize: '0.78rem',
              padding: '6px 12px',
              border: '1px solid #cbd5e1',
            }}
          >
            + Adicionar atraso
          </button>
        </div>
        <p
          className="hint"
          style={{ fontSize: '0.78rem', margin: '0 0 10px 0', color: '#64748b' }}
        >
          O 1º atraso herda o início do MineStar. Os atrasos seguintes herdam
          automaticamente o término do anterior em sequência cronológica.
        </p>

        {(!item.delays || item.delays.length === 0) && (
          <div
            style={{
              padding: '10px 12px',
              background: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.82rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            Nenhum subcódigo de atraso registrado. Clique no botão acima para
            adicionar.
          </div>
        )}

        {item.delays &&
          item.delays.map((delay, dIdx) => {
            const inheritedStart =
              dIdx === 0
                ? item.startTime || delay.startTime || ''
                : item.delays[dIdx - 1]?.endTime || delay.startTime || '';

            return (
              <div className="delay-row" key={dIdx}>
                <select
                  value={dIdx === 0 ? 'AG ATENDIMENTO' : delay.justification}
                  disabled={dIdx === 0}
                  onChange={(e) => {
                    if (dIdx > 0) {
                      const updated = [...item.delays];
                      updated[dIdx] = {
                        ...updated[dIdx],
                        justification: e.target.value,
                      };
                      update(index, { delays: updated });
                    }
                  }}
                  title={
                    dIdx === 0
                      ? 'O primeiro atraso é sempre AG ATENDIMENTO (Aguardando Atendimento)'
                      : 'Selecione a justificativa do atraso'
                  }
                  style={
                    dIdx === 0
                      ? {
                          background: '#f1f5f9',
                          color: '#1e293b',
                          fontWeight: 600,
                          cursor: 'not-allowed',
                        }
                      : {}
                  }
                >
                  {dIdx === 0 ? (
                    <option value="AG ATENDIMENTO">🕘 AG ATENDIMENTO</option>
                  ) : (
                    <>
                      <option value="">Selecione a justificativa</option>
                      {delayJustifications.map((j) => (
                        <option key={j} value={j}>
                          {j.startsWith('EXEC') ? '🔧 ' : '🕘 '}
                          {j}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <input
                  type="datetime-local"
                  value={inheritedStart}
                  disabled={true}
                  placeholder="Início"
                  title={
                    dIdx === 0
                      ? 'Início automático: Horário Início MineStar'
                      : `Início automático: término do atraso anterior (${item.delays[dIdx - 1]?.endTime || 'aguardando fim'})`
                  }
                  style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    cursor: 'not-allowed',
                  }}
                />
                <input
                  type="datetime-local"
                  value={delay.endTime || ''}
                  disabled={item.status !== 'Liberado'}
                  onChange={(e) => {
                    const newEndTime = e.target.value;
                    const updated = [...item.delays];
                    updated[dIdx] = {
                      ...updated[dIdx],
                      justification:
                        dIdx === 0 ? 'AG ATENDIMENTO' : delay.justification,
                      startTime:
                        dIdx === 0
                          ? item.startTime || ''
                          : updated[dIdx].startTime || '',
                      endTime: newEndTime,
                    };
                    // O próximo atraso sempre começa quando o atual termina:
                    if (dIdx + 1 < updated.length) {
                      updated[dIdx + 1] = {
                        ...updated[dIdx + 1],
                        startTime: newEndTime,
                      };
                    }
                    const changes = { delays: updated };
                    // O Horário Fim Technician sempre acompanha o fim do último subcódigo filho:
                    const isLastDelay = dIdx === updated.length - 1;
                    if (isLastDelay) {
                      changes.endTime = newEndTime;
                    }
                    update(index, changes);
                  }}
                  placeholder="Fim"
                  title={
                    item.status !== 'Liberado'
                      ? "Bloqueado: selecione o Status Final como 'Liberado' para preencher o fim do atraso"
                      : 'Horário Fim do Atraso'
                  }
                  style={
                    item.status !== 'Liberado'
                      ? {
                          background: '#f1f5f9',
                          color: '#94a3b8',
                          cursor: 'not-allowed',
                        }
                      : {}
                  }
                />
                <button
                  type="button"
                  className="remove"
                  title="Remover justificativa"
                  onClick={() => {
                    const updated = item.delays.filter((_, i) => i !== dIdx);
                    const changes = { delays: updated };
                    if (updated.length > 0) {
                      // Se removeu o primeiro, o novo primeiro vira AG ATENDIMENTO iniciando no Início MineStar
                      if (dIdx === 0) {
                        updated[0] = {
                          ...updated[0],
                          justification: 'AG ATENDIMENTO',
                          startTime: item.startTime || '',
                        };
                      } else if (dIdx < updated.length) {
                        updated[dIdx] = {
                          ...updated[dIdx],
                          startTime: updated[dIdx - 1]?.endTime || '',
                        };
                      }
                      // Atualiza o Fim Technician com o novo último atraso:
                      const lastDelay = updated[updated.length - 1];
                      if (lastDelay?.endTime) {
                        changes.endTime = lastDelay.endTime;
                        changes.status = 'Liberado';
                      }
                    }
                    update(index, changes);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
      </div>
      <div className="grid five">
        <SelectField
          label="1. Sistema"
          value={item.system}
          values={systems}
          onChange={(value) => change('system', value)}
        />
        <SelectField
          label="2. Conjunto"
          value={item.component}
          values={branch.components}
          onChange={(value) => change('component', value)}
          disabled={!item.system}
        />
        <SelectField
          label="3. Item"
          value={item.subcomponent}
          values={branch.subcomponents}
          onChange={(value) => change('subcomponent', value)}
          disabled={!item.component}
        />
        <SelectField
          label="4. Problema"
          value={item.cause}
          values={branch.causes}
          onChange={(value) => change('cause', value)}
          disabled={!item.subcomponent}
        />
        <SelectField
          label="5. Solução"
          value={item.faultSolution}
          values={branch.solutions}
          onChange={(value) => update(index, { faultSolution: value })}
          disabled={!item.cause}
        />
      </div>
      <Field
        label="Causa operacional (detalhes do sintoma / falha)"
        type="textarea"
        value={item.operationalCause || ''}
        onChange={(value) => update(index, { operationalCause: value })}
        placeholder="Ex.: Evento ativo de taxa de atualização anormal do sensor de medição inercial traseiro"
      />
      <div className="grid two">
        <Field
          label="Diagnóstico executado"
          type="textarea"
          value={item.diagnosis}
          onChange={(value) => update(index, { diagnosis: value })}
          placeholder="Verificações e testes realizados"
        />
        <Field
          label="Solução aplicada / Continuação"
          type="textarea"
          value={item.solution}
          onChange={(value) => update(index, { solution: value })}
          placeholder="Serviço realizado"
        />
      </div>
      <div className="status-grid">
        {statuses.map((status) => (
          <label className="status-option" key={status}>
            <input
              type="radio"
              name={`status-${index}`}
              checked={item.status === status}
              onChange={() => {
                const changes = { status };
                const currentDelays = item.delays || [];

                if (status === 'Liberado') {
                  const nowStr = getLocalDatetimeString();
                  const finalTime =
                    item.endTime && item.endTime.trim() ? item.endTime : nowStr;
                  changes.endTime = finalTime;

                  if (currentDelays.length > 0) {
                    const updated = [...currentDelays];
                    const lastIdx = updated.length - 1;
                    if (
                      !updated[lastIdx].endTime ||
                      !updated[lastIdx].endTime.trim()
                    ) {
                      updated[lastIdx] = {
                        ...updated[lastIdx],
                        endTime: finalTime,
                      };
                      changes.delays = updated;
                    }
                  }
                } else {
                  // Regra: se o equipamento estiver com status em manutenção (ou não liberado),
                  // o horário fim do equipamento fica em branco,
                  // e o último atraso também fica em branco pois continua em aberto!
                  changes.endTime = '';
                  if (currentDelays.length > 0) {
                    const updated = [...currentDelays];
                    const lastIdx = updated.length - 1;
                    updated[lastIdx] = {
                      ...updated[lastIdx],
                      endTime: '',
                    };
                    changes.delays = updated;
                  }
                }
                update(index, changes);
              }}
            />
            <span>{status}</span>
          </label>
        ))}
      </div>
    </article>
  );
}
