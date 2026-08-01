import { demoOperations } from "../../data/demoShipment";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import "./OverviewPage.css";

export function OverviewPage({ onStart }: { onStart: () => void }) {
  return (
    <main className="page overview">
      <section className="hero">
        <p className="eyebrow">Operational prevention protocol</p>
        <h1>Catch the delay before it becomes a missed cutoff.</h1>
        <p>
          Run an AI-guided voice readiness check before a critical shipment,
          delivery, or operational handoff.
        </p>
        <button
          className="button button--primary"
          id="overview-start-check"
          onClick={onStart}
        >
          Run a readiness check
        </button>
      </section>

      <section className="operations-queue" aria-labelledby="queue-heading">
        <div className="operations-queue__heading">
          <div>
            <p className="section-label">Operations queue</p>
            <h2 id="queue-heading">
              Upcoming, scheduled, and completed readiness checks.
            </h2>
          </div>
        </div>
        <p className="queue-note">
          Prototype data: SH-2048 is the active demo workflow. Other entries
          illustrate queue states only.
        </p>
        <div className="queue-list">
          {demoOperations.map((operation) => (
            <article
              className={`queue-row ${operation.isInteractive ? "queue-row--active" : ""}`}
              key={operation.id}
            >
              <div className="queue-row__operation">
                <strong>{operation.reference}</strong>
                <span>{operation.description}</span>
              </div>
              <div>
                <small>Route</small>
                <span>{operation.route}</span>
              </div>
              <div>
                <small>Status</small>
                <StatusBadge
                  tone={
                    operation.isInteractive
                      ? "attention"
                      : operation.queueState === "Done"
                        ? "ready"
                        : "active"
                  }
                >
                  {operation.status}
                </StatusBadge>
              </div>
              <div>
                <small>Queue state</small>
                <span className="queue-state">{operation.queueState}</span>
              </div>
              <div className="queue-row__action">
                {operation.isInteractive ? (
                  <button
                    className="button button--secondary"
                    onClick={onStart}
                  >
                    Open assessment
                  </button>
                ) : (
                  <span className="sample-label">Sample operation</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how">
        <p className="section-label">How it works</p>
        <ol>
          <li>
            <b>01</b>
            <span>Add the operation</span>
          </li>
          <li>
            <b>02</b>
            <span>Complete a voice readiness check</span>
          </li>
          <li>
            <b>03</b>
            <span>Receive a prevention plan</span>
          </li>
        </ol>
      </section>
    </main>
  );
}
