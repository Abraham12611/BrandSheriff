import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { requireBrandAccess } from "./lib/authz";

export const listByBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    const all = await ctx.db
      .query("patrolRuns")
      .withIndex("by_brand_status", (q) => q.eq("brandId", args.brandId))
      .collect();
    return all.sort((a, b) => b.startedAt - a.startedAt);
  },
});

export const start = mutation({
  args: {
    brandId: v.id("brands"),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const { brand } = await requireBrandAccess(ctx, args.brandId);

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
