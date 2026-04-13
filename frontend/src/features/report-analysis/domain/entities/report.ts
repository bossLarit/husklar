export type RiskLevel = "green" | "yellow" | "red";
export type ReportType = "tilstandsrapport" | "elrapport";

export interface RiskItem {
  category: string;
  risk: RiskLevel;
  finding: string;
  plainExplanation: string;
  estimatedCostLow: number;
  estimatedCostHigh: number;
}

export interface ReportAnalysis {
  id: string;
  type: ReportType;
  createdAt: string;
  overallRisk: RiskLevel;
  riskItems: RiskItem[];
  totalCostLow: number;
  totalCostHigh: number;
  summary: string;
}
