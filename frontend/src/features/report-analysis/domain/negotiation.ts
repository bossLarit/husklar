import type { ReportAnalysis, RiskItem, RiskLevel } from "./entities/report";

const YELLOW_THRESHOLD = 10_000;
const LONG_LISTING_DAYS = 60;

export interface TalkingPoint {
  category: string;
  finding: string;
  risk: RiskLevel;
  minAmount: number;
  maxAmount: number;
  script: string;
}

export interface NegotiationCalc {
  minDiscount: number;
  fairDiscount: number;
  maxDiscount: number;
  priorityItems: RiskItem[];
  talkingPoints: TalkingPoint[];
  askingPrice?: number;
  daysOnMarket?: number;
  realisticPrice?: number;
  discountPercent?: number;
  longListing: boolean;
}

function isPriority(item: RiskItem): boolean {
  if (item.risk === "red") return true;
  if (item.risk === "yellow" && item.estimatedCostHigh > YELLOW_THRESHOLD) return true;
  return false;
}

function buildScript(item: RiskItem): string {
  return `Nævn at ${item.finding.toLowerCase()} Tilstandsrapporten estimerer omkostninger på ${formatDkkShort(item.estimatedCostLow)}–${formatDkkShort(item.estimatedCostHigh)}. Kræv et afslag på mindst ${formatDkkShort(item.estimatedCostLow)}.`;
}

function formatDkkShort(amount: number): string {
  return `${new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(Math.round(amount))} kr`;
}

export function calculateNegotiation(
  analysis: ReportAnalysis,
  options: { askingPrice?: number; daysOnMarket?: number } = {},
): NegotiationCalc {
  const { askingPrice, daysOnMarket } = options;

  const minDiscount = analysis.totalCostLow;
  const maxDiscount = analysis.totalCostHigh;
  const fairDiscount = Math.round((minDiscount + maxDiscount) / 2);

  const priorityItems = [...analysis.riskItems]
    .filter(isPriority)
    .sort((a, b) => b.estimatedCostHigh - a.estimatedCostHigh);

  const talkingPoints: TalkingPoint[] = priorityItems.map((item) => ({
    category: item.category,
    finding: item.finding,
    risk: item.risk,
    minAmount: item.estimatedCostLow,
    maxAmount: item.estimatedCostHigh,
    script: buildScript(item),
  }));

  const hasAsking = typeof askingPrice === "number" && askingPrice > 0;
  const realisticPrice = hasAsking ? askingPrice - fairDiscount : undefined;
  const discountPercent = hasAsking ? fairDiscount / askingPrice : undefined;

  const longListing =
    typeof daysOnMarket === "number" && daysOnMarket >= LONG_LISTING_DAYS;

  return {
    minDiscount,
    fairDiscount,
    maxDiscount,
    priorityItems,
    talkingPoints,
    askingPrice: hasAsking ? askingPrice : undefined,
    daysOnMarket,
    realisticPrice,
    discountPercent,
    longListing,
  };
}
