import type { AppView } from "../../types/navigation";
import "./AppHeader.css";
export function AppHeader({
  view,
  onOverview,
}: {
  view: AppView;
  onOverview: () => void;
}) {
  return (
    <header className="app-header">
      <button className="brand" onClick={onOverview}>
        <span>TOMORROW IS CALLING</span>
        <small>Operations Risk Network</small>
      </button>
      <nav aria-label="Primary navigation">
        <button
          className={view === "overview" ? "active" : ""}
          onClick={onOverview}
        >
          Overview
        </button>
        <button disabled aria-label="Readiness Checks, upcoming">
          Readiness Checks <small>Upcoming</small>
        </button>
        <button disabled aria-label="Reports, upcoming">
          Reports <small>Upcoming</small>
        </button>
      </nav>
      <span className="mock-flag">PROTOTYPE / MOCK DATA</span>
    </header>
  );
}
