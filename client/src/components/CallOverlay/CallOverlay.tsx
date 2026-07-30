import { useEffect, useRef } from "react";
import { useMockCall } from "../../hooks/useMockCall";
import { SignalOrb } from "../SignalOrb/SignalOrb";
import "./CallOverlay.css";

type CallOverlayProps = { recipient: string; scenario: string; onClose: () => void; onReturnHome: () => void };

export function CallOverlay({ recipient, scenario, onClose, onReturnHome }: CallOverlayProps) {
  const call = useMockCall();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; return () => openerRef.current?.focus(); }, []);
  useEffect(() => { if (call.phase === "active" || call.phase === "ended") headingRef.current?.focus(); }, [call.phase]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && call.phase !== "active") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [call.phase, onClose]);

  const duration = formatDuration(call.duration);
  const active = call.phase === "active";
  return <div className="call-overlay-backdrop"><div className="call-overlay" role="dialog" aria-modal="true" aria-labelledby="call-overlay-title" ref={dialogRef}>
    <div className="call-overlay__top"><p className="eyebrow">Prototype voice readiness check</p>{!active && <button className="overlay-close" onClick={onClose} aria-label="Close call overlay">×</button>}</div>
    {call.phase === "ready" && <section className="call-overlay__panel"><SignalOrb/><p className="meta-label">Call recipient</p><h2 id="call-overlay-title" ref={headingRef} tabIndex={-1}>{recipient}</h2><p className="call-overlay__scenario">{scenario}</p><p className="prototype-notice">Fictional demo: starting this screen does not place a real phone call.</p><button className="button button--primary" onClick={call.start}>Start Call</button><button className="button button--quiet" onClick={onClose}>Cancel</button></section>}
    {call.phase === "active" && <section className="call-overlay__panel call-overlay__panel--active"><SignalOrb/><p className="meta-label">Connected — fictional demo</p><h2 id="call-overlay-title" ref={headingRef} tabIndex={-1}>Call in progress</h2><time className="call-overlay__timer" aria-label={`Call duration ${duration}`}>{duration}</time><p className="call-overlay__scenario">Reviewing carrier confirmation for {scenario}.</p><p className="sr-status" role="status">Call in progress. The timer has started.</p><button className="button button--danger" onClick={call.hangUp}>Hang Up</button></section>}
    {call.phase === "ended" && <section className="call-overlay__panel"><p className="meta-label">Prototype call status</p><h2 id="call-overlay-title" ref={headingRef} tabIndex={-1}>Call ended</h2><p className="call-overlay__final">Final call duration <b>{duration}</b></p><p className="prototype-notice">The timer has stopped. A fictional demo report is ready to review.</p><p className="sr-status" role="status">Call ended. Final duration {duration}.</p><button className="button button--primary" onClick={call.showReport}>View call summary</button><button className="button button--quiet" onClick={onClose}>Close</button></section>}
    {call.phase === "report" && <section className="call-overlay__report"><p className="meta-label">Fictional demo report</p><h2 id="call-overlay-title" ref={headingRef} tabIndex={-1}>Call Summary</h2><dl><div><dt>Final duration</dt><dd>{duration}</dd></div><div><dt>Call outcome</dt><dd>{call.report.outcome}</dd></div></dl><p>{call.report.summary}</p><h3>Key details</h3><ul>{call.report.details.map(item => <li key={item}>{item}</li>)}</ul><h3>Unresolved items</h3><ul>{call.report.unresolvedItems.map(item => <li key={item}>{item}</li>)}</ul><div className="form-actions"><button className="button button--primary" onClick={call.reset}>Start Another Call</button><button className="button button--quiet" onClick={onReturnHome}>Return Home</button></div></section>}
  </div></div>;
}

function formatDuration(seconds: number) { return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map(value => String(value).padStart(2, "0")).join(":"); }
