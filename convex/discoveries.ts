import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";
import { listOrganizationIds, requireBrandAccess, requireDiscoveryAccess } from "./lib/authz";

export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const discoveries: any[] = [];
    for (const orgId of organizationIds) {
      const orgDiscoveries = await ctx.db
        .query("discoveries")
        .withIndex("by_org_status", (q) =>
          q.eq("organizationId", orgId).eq("status", args.status),
        )
        .collect();
      discoveries.push(...orgDiscoveries);
    }
    return discoveries;
  },
});

export const get = query({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const { discovery } = await requireDiscoveryAccess(ctx, args.discoveryId);
    return discovery;
  },
});

export const listByBrandStatus = query({
  args: {
    brandId: v.id("brands"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    const all = await ctx.db
      .query("discoveries")
      .withIndex("by_brand_status", (q) =>
        q.eq("brandId", args.brandId).eq("status", args.status),
      )
      .collect();
    return all.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get("discoveries", args.discoveryId);
  },
});

export const getByUrl = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    canonicalUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const hit = await ctx.db
      .query("discoveries")
      .withIndex("by_url", (q) => q.eq("canonicalUrl", args.canonicalUrl))
      .first();
    return hit && hit.organizationId === args.organizationId ? hit : null;
  },
});

export const createFromPatrol = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    runId: v.id("patrolRuns"),
    canonicalUrl: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discoveries", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      patrolRunId: args.runId,
      canonicalUrl: args.canonicalUrl,
      title: args.title,
      summary: args.summary,
      status: args.status,
    });
  },
});

export const updateAnalysis = internalMutation({
  args: {
    discoveryId: v.id("discoveries"),
    summary: v.string(),
    matchConfidence: v.number(),
    identityRisk: v.number(),
    authorizationRisk: v.number(),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("discoveries", args.discoveryId, {
      summary: args.summary,
      matchConfidence: args.matchConfidence,
      identityRisk: args.identityRisk,
      authorizationRisk: args.authorizationRisk,
      severity: args.severity,
    });
  },
});
