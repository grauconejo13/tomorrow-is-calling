import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import type { CallEResponse } from "../../services/callEApi";
import type { TransportRequest } from "../../types/transport";
import "./ReadinessReportPage.css";

type Props = {
  request: TransportRequest;
  result?: CallEResponse;
  onNew: () => void;
  onOverview: () => void;
};

type StructuredOutcome = {
  reached?: boolean;
  form_received?: "yes" | "no" | "unknown";
  completion_timing?: string;
  human_help_needed?: boolean;
  blockers?: string[];
};

function getStructuredOutcome(result?: CallEResponse): StructuredOutcome | undefined {
  if (!result) return undefined;
  const recipientResult = result.recipients?.find((recipient) => recipient.structured_result)?.structured_result;
  const candidate = recipientResult ?? result.structured_result;
  return candidate && typeof candidate === "object" ? (candidate as StructuredOutcome) : undefined;
}

export function ReadinessReportPage({ request, result, onNew, onOverview }: Props) {
  const outcome = getStructuredOutcome(result);
  const reached = outcome?.reached;
  const formReceived = outcome?.form_received;
  const completionTiming = outcome?.completion_timing?.trim();
  const humanHelp = outcome?.human_help_needed;
  const blockers = Array.isArray(outcome?.blockers) ? outcome.blockers : [];
  const hasStructuredOutcome = Boolean(outcome);

  const statusTone = humanHelp || blockers.length ? "attention" : "ready";
  const statusLabel = humanHelp || blockers.length ? "Follow-up required" : "Call complete";

  return (
    <main className="page report">
      <p className="eyebrow">Customer follow-up outcome</p>
      <div className="report__title">
        <div>
          <h1>Call outcome <span>{request.reference}</span></h1>
          <p>{request.customer.fullName} · {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</p>
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>

      <section className="report-metrics">
        <div><b>{reached === undefined ? "—" : reached ? "Yes" : "No"}</b><span>Customer reached</span></div>
        <div><b>{completionTiming || "—"}</b><span>Expected completion</span></div>
        <div><b>{formReceived ? formReceived[0].toUpperCase() + formReceived.slice(1) : "—"}</b><span>Form received</span></div>
        <div><b>{humanHelp === undefined ? "—" : humanHelp ? "Yes" : "No"}</b><span>Human follow-up</span></div>
      </section>

      {hasStructuredOutcome ? (
        <>
          <section>
            <p className="section-label">Confirmed information</p>
            <div className="risk-list">
              <article className="risk-item"><div><StatusBadge tone="ready">Confirmed</StatusBadge><h3>Customer reached</h3></div><p>{reached ? "Yes" : "No"}</p></article>
              <article className="risk-item"><div><StatusBadge tone="ready">Confirmed</StatusBadge><h3>Secure form received</h3></div><p>{formReceived ?? "unknown"}</p></article>
              <article className="risk-item"><div><StatusBadge tone="ready">Confirmed</StatusBadge><h3>Expected completion</h3></div><p>{completionTiming || "Not provided"}</p></article>
            </div>
          </section>

          <section>
            <p className="section-label">Unresolved items</p>
            <div className="risk-list">
              {blockers.length ? blockers.map((blocker, index) => (
                <article className="risk-item" key={`${blocker}-${index}`}>
                  <div><StatusBadge tone="critical">Pending</StatusBadge><h3>Blocker</h3></div>
                  <p>{blocker}</p>
                </article>
              )) : (
                <article className="risk-item">
                  <div><StatusBadge tone="ready">Clear</StatusBadge><h3>No blockers reported</h3></div>
                  <p>CALL-E did not return any unresolved blockers for this call.</p>
                </article>
              )}
            </div>
          </section>

          <section className="projection">
            <p className="section-label">Next action</p>
            <div>
              <p>{humanHelp ? "Route this request to a human coordinator for follow-up." : "Continue the transport workflow using the confirmed call outcome."}</p>
              <p><b>Human escalation:</b> {humanHelp ? "Required" : "Not required"}</p>
              {result?.summary && <p><b>CALL-E summary:</b> {result.summary}</p>}
              <p><b>Call ID:</b> {result?.id ?? "Unavailable"}</p>
            </div>
          </section>
        </>
      ) : (
        <section className="projection">
          <p className="section-label">Live outcome unavailable</p>
          <div>
            <p>The call completed, but CALL-E did not return a structured outcome in the response available to this page.</p>
            {result?.summary && <p><b>CALL-E summary:</b> {result.summary}</p>}
            <p><b>Call ID:</b> {result?.id ?? "Unavailable"}</p>
          </div>
        </section>
      )}

      <div className="form-actions">
        <button className="button button--primary" onClick={onNew}>Create another request</button>
        <button className="button button--quiet" onClick={onOverview}>Return to transport queue</button>
      </div>
    </main>
  );
}
