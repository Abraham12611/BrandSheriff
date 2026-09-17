import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import { AgentMail } from "@agentmail/convex";
import type { ComponentApi } from "@agentmail/convex/_generated/component.js";
import type { Id } from "./_generated/dataModel";
import { MEMBER_ROLES, requireCaseAccess, requireOrganizationMembership } from "./lib/authz";

const agentmail = new AgentMail(
  components.agentmail as unknown as ComponentApi<"agentmail">,
);

type InboundMessage = {
  inbox_id: string;
  thread_id?: string;
  message_id?: string;
  in_reply_to?: string;
  from?: string;
  to?: string | string[];
  subject?: string;
  preview?: string;
  text?: string;
  extracted_text?: string;
  timestamp?: string | number;
};

// Deterministic, honest classification — no AI conclusions. The label is a
// triage hint only; the message body is always shown verbatim.
function classify(m: InboundMessage): string {
  const hay = `${m.subject ?? ""}\n${m.text ?? m.extracted_text ?? ""}`.toLowerCase();
  const from = (m.from ?? "").toLowerCase();
  if (
    /\bauto(matic|matically)?[- ]?(reply|response|generated)\b/.test(hay) ||
    /out of (the )?office|away from (my )?(desk|email)|vacation/.test(hay) ||
    /^(mailer-daemon|postmaster|no-?reply|donotreply)@/.test(from) ||
    /delivery (status notification|has failed)|undeliverable|returned mail/.test(hay)
  ) {
    return "auto_reply";
  }
  if (
    /(has|have|was|were|been)\s+(removed|taken down|deleted|suspended|disabled|terminated)/.test(
      hay,
    ) ||
    /removed the (listing|content|item|page)|complied with|violation (has been )?resolved/.test(
      hay,
    )
  ) {
    return "possible_compliance";
  }
  return "needs_read";
}

// Invoked by the AgentMail component's callback workpool on message.received.
export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  handler: async (ctx, args) => {
    const m = args.message as InboundMessage;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_mailbox", (q) => q.eq("mailboxId", m.inbox_id))
      .first();
    if (!org) return; // not a workspace mailbox — nothing to route to

    // Fast path: a draft we sent already knows its thread.
    let matchedCaseId: Id<"cases"> | null = null;
    if (m.thread_id) {
      const draft = await ctx.db
        .query("draftNotices")
        .withIndex("by_thread", (q) => q.eq("threadId", m.thread_id!))
        .first();
      if (draft && draft.organizationId === org._id) {
        matchedCaseId = draft.caseId;
      }
    }

    // Slow path: resolve thread/message ids on this workspace's sent drafts
    // via the component's outbound status, backfilling threadId as we go.
    if (!matchedCaseId) {
      const cases = (
        await ctx.db
          .query("cases")
          .withIndex("by_org", (q) => q.eq("organizationId", org._id))
          .collect()
      )
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 25);

      outer: for (const c of cases) {
        const drafts = await ctx.db
          .query("draftNotices")
          .withIndex("by_case", (q) => q.eq("caseId", c._id))
          .collect();
        for (const d of drafts) {
          if (!d.outboundId) continue;
          const st = (await agentmail.status(ctx, d.outboundId as never)) as {
            threadId?: string | null;
            agentmailMessageId?: string | null;
          } | null;
          if (!st) continue;
          if (st.threadId && !d.threadId) {
            await ctx.db.patch("draftNotices", d._id, { threadId: st.threadId });
          }
          if (
            (m.thread_id && st.threadId === m.thread_id) ||
            (m.in_reply_to && st.agentmailMessageId === m.in_reply_to)
          ) {
            matchedCaseId = c._id;
            break outer;
          }
        }
      }
    }

    const to = Array.isArray(m.to) ? m.to : m.to ? [m.to] : [];
    const caseMessageId = await ctx.db.insert("caseMessages", {
      organizationId: org._id,
      caseId: matchedCaseId ?? undefined,
      threadId: m.thread_id,
      messageId: m.message_id,
      direction: "in",
      fromAddr: m.from ?? "unknown",
      toAddrs: to,
      subject: m.subject,
      text: m.extracted_text ?? m.text,
      preview: m.preview ?? (m.extracted_text ?? m.text ?? "").slice(0, 200),
      classification: classify(m),
      eventId: args.eventId,
      receivedAt: Date.now(),
    });

    // Optional deeper triage — only when the workspace enabled provider
    // actions and the deployment has an OpenAI key. Stays deterministic
    // otherwise; AI output is stored with provenance, never authoritative.
    if (org.settings?.providerActionsEnabled === true && env.OPENAI_API_KEY) {
      await ctx.scheduler.runAfter(0, internal.replyClassification.classify, {
        caseMessageId,
      });
    }

    if (matchedCaseId) {
      await ctx.db.insert("auditEvents", {
        organizationId: org._id,
        caseId: matchedCaseId,
        actorType: "system",
        actorId: "agentmail",
        eventType: "reply_received",
        entityType: "caseMessage",
        entityId: m.message_id ?? args.eventId,
        timestamp: Date.now(),
        metadataSafe: { from: m.from, subject: m.subject, threadId: m.thread_id },
      });
      await ctx.db.insert("notifications", {
        organizationId: org._id,
        type: "reply_received",
        title: `Reply received${m.subject ? `: ${m.subject}` : ""}`,
        body: m.preview ?? (m.extracted_text ?? m.text ?? "").slice(0, 140),
        caseId: matchedCaseId,
        href: `/cases/${matchedCaseId}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const listByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    return await ctx.db
      .query("caseMessages")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const markReadForCase = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    const rows = await ctx.db
      .query("caseMessages")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const now = Date.now();
    for (const r of rows) {
      if (r.direction === "in" && r.readAt === undefined) {
        await ctx.db.patch("caseMessages", r._id, { readAt: now });
      }
    }
  },
});

export const listUnmatched = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rows = await ctx.db
      .query("caseMessages")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows.filter((r) => r.caseId === undefined);
  },
});
