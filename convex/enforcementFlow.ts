import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { requireCaseAccess } from "./lib/authz";
import type { WorkflowId } from "@convex-dev/workflow";
import {
  cancel as cancelWorkflow,
  defineEvent,
  defineWorkflow,
  getStatus,
  sendEvent,
  start as startWorkflow,
} from "@convex-dev/workflow";

// Shared event channel: a reply landing in mailInbound OR a scheduled timeout
// both resume the awaiting workflow — whichever arrives first.
export const progressEvent = defineEvent({
  name: "case-progress",
  validator: v.object({ kind: v.string() }),
});

// Post-send enforcement loop. Suspends (durably, for days) until a reply
// arrives or the wait window lapses, then rechecks the target page and
// notifies the workspace with the outcome. A follow-up send starts a new
// cycle — the previous one is cancelled.
export const postSend = defineWorkflow(components.workflow, {
  args: { caseId: v.id("cases") },
}).handler(async (step, args) => {
  const ev = (await step.awaitEvent(progressEvent)) as { kind?: string };

  if (ev.kind === "reply") {
    await step.runMutation(internal.enforcementFlow.onReply, {
      caseId: args.caseId,
    });
    return;
  }

  // Timeout path — verify the target page's current state. System-side entry:
  // no user identity exists in workflow steps, so the org's own opt-in flag is
  // the gate (same flag the interactive path checks after identity).
  const analysis = (await step.runAction(internal.verification.recheckSystem, {
    caseId: args.caseId,
  })) as { availability?: string; summary?: string } | null;

  await step.runMutation(internal.enforcementFlow.afterRecheck, {
    caseId: args.caseId,
    availability: String(analysis?.availability ?? "inconclusive"),
    summary: String(analysis?.summary ?? "").slice(0, 300),
  });
});

// Called from approveAndSend after the message goes out. Cancels any prior
// awaiting cycle so a re-send replaces rather than duplicates it.
export const arm = internalMutation({
  args: { caseId: v.id("cases"), waitMs: v.number() },
  handler: async (ctx, args) => {
    const c = await ctx.db.get("cases", args.caseId);
    if (!c) return;
    if (c.enforcementWorkflowId && c.enforcementWorkflowStatus === "awaiting") {
      try {
        await cancelWorkflow(
          ctx,
          components.workflow,
          c.enforcementWorkflowId as WorkflowId,
        );
      } catch {
        // Prior workflow may already be finished — proceed regardless.
      }
    }
    const workflowId = await startWorkflow(ctx, internal.enforcementFlow.postSend, {
      caseId: args.caseId,
    });
    await ctx.db.patch("cases", args.caseId, {
      enforcementWorkflowId: workflowId,
      enforcementWorkflowStatus: "awaiting",
      enforcementWorkflowStartedAt: Date.now(),
    });
    // The durable "timeout" half of the race: if no reply arrives within the
    // window, this event wakes the workflow into the recheck path.
    await ctx.scheduler.runAfter(args.waitMs, internal.enforcementFlow.sendTimeout, {
      workflowId,
    });
  },
});

// Live status of the case's follow-up workflow — drives the armed/completed
// banner and is the observable surface of the durable loop.
export const status = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    if (!c.enforcementWorkflowId) return null;
    try {
      return await getStatus(
        ctx,
        components.workflow,
        c.enforcementWorkflowId as WorkflowId,
      );
    } catch (e) {
      return { type: "error" as const, error: e instanceof Error ? e.message : String(e) };
    }
  },
});

// Member-facing "run the follow-up check now" — fires the timeout event early
// so the armed loop doesn't have to wait out the full window.
export const checkNow = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    if (c.enforcementWorkflowStatus !== "awaiting" || !c.enforcementWorkflowId) {
      throw new Error("No follow-up loop is awaiting on this case.");
    }
    await sendEvent(ctx, components.workflow, {
      ...progressEvent,
      workflowId: c.enforcementWorkflowId as WorkflowId,
      value: { kind: "timeout" },
    });
  },
});

export const sendTimeout = internalMutation({
  args: { workflowId: v.string() },
  handler: async (ctx, args) => {
    await sendEvent(ctx, components.workflow, {
      ...progressEvent,
      workflowId: args.workflowId as WorkflowId,
      value: { kind: "timeout" },
    });
  },
});

export const onReply = internalMutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = await ctx.db.get("cases", args.caseId);
    if (!c) return;
    await ctx.db.patch("cases", args.caseId, {
      enforcementWorkflowStatus: "reply_received",
    });
    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      caseId: args.caseId,
      actorType: "system",
      actorId: "workflow",
      eventType: "workflow_reply_seen",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: {},
    });
  },
});

export const afterRecheck = internalMutation({
  args: {
    caseId: v.id("cases"),
    availability: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.get("cases", args.caseId);
    if (!c) return;
    await ctx.db.patch("cases", args.caseId, {
      enforcementWorkflowStatus: "completed",
    });

    const removed = args.availability === "removed";
    const stillLive = args.availability === "still_present";
    const title = removed
      ? "Automated recheck: page appears removed"
      : stillLive
        ? "Automated recheck: page still live — follow-up recommended"
        : `Automated recheck: ${args.availability}`;

    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      caseId: args.caseId,
      actorType: "system",
      actorId: "workflow",
      eventType: removed
        ? "workflow_takedown_detected"
        : stillLive
          ? "workflow_still_live"
          : "workflow_recheck",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: { availability: args.availability, summary: args.summary },
    });
    await ctx.db.insert("notifications", {
      organizationId: c.organizationId,
      type: "case_update",
      title,
      body: args.summary.slice(0, 140),
      caseId: args.caseId,
      href: `/cases/${args.caseId}`,
      createdAt: Date.now(),
    });
  },
});
