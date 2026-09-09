import { v } from "convex/values";
import { query, internalQuery, mutation, internalMutation } from "./_generated/server";

export const listByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("cases").collect();
    return all.filter((c) => c.state === args.state);
  },
});

export const get = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db.get("cases", args.caseId);
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
    const discovery = await ctx.db.get("discoveries", args.discoveryId);
    if (!discovery) throw new Error("Discovery not found");

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
