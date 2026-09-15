import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { listOrganizationIds, requireBrandAccess, requireOrganizationMembership } from "./lib/authz";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const brands: any[] = [];
    for (const orgId of organizationIds) {
      const orgBrands = await ctx.db
        .query("brands")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      brands.push(...orgBrands);
    }
    return brands;
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    canonicalDomain: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrganizationMembership(ctx, args.organizationId);

    const brandId = await ctx.db.insert("brands", {
      organizationId: args.organizationId,
      name: args.name,
      canonicalDomain: args.canonicalDomain,
      status: "active",
      brandDnaStatus: "pending",
      description: "",
    });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "created",
      entityType: "brand",
      entityId: brandId,
      timestamp: Date.now(),
      metadataSafe: { name: args.name },
    });

    return brandId;
  },
});

export const remove = mutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const { brand, identity } = await requireBrandAccess(ctx, args.brandId);
    await requireOrganizationMembership(ctx, brand.organizationId, ["owner", "admin"]);

    const assets = await ctx.db
      .query("brandAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    for (const asset of assets) {
      await ctx.db.delete("brandAssets", asset._id);
    }
    await ctx.db.delete("brands", args.brandId);

    await ctx.db.insert("auditEvents", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "deleted",
      entityType: "brand",
      entityId: args.brandId,
      timestamp: Date.now(),
      metadataSafe: { name: brand.name },
    });
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
