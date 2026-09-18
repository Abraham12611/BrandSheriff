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
  "counter_notice",
  "platform_response",
  "auto_reply",
  "unrelated",
  "other",
]);

/** Platform/system sender detection — responses from Shopify, Google,
 * Meta, marketplaces etc. should be triaged as platform responses even
 * when they arrive on a case thread. */
const PLATFORM_SENDER =
  /noreply|no-reply|donotreply|support|legal|ip[-_.]?team|abuse|copyright|trust|notice|complaint/i;
const PLATFORM_DOMAINS =
  /shopify\.com|google\.com|facebook\.com|instagram\.com|meta\.com|fb\.com|amazon\.com|ebay\.|etsy\.com|tiktok\.com|alibaba|aliexpress|walmart\.com|godaddy\.com|namecheap\.com|cloudflare\.com|icann\.org|wipo\.int/i;

function isPlatformSender(from: string): boolean {
  return PLATFORM_SENDER.test(from) || PLATFORM_DOMAINS.test(from);
}

/** Deterministic ticket/case/ref extraction — catches the reference
 * numbers platforms include so they can be matched to enforcement actions. */
function extractRefs(text: string): string[] {
  const found = new Set<string>();
  const patterns = [
    /(?:case|ticket|report|reference|ref|id|complaint|notice)\s*[:#№]?\s*#?\s*([A-Z0-9][A-Z0-9\-_]{4,30})/gi,
    /\b([0-9]{10,})\b/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null && found.size < 10) {
      const ref = (m[1] ?? m[0]).trim();
      if (ref.length >= 5) found.add(ref);
    }
  }
  return [...found];
}

function extractDeadline(text: string): string | undefined {
  const m = text.match(
    /(?:within|by|before|deadline of|no later than)\s+([^.]{3,60}?(?:days?|business days?|weeks?|[A-Z][a-z]+ \d{1,2},? \d{4}|\d{4}-\d{2}-\d{2}))/i,
  );
  return m ? m[0].slice(0, 120) : undefined;
}

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
            'compliance_partial, question, refusal, negotiation, legal_response, counter_notice, ' +
            'platform_response, auto_reply, ' +
            'unrelated, other; "confidence": 0-1; "summary": one sentence}. ' +
            "Use platform_response for automated/human replies from a platform's IP/abuse/legal team " +
            "(ticket acknowledgements, requests for more information, removal confirmations). " +
            "Use counter_notice when the alleged infringer formally disputes a takedown.",
        },
        {
          role: "user",
          content: `Subject: ${msg.subject ?? "(none)"}\nFrom: ${msg.fromAddr}\n\n${body}`,
        },
      ],
      MODEL,
    );

    let intent = typeof raw.intent === "string" && INTENTS.has(raw.intent) ? raw.intent : "other";
    const platformSender = isPlatformSender(msg.fromAddr ?? "");
    if (platformSender && intent !== "counter_notice") intent = "platform_response";
    const confidence =
      typeof raw.confidence === "number" && raw.confidence >= 0 && raw.confidence <= 1
        ? raw.confidence
        : 0.5;
    const summary = typeof raw.summary === "string" ? raw.summary.slice(0, 300) : "";
    const refs = extractRefs(`${msg.subject ?? ""}\n${body}`);
    const deadline = extractDeadline(body);

    await ctx.runMutation(internal.replyClassification.apply, {
      caseMessageId: args.caseMessageId,
      intent,
      confidence,
      summary,
      model: MODEL,
      refs,
      deadline,
      platformSender,
    });

    // Counter-notices and legal responses escalate immediately — deadlines
    // start running and the workspace needs to see it now, not later.
    if (intent === "counter_notice" || intent === "legal_response") {
      await ctx.runMutation(internal.replyClassification.escalate, {
        caseMessageId: args.caseMessageId,
        intent,
        refs,
        deadline,
      });
    }
  },
});

export const apply = internalMutation({
  args: {
    caseMessageId: v.id("caseMessages"),
    intent: v.string(),
    confidence: v.number(),
    summary: v.string(),
    model: v.string(),
    refs: v.optional(v.array(v.string())),
    deadline: v.optional(v.string()),
    platformSender: v.optional(v.boolean()),
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
        refs: args.refs,
        deadline: args.deadline,
        platformSender: args.platformSender,
      },
    });
  },
});

/** Counter-notice / legal-response escalation: flag the case, notify the
 * workspace, and move any in-flight enforcement actions on this case to
 * counter_notice so the pipeline reflects reality. */
export const escalate = internalMutation({
  args: {
    caseMessageId: v.id("caseMessages"),
    intent: v.string(),
    refs: v.optional(v.array(v.string())),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get("caseMessages", args.caseMessageId);
    const caseId = msg?.caseId;
    if (!msg || !caseId) return;
    const actions = await ctx.db
      .query("enforcementActions")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();
    const refSet = new Set(args.refs ?? []);
    let moved = 0;
    for (const a of actions) {
      if (!["submitted", "platform_reviewing", "prepared"].includes(a.status)) continue;
      // Prefer the action whose externalRef matches an extracted ticket ref;
      // otherwise escalate the most recent in-flight action.
      if (a.externalRef && refSet.has(a.externalRef)) {
        await ctx.db.patch("enforcementActions", a._id, {
          status: args.intent === "counter_notice" ? "counter_notice" : "platform_reviewing",
          updatedAt: Date.now(),
        });
        moved++;
      }
    }
    if (moved === 0 && args.intent === "counter_notice") {
      const inFlight = actions
        .filter((a) => ["submitted", "platform_reviewing"].includes(a.status))
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      if (inFlight) {
        await ctx.db.patch("enforcementActions", inFlight._id, {
          status: "counter_notice",
          updatedAt: Date.now(),
        });
        moved++;
      }
    }
    await ctx.db.insert("notifications", {
      organizationId: msg.organizationId,
      type: "counter_notice",
      title:
        args.intent === "counter_notice"
          ? "Counter-notice received — legal escalation required"
          : "Legal response received",
      body: args.deadline
        ? `Response deadline detected: ${args.deadline.slice(0, 100)}`
        : "An inbound message on this case requires legal attention.",
      caseId: msg.caseId,
      href: `/cases/${msg.caseId}`,
      createdAt: Date.now(),
    });
    return { moved };
  },
});
