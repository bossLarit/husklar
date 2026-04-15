import { useMemo, useState } from "react";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import { formatDKK } from "@/core/utils/formatCurrency";
import {
  type Budget,
  type SectionKind,
  defaultBudget,
  newId,
  totals,
} from "./domain/budgetTemplate";
import { downloadBudgetXlsx } from "./application/exportBudgetXlsx";
import { BudgetSectionCard } from "./presentation/components/BudgetSection";

export function BudgetPage() {
  useDocumentTitle("Lav dit budget");
  useMetaDescription(
    "Lav et professionelt månedligt budget med danske standardkategorier. Tilføj dine egne poster og hent budgettet som CSV, der åbner direkte i Excel.",
  );

  const [budget, setBudget] = useState<Budget>(() => defaultBudget());

  const summary = useMemo(() => totals(budget), [budget]);

  function updateSection(
    sectionId: string,
    updater: (s: Budget["sections"][number]) => Budget["sections"][number],
  ) {
    setBudget((b) => ({
      sections: b.sections.map((s) => (s.id === sectionId ? updater(s) : s)),
    }));
  }

  function addRow(sectionId: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      rows: [...s.rows, { id: newId("row"), label: "", amount: 0 }],
    }));
  }

  function removeRow(sectionId: string, rowId: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      rows: s.rows.filter((r) => r.id !== rowId),
    }));
  }

  function renameRow(sectionId: string, rowId: string, label: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.id === rowId ? { ...r, label } : r)),
    }));
  }

  function setAmount(sectionId: string, rowId: string, amount: number) {
    updateSection(sectionId, (s) => ({
      ...s,
      rows: s.rows.map((r) => (r.id === rowId ? { ...r, amount } : r)),
    }));
  }

  function renameSection(sectionId: string, name: string) {
    updateSection(sectionId, (s) => ({ ...s, name }));
  }

  function removeSection(sectionId: string) {
    setBudget((b) => ({
      sections: b.sections.filter((s) => s.id !== sectionId),
    }));
  }

  function addSection(kind: SectionKind) {
    setBudget((b) => ({
      sections: [
        ...b.sections,
        {
          id: newId("sec"),
          name: kind === "income" ? "Ny indtægt" : "Ny udgift",
          kind,
          rows: [{ id: newId("row"), label: "", amount: 0 }],
        },
      ],
    }));
  }

  function resetTemplate() {
    setBudget(defaultBudget());
  }

  const netColor =
    summary.net > 0
      ? "text-risk-green"
      : summary.net < 0
        ? "text-risk-red"
        : "text-foreground";

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Lav dit budget</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Få et overblik over din månedlige økonomi. Udfyld de
            prædefinerede kategorier eller tilføj dine egne poster — og hent
            dit budget som et formateret Excel-ark klar til at dele eller printe.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={resetTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Nulstil
          </button>
          <button
            type="button"
            onClick={() => {
              void downloadBudgetXlsx(budget);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <DownloadIcon /> Download som Excel
          </button>
        </div>
      </header>

      <section
        aria-label="Samlet oversigt"
        className="sticky top-16 z-10 rounded-xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryStat label="Indtægter" value={summary.income} color="text-risk-green" />
          <SummaryStat label="Udgifter" value={summary.expense} color="text-foreground" />
          <SummaryStat
            label={summary.net >= 0 ? "Overskud" : "Underskud"}
            value={summary.net}
            color={netColor}
            emphasized
          />
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {budget.sections.map((section) => (
          <BudgetSectionCard
            key={section.id}
            section={section}
            onRenameSection={(name) => renameSection(section.id, name)}
            onRenameRow={(rowId, label) => renameRow(section.id, rowId, label)}
            onAmountChange={(rowId, amount) => setAmount(section.id, rowId, amount)}
            onAddRow={() => addRow(section.id)}
            onRemoveRow={(rowId) => removeRow(section.id, rowId)}
            onRemoveSection={() => removeSection(section.id)}
            canRemoveSection={budget.sections.length > 1}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => addSection("expense")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <PlusIcon /> Tilføj ny udgifts-sektion
        </button>
        <button
          type="button"
          onClick={() => addSection("income")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <PlusIcon /> Tilføj ny indtægts-sektion
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Alle beløb er i kroner pr. måned. Dit budget gemmes ikke
        automatisk — hent det som Excel for at beholde det.
      </p>
    </article>
  );
}

interface StatProps {
  label: string;
  value: number;
  color: string;
  emphasized?: boolean;
}

function SummaryStat({ label, value, color, emphasized }: StatProps) {
  return (
    <div className={emphasized ? "sm:border-l sm:border-border sm:pl-4" : ""}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>
        {value > 0 && emphasized ? "+" : ""}
        {formatDKK(value)}
      </p>
    </div>
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

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
