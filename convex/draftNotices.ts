import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireCaseAccess } from "./lib/authz";

export const create = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    routeType: v.string(),
    status: v.string(),
    structuredFields: v.optional(v.any()),
    body: v.optional(v.string()),
    generatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("draftNotices", {
      organizationId: args.organizationId,
      caseId: args.caseId,
      routeType: args.routeType,
      status: args.status,
      structuredFields: args.structuredFields,
      body: args.body,
      generatedBy: args.generatedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const latest = query({
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

export const getById = internalQuery({
  args: { draftId: v.id("draftNotices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.draftId);
  },
});

export const markSent = internalMutation({
  args: {
    draftId: v.id("draftNotices"),
    outboundId: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db.get("draftNotices", args.draftId);
    if (!draft) return;
    await ctx.db.patch("draftNotices", args.draftId, {
      status: "sent",
      outboundId: args.outboundId,
      sentTo: args.to,
      sentAt: Date.now(),
      updatedAt: Date.now(),
    });
    // Record the outbound side of the thread so replies render in context.
    if (args.to) {
      const subject =
        (draft.structuredFields as { subject?: string } | undefined)?.subject ??
        "Brand enforcement notice";
      await ctx.db.insert("caseMessages", {
        organizationId: draft.organizationId,
        caseId: draft.caseId,
        direction: "out",
        fromAddr: "workspace",
        toAddrs: [args.to],
        subject,
        text: draft.body,
        preview: (draft.body ?? "").slice(0, 200),
        receivedAt: Date.now(),
        readAt: Date.now(),
      });
    }
  },
});
