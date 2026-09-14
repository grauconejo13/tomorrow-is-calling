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

type QuoteDecision =
  | "accepted"
  | "declined"
  | "thinking"
  | "email_requested"
  | "price_objection"
  | "unclear";

type NextAction =
  | "SEND_PAYMENT_LINK"
  | "CLOSE_OR_FOLLOW_UP"
  | "EMAIL_QUOTE"
  | "WAIT_FOR_CUSTOMER"
  | "HUMAN_REVIEW"
  | "RETRY_OR_HUMAN_REVIEW";

type StructuredOutcome = {
  reached?: boolean;
  identity_confirmed?: boolean;
  quote_presented?: boolean;
  quote_decision?: QuoteDecision;
  next_action?: NextAction;
  human_help_needed?: boolean;
  customer_questions?: string[];
  price_objection_reason?: string;
  competitor_price_mentioned?: string;
  summary?: string;
};

function getStructuredOutcome(result?: CallEResponse): StructuredOutcome | undefined {
  if (!result) return undefined;
  const recipientResult = result.recipients?.find((recipient) => recipient.structured_result)?.structured_result;
  const candidate = recipientResult ?? result.structured_result;
  return candidate && typeof candidate === "object" ? (candidate as StructuredOutcome) : undefined;
}

function cleanList(value?: string[]) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function money(value?: number) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value as number);
}

function decisionLabel(decision?: QuoteDecision) {
  switch (decision) {
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "thinking":
      return "Thinking it over";
    case "email_requested":
      return "Email requested";
    case "price_objection":
      return "Price objection";
    case "unclear":
      return "Unclear";
    default:
      return "—";
  }
}

function nextActionLabel(action?: NextAction) {
  switch (action) {
    case "SEND_PAYMENT_LINK":
      return "Send the secure payment link by email or text. Payment credentials are entered only on the hosted checkout page.";
    case "CLOSE_OR_FOLLOW_UP":
      return "Close the quote or schedule an approved follow-up without pressuring the customer.";
    case "EMAIL_QUOTE":
      return "Email the quote to the customer and keep the request pending.";
    case "WAIT_FOR_CUSTOMER":
      return "Leave the quote pending while the customer considers it.";
    case "HUMAN_REVIEW":
      return "Route the pricing concern to a human coordinator for review. CALL-E must not invent or authorize a discount.";
    case "RETRY_OR_HUMAN_REVIEW":
      return "Review the unclear outcome and either retry the quote conversation or route it to a human coordinator.";
    default:
      return "Review the call outcome before continuing the transport workflow.";
  }
}

