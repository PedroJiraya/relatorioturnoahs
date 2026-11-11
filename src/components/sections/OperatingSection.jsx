'use client';

export default function OperatingSection({ operating = [] }) {
  return (
    <section>
      <div className="section-title">
        <h2>🚚 Equipamentos operando autônomo</h2>
        <span
          className="auto-save-pill"
          style={{
            background: '#e8f5e9',
            color: '#1b5e20',
            borderColor: '#c8e6c9',
          }}
        >
          🟢 {operating.length} Caminhões Autônomo
        </span>
      </div>
      <p className="hint">
        Todos os 23 caminhões operam em modo autônomo por padrão. Ao incluir um
        caminhão em <strong>Equipamentos parados</strong> ou em atendimento com
        manutenção ativa, ele sai automaticamente da rota autônoma e passa para
        manutenção.
      </p>
      {operating.length > 0 ? (
        <div className="operating-chips-grid">
          {operating.map((item) => (
            <div key={item.asset} className="operating-chip">
              <span>🟢</span>
              <strong>{item.asset}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#888', fontStyle: 'italic', marginTop: '10px' }}>
          Nenhum caminhão operando autônomo no momento (toda a frota está em
          manutenção).
        </p>
      )}
    </section>
  );
}
