export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

if (!API_BASE && import.meta.env.PROD) {
  console.error(
    "[PocketTask] VITE_API_URL is not set — API calls will fail in production!",
  );
}

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
