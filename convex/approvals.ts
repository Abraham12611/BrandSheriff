import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const create = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    objectType: v.string(),
    objectId: v.string(),
    action: v.string(),
    snapshotBody: v.optional(v.string()),
    snapshotSubject: v.optional(v.string()),
    approvedByUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvals", {
      organizationId: args.organizationId,
      caseId: args.caseId,
      objectType: args.objectType,
      objectId: args.objectId,
      action: args.action,
      snapshotBody: args.snapshotBody,
      snapshotSubject: args.snapshotSubject,
      approvedByUserId: args.approvedByUserId,
      approvedAt: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const listByObject = query({
  args: { objectType: v.string(), objectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("approvals")
      .withIndex("by_object", (q) => q.eq("objectType", args.objectType).eq("objectId", args.objectId))
      .collect();
  },
});
