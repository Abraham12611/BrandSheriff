import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { CrawledPage, CrawlCompletePayload } from "@firecrawl/firecrawl-convex";
import { assertProviderActionsEnabled } from "./providerSafety";
import type { Doc } from "./_generated/dataModel";

const firecrawl = new FirecrawlClient(components.firecrawl);

const CRAWL_LIMIT = 25;
const PAGE_BATCH = 50;

// Starts a real Firecrawl crawl of the brand's official site. The component
// stores every crawled page (markdown included); when the crawl reaches a
// terminal state Firecrawl's webhook invokes onCrawlComplete, which ingests
// the pages into the brand's asset library. brandDnaStatus stays "crawling"
// until that finishes.
export const crawl = action({
  args: {
    brandId: v.id("brands"),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.runQuery(internal.brands.get, { brandId: args.brandId });
    if (!brand) throw new Error("Brand not found");

    await assertProviderActionsEnabled(ctx, brand.organizationId);

    await ctx.runMutation(internal.brands.updateStatus, {
      brandId: args.brandId,
      brandDnaStatus: "crawling",
    });

    try {
      const { crawlId, jobId } = await firecrawl.startCrawl(ctx, {
        url: args.url,
        options: {
          limit: CRAWL_LIMIT,
          deduplicateSimilarURLs: true,
          scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
        },
        storeContent: true,
        onComplete: internal.brandDna.onCrawlComplete,
        context: { brandId: args.brandId },
      });
      await ctx.runMutation(internal.brands.setCrawlId, {
        brandId: args.brandId,
        crawlId,
      });
      return { started: true, crawlId, jobId };
    } catch (error) {
      await ctx.runMutation(internal.brands.updateStatus, {
        brandId: args.brandId,
        brandDnaStatus: "failed",
      });
      throw error;
    }
  },
});

// Invoked by the component when the crawl reaches a terminal state. Mutations
// cannot read component tables, so this only schedules the ingest action.
export const onCrawlComplete = internalMutation({
  args: {
    crawlId: v.string(),
    jobId: v.optional(v.string()),
    status: v.string(),
    pageCount: v.number(),
    unstored: v.optional(v.number()),
    error: v.optional(v.string()),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args: CrawlCompletePayload) => {
    const brandId = (args.context as { brandId?: string } | undefined)?.brandId;
    if (!brandId) return;
    if (args.status !== "completed") {
      await ctx.db.patch("brands", brandId as Doc<"brands">["_id"], {
        brandDnaStatus: "failed",
      });
      return;
    }
    await ctx.scheduler.runAfter(0, internal.brandDna.ingestCrawl, {
      crawlId: args.crawlId,
      brandId: brandId as Doc<"brands">["_id"],
    });
  },
});

// Pulls every stored page out of the component and materializes it as a
// brand asset with real content — the DNA library only contains pages the
// crawl actually fetched.
export const ingestCrawl = internalAction({
  args: { crawlId: v.string(), brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const brand = (await ctx.runQuery(internal.brands.get, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (!brand) return;

    let cursor: string | null = null;
    let stored = 0;
    do {
      // The client's listPages types ctx as its own query ctx; ActionCtx is
      // the same object at runtime (runQuery without the options parameter).
      const page = await firecrawl.listPages(
        ctx as unknown as Parameters<typeof firecrawl.listPages>[0],
        {
        crawlId: args.crawlId,
        paginationOpts: { numItems: PAGE_BATCH, cursor },
      });
      for (const p of page.page as CrawledPage[]) {
        await ctx.runMutation(internal.brandAssets.createFromCrawl, {
          organizationId: brand.organizationId,
          brandId: args.brandId,
          sourceUrl: p.url,
          title: p.metadata?.title ?? p.url,
          textContent: p.markdown ?? "",
          links: [],
        });
        stored++;
      }
      cursor = page.isDone ? null : page.continueCursor;
    } while (cursor);

    await ctx.runMutation(internal.brands.updateStatus, {
      brandId: args.brandId,
      brandDnaStatus: stored > 0 ? "active" : "failed",
      lastIndexedAt: Date.now(),
    });
    return { stored };
  },
});
