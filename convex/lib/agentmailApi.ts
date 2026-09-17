import { env } from "../_generated/server";

const API_BASE = "https://api.agentmail.to/v0";

// Thin REST wrapper for AgentMail endpoints the vendored component doesn't
// cover (pods, pod inboxes, webhooks). Requires an organization-level key.
export async function agentmailApi<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const key = env.AGENTMAIL_API_KEY;
  if (!key) {
    throw new Error("AGENTMAIL_API_KEY is not set on this Convex deployment.");
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
    throw new Error(`AgentMail ${init.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
