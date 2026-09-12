import { useEffect, useRef, useState } from "react";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { CallOverlay } from "./components/CallOverlay/CallOverlay";
import { PageLoader } from "./components/PageLoader/PageLoader";
import { ProgressStepper } from "./components/ProgressStepper/ProgressStepper";
import { demoCallTask, demoForm } from "./data/demoShipment";
import { NewReadinessCheckPage } from "./pages/NewReadinessCheckPage/NewReadinessCheckPage";
import { OverviewPage } from "./pages/OverviewPage/OverviewPage";
import { ReadinessReportPage } from "./pages/ReadinessReportPage/ReadinessReportPage";
import { ReviewCallPage } from "./pages/ReviewCallPage/ReviewCallPage";
import { TemporaryCallTestPage } from "./pages/TemporaryCallTestPage";
import type { AppView } from "./types/navigation";
import type { TransportRequestForm } from "./types/transport";
import "./App.css";

function App() {
  if (window.location.pathname === "/test-call") {
    return <TemporaryCallTestPage />;
  }

  const [view, setView] = useState<AppView>("overview");
  const [form, setForm] = useState<TransportRequestForm>(demoForm);
  const [callOpen, setCallOpen] = useState(false);
  const restoreOverviewFocus = useRef(false);
  const show = (next: AppView) => {
    setCallOpen(false);
    setView(next);
  };

  useEffect(() => {
    if (restoreOverviewFocus.current && view === "overview") {
      document.getElementById("overview-start-check")?.focus();
      restoreOverviewFocus.current = false;
    }
  }, [view]);

  let page;
  switch (view) {
    case "new-check":
      page = (
        <NewReadinessCheckPage
          initial={form}
          onReview={(data) => {
            setForm(data);
            show("review");
          }}
          onCancel={() => show("overview")}
        />
      );
      break;
    case "review":
      page = (
        <ReviewCallPage
          data={form}
          onBegin={() => setCallOpen(true)}
          onEdit={() => show("new-check")}
        />
      );
      break;
    case "report":
      page = (
        <ReadinessReportPage
          onNew={() => show("new-check")}
          onOverview={() => show("overview")}
        />
      );
      break;
    default:
      page = <OverviewPage onStart={() => show("new-check")} />;
  }

  return (
    <PageLoader>
      <div className="app-shell" aria-hidden={callOpen || undefined}>
        <div className="workspace">
          <AppHeader view={view} onOverview={() => show("overview")} />
          {view !== "overview" && <ProgressStepper view={view} />}
          {page}
        </div>
      </div>
      {callOpen && (
        <CallOverlay
          request={form}
          task={{ ...demoCallTask, recipient: form.customer, requestReference: form.reference }}
          onClose={() => setCallOpen(false)}
          onReturnHome={() => {
            restoreOverviewFocus.current = true;
            show("overview");
          }}
          onViewReport={() => show("report")}
        />
      )}
    </PageLoader>
  );
}

export default App;
