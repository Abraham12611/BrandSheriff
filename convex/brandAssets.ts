import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

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

export const listByBrand = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});
