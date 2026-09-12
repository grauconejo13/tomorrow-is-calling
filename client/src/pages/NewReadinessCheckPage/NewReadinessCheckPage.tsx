import { useRef, useState, type FormEvent } from "react";
import type { TransportRequestForm } from "../../types/transport";
import "./NewReadinessCheckPage.css";

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function NewReadinessCheckPage({ initial, onReview, onCancel }: { initial: TransportRequestForm; onReview: (data: TransportRequestForm) => void; onCancel: () => void }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const consentRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const update = <K extends keyof TransportRequestForm>(key: K, value: TransportRequestForm[K]) => setData((current) => ({ ...current, [key]: value }));
  const customer = (key: "fullName" | "phone" | "email", value: string) => update("customer", { ...data.customer, [key]: value });
  const vehicle = (key: "year" | "make" | "model", value: string) => update("vehicle", { ...data.vehicle, [key]: value });
  const place = (kind: "pickup" | "delivery", key: string, value: unknown) => update(kind, { ...data[kind], [key]: value } as TransportRequestForm[typeof kind]);
  const alternate = (kind: "pickup" | "delivery", key: string, value: string | boolean) => {
    const existing = data[kind].alternateContact ?? { fullName: "", phone: "", relationship: "", authorized: false };
    place(kind, "alternateContact", { ...existing, [key]: value });
  };
  const required = [data.customer.fullName, data.customer.phone, data.customer.email, data.vehicle.year, data.vehicle.make, data.vehicle.model, data.pickup.address, data.pickup.preferredWindow, data.delivery.address, data.delivery.preferredWindow];
  function submit(event: FormEvent) {
    event.preventDefault();
    if (required.some((value) => !value) || !data.consentToContact) {
      setError("Complete all required transport details and confirm contact consent.");
      if (!data.consentToContact) consentRef.current?.focus();
      return;
    }
    if (!E164_PATTERN.test(data.customer.phone.trim())) {
      setError("Enter the customer phone in E.164 format, for example +12105551234.");
      phoneRef.current?.focus();
      return;
    }
    setError(""); onReview(data);
  }
  const ContactFields = ({ kind }: { kind: "pickup" | "delivery" }) => data[kind].presence === "alternate" ? <div className="form-grid alternate-fields"><label>Authorized {kind} contact name<input value={data[kind].alternateContact?.fullName ?? ""} onChange={(e) => alternate(kind, "fullName", e.target.value)} required /></label><label>Mobile phone<input type="tel" value={data[kind].alternateContact?.phone ?? ""} onChange={(e) => alternate(kind, "phone", e.target.value)} required /></label><label>Relationship / role (optional)<input value={data[kind].alternateContact?.relationship ?? ""} onChange={(e) => alternate(kind, "relationship", e.target.value)} /></label><label className="consent"><input type="checkbox" checked={data[kind].alternateContact?.authorized ?? false} onChange={(e) => alternate(kind, "authorized", e.target.checked)} /> I confirm this person is authorized to {kind === "pickup" ? "release" : "receive"} the vehicle.</label>{!data[kind].alternateContact?.authorized && <p className="alternate-warning">Alternate contact provided — authorization pending. This person will not be treated as authorized.</p>}</div> : null;
  return <main className="page form-page"><p className="eyebrow">Customer transport form</p><h1>Complete your transport details</h1><p className="page-intro">This flow can place a live CALL-E outbound call. For testing, replace the sample customer name and phone with the real recipient you intend to call.</p>{error && <div className="form-error" role="alert">{error}</div>}<form onSubmit={submit} noValidate>
    <section><p className="section-label">Customer</p><div className="form-grid"><label>Full name<input value={data.customer.fullName} onChange={(e) => customer("fullName", e.target.value)} required /></label><label>Phone<input ref={phoneRef} type="tel" inputMode="tel" placeholder="+12105551234" value={data.customer.phone} onChange={(e) => customer("phone", e.target.value)} required /><small>Use E.164 format: +1 followed by the 10-digit US number.</small></label><label>Email<input type="email" value={data.customer.email} onChange={(e) => customer("email", e.target.value)} required /></label></div></section>
    <section><p className="section-label">Vehicle</p><div className="form-grid"><label>Year<input inputMode="numeric" value={data.vehicle.year} onChange={(e) => vehicle("year", e.target.value)} required /></label><label>Make<input value={data.vehicle.make} onChange={(e) => vehicle("make", e.target.value)} required /></label><label>Model<input value={data.vehicle.model} onChange={(e) => vehicle("model", e.target.value)} required /></label></div></section>
    {(["pickup", "delivery"] as const).map((kind) => <section key={kind}><p className="section-label">{kind}</p><div className="form-grid"><label>{kind} address<input value={data[kind].address} onChange={(e) => place(kind, "address", e.target.value)} required /></label><label>Preferred {kind} window<input value={data[kind].preferredWindow} onChange={(e) => place(kind, "preferredWindow", e.target.value)} required /></label></div><fieldset><legend>Who will be present?</legend><label><input type="radio" checked={data[kind].presence === "customer"} onChange={() => place(kind, "presence", "customer")} /> I will be present</label><label><input type="radio" checked={data[kind].presence === "alternate"} onChange={() => place(kind, "presence", "alternate")} /> Someone else will be present</label></fieldset>{kind === "delivery" && data.pickup.alternateContact && <label className="consent"><input type="checkbox" checked={data.delivery.usePickupAlternate} onChange={(e) => place("delivery", "usePickupAlternate", e.target.checked)} /> Use the pickup alternate contact for delivery</label>}<ContactFields kind={kind} /></section>)}
    <section><p className="section-label">Service authorization</p><label>Special instructions<textarea rows={4} value={data.specialInstructions} onChange={(e) => update("specialInstructions", e.target.value)} /></label><div className="prototype-notice">Do not enter payment-card information here. Sensitive payment or authorization details should use a secure external channel.</div></section>
    <label className="consent"><input ref={consentRef} type="checkbox" checked={data.consentToContact} onChange={(e) => update("consentToContact", e.target.checked)} /> I consent to service-related calls and texts about this transport request.</label><div className="form-actions"><button className="button button--primary" type="submit">Review live follow-up call</button><button className="button button--quiet" type="button" onClick={onCancel}>Cancel</button></div></form></main>;
}
