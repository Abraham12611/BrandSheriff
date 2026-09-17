import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import { sendEvent } from "@convex-dev/workflow";
import type { WorkflowId } from "@convex-dev/workflow";
import { progressEvent } from "./enforcementFlow";
import { AgentMail } from "@agentmail/convex";
import type { ComponentApi } from "@agentmail/convex/_generated/component.js";
import type { Doc, Id } from "./_generated/dataModel";
import { MEMBER_ROLES, requireCaseAccess, requireOrganizationMembership } from "./lib/authz";
import { agentmailApi } from "./lib/agentmailApi";

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
  attachments?: Array<{
    attachment_id?: string;
    id?: string;
    filename?: string;
    content_type?: string;
    size?: number;
  }>;
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
    const attachments = (m.attachments ?? [])
      .map((a) => {
        const attachmentId = a.attachment_id ?? a.id;
        if (!attachmentId) return null;
        return {
          attachmentId,
          filename: a.filename,
          contentType: a.content_type,
          size: a.size,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

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
      attachments: attachments.length > 0 ? attachments : undefined,
      receivedAt: Date.now(),
    });

    // Fetch attachment bytes into our own storage — the AgentMail download
    // URLs expire, and evidence needs to outlive them.
    if (attachments.length > 0 && m.message_id) {
      await ctx.scheduler.runAfter(0, internal.mailInbound.fetchAttachments, {
        caseMessageId,
        inboxId: m.inbox_id,
        messageId: m.message_id,
      });
    }

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

      // Wake the post-send workflow immediately if one is awaiting this case.
      const c = await ctx.db.get("cases", matchedCaseId);
      if (c?.enforcementWorkflowStatus === "awaiting" && c.enforcementWorkflowId) {
        try {
          await sendEvent(ctx, components.workflow, {
            ...progressEvent,
            workflowId: c.enforcementWorkflowId as WorkflowId,
            value: { kind: "reply" },
          });
        } catch {
          // Event consumption is best-effort — receipt itself already landed.
        }
      }
    }
  },
});

// Downloads each attachment's bytes via the AgentMail signed URL and stores
// them in Convex file storage, then stamps fileId onto the message row.
export const fetchAttachments = internalAction({
  args: {
    caseMessageId: v.id("caseMessages"),
    inboxId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.runQuery(internal.mailInbound.getMessage, {
      caseMessageId: args.caseMessageId,
    });
    if (!msg?.attachments?.length) return;
    for (const att of msg.attachments) {
      try {
        const meta = await agentmailApi<{ download_url?: string }>(
          `/inboxes/${args.inboxId}/messages/${encodeURIComponent(args.messageId)}/attachments/${encodeURIComponent(att.attachmentId)}`,
        );
        if (!meta?.download_url) continue;
        const res = await fetch(meta.download_url);
        if (!res.ok) continue;
        const fileId = await ctx.storage.store(await res.blob());
        await ctx.runMutation(internal.mailInbound.attachFile, {
          caseMessageId: args.caseMessageId,
          attachmentId: att.attachmentId,
          fileId,
        });
      } catch (e) {
        console.error("attachment fetch failed:", e instanceof Error ? e.message : String(e));
      }
    }
  },
});

export const attachFile = internalMutation({
  args: {
    caseMessageId: v.id("caseMessages"),
    attachmentId: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get("caseMessages", args.caseMessageId);
    if (!msg?.attachments) return;
    await ctx.db.patch("caseMessages", args.caseMessageId, {
      attachments: msg.attachments.map((a) =>
        a.attachmentId === args.attachmentId ? { ...a, fileId: args.fileId } : a,
      ),
    });
  },
});

export const getMessage = internalQuery({
  args: { caseMessageId: v.id("caseMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get("caseMessages", args.caseMessageId);
  },
});

export const listByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    const rows = await ctx.db
      .query("caseMessages")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    return await withAttachmentUrls(ctx, rows);
  },
});

async function withAttachmentUrls(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  rows: Doc<"caseMessages">[],
) {
  return await Promise.all(
    rows.map(async (r) => ({
      ...r,
      attachments: r.attachments
        ? await Promise.all(
            r.attachments.map(async (a) => ({
              ...a,
              fileUrl: a.fileId
                ? await ctx.storage.getUrl(a.fileId as Id<"_storage">)
                : null,
            })),
          )
        : undefined,
    })),
  );
}

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
    const unmatched = rows
      .filter((r) => r.caseId === undefined && r.direction === "in")
      .sort((a, b) => b.receivedAt - a.receivedAt);
    return await withAttachmentUrls(ctx, unmatched);
  },
});

// Attach an unrouted inbound message to a case — it joins that case's
// communication thread and clears from the unmatched inbox.
export const assignToCase = mutation({
  args: { caseMessageId: v.id("caseMessages"), caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    const msg = await ctx.db.get("caseMessages", args.caseMessageId);
    if (!msg || msg.organizationId !== c.organizationId) {
      throw new Error("Message not found.");
    }
    if (msg.caseId) throw new Error("Message is already assigned to a case.");
    await ctx.db.patch("caseMessages", args.caseMessageId, { caseId: args.caseId });
  },
});
