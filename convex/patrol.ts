import { v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { assertProviderActionsEnabled } from "./providerSafety";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const runSearch = action({
  args: {
    runId: v.id("patrolRuns"),
    brandId: v.id("brands"),
    queries: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.runQuery(internal.brands.get, { brandId: args.brandId });
    if (!brand) throw new Error("Brand not found");

    await assertProviderActionsEnabled(ctx, brand.organizationId);

    await ctx.runMutation(internal.patrolRuns.updateStatus, {
      runId: args.runId,
      status: "running",
    });

    const foundUrls = new Set<string>();
    for (const query of args.queries.slice(0, 5)) {
      try {
        const result = await firecrawl.search(ctx, query, { limit: 10 });
        const data = (result as { data?: Array<{ url?: string; title?: string; description?: string }> }).data ?? [];
        for (const item of data) {
          if (item.url) foundUrls.add(item.url);
        }
      } catch (e) {
        console.error("Search failed for query", query, e);
      }
    }

    for (const url of foundUrls) {
      await ctx.runMutation(internal.discoveries.createFromPatrol, {
        organizationId: brand.organizationId,
        brandId: args.brandId,
        runId: args.runId,
        canonicalUrl: url,
        title: "Discovered URL",
        status: "needs_review",
      });
    }

    await ctx.runMutation(internal.patrolRuns.updateStatus, {
      runId: args.runId,
      status: "completed",
      completedAt: Date.now(),
    });

    return { discovered: foundUrls.size };
  },
});
