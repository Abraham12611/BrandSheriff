import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { ConvexError } from "convex/values";
import { requireBrandAccess, requireOrganizationMembership } from "./lib/authz";
import type { Id } from "./_generated/dataModel";

async function requireAssetAccess(ctx: MutationCtx, assetId: Id<"brandAssets">) {
  const asset = await ctx.db.get("brandAssets", assetId);
  if (!asset) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Asset not found." });
  }
  const { identity, membership } = await requireOrganizationMembership(ctx, asset.organizationId);
  return { asset, identity, membership };
}

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

export const createDocument = mutation({
  args: {
    brandId: v.id("brands"),
    title: v.string(),
    fileId: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { brand } = await requireBrandAccess(ctx, args.brandId);
    const assetId = await ctx.db.insert("brandAssets", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      type: "document",
      title: args.title,
      fileId: args.fileId,
      status: "active",
      monitorEnabled: false,
    });
    return assetId;
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
    return await Promise.all(
      assets.map(async (a) => ({
        ...a,
        textContent: a.textContent ? a.textContent.slice(0, 500) : a.textContent,
        fileUrl: a.fileId
          ? await ctx.storage.getUrl(a.fileId as Id<"_storage">)
          : undefined,
      })),
    );
  },
});

export const setMonitor = mutation({
  args: { assetId: v.id("brandAssets"), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await requireAssetAccess(ctx, args.assetId);
    await ctx.db.patch("brandAssets", args.assetId, { monitorEnabled: args.enabled });
  },
});

export const bulkSetMonitor = mutation({
  args: { assetIds: v.array(v.id("brandAssets")), enabled: v.boolean() },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const assetId of args.assetIds.slice(0, 200)) {
      try {
        await requireAssetAccess(ctx, assetId);
        await ctx.db.patch("brandAssets", assetId, { monitorEnabled: args.enabled });
        updated++;
      } catch {
        // skip assets the caller can't access
      }
    }
    return updated;
  },
});

export const remove = mutation({
  args: { assetId: v.id("brandAssets") },
  handler: async (ctx, args) => {
    await requireAssetAccess(ctx, args.assetId);
    await ctx.db.delete("brandAssets", args.assetId);
  },
});

export const bulkRemove = mutation({
  args: { assetIds: v.array(v.id("brandAssets")) },
  handler: async (ctx, args) => {
    let removed = 0;
    for (const assetId of args.assetIds.slice(0, 200)) {
      try {
        await requireAssetAccess(ctx, assetId);
        await ctx.db.delete("brandAssets", assetId);
        removed++;
      } catch {
        // skip assets the caller can't access
      }
    }
    return removed;
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