export function ReadinessReportPage({ request, result, onNew, onOverview }: Props) {
  const outcome = getStructuredOutcome(result);
  const quote = request.quote;
  const reached = outcome?.reached;
  const identityConfirmed = outcome?.identity_confirmed;
  const quotePresented = outcome?.quote_presented;
  const decision = outcome?.quote_decision;
  const nextAction = outcome?.next_action;
  const humanHelp = outcome?.human_help_needed;
  const questions = cleanList(outcome?.customer_questions);
  const objectionReason = outcome?.price_objection_reason?.trim();
  const competitorPrice = outcome?.competitor_price_mentioned?.trim();
  const summary = outcome?.summary?.trim() || result?.summary?.trim();
  const hasStructuredOutcome = Boolean(outcome);
  const accepted = decision === "accepted";
  const needsHumanReview = humanHelp || decision === "price_objection" || decision === "unclear";

  const statusTone = accepted ? "ready" : needsHumanReview ? "attention" : decision === "declined" ? "critical" : "attention";
  const statusLabel = accepted
    ? "Quote accepted"
    : decision === "declined"
      ? "Quote declined"
      : decision === "thinking"
        ? "Customer deciding"
        : decision === "email_requested"
          ? "Quote requested"
          : decision === "price_objection"
            ? "Price review needed"
            : decision === "unclear"
              ? "Review required"
              : "Call complete";

  return (
    <main className="page report">
      <p className="eyebrow">Customer quote call outcome</p>
      <div className="report__title">
        <div>
          <h1>Quote decision <span>{request.reference}</span></h1>
          <p>{request.customer.fullName} · {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}</p>
        </div>
        <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
      </div>

      <section className="report-metrics">
        <div><b>{reached === undefined ? "—" : reached ? "Yes" : "No"}</b><span>Customer reached</span></div>
        <div><b>{quotePresented === undefined ? "—" : quotePresented ? "Yes" : "No"}</b><span>Quote presented</span></div>
        <div><b>{decisionLabel(decision)}</b><span>Customer decision</span></div>
        <div><b>{money(quote?.confirmedTotal)}</b><span>Confirmed price</span></div>
      </section>

      <section className="projection">
        <p className="section-label">Quote details</p>
        <div>
          <p><b>Earlier estimate:</b> {money(quote?.estimateLow)}–{money(quote?.estimateHigh)}</p>
          <p><b>Confirmed transport price:</b> {money(quote?.confirmedTotal)}</p>
          <p><b>Initial payment:</b> {money(quote?.initialPayment)}</p>
          <p><b>Remaining at delivery:</b> {money(quote?.remainingBalance)}</p>
        </div>
      </section>

      {hasStructuredOutcome ? (
        <>
          <section className="projection">
            <p className="section-label">Conversation summary</p>
            <div>
              <p>{summary || "CALL-E completed the quote call but did not return a narrative summary."}</p>
              <p><b>Identity confirmed:</b> {identityConfirmed === undefined ? "Unavailable" : identityConfirmed ? "Yes" : "No"}</p>
              <p><b>Human escalation:</b> {humanHelp ? "Required" : "Not required"}</p>
            </div>
          </section>

          <section>
            <p className="section-label">Decision result</p>
            <div className="risk-list">
              <article className="risk-item">
                <div>
                  <StatusBadge tone={quotePresented ? "ready" : "critical"}>{quotePresented ? "Presented" : "Not confirmed"}</StatusBadge>
                  <h3>Confirmed quote</h3>
                </div>
                <p>{quotePresented ? `CALL-E presented the confirmed ${money(quote?.confirmedTotal)} transport price.` : "The structured result did not confirm that the quote was presented."}</p>
              </article>

              <article className="risk-item">
                <div>
                  <StatusBadge tone={accepted ? "ready" : needsHumanReview ? "attention" : decision === "declined" ? "critical" : "attention"}>{decisionLabel(decision)}</StatusBadge>
                  <h3>Customer decision</h3>
                </div>
                <p>{accepted ? "The customer explicitly accepted the confirmed quote." : `Recorded outcome: ${decisionLabel(decision)}.`}</p>
              </article>

              <article className="risk-item">
                <div>
                  <StatusBadge tone={accepted ? "ready" : "attention"}>{accepted ? "Eligible" : "Not authorized"}</StatusBadge>
                  <h3>Secure checkout</h3>
                </div>
                <p>{accepted ? "The workflow may now send a secure hosted payment link. CALL-E does not collect card or bank credentials." : "A payment link must not be sent unless the customer explicitly accepts the quote."}</p>
              </article>
            </div>
          </section>

          {(objectionReason || competitorPrice) && (
            <section>
              <p className="section-label">Pricing concern</p>
              <div className="risk-list">
                {objectionReason && (
                  <article className="risk-item">
                    <div><StatusBadge tone="attention">Review</StatusBadge><h3>Price objection</h3></div>
                    <p>{objectionReason}</p>
                  </article>
                )}
                {competitorPrice && (
                  <article className="risk-item">
                    <div><StatusBadge tone="attention">Reported</StatusBadge><h3>Competitor price mentioned</h3></div>
                    <p>{competitorPrice}</p>
                  </article>
                )}
              </div>
            </section>
          )}

          <section>
            <p className="section-label">Customer questions</p>
            <div className="risk-list">
              {questions.length ? questions.map((question, index) => (
                <article className="risk-item" key={`${question}-${index}`}>
                  <div><StatusBadge tone="attention">Question</StatusBadge><h3>Customer question</h3></div>
                  <p>{question}</p>
                </article>
              )) : (
                <article className="risk-item">
                  <div><StatusBadge tone="ready">None</StatusBadge><h3>No unresolved questions</h3></div>
                  <p>CALL-E did not record any customer questions requiring follow-up.</p>
                </article>
              )}
            </div>
          </section>

          <section className="projection">
            <p className="section-label">Next action</p>
            <div>
              <p>{nextActionLabel(nextAction)}</p>
              <p><b>Workflow action:</b> {nextAction ?? "Unavailable"}</p>
              <p><b>Call ID:</b> {result?.id ?? "Unavailable"}</p>
            </div>
          </section>
        </>
      ) : (
        <section className="projection">
          <p className="section-label">Live outcome unavailable</p>
          <div>
            <p>The call completed, but CALL-E did not return the structured quote-decision outcome expected by this page.</p>
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
