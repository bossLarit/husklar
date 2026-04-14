import { useState } from "react";
import { apiPost, setAuthToken } from "@/core/utils/apiClient";

interface AccessCodeFormProps {
  onAuthenticated: () => void;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
}

export function AccessCodeForm({ onAuthenticated }: AccessCodeFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiPost<AuthResponse>("/api/auth/verify", {
        code: code.trim(),
      });
      setAuthToken(result.token);
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
          Rapport-analysen bruger AI og kræver en adgangskode.
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
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Indtast adgangskode"
            autoComplete="current-password"
            aria-describedby={error ? "access-code-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
            {isLoading ? "Verificerer..." : "Log ind"}
          </button>
        </form>
      </div>
    </div>
  );
}
