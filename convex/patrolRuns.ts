import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("patrolRuns").collect();
    return all
      .filter((r) => r.brandId === args.brandId)
      .sort((a, b) => b.startedAt - a.startedAt);
  },
});

export const start = mutation({
  args: {
    brandId: v.id("brands"),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get("brands", args.brandId);
    if (!brand) throw new Error("Brand not found");

    const patrolId = await ctx.db.insert("patrols", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      name: `${args.type} patrol`,
      type: args.type,
      enabled: true,
      config: {},
    });

    const runId = await ctx.db.insert("patrolRuns", {
      patrolId,
      organizationId: brand.organizationId,
      brandId: args.brandId,
      type: args.type,
      status: "queued",
      startedAt: Date.now(),
    });

    return runId;
  },
});

export const updateStatus = internalMutation({
  args: {
    runId: v.id("patrolRuns"),
    status: v.string(),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<{ status: string; completedAt: number }> = {
      status: args.status,
    };
    if (args.completedAt !== undefined) updates.completedAt = args.completedAt;
    await ctx.db.patch("patrolRuns", args.runId, updates);
  },
});
