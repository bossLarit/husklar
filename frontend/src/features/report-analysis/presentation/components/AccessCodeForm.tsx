import { useState } from "react";
import { apiPost, setAccessCode } from "@/core/utils/apiClient";

interface AccessCodeFormProps {
  onAuthenticated: () => void;
}

interface VerifyResponse {
  valid: boolean;
}

export function AccessCodeForm({ onAuthenticated }: AccessCodeFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiPost<VerifyResponse>("/api/auth/verify", { code: trimmed });
      setAccessCode(trimmed);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Adgangskode påkrævet</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Rapport-analysen bruger AI og kræver en adgangskode. Hver kode giver
          adgang til én analyse.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-3"
        >
          <label htmlFor="access-code" className="sr-only">
            Adgangskode
          </label>
          <input
            id="access-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HUS-XXXXXXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={error ? "access-code-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm uppercase tracking-wider transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
          {error && (
            <p id="access-code-error" role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="h-10 cursor-pointer rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Verificerer…" : "Log ind"}
          </button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Har du ikke en kode? Kontakt ejeren for at købe én.
        </p>
      </div>
    </div>
  );
}
