import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export { API_URL } from "@/shared/lib/constants";
import { API_URL } from "@/shared/lib/constants";

// Per-field validation messages, as returned by the API's Zod error mapping
// (`{ error: "Validation failed", details: { fieldName: ["message"] } }`).
export type ApiErrorDetails = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Maps an ApiError's field-level `details` onto a react-hook-form `setError`
// call, so a server-side-only validation failure (one the client schema
// didn't already catch) still lands on the right field instead of only
// showing as a generic top-level message.
export function applyApiErrorToForm<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
): boolean {
  if (!(error instanceof ApiError) || !error.details) {
    return false;
  }
  let applied = false;
  for (const [field, messages] of Object.entries(error.details)) {
    const message = messages?.[0];
    if (message) {
      // The server's field names are a runtime contract with the client
      // schema, not something react-hook-form's Path<T> can verify here.
      setError(field as Path<TFieldValues>, { message });
      applied = true;
    }
  }
  return applied;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, body.error ?? "Request failed", body.details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  return handleResponse<T>(response);
}

// No Content-Type header here — the browser sets multipart/form-data with
// the correct boundary itself; setting it manually breaks the upload.
export async function apiFetchForm<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, "body">,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
    ...init,
  });
  return handleResponse<T>(response);
}
