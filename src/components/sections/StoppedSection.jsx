'use client';

import { codes, fleetEquipments, delayJustifications } from '../../constants';
import { formatCA, getTag, getCodeEmoji } from '../../utils/formatters';

export default function StoppedSection({ stopped, setStopped }) {
  const addStopped = () => {
    setStopped((items) => [
      ...items,
      {
        asset: '',
        code: codes[0],
        subCode: 'EXEC MANUT',
        startTime: '',
        reason: '',
      },
    ]);
  };

  const removeStopped = (indexToRemove) => {
    setStopped((items) =>
      items.filter((_, itemIndex) => itemIndex !== indexToRemove),
    );
  };

  return (
    <section>
      <div className="section-title">
        <h2>🚚 Equipamentos parados</h2>
        <button
          type="button"
          className="small primary"
          style={{ marginBottom: '8px' }}
          onClick={addStopped}
        >
          + Adicionar equipamento
        </button>
      </div>
      {stopped.length === 0 ? (
        <p
          className="hint"
          style={{
            textAlign: 'center',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            margin: '14px 0 16px',
          }}
        >
          Nenhum equipamento parado informado no momento. Clique no botão acima para adicionar.
        </p>
      ) : (
        stopped.map((item, index) => (
          <div className="stopped-row" key={index}>
            <select
              value={formatCA(item.asset)}
              onChange={(event) =>
                setStopped((items) =>
                  items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, asset: event.target.value }
                      : entry,
                  ),
                )
              }
            >
              <option value="">Selecione o equipamento</option>
              {(item.asset && !fleetEquipments.includes(formatCA(item.asset))
                ? [formatCA(item.asset), ...fleetEquipments]
                : fleetEquipments
              ).map((eq) => (
                <option key={eq} value={eq}>
                  {getTag(eq)}
                </option>
              ))}
            </select>
            <select
              value={item.code}
              onChange={(event) =>
                setStopped((items) =>
                  items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, code: event.target.value }
                      : entry,
                  ),
                )
              }
            >
              {codes.map((code) => (
                <option key={code} value={code}>
                  {getCodeEmoji(code)} {code}
                </option>
              ))}
            </select>
            <select
              value={item.subCode || 'EXEC MANUT'}
              onChange={(event) =>
                setStopped((items) =>
                  items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, subCode: event.target.value }
                      : entry,
                  ),
                )
              }
              title="Subcódigo / Evento da Manutenção"
            >
              {delayJustifications.map((j) => (
                <option key={j} value={j}>
                  {j.startsWith('EXEC') ? '🔧 ' : '🕘 '}
                  {j}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={item.startTime || ''}
              onChange={(event) =>
                setStopped((items) =>
                  items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, startTime: event.target.value }
                      : entry,
                  ),
                )
              }
              title="Data e hora de início da parada"
              placeholder="Início"
            />
            <input
              type="text"
              value={item.reason || item.discipline || ''}
              onChange={(event) =>
                setStopped((items) =>
                  items.map((entry, entryIndex) =>
                    entryIndex === index
                      ? { ...entry, reason: event.target.value }
                      : entry,
                  ),
                )
              }
              placeholder="Motivo da parada / breve descrição (Ex.: Falha E1651...)"
              title="Motivo / Breve descrição"
            />
            <button
              type="button"
              className="remove"
              onClick={() => removeStopped(index)}
            >
              ×
            </button>
          </div>
        ))
      )}
    </section>
  );
}
