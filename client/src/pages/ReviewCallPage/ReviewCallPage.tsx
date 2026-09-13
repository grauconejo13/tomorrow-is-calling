import type { TransportRequestForm } from "../../types/transport";
import "./ReviewCallPage.css";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ReviewCallPage({ data, onBegin, onEdit }: { data: TransportRequestForm; onBegin: () => void; onEdit: () => void }) {
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
      <h1>Present the transport price and capture the customer’s decision</h1>
      <p className="prototype-notice">
        Prototype mode: CALL-E presents the quote and records the customer’s response. It does not collect card numbers or charge the customer during the call.
      </p>

      <dl>
        {rows.map(([term, description]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>

      {quote && (
        <section className="quote-card" aria-label="Transport quote and payment terms">
          <div className="quote-card__heading">
            <div>
              <p className="section-label">Confirmed quote</p>
              <strong>{money(quote.confirmedTotal)}</strong>
            </div>
            <span>Customer decision pending</span>
          </div>

          <p className="quote-card__estimate">
            Earlier estimate: {money(quote.estimateLow)}–{money(quote.estimateHigh)}
          </p>

          <div className="quote-card__payments">
            <div>
              <small>Initial payment</small>
              <b>{money(quote.initialPayment)}</b>
              <span>{quote.depositPercent}% after acceptance</span>
            </div>
            <div>
              <small>Remaining balance</small>
              <b>{money(quote.remainingBalance)}</b>
              <span>Due at delivery</span>
            </div>
          </div>

          <p className="quote-card__methods">
            Secure checkout can support credit card, debit card, or ACH in the production flow.
          </p>
        </section>
      )}

      <section>
        <p className="section-label">CALL-E goal</p>
        <p>
          State the confirmed transport price clearly, explain the payment split, and ask the customer whether they want to accept the quote.
        </p>

        <p className="section-label">Allowed customer outcomes</p>
        <ul>
          {["Accept quote", "Decline quote", "Think about it", "Email me the quote", "Price is too high — request human review"].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="call-rules">
        <p className="section-label">Payment boundary</p>
        <p>
          Only an explicit acceptance continues to payment. CALL-E then sends a secure checkout link by email or text. Card or bank details are entered on the secure payment page, not spoken to CALL-E and not entered into this transport form.
        </p>
        <p>
          If the customer objects to the price, CALL-E records the objection and routes it for review. It does not invent or negotiate an unauthorized discount.
        </p>
      </section>

      <div className="form-actions">
        <button className="button button--primary" onClick={onBegin}>Begin quote call</button>
        <button className="button button--quiet" onClick={onEdit}>Edit transport details</button>
      </div>
    </main>
  );
}
