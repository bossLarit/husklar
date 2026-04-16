import type { CrimeData } from "../../domain/entities/surroundings";

interface CrimeStatsCardProps {
  crime: CrimeData | null;
  available: boolean;
}

export function CrimeStatsCard({ crime, available }: CrimeStatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h4 className="mb-3 text-sm font-semibold">Kriminalitet</h4>
      {!available || crime === null ? (
        <p className="text-sm text-muted-foreground">
          Kriminalitetsdata er ikke tilgængelig for denne adresse lige nu.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Tallene gælder hele {crime.municipalityName} kommune (
            {crime.year}) — ikke kun dit nærområde.
          </div>
          <Stat
            label="Indbrud"
            value={`${crime.burglariesPerThousand.toFixed(1)} / 1.000 indb.`}
          />
          <Stat
            label="Anmeldte forbrydelser i alt"
            value={`${crime.totalPerThousand.toFixed(1)} / 1.000 indb.`}
          />
          <p className="text-xs text-muted-foreground">
            Kilde: Danmarks Statistik (StatBank).
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
