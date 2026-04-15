import { useState } from "react";
import type { ChecklistPhase } from "../../domain/checklistTemplate";

interface Props {
  phase: ChecklistPhase;
  onToggle: (itemId: string) => void;
  onNote: (itemId: string, note: string) => void;
  onAdd: (label: string) => void;
  onRemove: (itemId: string) => void;
}

export function ChecklistSectionCard({
  phase,
  onToggle,
  onNote,
  onAdd,
  onRemove,
}: Props) {
  const [draft, setDraft] = useState("");
  const doneInPhase = phase.items.filter((it) => it.checked).length;

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">{phase.title}</h2>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {doneInPhase}/{phase.items.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{phase.subtitle}</p>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {phase.items.map((it) => (
          <ChecklistRow
            key={it.id}
            item={it}
            onToggle={() => onToggle(it.id)}
            onNote={(note) => onNote(it.id, note)}
            onRemove={() => onRemove(it.id)}
          />
        ))}
        {phase.items.length === 0 && (
          <li className="px-5 py-4 text-center text-sm text-muted-foreground">
            Ingen punkter endnu — tilføj et nedenfor.
          </li>
        )}
      </ul>

      <footer className="border-t border-border bg-secondary/30 px-5 py-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(draft);
            setDraft("");
          }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tilføj eget punkt…"
            aria-label={`Tilføj punkt til ${phase.title}`}
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon /> Tilføj
          </button>
        </form>
      </footer>
    </section>
  );
}

interface RowProps {
  item: ChecklistPhase["items"][number];
  onToggle: () => void;
  onNote: (note: string) => void;
  onRemove: () => void;
}

function ChecklistRow({ item, onToggle, onNote, onRemove }: RowProps) {
  const [showNote, setShowNote] = useState(Boolean(item.note));

  return (
    <li className="flex flex-col gap-2 px-5 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          role="checkbox"
          aria-checked={item.checked}
          aria-label={`${item.checked ? "Fjern markering af" : "Marker"} ${item.label}`}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
            item.checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary"
          }`}
        >
          {item.checked && (
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onToggle}
            className={`text-left text-sm leading-relaxed transition ${
              item.checked ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {item.label}
          </button>
          <div className="mt-1 flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {showNote || item.note ? "Skjul note" : "+ note"}
            </button>
            {item.custom && (
              <button
                type="button"
                onClick={onRemove}
                className="text-muted-foreground transition hover:text-destructive"
              >
                Fjern
              </button>
            )}
          </div>
        </div>
      </div>
      {(showNote || item.note) && (
        <textarea
          value={item.note ?? ""}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Skriv en note…"
          rows={2}
          aria-label={`Note til ${item.label}`}
          className="ml-8 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-ring"
        />
      )}
    </li>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
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
