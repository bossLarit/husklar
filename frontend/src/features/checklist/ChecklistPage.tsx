import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import { countProgress } from "./domain/checklistTemplate";
import { useChecklistState } from "./presentation/hooks/useChecklistState";
import { useDownloadChecklist } from "./presentation/hooks/useDownloadChecklist";
import { ChecklistSectionCard } from "./presentation/components/ChecklistSectionCard";

export function ChecklistPage() {
  useDocumentTitle("Boligkøbs-tjekliste");
  useMetaDescription(
    "Interaktiv tjekliste til boligkøb i Danmark: før budgivning, ved fremvisning, før og efter underskrift. Afkrydselig, gemmes automatisk, kan downloades som PDF.",
  );

  const { checklist, toggleItem, updateNote, addItem, removeItem, reset } =
    useChecklistState();
  const { downloadChecklist, isGenerating, error } = useDownloadChecklist();

  const { done, total } = countProgress(checklist);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Boligkøbs-tjekliste</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Fra research til nøglen i hånden. Afkryds undervejs — din
            fremgang gemmes automatisk i din browser, så du kan vende
            tilbage. Download som PDF for at dele eller have med på mobilen.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Er du sikker på at du vil nulstille tjeklisten? Alle afkrydsninger, noter og egne punkter slettes.",
                )
              ) {
                reset();
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Nulstil
          </button>
          <button
            type="button"
            onClick={() => {
              void downloadChecklist(checklist);
            }}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <SpinnerIcon /> Genererer…
              </>
            ) : (
              <>
                <DownloadIcon /> Download som PDF
              </>
            )}
          </button>
        </div>
      </header>

      <section
        aria-label="Fremgang"
        className="sticky top-16 z-10 rounded-xl border border-border bg-card/95 p-5 shadow-sm backdrop-blur"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">Fremgang</p>
          <p className="text-sm tabular-nums">
            <span className="text-2xl font-semibold text-foreground">{done}</span>
            <span className="text-muted-foreground"> / {total} punkter</span>
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Afkrydsede punkter"
          className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-risk-red/30 bg-risk-red/10 px-4 py-3 text-sm text-risk-red" role="alert">
          Kunne ikke generere PDF. Prøv igen.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {checklist.phases.map((phase) => (
          <ChecklistSectionCard
            key={phase.id}
            phase={phase}
            onToggle={(itemId) => toggleItem(phase.id, itemId)}
            onNote={(itemId, note) => updateNote(phase.id, itemId, note)}
            onAdd={(label) => addItem(phase.id, label)}
            onRemove={(itemId) => removeItem(phase.id, itemId)}
          />
        ))}
      </div>

      <footer className="flex flex-col gap-2 rounded-xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
        <p>
          Oplysningerne er vejledende og erstatter ikke juridisk rådgivning.
          Kontakt en advokat for bindende rådgivning om din konkrete situation.
        </p>
        <p>
          Beregninger og økonomiske vurderinger erstatter ikke rådgivning fra
          bank eller realkreditinstitut.
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
