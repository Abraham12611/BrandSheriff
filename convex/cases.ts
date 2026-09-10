import { v } from "convex/values";
import { query, internalQuery, mutation, internalMutation } from "./_generated/server";
import { listOrganizationIds, requireCaseAccess, requireDiscoveryAccess } from "./lib/authz";

export const listByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const cases: any[] = [];
    for (const orgId of organizationIds) {
      const orgCases = await ctx.db
        .query("cases")
        .withIndex("by_org_state", (q) => q.eq("organizationId", orgId).eq("state", args.state))
        .collect();
      cases.push(...orgCases);
    }
    return cases;
  },
});

export const get = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    return c;
  },
});

export const getById = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get("cases", args.caseId);
  },
});

export const createFromDiscovery = mutation({
  args: {
    discoveryId: v.id("discoveries"),
    title: v.string(),
    severity: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { discovery } = await requireDiscoveryAccess(ctx, args.discoveryId);

    const count = await ctx.db.query("cases").collect();
    const caseNumber = `BS-${1000 + count.length}`;

    const caseId = await ctx.db.insert("cases", {
      organizationId: discovery.organizationId,
      brandId: discovery.brandId,
      discoveryId: args.discoveryId,
      caseNumber,
      title: args.title,
      state: "active",
      severity: args.severity ?? discovery.severity ?? "medium",
      summary: args.summary ?? discovery.summary ?? "",
      primaryThreatType: "suspected_infringement",
    });

    await ctx.db.patch("discoveries", args.discoveryId, {
      status: "case_created",
    });

    await ctx.db.insert("evidenceItems", {
      organizationId: discovery.organizationId,
      caseId,
      discoveryId: args.discoveryId,
      type: "discovery_link",
      title: discovery.title ?? discovery.canonicalUrl,
      sourceUrl: discovery.canonicalUrl,
      capturedAt: Date.now(),
    });

    return caseId;
  },
});

export const updateState = internalMutation({
  args: {
    caseId: v.id("cases"),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("cases", args.caseId, { state: args.state });
  },
});
