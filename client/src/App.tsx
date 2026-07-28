import { useState } from "react";
import { PageLoader } from "./components/PageLoader/PageLoader";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { ProgressStepper } from "./components/ProgressStepper/ProgressStepper";
import { demoForm, demoShipment } from "./data/demoShipment";
import { CallStatusPage } from "./pages/CallStatusPage/CallStatusPage";
import { NewReadinessCheckPage } from "./pages/NewReadinessCheckPage/NewReadinessCheckPage";
import { OverviewPage } from "./pages/OverviewPage/OverviewPage";
import { ReadinessReportPage } from "./pages/ReadinessReportPage/ReadinessReportPage";
import { ReviewCallPage } from "./pages/ReviewCallPage/ReviewCallPage";
import type { AppView } from "./types/navigation";
import type { ReadinessCheckForm } from "./types/shipment";
import "./App.css";

function App() { const [view,setView]=useState<AppView>("overview");const [form,setForm]=useState<ReadinessCheckForm>(demoForm);const show=(next:AppView)=>setView(next);let page;switch(view){case "new-check":page=<NewReadinessCheckPage initial={form} onReview={data=>{setForm(data);show("review")}} onCancel={()=>show("overview")}/>;break;case "review":page=<ReviewCallPage data={form} onBegin={()=>show("call-status")} onEdit={()=>show("new-check")}/>;break;case "call-status":page=<CallStatusPage onComplete={()=>show("report")} onCancel={()=>show("review")}/>;break;case "report":page=<ReadinessReportPage onNew={()=>show("new-check")} onOverview={()=>show("overview")}/>;break;default:page=<OverviewPage shipment={demoShipment} onStart={()=>show("new-check")}/>;}return <PageLoader><div className="app-shell"><div className="workspace"><AppHeader view={view} onOverview={()=>show("overview")}/>{view!=="overview"&&<ProgressStepper view={view}/>} {page}</div></div></PageLoader> }
export default App;
