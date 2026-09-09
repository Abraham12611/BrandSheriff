import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const create = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    caseId: v.id("cases"),
    targetUrl: v.string(),
    purpose: v.string(),
    status: v.string(),
    checkedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rechecks", {
      organizationId: args.organizationId,
      caseId: args.caseId,
      targetUrl: args.targetUrl,
      purpose: args.purpose,
      status: args.status,
      checkedAt: args.checkedAt,
    });
  },
});

export const updateResult = internalMutation({
  args: {
    recheckId: v.id("rechecks"),
    status: v.string(),
    availability: v.optional(v.string()),
    comparisonResult: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recheckId, {
      status: args.status,
      availability: args.availability,
      comparisonResult: args.comparisonResult,
    });
  },
});
