import { useState } from "react";
import { useDocumentTitle } from "@/core/hooks/useDocumentTitle";
import { useMetaDescription } from "@/core/hooks/useMetaDescription";
import { useGenerateCodes } from "./presentation/hooks/useGenerateCodes";

export function AdminPage() {
  useDocumentTitle("Admin");
  useMetaDescription("HusKlar administration — generér adgangskoder.");

  const [masterPassword, setMasterPassword] = useState("");
  const [count, setCount] = useState<number>(5);
  const [note, setNote] = useState("");
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const { codes, error, isLoading, generate, clear } = useGenerateCodes();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword.trim() || count < 1) return;
    await generate({
      masterPassword: masterPassword.trim(),
      count,
      note: note.trim() || undefined,
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToast(label);
      setTimeout(() => setCopiedToast(null), 2000);
    } catch {
      // clipboard API may fail — silent
    }
  };

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold">Admin</h1>
        <p className="mt-2 text-muted-foreground">
          Generér engangs-adgangskoder til rapport-analyse. Koder er
          single-use og forbruges når en analyse lykkes.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Master-password</span>
          <input
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            autoComplete="current-password"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Antal koder</span>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Note <span className="text-xs text-muted-foreground">(valgfri)</span>
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="fx 'til Sarah' eller 'uge 42'"
              maxLength={100}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !masterPassword.trim() || count < 1}
            className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Genererer…" : `Generér ${count} kode${count === 1 ? "" : "r"}`}
          </button>
          {codes.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="h-10 rounded-md border border-border bg-background px-5 text-sm font-medium transition hover:bg-secondary"
            >
              Ryd liste
            </button>
          )}
        </div>
      </form>

      {codes.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-6">
          <header className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Genererede koder ({codes.length})
            </h2>
            <button
              type="button"
              onClick={() => copyToClipboard(codes.join("\n"), "Alle koder")}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-secondary"
            >
              Kopiér alle
            </button>
          </header>
          <ul className="flex flex-col gap-2">
            {codes.map((code) => (
              <li
                key={code}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                <code className="font-mono text-sm tracking-wider">{code}</code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(code, code)}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                >
                  Kopiér
                </button>
              </li>
            ))}
          </ul>
          {copiedToast && (
            <p
              role="status"
              className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary"
            >
              Kopieret: {copiedToast}
            </p>
          )}
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Koder er single-use. Send dem manuelt til modtageren (fx via
        MobilePay-chat). De bliver automatisk refunderet hvis analysen fejler.
      </p>
    </article>
  );
}
