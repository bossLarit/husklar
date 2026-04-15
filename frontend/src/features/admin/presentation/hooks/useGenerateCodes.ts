import { useState } from "react";
import { apiPost } from "@/core/utils/apiClient";

interface GenerateResponse {
  codes: string[];
}

interface Params {
  masterPassword: string;
  count: number;
  note?: string;
}

export function useGenerateCodes() {
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generate = async (params: Params) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiPost<GenerateResponse>("/api/admin/codes", {
        masterPassword: params.masterPassword,
        count: params.count,
        note: params.note ?? null,
      });
      setCodes((prev) => [...response.codes, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl");
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => setCodes([]);

  return { codes, error, isLoading, generate, clear };
}
