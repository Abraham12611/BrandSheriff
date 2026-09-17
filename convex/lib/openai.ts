import { env } from "../_generated/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Shared JSON-mode chat helper. Callers are responsible for provider-action
// gating before invoking; this only fails when the key is absent.
export async function openaiChat(
  messages: Array<{ role: string; content: string }>,
  model = "gpt-4o-mini",
): Promise<Record<string, unknown>> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content) as Record<string, unknown>;
}
