import type { ApiResponse } from "../types/api";
import { AppError } from "../errors/AppError";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// Access code stored in memory only — never localStorage (per api-security.md)
let accessCode: string | null = null;

export function setAccessCode(code: string | null) {
  accessCode = code;
}

export function getAccessCode(): string | null {
  return accessCode;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: buildHeaders(),
  });

  return handleResponse<T>(response);
}

export async function apiPost<T>(
  path: string,
  body: FormData | Record<string, unknown>,
): Promise<T> {
  const isFormData = body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: isFormData
      ? buildHeaders()
      : { ...buildHeaders(), "Content-Type": "application/json" },
    body: isFormData ? body : JSON.stringify(body),
  });

  return handleResponse<T>(response);
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (accessCode) {
    headers["X-Access-Code"] = accessCode;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    // Per api-security.md: clear code on auth failure
    accessCode = null;
    const errorBody = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new AppError(
      errorBody?.error ?? "Ikke autoriseret — indtast din adgangskode.",
      "UNAUTHORIZED",
      401,
    );
  }

  if (response.status === 429) {
    const errorBody = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new AppError(
      errorBody?.error ?? "For mange forsøg. Vent venligst og prøv igen.",
      "RATE_LIMITED",
      429,
    );
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    if (errorBody?.error) {
      throw new AppError(errorBody.error, "API_ERROR", response.status);
    }
    throw new AppError("Noget gik galt. Prøv venligst igen.", "API_ERROR", response.status);
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success || json.data === null) {
    throw new AppError(json.error ?? "Ukendt fejl", "API_ERROR");
  }

  return json.data;
}
