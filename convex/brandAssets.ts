import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireBrandAccess } from "./lib/authz";

export const createFromCrawl = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    sourceUrl: v.string(),
    title: v.string(),
    textContent: v.string(),
    links: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("brandAssets", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      type: "page",
      title: args.title,
      sourceUrl: args.sourceUrl,
      textContent: args.textContent.slice(0, 100000),
      status: "active",
      monitorEnabled: true,
    });

    for (const link of args.links.slice(0, 50)) {
      await ctx.db.insert("brandAssets", {
        organizationId: args.organizationId,
        brandId: args.brandId,
        type: "link",
        title: link,
        sourceUrl: link,
        status: "active",
        monitorEnabled: false,
      });
    }
  },
});

export const list = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    const assets = await ctx.db
      .query("brandAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    return assets.map((a) => ({
      ...a,
      textContent: a.textContent ? a.textContent.slice(0, 500) : a.textContent,
    }));
  },
});

export const listByBrand = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});
