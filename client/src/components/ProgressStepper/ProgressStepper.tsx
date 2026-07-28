import type { AppView } from "../../types/navigation"; import "./ProgressStepper.css";
const steps: AppView[]=["overview","new-check","review","call-status","report"]; const names=["Overview","Details","Review","Assessment","Report"];
export function ProgressStepper({view}:{view:AppView}){const current=steps.indexOf(view);return <ol className="stepper" aria-label="Readiness check progress">{names.map((name,index)=><li key={name} className={index<=current?"done":""}><span>{index+1}</span><small>{name}</small></li>)}</ol>}
