import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { assertPrototypeWriteEnabled } from "./prototypeSafety";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brands").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    canonicalDomain: v.string(),
  },
  handler: async (ctx, args) => {
    assertPrototypeWriteEnabled();
    const existingOrg = await ctx.db.query("organizations").first();
    let organizationId;
    if (existingOrg) {
      organizationId = existingOrg._id;
    } else {
      organizationId = await ctx.db.insert("organizations", {
        name: "Default workspace",
        slug: "default",
        ownerUserId: "demo-user",
        plan: "demo",
        settings: {},
      });
    }

    const brandId = await ctx.db.insert("brands", {
      organizationId,
      name: args.name,
      canonicalDomain: args.canonicalDomain,
      status: "active",
      brandDnaStatus: "pending",
      description: "",
    });

    await ctx.db.insert("auditEvents", {
      organizationId,
      brandId,
      actorType: "user",
      actorId: "demo-user",
      eventType: "created",
      entityType: "brand",
      entityId: brandId,
      timestamp: Date.now(),
      metadataSafe: { name: args.name },
    });

    return brandId;
  },
});

export const get = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db.get("brands", args.brandId);
  },
});

export const updateStatus = internalMutation({
  args: {
    brandId: v.id("brands"),
    brandDnaStatus: v.optional(v.string()),
    lastIndexedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<{
      brandDnaStatus: string;
      lastIndexedAt: number;
    }> = {};
    if (args.brandDnaStatus !== undefined) updates.brandDnaStatus = args.brandDnaStatus;
    if (args.lastIndexedAt !== undefined) updates.lastIndexedAt = args.lastIndexedAt;
    await ctx.db.patch("brands", args.brandId, updates);
  },
});
