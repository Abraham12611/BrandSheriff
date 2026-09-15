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

export const listForOrg = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const all = [];
    for (const orgId of organizationIds) {
      const rows = await ctx.db
        .query("cases")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      all.push(...rows);
    }
    return all
      .filter((c) => !args.state || c.state === args.state)
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 200);
  },
});

export const countsByState = query({
  args: {},
  handler: async (ctx) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const counts: Record<string, number> = {};
    for (const orgId of organizationIds) {
      const rows = await ctx.db
        .query("cases")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const c of rows) {
        counts[c.state] = (counts[c.state] ?? 0) + 1;
      }
    }
    return counts;
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
    const { discovery, identity } = await requireDiscoveryAccess(ctx, args.discoveryId);

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

    await ctx.db.insert("auditEvents", {
      organizationId: discovery.organizationId,
      brandId: discovery.brandId,
      caseId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "case_created",
      entityType: "case",
      entityId: caseId,
      timestamp: Date.now(),
      metadataSafe: { title: args.title, caseNumber },
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

export const resolve = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c, identity } = await requireCaseAccess(ctx, args.caseId);
    await ctx.db.patch("cases", args.caseId, {
      state: "resolved",
      resolvedAt: Date.now(),
    });
    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      brandId: c.brandId,
      caseId: args.caseId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "case_resolved",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: { caseNumber: c.caseNumber },
    });
  },
});

export const reopen = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c, identity } = await requireCaseAccess(ctx, args.caseId);
    await ctx.db.patch("cases", args.caseId, {
      state: "active",
      resolvedAt: undefined,
    });
    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      brandId: c.brandId,
      caseId: args.caseId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "case_reopened",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: { caseNumber: c.caseNumber },
    });
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
