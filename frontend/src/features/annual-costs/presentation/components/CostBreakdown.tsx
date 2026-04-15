import type {
  AnnualCostBreakdown,
  OneTimeCostBreakdown,
} from "../../domain/costCalculation";
import { formatDKK } from "@/core/utils/formatCurrency";

interface Props {
  annual: AnnualCostBreakdown;
  oneTime: OneTimeCostBreakdown;
  hasLaan: boolean;
}

export function CostBreakdown({ annual, oneTime, hasLaan }: Props) {
  const monthly = Math.round(annual.total / 12);

  const annualRows: Array<[string, number, string?]> = [
    ["Ejendomsværdiskat", annual.ejendomsvaerdiskat, "Af offentlig ejendomsværdi"],
    ["Grundskyld", annual.grundskyld, "Af grundværdi × kommune-sats"],
    ["El", annual.el, "Estimat pr. person"],
    ["Vand", annual.vand, "Estimat pr. person"],
    ["Varme", annual.varme, "Estimat ud fra m² og byggeår"],
    ["Bygningsforsikring", annual.bygningsforsikring, "Gennemsnit"],
    ["Vedligehold", annual.vedligehold, "1 %-reglen af boligværdi"],
  ];
  if (annual.grundejerforening > 0) {
    annualRows.push(["Grundejer-/ejerforening", annual.grundejerforening]);
  }

  const oneTimeRows: Array<[string, number, string?]> = [
    ["Tinglysningsafgift skøde", oneTime.tinglysningSkoede, "0,6 % af kontantpris + 1.850 kr"],
  ];
  if (hasLaan) {
    oneTimeRows.push(
      ["Tinglysningsafgift pantebrev", oneTime.tinglysningPantebrev, "1,45 % af lånebeløb + 1.850 kr"],
      ["Vurderingsgebyr", oneTime.vurderingsgebyr],
      ["Lånesagsgebyr", oneTime.laanesagsgebyr],
      ["Kurtage", oneTime.kurtage, "0,22 % af lånebeløb"],
    );
  }
  oneTimeRows.push(["Advokat / berigtigelse", oneTime.advokat]);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Årlige ejerudgifter"
        className="rounded-xl border border-border bg-card p-6"
      >
        <header className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Ejerudgift</h2>
            <p className="text-sm text-muted-foreground">
              Løbende omkostninger eksklusiv lån
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums text-primary">
              {formatDKK(annual.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              pr. år · {formatDKK(monthly)} pr. måned
            </p>
          </div>
        </header>

        <dl className="mt-4 divide-y divide-border border-t border-border">
          {annualRows.map(([label, value, hint]) => (
            <Row key={label} label={label} value={value} hint={hint} />
          ))}
        </dl>
      </section>

      <section
        aria-label="Engangsomkostninger ved køb"
        className="rounded-xl border border-border bg-card p-6"
      >
        <header className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Engangsomkostninger ved køb</h2>
            <p className="text-sm text-muted-foreground">
              {hasLaan
                ? "Tinglysning, finansiering og advokat"
                : "Tinglysning og advokat (indtast lånebeløb for finansiering)"}
            </p>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {formatDKK(oneTime.total)}
          </p>
        </header>

        <dl className="mt-4 divide-y divide-border border-t border-border">
          {oneTimeRows.map(([label, value, hint]) => (
            <Row key={label} label={label} value={value} hint={hint} />
          ))}
        </dl>
      </section>

      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <p className="text-xs text-muted-foreground">
          Beløbene er estimater. Bed sælger om seneste 12 måneders
          forbrugsregninger og salgsopstillingens ejerudgift for faktiske
          tal. Estimatet er baseret på offentligt tilgængelige markeds-
          og skattedata og er vejledende — en ejendomsmægler, valuar eller
          bankrådgiver giver en konkret vurdering.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <dt className="text-sm font-medium text-foreground">{label}</dt>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <dd className="shrink-0 text-sm font-semibold tabular-nums">
        {formatDKK(value)}
      </dd>
    </div>
  );
}
