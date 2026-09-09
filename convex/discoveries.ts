import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";

export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("discoveries").collect();
    return all.filter((d) => d.status === args.status);
  },
});

export const get = query({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get("discoveries", args.discoveryId);
  },
});

export const listByBrandStatus = query({
  args: {
    brandId: v.id("brands"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("discoveries").collect();
    return all
      .filter((d) => d.brandId === args.brandId && d.status === args.status)
      .sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get("discoveries", args.discoveryId);
  },
});

export const createFromPatrol = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    runId: v.id("patrolRuns"),
    canonicalUrl: v.string(),
    title: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("discoveries", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      patrolRunId: args.runId,
      canonicalUrl: args.canonicalUrl,
      title: args.title,
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
