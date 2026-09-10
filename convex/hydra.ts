import { v } from "convex/values";
import { action, mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { requireCaseAccess } from "./lib/authz";
import { assertProviderActionsEnabled } from "./providerSafety";
import type { Doc } from "./_generated/dataModel";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const startWatch = mutation({
  args: { caseId: v.id("cases"), brandId: v.id("brands"), fingerprint: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    if (c.brandId !== args.brandId) {
      throw new Error("Brand does not match case brand.");
    }
    await ctx.db.insert("hydraWatches", {
      organizationId: c.organizationId,
      brandId: args.brandId,
      caseId: args.caseId,
      fingerprint: args.fingerprint ?? {},
      enabled: true,
      lastRunAt: Date.now(),
    });
    await ctx.db.patch(args.caseId, { state: "watching" });
  },
});

export const runWatch = action({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = (await ctx.runQuery(internal.hydra.getById, { watchId: args.watchId })) as Doc<"hydraWatches"> | null;
    if (!watch) throw new Error("Watch not found");

    await assertProviderActionsEnabled(ctx, watch.organizationId);

    const brand = (await ctx.runQuery(internal.brands.get, { brandId: watch.brandId })) as Doc<"brands"> | null;
    if (!brand) throw new Error("Brand not found");

    const queries = [brand.name, `${brand.name} sale`, `${brand.name} discount`];
    const foundUrls = new Set<string>();
    for (const query of queries.slice(0, 3)) {
      try {
        const result = await firecrawl.search(ctx, query, { limit: 10 });
        const data = (result as { data?: Array<{ url?: string }> }).data ?? [];
        for (const item of data) {
          if (item.url) foundUrls.add(item.url);
        }
      } catch (e) {
        console.error("Hydra search failed for", query, e);
      }
    }

    for (const url of foundUrls) {
      await ctx.runMutation(internal.discoveries.createFromPatrol, {
        organizationId: watch.organizationId,
        brandId: watch.brandId,
        runId: args.watchId as any,
        canonicalUrl: url,
        title: "Hydra reappearance",
        status: "needs_review",
      });
    }

    await ctx.runMutation(internal.hydra.markRun, { watchId: args.watchId });
    return { discovered: foundUrls.size };
  },
});

export const list = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    return await ctx.db
      .query("hydraWatches")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const getById = internalQuery({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    return await ctx.db.get("hydraWatches", args.watchId);
  },
});

export const markRun = internalMutation({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.watchId, { lastRunAt: Date.now() });
  },
});
