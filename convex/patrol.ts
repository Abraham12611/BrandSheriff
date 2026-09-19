import { v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { assertProviderActionsEnabled } from "./providerSafety";
import { guessPlatform } from "./lib/platform";
import type { Id } from "./_generated/dataModel";

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

    // Exclude the official page itself (and anything under its directory)
    // without excluding the whole host — demo pages share the site origin.
    const canonical = brand.canonicalDomain.replace(/\/$/, "");
    const canonicalDir = canonical.slice(0, canonical.lastIndexOf("/") + 1);
    const allowlist = new Set((brand.allowlist ?? []).map((d: string) => d.toLowerCase()));
    const isSelf = (url: string) =>
      url === canonical || (canonicalDir.length > 0 && url.startsWith(canonicalDir));
    const isAllowed = (url: string) => {
      try {
        const host = new URL(url).hostname.toLowerCase();
        return [...allowlist].some((d) => host === d || host.endsWith(`.${d}`));
      } catch {
        return false;
      }
    };

    // Keyword fallback chain: active keyword rows → legacy brand.keywords
    // array → caller-provided defaults (name-derived).
    const activeTerms = (await ctx.runQuery(internal.keywords.listActiveTerms, {
      brandId: args.brandId,
    })) as string[];
    const queries =
      activeTerms.length > 0
        ? activeTerms
        : brand.keywords && brand.keywords.length > 0
          ? brand.keywords
          : args.queries;
    const used = queries.slice(0, 8);

    const found = new Map<string, { title?: string; summary?: string; query: string }>();
    for (const query of used) {
      try {
        const result = await firecrawl.search(ctx, query, { limit: 10 });
        // The component returns body.data directly; web hits live under `web`.
        const data = (result as { web?: Array<{ url?: string; title?: string; description?: string }> }).web ?? [];
        for (const item of data) {
          if (item.url && !isSelf(item.url) && !isAllowed(item.url)) {
            // First query to surface a URL keeps the attribution.
            if (!found.has(item.url)) {
              found.set(item.url, { title: item.title, summary: item.description, query });
            }
          }
        }
      } catch (e) {
        console.error("Search failed for query", query, e);
      }
    }

    await ctx.runMutation(internal.keywords.touchUsed, {
      brandId: args.brandId,
      terms: used,
    });

    let created = 0;
    for (const [url, meta] of found) {
      const existing = await ctx.runQuery(internal.discoveries.getByUrl, {
        organizationId: brand.organizationId,
        canonicalUrl: url,
      });
      if (existing) continue;
      const createdDiscovery = (await ctx.runMutation(
        internal.discoveries.createFromPatrol,
        {
          organizationId: brand.organizationId,
          brandId: args.brandId,
          runId: args.runId,
          canonicalUrl: url,
          title: meta.title ?? "Discovered URL",
          summary: meta.summary,
          status: "needs_review",
          platformGuess: guessPlatform(url),
          source: "patrol",
          matchedQuery: meta.query,
        },
      )) as { discoveryId: Id<"discoveries"> };
      // Score it and join it to the offender graph — both cheap, both make
      // the review queue ordered instead of flat.
      await ctx.scheduler.runAfter(0, internal.cloneScore.compute, {
        discoveryId: createdDiscovery.discoveryId,
      });
      await ctx.scheduler.runAfter(0, internal.offenders.upsertForDiscovery, {
        discoveryId: createdDiscovery.discoveryId,
      });
      created++;
    }

    await ctx.runMutation(internal.patrolRuns.updateStatus, {
      runId: args.runId,
      status: "completed",
      completedAt: Date.now(),
    });

    return { discovered: created, seen: found.size };
  },
});
