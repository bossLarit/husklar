import type { AreaScores } from "../../domain/entities/surroundings";

interface AreaScoreCardProps {
  scores: AreaScores;
}

const scoreLabels: { key: keyof Omit<AreaScores, "overall" | "noise">; label: string }[] = [
  { key: "transport", label: "Transport" },
  { key: "schools", label: "Skoler & institutioner" },
];

function scoreColor(score: number): string {
  if (score >= 8) return "text-risk-green";
  if (score >= 5) return "text-risk-yellow";
  return "text-risk-red";
}

function scoreBarWidth(score: number): string {
  return `${score * 10}%`;
}

function scoreBarColor(score: number): string {
  if (score >= 8) return "bg-risk-green";
  if (score >= 5) return "bg-risk-yellow";
  return "bg-risk-red";
}

export function AreaScoreCard({ scores }: AreaScoreCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Områdescore</h3>
        <span className={`text-3xl font-bold ${scoreColor(scores.overall)}`}>
          {scores.overall}/10
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {scoreLabels.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className={`font-semibold ${scoreColor(scores[key])}`}>
                {scores[key]}/10
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(scores[key])}`}
                style={{ width: scoreBarWidth(scores[key]) }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Score baseret på afstand til nærmeste faciliteter via OpenStreetMap.
        Støjdata er ikke tilgængeligt endnu.
      </p>
    </div>
  );
}
