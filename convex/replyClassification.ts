import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { openaiChat } from "./lib/openai";

const MODEL = "gpt-4o-mini";

const INTENTS = new Set([
  "compliance_confirmed",
  "compliance_partial",
  "question",
  "refusal",
  "negotiation",
  "legal_response",
  "auto_reply",
  "unrelated",
  "other",
]);

export const getForClassify = internalQuery({
  args: { caseMessageId: v.id("caseMessages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get("caseMessages", args.caseMessageId);
    if (!msg) return null;
    const org = await ctx.db.get("organizations", msg.organizationId);
    return { msg, providerActions: org?.settings?.providerActionsEnabled === true };
  },
});

// Optional deeper triage: runs only when the workspace has provider actions
// on AND the deployment has an OpenAI key. The deterministic label stays as
// fallback; AI output is stored separately with provenance and surfaced as a
// machine signal, never a legal conclusion.
export const classify = internalAction({
  args: { caseMessageId: v.id("caseMessages") },
  handler: async (ctx, args) => {
    if (!env.OPENAI_API_KEY) return;
    const loaded = (await ctx.runQuery(internal.replyClassification.getForClassify, {
      caseMessageId: args.caseMessageId,
    })) as { msg: Doc<"caseMessages">; providerActions: boolean } | null;
    if (!loaded || !loaded.providerActions) return;
    const msg = loaded.msg;
    if (msg.direction !== "in" || msg.classificationSource === "ai") return;
    if (msg.classification === "auto_reply") return;

    const body = (msg.text ?? msg.preview ?? "").slice(0, 4000);
    if (body.trim().length < 20) return;

    const raw = await openaiChat(
      [
        {
          role: "system",
          content:
            "You triage replies received by a brand-protection platform to notices sent about " +
            "suspected copying or counterfeiting. Classify the reply's intent and summarize it " +
            "in one sentence. You are not a lawyer and make no legal determinations. " +
            'Respond with strict JSON: {"intent": one of compliance_confirmed, ' +
            'compliance_partial, question, refusal, negotiation, legal_response, auto_reply, ' +
            'unrelated, other; "confidence": 0-1; "summary": one sentence}.',
        },
        {
          role: "user",
          content: `Subject: ${msg.subject ?? "(none)"}\nFrom: ${msg.fromAddr}\n\n${body}`,
        },
      ],
      MODEL,
    );

    const intent = typeof raw.intent === "string" && INTENTS.has(raw.intent) ? raw.intent : "other";
    const confidence =
      typeof raw.confidence === "number" && raw.confidence >= 0 && raw.confidence <= 1
        ? raw.confidence
        : 0.5;
    const summary = typeof raw.summary === "string" ? raw.summary.slice(0, 300) : "";

    await ctx.runMutation(internal.replyClassification.apply, {
      caseMessageId: args.caseMessageId,
      intent,
      confidence,
      summary,
      model: MODEL,
    });
  },
});

export const apply = internalMutation({
  args: {
    caseMessageId: v.id("caseMessages"),
    intent: v.string(),
    confidence: v.number(),
    summary: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get("caseMessages", args.caseMessageId);
    if (!msg) return;
    await ctx.db.patch("caseMessages", args.caseMessageId, {
      classification: args.intent,
      classificationSource: "ai",
      classificationDetail: {
        intent: args.intent,
        confidence: args.confidence,
        summary: args.summary,
        model: args.model,
        classifiedAt: Date.now(),
      },
    });
  },
});
