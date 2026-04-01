const REPLIT_BACKEND =
  "https://eba6143e-23d5-46c2-a20e-77d829c2e924-00-1ryndp5gw5xcb.worf.replit.dev";

export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) || REPLIT_BACKEND;

export async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
  }
  return res.json();
}
