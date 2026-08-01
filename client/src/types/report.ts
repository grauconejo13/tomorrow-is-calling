export type Risk = {
  title: string;
  severity: "High" | "Moderate";
  impact?: string;
};
export type RecommendedAction = { action: string; owner: string };
export type ReadinessReport = {
  readiness: number;
  preventionWindow: string;
  risks: Risk[];
  actions: RecommendedAction[];
};
