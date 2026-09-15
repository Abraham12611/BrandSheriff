import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireCaseAccess } from "./lib/authz";

export const listByCase = query({
  args: { caseId: v.id("cases"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    const events = await ctx.db
      .query("auditEvents")
      .withIndex("by_case_time", (q) => q.eq("caseId", args.caseId))
      .collect();
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, args.limit ?? 100);
  },
});
