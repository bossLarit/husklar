import type { AreaScores } from "../../domain/entities/surroundings";

interface AreaScoreCardProps {
  scores: AreaScores;
}

interface ScoreLabel {
  key: keyof Omit<AreaScores, "overall" | "noise">;
  label: string;
}

const scoreLabels: ScoreLabel[] = [
  { key: "transport", label: "Transport" },
  { key: "schools", label: "Skoler & institutioner" },
];

function scoreColor(score: number): string {
  if (score >= 8) return "text-risk-green";
  if (score >= 5) return "text-risk-yellow";
  return "text-risk-red";
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
        <h2 className="text-lg font-semibold">Områdescore</h2>
        {scores.overall === null ? (
          <span className="text-sm text-muted-foreground">Ingen data</span>
        ) : (
          <span className={`text-3xl font-bold ${scoreColor(scores.overall)}`}>
            {scores.overall}/10
          </span>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {scoreLabels.map(({ key, label }) => (
          <ScoreRow key={key} label={label} score={scores[key]} />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Score baseret på afstand til nærmeste faciliteter via OpenStreetMap.
        Støjdata er ikke tilgængeligt endnu.
      </p>
    </div>
  );
}

function ScoreRow({ label, score }: { label: string; score: number | null }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        {score === null ? (
          <span className="text-xs text-muted-foreground">Ingen data</span>
        ) : (
          <span className={`font-semibold ${scoreColor(score)}`}>
            {score}/10
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {score !== null && (
          <div
            className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
            style={{ width: `${score * 10}%` }}
          />
        )}
      </div>
    </div>
  );
}
