import { useState, type FormEvent } from "react";
import { createTestCall } from "../services/callEApi";

export function TemporaryCallTestPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await createTestCall(phone, name, consent);
      const remaining = result.demo_usage?.phone_remaining;
      const remainingText = typeof remaining === "number"
        ? ` You have ${remaining} demo call${remaining === 1 ? "" : "s"} remaining for this number in the current 24-hour window.`
        : "";
      setMessage(`Call request accepted. Status: ${result.status}. Call ID: ${result.id}.${remainingText}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to place test call.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#090b0f",
        color: "#f5f7fa",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(520px, 100%)",
          border: "1px solid #424854",
          padding: "28px",
          background: "#10141b",
        }}
      >
        <p style={{ marginTop: 0, fontFamily: "monospace", opacity: 0.65 }}>
          PUBLIC CALL-E CONNECTION TEST
        </p>
        <h1 style={{ marginBottom: "8px" }}>Call my phone</h1>
        <p style={{ marginTop: 0, lineHeight: 1.5, opacity: 0.8 }}>
          Enter a phone number you control to receive a short live CALL-E connection test. Public demo usage is limited to three calls per phone number per 24 hours.
        </p>

        <label style={{ display: "block", marginTop: "24px" }}>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            style={{ display: "block", width: "100%", marginTop: "8px", padding: "12px", boxSizing: "border-box" }}
          />
        </label>

        <label style={{ display: "block", marginTop: "18px" }}>
          Phone number
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+12105551234"
            inputMode="tel"
            autoComplete="tel"
            required
            style={{ display: "block", width: "100%", marginTop: "8px", padding: "12px", boxSizing: "border-box" }}
          />
        </label>

        <p style={{ fontSize: "0.9rem", opacity: 0.68 }}>
          Use E.164 format: +1 followed by the 10-digit US number. Do not enter someone else's number without their permission.
        </p>

        <label
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            marginTop: "18px",
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            style={{ marginTop: "3px" }}
          />
          <span>I confirm that I control this phone number or have permission for this CALL-E test call.</span>
        </label>

        <button
          type="submit"
          disabled={loading || !consent}
          style={{
            width: "100%",
            marginTop: "20px",
            padding: "14px",
            cursor: loading || !consent ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Calling…" : "Place test call"}
        </button>

        {message && <p style={{ marginTop: "20px", lineHeight: 1.5 }}>{message}</p>}
        {error && <p style={{ marginTop: "20px", lineHeight: 1.5 }}>Error: {error}</p>}
      </form>
    </main>
  );
}
