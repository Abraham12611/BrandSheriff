import { env } from "../_generated/server";

const API_BASE = "https://api.firecrawl.dev/v2";

// Thin REST wrapper for Firecrawl endpoints the vendored component doesn't
// cover (monitors, interact sessions). Callers must gate on provider actions.
export async function firecrawlApi<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const key = env.FIRECRAWL_API_KEY;
  if (!key) {
    throw new Error("FIRECRAWL_API_KEY is not set on this Convex deployment.");
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
