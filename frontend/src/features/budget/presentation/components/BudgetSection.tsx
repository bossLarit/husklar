import type { BudgetSection as Section } from "../../domain/budgetTemplate";
import { sectionTotal } from "../../domain/budgetTemplate";
import { formatDKK } from "@/core/utils/formatCurrency";

interface Props {
  section: Section;
  onRenameSection: (name: string) => void;
  onRenameRow: (rowId: string, label: string) => void;
  onAmountChange: (rowId: string, amount: number) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  onRemoveSection: () => void;
  canRemoveSection: boolean;
}

export function BudgetSectionCard({
  section,
  onRenameSection,
  onRenameRow,
  onAmountChange,
  onAddRow,
  onRemoveRow,
  onRemoveSection,
  canRemoveSection,
}: Props) {
  const total = sectionTotal(section);
  const kindLabel = section.kind === "income" ? "Indtægt" : "Udgift";
  const kindClasses =
    section.kind === "income"
      ? "bg-risk-green/10 text-risk-green border-risk-green/30"
      : "bg-secondary text-secondary-foreground border-border";

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <input
            type="text"
            value={section.name}
            onChange={(e) => onRenameSection(e.target.value)}
            aria-label="Sektionsnavn"
            className="min-w-0 flex-1 rounded-md bg-transparent text-base font-semibold text-foreground outline-none focus:bg-secondary/50 focus:px-2 focus:py-1"
          />
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${kindClasses}`}
          >
            {kindLabel}
          </span>
        </div>
        {canRemoveSection && (
          <button
            type="button"
            onClick={onRemoveSection}
            aria-label={`Fjern sektionen ${section.name}`}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-destructive"
          >
            <TrashIcon />
          </button>
        )}
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {section.rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2 px-5 py-2.5">
            <input
              type="text"
              value={row.label}
              onChange={(e) => onRenameRow(row.id, e.target.value)}
              placeholder="Beskrivelse"
              aria-label="Postbeskrivelse"
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none focus:border-ring focus:bg-background"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={Number.isFinite(row.amount) && row.amount !== 0 ? row.amount : ""}
                onChange={(e) =>
                  onAmountChange(row.id, e.target.value === "" ? 0 : Number(e.target.value))
                }
                placeholder="0"
                aria-label={`Beløb for ${row.label || "post"}`}
                className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-ring"
              />
              <span className="text-xs text-muted-foreground">kr</span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveRow(row.id)}
              aria-label={`Fjern ${row.label || "post"}`}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-destructive"
            >
              <TrashIcon />
            </button>
          </li>
        ))}
        {section.rows.length === 0 && (
          <li className="px-5 py-4 text-center text-sm text-muted-foreground">
            Ingen poster endnu — tilføj en nedenfor.
          </li>
        )}
      </ul>

      <footer className="flex items-center justify-between gap-3 border-t border-border bg-secondary/30 px-5 py-3">
        <button
          type="button"
          onClick={onAddRow}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          <PlusIcon /> Tilføj række
        </button>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold tabular-nums">{formatDKK(total)}</span>
        </div>
      </footer>
    </section>
  );
}

function TrashIcon() {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
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
