import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireCaseAccess, requireDiscoveryAccess } from "./lib/authz";
import type { Doc, Id } from "./_generated/dataModel";

async function withFileUrls(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  items: Doc<"evidenceItems">[],
) {
  return await Promise.all(
    items.map(async (item) => ({
      ...item,
      fileUrl: item.fileId
        ? await ctx.storage.getUrl(item.fileId as Id<"_storage">)
        : null,
    })),
  );
}

export const createFromInvestigation = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    discoveryId: v.optional(v.id("discoveries")),
    type: v.string(),
    title: v.string(),
    sourceUrl: v.optional(v.string()),
    textContent: v.optional(v.string()),
    capturedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("evidenceItems", {
      organizationId: args.organizationId,
      discoveryId: args.discoveryId,
      type: args.type,
      title: args.title,
      sourceUrl: args.sourceUrl,
      textContent: args.textContent,
      capturedAt: args.capturedAt,
    });
  },
});

export const listByDiscovery = query({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    await requireDiscoveryAccess(ctx, args.discoveryId);
    const items = await ctx.db
      .query("evidenceItems")
      .withIndex("by_discovery", (q) => q.eq("discoveryId", args.discoveryId))
      .collect();
    return await withFileUrls(ctx, items);
  },
});

export const listByCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    const items = await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    return await withFileUrls(ctx, items);
  },
});

export const listByCaseInternal = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});
