import { useEffect, useState } from "react";
import type { CallPhase, MockCallReport } from "../types/call";

const demoReport: MockCallReport = {
  outcome: "Readiness exceptions require follow-up",
  summary: "This fictional demo assessment identified carrier confirmation and receiving availability as the immediate review areas.",
  details: ["Carrier pickup confirmation is still pending.", "Receiving acknowledgment has not been recorded."],
  unresolvedItems: ["Assign a backup carrier.", "Confirm ownership of final shipping-document review."],
};

export function useMockCall() {
  const [phase, setPhase] = useState<CallPhase>("ready");
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = window.setInterval(() => setDuration(value => value + 1), 1_000);
    return () => window.clearInterval(interval);
  }, [phase]);

  const start = () => { setDuration(0); setPhase("active"); };
  const hangUp = () => setPhase("ended");
  const showReport = () => setPhase("report");
  const reset = () => { setDuration(0); setPhase("ready"); };

  return { phase, duration, report: demoReport, start, hangUp, showReport, reset };
}
