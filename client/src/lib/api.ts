const REPLIT_BACKEND =
  "https://eba6143e-23d5-46c2-a20e-77d829c2e924-00-1ryndp5gw5xcb.worf.replit.dev";

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) || REPLIT_BACKEND;

const TOKEN_KEY = "pt_sid";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(sid: string): void {
  localStorage.setItem(TOKEN_KEY, sid);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(url: string, options?: RequestInit) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
  }
  return res.json();
}
