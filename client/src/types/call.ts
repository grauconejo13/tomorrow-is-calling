export type CallPhase = "ready" | "active" | "ended" | "report";

export type MockCallReport = {
  outcome: string;
  summary: string;
  details: string[];
  unresolvedItems: string[];
};
