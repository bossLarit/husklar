import { useMemo, useState } from "react";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import {
  type CostInputs,
  calculateAnnualCosts,
  calculateOneTimeCosts,
} from "./domain/costCalculation";
import { downloadCostsXlsx } from "./application/exportCostsXlsx";
import { CostForm } from "./presentation/components/CostForm";
import { CostBreakdown } from "./presentation/components/CostBreakdown";

const DEFAULT_INPUTS: CostInputs = {
  kontantpris: 3_000_000,
  boligType: "hus",
  boligStoerrelseM2: 140,
  byggeaar: 1975,
  antalPersoner: 2,
};

export function AnnualCostsPage() {
  useDocumentTitle("Årlige omkostninger");
  useMetaDescription(
    "Beregn de reelle omkostninger ved at eje en bolig i Danmark: ejendomsværdiskat, grundskyld, forbrug, forsikring, vedligehold og engangsomkostninger ved køb.",
  );

  const [inputs, setInputs] = useState<CostInputs>(DEFAULT_INPUTS);
  const [isExporting, setIsExporting] = useState(false);

  const annual = useMemo(() => calculateAnnualCosts(inputs), [inputs]);
  const oneTime = useMemo(() => calculateOneTimeCosts(inputs), [inputs]);
  const hasLaan = (inputs.laanebeloeb ?? 0) > 0;

  const hasValidInputs =
    inputs.kontantpris > 0 &&
    inputs.boligStoerrelseM2 > 0 &&
    inputs.antalPersoner > 0;

  async function handleDownload() {
    if (!hasValidInputs) return;
    setIsExporting(true);
    try {
      await downloadCostsXlsx(inputs, annual, oneTime);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Årlige omkostninger</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Hvad koster det reelt at eje boligen? Beregn årlig ejerudgift
            (ejendomsværdiskat, grundskyld, forbrug, forsikring, vedligehold)
            og engangsomkostninger ved køb (tinglysning, lånegebyrer,
            advokat).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={!hasValidInputs || isExporting}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? (
            <>
              <SpinnerIcon /> Genererer…
            </>
          ) : (
            <>
              <DownloadIcon /> Download som Excel
            </>
          )}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Indtast oplysninger">
          <CostForm inputs={inputs} onChange={setInputs} />
        </section>
        <section aria-label="Beregning" className="flex flex-col gap-6">
          <CostBreakdown annual={annual} oneTime={oneTime} hasLaan={hasLaan} />
        </section>
      </div>

      <footer className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <p>
          Beregningen er vejledende og erstatter ikke rådgivning fra bank
          eller realkreditinstitut. Faktiske vilkår afhænger af kreditvurdering
          og aktuelle kurser.
        </p>
        <p>
          Estimatet er baseret på offentligt tilgængelige markeds- og
          skattedata og er vejledende. En ejendomsmægler eller valuar giver
          en konkret vurdering af boligen.
        </p>
      </footer>
    </article>
  );
}

function DownloadIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
