import { useMemo, useState } from "react";
import type { ReportAnalysis } from "../../domain/entities/report";
import { calculateNegotiation } from "../../domain/negotiation";
import { formatDKK } from "@/core/utils/formatCurrency";
import { RiskBadge } from "./RiskBadge";

interface Props {
  analysis: ReportAnalysis;
  askingPrice: number | null;
  daysOnMarket: number | null;
  onChange: (next: { askingPrice: number | null; daysOnMarket: number | null }) => void;
}

export function NegotiationHelper({
  analysis,
  askingPrice,
  daysOnMarket,
  onChange,
}: Props) {
  const [showAllPoints, setShowAllPoints] = useState(false);

  const negotiation = useMemo(
    () =>
      calculateNegotiation(analysis, {
        askingPrice: askingPrice ?? undefined,
        daysOnMarket: daysOnMarket ?? undefined,
      }),
    [analysis, askingPrice, daysOnMarket],
  );

  const visiblePoints = showAllPoints
    ? negotiation.talkingPoints
    : negotiation.talkingPoints.slice(0, 3);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <header>
        <h2 className="text-lg font-semibold">Forhandlings-hjælper</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Omsæt tilstandsrapporten til konkrete forhandlings-argumenter.
          Indtast kontantprisen for at se et forslag til realistisk
          slutpris.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Kontantpris</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={10000}
              value={askingPrice ?? ""}
              onChange={(e) =>
                onChange({
                  askingPrice: e.target.value === "" ? null : Number(e.target.value),
                  daysOnMarket,
                })
              }
              placeholder="3.000.000"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm tabular-nums outline-none focus:border-ring"
            />
            <span className="text-xs text-muted-foreground">kr</span>
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Liggetid <span className="text-muted-foreground">(valgfri)</span>
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={daysOnMarket ?? ""}
              onChange={(e) =>
                onChange({
                  askingPrice,
                  daysOnMarket: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              placeholder="Tjek på boliga.dk"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm tabular-nums outline-none focus:border-ring"
            />
            <span className="text-xs text-muted-foreground">dage</span>
          </div>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DiscountStat
          label="Minimum afslag"
          value={negotiation.minDiscount}
          hint="Summen af lave estimater — de mest sikre omkostninger"
        />
        <DiscountStat
          label="Fair afslag"
          value={negotiation.fairDiscount}
          hint="Gennemsnit af lave og høje estimater"
          emphasized
        />
        <DiscountStat
          label="Maks afslag"
          value={negotiation.maxDiscount}
          hint="Summen af høje estimater — hvis alt viser sig værst"
        />
      </div>

      {negotiation.realisticPrice !== undefined && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Realistisk slutpris
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
            {formatDKK(negotiation.realisticPrice)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Svarer til et afslag på{" "}
            {((negotiation.discountPercent ?? 0) * 100).toFixed(1).replace(".", ",")}
            {" "}% af kontantprisen
          </p>
        </div>
      )}

      {negotiation.longListing && (
        <div className="rounded-lg border border-risk-yellow/30 bg-risk-yellow/10 p-4">
          <p className="text-sm font-medium text-foreground">
            Boligen har ligget i {negotiation.daysOnMarket} dage
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Lang liggetid styrker din forhandlings-position — sælger er
            typisk mere villig til at forhandle efter 60 dage.
          </p>
        </div>
      )}

      {negotiation.talkingPoints.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            Prioriterede forhandlingspunkter ({negotiation.talkingPoints.length})
          </h3>
          {visiblePoints.map((pt, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-secondary/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{pt.category}</p>
                <RiskBadge level={pt.risk} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pt.finding}</p>
              <p className="mt-2 text-sm">
                <span className="font-medium">Afslag: </span>
                <span className="tabular-nums">
                  {formatDKK(pt.minAmount)} – {formatDKK(pt.maxAmount)}
                </span>
              </p>
              <p className="mt-2 rounded-md bg-background/60 p-3 text-xs italic leading-relaxed text-muted-foreground">
                {pt.script}
              </p>
            </div>
          ))}
          {negotiation.talkingPoints.length > 3 && !showAllPoints && (
            <button
              type="button"
              onClick={() => setShowAllPoints(true)}
              className="self-start text-sm font-medium text-primary hover:underline"
            >
              Vis alle {negotiation.talkingPoints.length} punkter
            </button>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-secondary/30 p-4">
        <p className="text-sm font-semibold">Generelle forhandlings-tips</p>
        <ul className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Advokatforbehold:</span>{" "}
            Insistér på det i købsaftalen — giver dig 6 hverdage til at
            godkende handlen uden gebyr.
          </li>
          <li>
            <span className="font-medium text-foreground">Ejerskifteforsikring:</span>{" "}
            Sælger skal tilbyde standardforsikring og betale halvdelen.
            Forhandl at sælger betaler hele præmien som del af aftalen.
          </li>
          <li>
            <span className="font-medium text-foreground">BBR-areal:</span>{" "}
            Sammenlign mæglerens m² med BBR-arealet på{" "}
            <a
              href="https://bbr.dk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              bbr.dk
            </a>
            . Afvigelser giver forhandlings-rum.
          </li>
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Oplysningerne er vejledende og erstatter ikke juridisk rådgivning.
        Kontakt en advokat for bindende rådgivning om din konkrete situation.
      </p>
    </section>
  );
}

interface StatProps {
  label: string;
  value: number;
  hint: string;
  emphasized?: boolean;
}

function DiscountStat({ label, value, hint, emphasized }: StatProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasized
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-secondary/30"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${
          emphasized ? "text-primary" : "text-foreground"
        }`}
      >
        {formatDKK(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
