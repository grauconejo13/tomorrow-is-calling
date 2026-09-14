import type { TransportRequestForm } from "../../types/transport";
import "./ReviewCallPage.css";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function paymentMethodLabel(method: string) {
  if (method === "credit_card") return "Credit card";
  if (method === "debit_card") return "Debit card";
  if (method === "ach") return "ACH";
  return method;
}

export function ReviewCallPage({
  data,
  onBegin,
  onBack,
}: {
  data: TransportRequestForm;
  onBegin: () => void;
  onBack: () => void;
}) {
  const quote = data.quote;

  const rows = [
    ["Transport request", data.reference],
    ["Customer", `${data.customer.fullName} · ${data.customer.phone}`],
    ["Vehicle", `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`],
    ["Route", `${data.pickup.address} → ${data.delivery.address}`],
    ["Pickup window", data.pickup.preferredWindow],
    ["Delivery window", data.delivery.preferredWindow],
    ["Expected call duration", "3–5 minutes"],
  ];

  return (
    <main className="page review">
      <p className="eyebrow">Customer quote call brief</p>
      <h1>Present the transport price and capture the customer’s decision.</h1>

      <p className="prototype-notice">
        This action places a real outbound CALL-E call to the customer phone shown below. CALL-E may present the confirmed quote and record the customer’s response, but it does not collect card or bank credentials and it does not charge the customer.
      </p>

      <dl>
        {rows.map(([term, description]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>

      {quote ? (
        <section className="quote-card" aria-labelledby="confirmed-quote-heading">
          <div className="quote-card__heading">
            <div>
              <p className="section-label" id="confirmed-quote-heading">Confirmed transport quote</p>
              <strong>{money(quote.confirmedTotal)}</strong>
            </div>
            <span>Ready to present</span>
          </div>

          <p className="quote-card__estimate">
            Earlier estimate: {money(quote.estimateLow)}–{money(quote.estimateHigh)}
          </p>

          <div className="quote-card__payments">
            <div>
              <small>Initial payment · {quote.depositPercent}%</small>
              <b>{money(quote.initialPayment)}</b>
              <span>Due after quote acceptance through secure checkout</span>
            </div>
            <div>
              <small>Remaining balance</small>
              <b>{money(quote.remainingBalance)}</b>
              <span>Due at delivery in this demo workflow</span>
            </div>
          </div>

          <p className="quote-card__methods">
            Secure checkout methods: {quote.supportedPaymentMethods.map(paymentMethodLabel).join(" · ")}
          </p>
        </section>
      ) : (
        <section className="call-rules">
          <p className="section-label">Quote unavailable</p>
          <p>A confirmed quote is required before CALL-E can place this customer quote call.</p>
        </section>
      )}

      <section>
        <p className="section-label">Reason</p>
        <p>Present the confirmed transport quote and record the customer’s decision.</p>

        <p className="section-label">Goal</p>
        <p>
          State the confirmed price clearly, explain the initial payment and remaining balance, and record whether the customer accepts, declines, wants time, wants the quote emailed, or has a price objection.
        </p>

        <p className="section-label">CALL-E will cover</p>
        <ul>
          {[
            "Confirm it is speaking with the customer before disclosing transport details",
            "Present the confirmed transport price and earlier estimate",
            "Explain the initial payment and remaining balance",
            "Capture accept, decline, think, email, or price-objection outcomes",
            "Route price objections or unresolved questions for human review",
            "Explain that secure checkout is sent only after explicit acceptance",
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="call-rules">
        <p className="section-label">Payment and pricing boundary</p>
        <p>
          CALL-E can present the approved price, record acceptance, and trigger the next workflow step. It cannot invent a discount, negotiate an unauthorized price, collect payment credentials, or charge the customer during the call.
        </p>
        <p>
          Only an explicit quote acceptance can continue to a secure hosted payment link. Declines, requests for time, email requests, unclear responses, and price objections do not authorize payment.
        </p>
      </section>

      <div className="form-actions">
        <button className="button button--primary" onClick={onBegin} disabled={!quote}>
          Begin quote call
        </button>
        <button className="button button--quiet" onClick={onBack}>
          Back to queue
        </button>
      </div>
    </main>
  );
}
