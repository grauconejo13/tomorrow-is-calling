import { demoOperations } from "../../data/demoShipment";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import "./OverviewPage.css";

const label = (status: string) => status.replaceAll("_", " ");

type Props = {
  hasDraft: boolean;
  onStart: () => void;
  onDiscardDraft: () => void;
};

export function OverviewPage({ hasDraft, onStart, onDiscardDraft }: Props) {
  return (
    <main className="page overview">
      <section className="hero">
        <p className="eyebrow">Transport coordination console</p>
        <h1>Keep every vehicle handoff moving.</h1>
        <p>Create transport requests, collect secure customer details, and use CALL-E for the coordination calls that move a vehicle forward.</p>
        <button className="button button--primary" id="overview-start-check" onClick={onStart}>
          {hasDraft ? "Resume transport request" : "Create transport request"}
        </button>
      </section>

      {hasDraft && (
        <aside className="draft-card" aria-labelledby="draft-heading">
          <div>
            <p className="section-label">In-progress demo request</p>
            <h2 id="draft-heading">Continue where you left off.</h2>
            <p>Your details are held only while this tab stays open. They are cleared when the tab closes or you discard the draft.</p>
          </div>
          <div className="draft-card__actions">
            <button className="button button--secondary" onClick={onStart}>Resume request</button>
            <button className="button button--quiet" onClick={onDiscardDraft}>Discard draft</button>
          </div>
        </aside>
      )}

      <section className="operations-queue" aria-labelledby="queue-heading">
        <div className="operations-queue__heading">
          <div>
            <p className="section-label">Transport requests</p>
            <h2 id="queue-heading">Customer forms, driver assignment, and vehicle handoffs.</h2>
          </div>
        </div>
        <p className="queue-note">Prototype data: AT-4821 is the active demo workflow. Other entries illustrate queue states only.</p>
        <div className="queue-list">
          {demoOperations.map((operation) => (
            <article className={`queue-row ${operation.isInteractive ? "queue-row--active" : ""}`} key={operation.id}>
              <div className="queue-row__operation">
                <strong>{operation.reference}</strong>
                <span>{operation.customer} · {operation.vehicle}</span>
              </div>
              <div><small>Route</small><span>{operation.route}</span></div>
              <div><small>Status</small><StatusBadge tone={operation.isInteractive ? "attention" : operation.status === "completed" ? "ready" : "active"}>{label(operation.status)}</StatusBadge></div>
              <div><small>Next action</small><span className="queue-state">{operation.nextAction}</span></div>
              <div className="queue-row__action">
                {operation.isInteractive ? <button className="button button--secondary" onClick={onStart}>{hasDraft ? "Resume request" : "Open request"}</button> : <span className="sample-label">Sample request</span>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="how">
        <p className="section-label">Demo coordination path</p>
        <ol>
          <li><b>01</b><span>Request created → secure form sent → follow-up required</span></li>
          <li><b>02</b><span>Authorization complete → ready for driver → driver accepted</span></li>
          <li><b>03</b><span>Pickup approaching → in transit → delivery approaching → completed</span></li>
        </ol>
      </section>
    </main>
  );
}
