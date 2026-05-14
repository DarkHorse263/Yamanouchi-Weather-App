import { useQuery, type UseQueryResult } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "");

export class AdminApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Tiny wrapper around fetch for admin endpoints. Always sends credentials
 * (so the session cookie travels), throws AdminApiError with a status code
 * so the UI can branch on 401 (not logged in) vs 403 (not on allowlist).
 */
export async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/admin${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.error ?? body?.message ?? msg;
    } catch {
      /* noop */
    }
    throw new AdminApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export function useAdminQuery<T>(key: string, path: string): UseQueryResult<T, AdminApiError> {
  return useQuery<T, AdminApiError>({
    queryKey: ["admin", key],
    queryFn: () => adminFetch<T>(path),
    retry: (failureCount, error) => {
      // never retry forbidden / unauthorized
      if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
