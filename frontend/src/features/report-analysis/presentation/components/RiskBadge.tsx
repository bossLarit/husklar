import type { RiskLevel } from "../../domain/entities/report";

const riskConfig: Record<
  RiskLevel,
  { label: string; className: string }
> = {
  green: {
    label: "Lav risiko",
    className: "bg-risk-green/10 text-risk-green border-risk-green/30",
  },
  yellow: {
    label: "Moderat risiko",
    className: "bg-risk-yellow/10 text-risk-yellow border-risk-yellow/30",
  },
  red: {
    label: "Høj risiko",
    className: "bg-risk-red/10 text-risk-red border-risk-red/30",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  size?: "sm" | "lg";
}

export function RiskBadge({ level, size = "sm" }: RiskBadgeProps) {
  const config = riskConfig[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${config.className} ${
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span
        className={`rounded-full ${
          size === "lg" ? "h-2.5 w-2.5" : "h-2 w-2"
        } ${
          level === "green"
            ? "bg-risk-green"
            : level === "yellow"
              ? "bg-risk-yellow"
              : "bg-risk-red"
        }`}
      />
      {config.label}
    </span>
  );
}
