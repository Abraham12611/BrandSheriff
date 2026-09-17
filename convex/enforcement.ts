import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireCaseAccess, requireDraftAccess } from "./lib/authz";
import { assertProviderActionsEnabled } from "./providerSafety";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const FOLLOWUP_WAIT_MS = 72 * 60 * 60 * 1000;

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

export const generateDraft = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = (await ctx.runQuery(internal.cases.getById, { caseId: args.caseId })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");

    await assertProviderActionsEnabled(ctx, c.organizationId);

    const discovery = c.discoveryId
      ? ((await ctx.runQuery(internal.discoveries.getById, { discoveryId: c.discoveryId })) as Doc<"discoveries"> | null)
      : null;
    const evidence = (await ctx.runQuery(internal.evidenceItems.listByCaseInternal, { caseId: args.caseId })) as Doc<"evidenceItems">[];

    const prompt = `Draft a concise, factual cease-and-desist style email requesting that an unauthorized party stop using a brand's intellectual property. Do not invent registration numbers, dates, or recipients. Use only the supplied facts.

Brand / rights owner: ${c.title}
Target URL: ${discovery?.canonicalUrl ?? "unknown"}
Observed copying summary: ${discovery?.summary ?? c.summary ?? "Not provided"}
Evidence: ${evidence.map((e) => `- ${e.title}: ${(e.textContent ?? "").slice(0, 300)}`).join("\n")}

Return JSON with:
- subject: email subject line
- body: full plain-text email body
- missingFields: array of strings for facts still needed before sending
- warnings: array of caution notes (e.g., "recipient not verified")
Use cautious, non-legal language and a professional tone.`;

    const draft = await openaiChat([
      { role: "system", content: "You are an assistive brand-protection drafting tool. You produce structured email drafts based only on confirmed facts. You never fabricate legal claims, registration numbers, or recipient details." },
      { role: "user", content: prompt },
    ]);

    await ctx.runMutation(internal.draftNotices.create, {
      organizationId: c.organizationId,
      caseId: args.caseId,
      routeType: "email",
      status: "draft",
      structuredFields: draft,
      body: String(draft.body ?? ""),
      generatedBy: "openai",
    });

    return draft;
  },
});

export const latestDraft = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    const all = await ctx.db
      .query("draftNotices")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    return all.sort((a, b) => b._creationTime - a._creationTime)[0] ?? null;
  },
});

export const updateDraft = mutation({
  args: {
    draftId: v.id("draftNotices"),
    body: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { draft } = await requireDraftAccess(ctx, args.draftId);
    const structured =
      args.subject !== undefined
        ? { ...(draft.structuredFields as Record<string, unknown> | undefined), subject: args.subject }
        : draft.structuredFields;
    await ctx.db.patch(args.draftId, {
      body: args.body,
      structuredFields: structured,
      status: "draft_edited",
      updatedAt: Date.now(),
    });
  },
});

export const approveAndSend = action({
  args: {
    caseId: v.id("cases"),
    draftId: v.id("draftNotices"),
    to: v.string(),
  },
  handler: async (ctx, args) => {
    const c = (await ctx.runQuery(internal.cases.getById, { caseId: args.caseId })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");

    await assertProviderActionsEnabled(ctx, c.organizationId);

    const org = (await ctx.runQuery(internal.organizations.get, {
      organizationId: c.organizationId,
    })) as Doc<"organizations"> | null;
    if (!org?.mailboxId) throw new Error("No AgentMail inbox configured for this workspace");
    const draft = (await ctx.runQuery(internal.draftNotices.getById, {
      draftId: args.draftId,
    })) as Doc<"draftNotices"> | null;
    if (!draft?.body) throw new Error("Draft not found or empty");

    const subject =
      (draft.structuredFields as { subject?: string } | undefined)?.subject ?? "Brand enforcement notice";

    await ctx.runMutation(internal.approvals.create, {
      organizationId: c.organizationId,
      caseId: args.caseId,
      objectType: "draft",
      objectId: args.draftId,
      action: "send_email",
      snapshotBody: draft.body,
      snapshotSubject: subject,
    });

    const outboundId = (await ctx.runMutation(internal.mail.sendFromCase, {
      inboxId: org.mailboxId,
      to: args.to,
      subject,
      text: draft.body,
    })) as string;

    await ctx.runMutation(internal.draftNotices.markSent, {
      draftId: args.draftId,
      outboundId,
      to: args.to,
    });

    // Arm the durable post-send loop: awaits a reply (resumes instantly) or
    // the wait window lapsing, then auto-rechecks the target page.
    await ctx.runMutation(internal.enforcementFlow.arm, {
      caseId: args.caseId,
      waitMs: FOLLOWUP_WAIT_MS,
    });

    return { outboundId };
  },
});
