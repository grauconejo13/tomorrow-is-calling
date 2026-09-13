import { demoReport } from "../../data/demoShipment";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import "./ReadinessReportPage.css";

export function ReadinessReportPage({ onNew, onOverview }: { onNew: () => void; onOverview: () => void }) {
  const { outcome } = demoReport;

  return (
    <main className="page report">
      <p className="eyebrow">Customer quote call outcome</p>
      <div className="report__title">
        <div>
          <h1>Call outcome <span>AT-4821</span></h1>
          <p>Maya Chen · 2022 Toyota Camry</p>
        </div>
        <StatusBadge tone="ready">Quote accepted</StatusBadge>
      </div>

      <section className="report-metrics">
        <div><b>Yes</b><span>Customer reached</span></div>
        <div><b>$1,180</b><span>Confirmed price</span></div>
        <div><b>$590</b><span>Initial payment</span></div>
        <div><b>Pending</b><span>Secure checkout</span></div>
      </section>

      <section>
        <p className="section-label">Confirmed information</p>
        <div className="risk-list">
          {outcome.confirmed.map((item) => (
            <article className="risk-item" key={item.label}>
              <div>
                <StatusBadge tone="ready">Confirmed</StatusBadge>
                <h3>{item.label}</h3>
              </div>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="section-label">Pending actions</p>
        <div className="risk-list">
          {outcome.unresolved.map((item) => (
            <article className="risk-item" key={item.label}>
              <div>
                <StatusBadge tone="attention">Pending</StatusBadge>
                <h3>{item.label}</h3>
              </div>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="projection">
        <p className="section-label">Next action</p>
        <div>
          <p>{outcome.nextAction}</p>
          <p><b>Human escalation:</b> {outcome.humanEscalation ? "Required." : "Not required for the accepted quote."}</p>
          <p><b>Notes:</b> {outcome.notes}</p>
        </div>
      </section>

      <div className="form-actions">
        <button className="button button--primary" onClick={onNew}>Create another request</button>
        <button className="button button--quiet" onClick={onOverview}>Return to transport queue</button>
      </div>
    </main>
  );
}
