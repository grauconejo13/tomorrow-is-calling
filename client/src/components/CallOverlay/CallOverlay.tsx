import { useEffect, useRef } from "react";
import { useMockCall } from "../../hooks/useMockCall";
import type {
  PrototypeCallInterruption,
  PrototypeCallState,
} from "../../types/call";
import { SignalOrb } from "../SignalOrb/SignalOrb";
import "./CallOverlay.css";

type CallOverlayProps = {
  recipient: string;
  scenario: string;
  onClose: () => void;
  onReturnHome: () => void;
  onViewReport: () => void;
};
const reviewAreas = [
  "Cargo readiness",
  "Carrier confirmation",
  "Shipping documentation",
  "Pickup access",
  "Receiving availability",
  "Exception ownership",
  "Contingency plan",
];
const stageCopy: Partial<Record<PrototypeCallState, string>> = {
  preparing: "Preparing a prototype readiness check",
  dialing: "Dialing the responsible contact",
  ringing: "Phone ringing",
  connected: "Connection established",
  assessment: "Readiness assessment in progress",
  processing: "Processing structured responses",
  complete: "Report ready",
};
const interruptions: Record<
  PrototypeCallInterruption,
  { title: string; message: string }
> = {
  cancelled: {
    title: "Assessment cancelled",
    message:
      "No readiness report was generated. You can return to the call brief or try the prototype again.",
  },
  "no-answer": {
    title: "No answer",
    message:
      "The fictional recipient did not answer during this prototype state.",
  },
  failed: {
    title: "Call failed",
    message: "The prototype call monitor could not continue.",
  },
  "processing-failed": {
    title: "Result processing failed",
    message: "The fictional structured result could not be prepared.",
  },
};

export function CallOverlay({
  recipient,
  scenario,
  onClose,
  onReturnHome,
  onViewReport,
}: CallOverlayProps) {
  const call = useMockCall();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const active = [
    "preparing",
    "dialing",
    "ringing",
    "connected",
    "assessment",
    "processing",
  ].includes(call.state);
  const currentReview =
    reviewAreas[
      Math.min(Math.floor(call.duration / 8), reviewAreas.length - 1)
    ];
  const interruption = isInterruption(call.state)
    ? interruptions[call.state]
    : null;

  useEffect(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    return () => openerRef.current?.focus();
  }, []);
  useEffect(() => {
    headingRef.current?.focus();
  }, [call.state]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !active) onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  return (
    <div className="call-overlay-backdrop">
      <section
        className="call-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-overlay-title"
        ref={dialogRef}
      >
        <header className="call-overlay__top">
          <div>
            <p className="eyebrow">Voice readiness check</p>
            <span className="call-overlay__prototype">
              PROTOTYPE MONITOR · NO LIVE PHONE AUDIO
            </span>
          </div>
          {!active && (
            <button className="overlay-close" onClick={onClose}>
              Close
            </button>
          )}
        </header>
        {interruption ? (
          <InterruptionPanel
            {...interruption}
            onRetry={call.retry}
            onClose={onClose}
            onHome={onReturnHome}
          />
        ) : (
          <>
            <div className="call-overlay__shipment">
              <div>
                <small>Shipment</small>
                <strong>SH-2048</strong>
              </div>
              <div>
                <small>Cargo</small>
                <span>Temperature-sensitive diagnostic equipment</span>
              </div>
              <div>
                <small>Contact</small>
                <span>{recipient}</span>
              </div>
              <div>
                <small>Carrier / cutoff</small>
                <span>Northline Express · 6:30 PM</span>
              </div>
            </div>
            <main className="call-overlay__monitor">
              <SignalOrb state={call.state} />
              <div className="call-overlay__status">
                <p className="meta-label" aria-live="polite">
                  Current call stage
                </p>
                <h2 id="call-overlay-title" ref={headingRef} tabIndex={-1}>
                  {stageCopy[call.state]}
                </h2>
                <p className="call-overlay__scenario">{scenario}</p>
                {["connected", "assessment", "processing", "complete"].includes(
                  call.state,
                ) && (
                  <time
                    className="call-overlay__timer"
                    aria-label={`Elapsed call duration ${formatDuration(call.duration)}`}
                  >
                    {formatDuration(call.duration)}
                  </time>
                )}
                {call.state === "assessment" && (
                  <>
                    <p className="call-overlay__review">
                      <span>Current review</span>
                      {currentReview}
                    </p>
                    <p className="call-overlay__guidance">
                      Continue the conversation on the recipient’s phone. This
                      console will prepare the readiness report when the call
                      ends.
                    </p>
                  </>
                )}
                {call.state === "processing" && (
                  <p className="call-overlay__guidance">
                    Preparing a fictional structured result. This will take a
                    moment.
                  </p>
                )}
                {call.state === "complete" && (
                  <p className="call-overlay__guidance">
                    Prototype assessment complete. The readiness report is ready
                    to review.
                  </p>
                )}
                <p className="prototype-notice">
                  Prototype mode: no phone call is currently being placed.
                </p>
              </div>
            </main>
            <footer className="call-overlay__controls">
              {call.state === "assessment" && (
                <>
                  <button
                    className="button button--primary"
                    onClick={call.completeAssessment}
                  >
                    Complete mock assessment
                  </button>
                  <button
                    className="button button--quiet"
                    onClick={call.cancel}
                  >
                    Cancel assessment
                  </button>
                </>
              )}
              {call.state === "processing" && (
                <button className="button button--primary" disabled>
                  Processing assessment…
                </button>
              )}
              {call.state === "complete" && (
                <>
                  <button
                    className="button button--primary"
                    onClick={onViewReport}
                  >
                    View readiness report
                  </button>
                  <button
                    className="button button--quiet"
                    onClick={onReturnHome}
                  >
                    Return to operation
                  </button>
                </>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

function InterruptionPanel({
  title,
  message,
  onRetry,
  onClose,
  onHome,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onClose: () => void;
  onHome: () => void;
}) {
  return (
    <main className="call-overlay__interruption">
      <p className="meta-label">Prototype interruption</p>
      <h2 id="call-overlay-title" tabIndex={-1}>
        {title}
      </h2>
      <p>{message}</p>
      <div className="form-actions">
        <button className="button button--primary" onClick={onRetry}>
          Try again
        </button>
        <button className="button button--quiet" onClick={onClose}>
          Return to review
        </button>
        <button className="button button--quiet" onClick={onHome}>
          Return to overview
        </button>
      </div>
    </main>
  );
}
function isInterruption(
  state: PrototypeCallState,
): state is PrototypeCallInterruption {
  return ["cancelled", "no-answer", "failed", "processing-failed"].includes(
    state,
  );
}
function formatDuration(seconds: number) {
  return [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
