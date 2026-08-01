import { useRef, useState, type FormEvent } from "react";
import type { ReadinessCheckForm } from "../../types/shipment";
import "./NewReadinessCheckPage.css";

const fields: [keyof ReadinessCheckForm, string, string][] = [
  ["reference", "Shipment reference", "text"],
  ["cargo", "Cargo or operation description", "text"],
  ["origin", "Origin", "text"],
  ["destination", "Destination", "text"],
  ["carrier", "Carrier", "text"],
  ["cutoffDate", "Cutoff date", "date"],
  ["cutoffTime", "Cutoff time", "time"],
  ["contact", "Responsible contact", "text"],
  ["phone", "Phone number", "tel"],
];

export function NewReadinessCheckPage({
  initial,
  onReview,
  onCancel,
}: {
  initial: ReadinessCheckForm;
  onReview: (data: ReadinessCheckForm) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [consentError, setConsentError] = useState(false);
  const consentRef = useRef<HTMLInputElement>(null);
  const update = (key: keyof ReadinessCheckForm, value: string | boolean) =>
    setData((current) => ({ ...current, [key]: value }));
  const updateConsent = (checked: boolean) => {
    update("consent", checked);
    if (checked) setConsentError(false);
  };

  function submit(event: FormEvent) {
    event.preventDefault();
    const missing = fields
      .filter(([key]) => !data[key])
      .map(([, label]) => label);
    const needsConsent = !data.consent;
    setErrors(missing);
    setConsentError(needsConsent);
    if (needsConsent) consentRef.current?.focus();
    if (!missing.length && !needsConsent) onReview(data);
  }

  return (
    <main className="page form-page">
      <p className="eyebrow">New readiness check</p>
      <h1>Prepare an operation review</h1>
      <p className="page-intro">
        All fields are prefilled with fictional prototype data. No call will be
        placed.
      </p>
      {errors.length > 0 && (
        <div className="form-error" role="alert">
          Complete: {errors.join(", ")}.
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          {fields.map(([key, label, type]) => (
            <label key={key}>
              {label}
              <input
                type={type}
                value={String(data[key])}
                onChange={(event) => update(key, event.target.value)}
                required
                aria-invalid={errors.some((error) => error === label)}
              />
              {key === "phone" && (
                <small>Prototype mock data only. No call will be placed.</small>
              )}
            </label>
          ))}
        </div>
        <label>
          Known concerns
          <textarea
            value={data.concerns}
            onChange={(event) => update("concerns", event.target.value)}
            required
            rows={4}
          />
        </label>
        <fieldset>
          <legend>Call timing</legend>
          <label>
            <input
              type="radio"
              checked={data.callTiming === "now"}
              onChange={() => update("callTiming", "now")}
            />{" "}
            Call now
          </label>
          <label>
            <input
              type="radio"
              checked={data.callTiming === "schedule"}
              onChange={() => update("callTiming", "schedule")}
            />{" "}
            Schedule
          </label>
        </fieldset>
        <div
          className={`consent-group ${consentError ? "consent-group--error" : ""}`}
          role="group"
          aria-label="Contact permission"
          aria-invalid={consentError || undefined}
        >
          <label className="consent">
            <input
              ref={consentRef}
              type="checkbox"
              checked={data.consent}
              onChange={(event) => updateConsent(event.target.checked)}
              aria-invalid={consentError || undefined}
              aria-describedby={consentError ? "consent-error" : undefined}
            />{" "}
            I confirm I have permission to contact the responsible person for
            this readiness check.
          </label>
          {consentError && (
            <p className="consent-error" id="consent-error" role="alert">
              Please confirm you have permission to contact this person before
              continuing.
            </p>
          )}
        </div>
        <div className="form-actions">
          <button className="button button--primary" type="submit">
            Review readiness call
          </button>
          <button
            className="button button--quiet"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
