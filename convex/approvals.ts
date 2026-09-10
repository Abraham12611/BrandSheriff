import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireCaseAccess, requireDraftAccess } from "./lib/authz";
import type { Id } from "./_generated/dataModel";

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
    if (args.objectType === "case") {
      await requireCaseAccess(ctx, args.objectId as Id<"cases">);
    } else if (args.objectType === "draft") {
      await requireDraftAccess(ctx, args.objectId as Id<"draftNotices">);
    } else {
      throw new Error("Unsupported approval object type.");
    }
    return await ctx.db
      .query("approvals")
      .withIndex("by_object", (q) => q.eq("objectType", args.objectType).eq("objectId", args.objectId))
      .collect();
  },
});
