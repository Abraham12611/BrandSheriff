import { v } from "convex/values";
import { query } from "./_generated/server";
import { listOrganizationIds } from "./lib/authz";

export const summary = query({
  args: { brandId: v.optional(v.id("brands")) },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);

    const byPlatform: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const casesByState: Record<string, number> = {};

    let total = 0;
    let withSimilarity = 0;
    let similaritySum = 0;

    for (const orgId of organizationIds) {
      const discoveries = await ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const d of discoveries) {
        if (args.brandId && d.brandId !== args.brandId) continue;
        total++;
        const platform = d.platformGuess ?? "web";
        byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;
        byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
        const sev = d.severity ?? "unrated";
        bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;
        const src = d.source ?? "patrol";
        bySource[src] = (bySource[src] ?? 0) + 1;
        const day = new Date(d._creationTime).toISOString().slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + 1;
        const sim = d.similarityScore ?? d.matchConfidence;
        if (sim !== undefined) {
          withSimilarity++;
          similaritySum += sim;
        }
      }

      const cases = await ctx.db
        .query("cases")
        .withIndex("by_org_state", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const c of cases) {
        if (args.brandId && c.brandId !== args.brandId) continue;
        casesByState[c.state] = (casesByState[c.state] ?? 0) + 1;
      }
    }

    return {
      total,
      byPlatform,
      byStatus,
      bySeverity,
      bySource,
      byDay,
      casesByState,
      avgSimilarity: withSimilarity > 0 ? similaritySum / withSimilarity : null,
      scoredCount: withSimilarity,
    };
  },
});
