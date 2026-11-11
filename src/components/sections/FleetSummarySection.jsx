'use client';

export default function FleetSummarySection({ fleetSummary }) {
  return (
    <section className="summary-section">
      <h2>📊 Resumo da Frota</h2>
      <div className="summary-cards">
        {/* Total da Frota */}
        <div className="summary-card total">
          <span className="summary-label">Total da Frota</span>
          <span className="summary-value">{fleetSummary.totalTrucks}</span>
          <span className="summary-sub">caminhões monitorados</span>
          <div className="summary-split" style={{ marginTop: '10px' }}>
            <div className="fleet-sub-stat" style={{ color: '#4ade80' }}>
              <span>🟢 {fleetSummary.totalAuto} Operando</span>
              <strong>{fleetSummary.percTotalAuto}</strong>
            </div>
            <div className="fleet-sub-stat" style={{ color: '#f87171' }}>
              <span>🔴 {fleetSummary.totalMaint} Manutenção</span>
              <strong>{fleetSummary.percTotalMaint}</strong>
            </div>
          </div>
          <div className="fleet-progress-bar">
            <div
              className="fleet-progress-auto"
              style={{ width: `${fleetSummary.numPercTotalAuto}%` }}
            />
            <div
              className="fleet-progress-maint"
              style={{ width: `${fleetSummary.numPercTotalMaint}%` }}
            />
          </div>
        </div>

        {/* CAT 797F */}
        <div className="summary-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span className="summary-label">CAT 797F (CA55xx)</span>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              {fleetSummary.total797F} cam.
            </span>
          </div>
          <div className="summary-split">
            <div className="fleet-sub-stat">
              <span className="auto">
                🟢 {fleetSummary.count797F_Auto} Operando
              </span>
              <strong className="auto">{fleetSummary.perc797F_Auto}</strong>
            </div>
            <div className="fleet-sub-stat">
              <span className="maint">
                🔴 {fleetSummary.count797F_Maint} Manutenção
              </span>
              <strong className="maint">
                {fleetSummary.perc797F_Maint}
              </strong>
            </div>
          </div>
          <div className="fleet-progress-bar">
            <div
              className="fleet-progress-auto"
              style={{ width: `${fleetSummary.numPerc797F_Auto}%` }}
            />
            <div
              className="fleet-progress-maint"
              style={{ width: `${fleetSummary.numPerc797F_Maint}%` }}
            />
          </div>
        </div>

        {/* CAT 794 AC */}
        <div className="summary-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span className="summary-label">CAT 794 AC (CA57xx)</span>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                fontWeight: 700,
              }}
            >
              {fleetSummary.total794AC} cam.
            </span>
          </div>
          <div className="summary-split">
            <div className="fleet-sub-stat">
              <span className="auto">
                🟢 {fleetSummary.count794AC_Auto} Operando
              </span>
              <strong className="auto">
                {fleetSummary.perc794AC_Auto}
              </strong>
            </div>
            <div className="fleet-sub-stat">
              <span className="maint">
                🔴 {fleetSummary.count794AC_Maint} Manutenção
              </span>
              <strong className="maint">
                {fleetSummary.perc794AC_Maint}
              </strong>
            </div>
          </div>
          <div className="fleet-progress-bar">
            <div
              className="fleet-progress-auto"
              style={{ width: `${fleetSummary.numPerc794AC_Auto}%` }}
            />
            <div
              className="fleet-progress-maint"
              style={{ width: `${fleetSummary.numPerc794AC_Maint}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
