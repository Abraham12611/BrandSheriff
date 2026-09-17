import { v } from "convex/values";
import { action, internalAction, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import { components } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { Doc } from "./_generated/dataModel";
import { requireCaseAccess } from "./lib/authz";
import { assertOrgProviderEnabled, assertProviderActionsEnabled } from "./providerSafety";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

const firecrawl = new FirecrawlClient(components.firecrawl);
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function openaiChat(messages: Array<{ role: string; content: string }>, model = "gpt-4o-mini") {
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
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content);
}

async function performRecheck(
  ctx: GenericActionCtx<DataModel>,
  c: Doc<"cases">,
): Promise<Record<string, unknown>> {
  const discovery = c.discoveryId
    ? ((await ctx.runQuery(internal.discoveries.getById, { discoveryId: c.discoveryId })) as Doc<"discoveries"> | null)
    : null;
  const targetUrl = discovery?.canonicalUrl;
  if (!targetUrl) throw new Error("No target URL to recheck");

  const recheckId = await ctx.runMutation(internal.rechecks.create, {
    organizationId: c.organizationId,
    caseId: c._id,
    targetUrl,
    purpose: "post_action",
    status: "running",
    checkedAt: Date.now(),
  });

  try {
    const scrapeResult = await firecrawl.scrape(ctx, targetUrl, {
      formats: ["markdown"],
      onlyMainContent: true,
    });
    const suspectText = (scrapeResult as { markdown?: string }).markdown ?? "";

    const prompt = `Classify the current state of this web page after a brand enforcement action was attempted.

Target URL: ${targetUrl}
Page text (first 3000 chars):
${suspectText.slice(0, 3000)}

Return JSON with:
- availability: one of removed, changed, still_present, inconclusive
- summary: concise explanation of what the page shows now
- confidence: number 0-1
- changedElements: array of what changed, if anything
- recommendation: next suggested step (e.g., escalate, watch, close)
Use cautious language.`;

    const analysis = await openaiChat([
      { role: "system", content: "You verify whether a reported infringing web page is still present, changed, or removed. You base conclusions only on the supplied page content." },
      { role: "user", content: prompt },
    ]);

    await ctx.runMutation(internal.rechecks.updateResult, {
      recheckId,
      status: "completed",
      availability: String(analysis.availability ?? "inconclusive"),
      comparisonResult: JSON.stringify(analysis, null, 2),
    });

    if (analysis.availability === "removed") {
      await ctx.runMutation(internal.cases.updateState, { caseId: c._id, state: "resolved" });
    } else if (analysis.availability === "still_present") {
      await ctx.runMutation(internal.cases.updateState, { caseId: c._id, state: "active" });
    } else if (analysis.availability === "changed") {
      await ctx.runMutation(internal.cases.updateState, { caseId: c._id, state: "reviewing" });
    }

    return analysis;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await ctx.runMutation(internal.rechecks.updateResult, {
      recheckId,
      status: "failed",
      availability: "inconclusive",
      comparisonResult: message,
    });
    throw error;
  }
}

export const recheckTarget = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = (await ctx.runQuery(internal.cases.getById, { caseId: args.caseId })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");

    await assertProviderActionsEnabled(ctx, c.organizationId);
    return await performRecheck(ctx, c);
  },
});

// System-side entry for workflows/crons — checks the workspace flag only,
// no user identity exists in scheduled contexts.
export const recheckSystem = internalAction({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = (await ctx.runQuery(internal.cases.getById, { caseId: args.caseId })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");
    await assertOrgProviderEnabled(ctx, c.organizationId);
    return await performRecheck(ctx, c);
  },
});

export const list = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    return await ctx.db
      .query("rechecks")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});
