import { v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { assertProviderActionsEnabled } from "./providerSafety";

const firecrawl = new FirecrawlClient(components.firecrawl);

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
      const scrapeResult = await firecrawl.scrape(ctx, args.url, {
        formats: ["markdown", "links"],
        onlyMainContent: true,
      });

      const data = (scrapeResult as { data?: { markdown?: string; links?: string[]; title?: string; description?: string } }).data;
      if (!data) {
        throw new Error("Firecrawl scrape returned no data");
      }

      await ctx.runMutation(internal.brandAssets.createFromCrawl, {
        organizationId: brand.organizationId,
        brandId: args.brandId,
        sourceUrl: args.url,
        title: data.title ?? "Homepage",
        textContent: data.markdown ?? "",
        links: data.links ?? [],
      });

      const mapResult = await firecrawl.map(ctx, args.url, { limit: 50 });
      const links = ((mapResult as unknown) as { links?: string[] }).links ?? [];
      for (const link of links.slice(0, 20)) {
        await ctx.runMutation(internal.brandAssets.createFromCrawl, {
          organizationId: brand.organizationId,
          brandId: args.brandId,
          sourceUrl: link,
          title: link,
          textContent: "",
          links: [],
        });
      }

      await ctx.runMutation(internal.brands.updateStatus, {
        brandId: args.brandId,
        brandDnaStatus: "active",
        lastIndexedAt: Date.now(),
      });

      return { success: true, pages: 1 + links.length };
    } catch (error) {
      await ctx.runMutation(internal.brands.updateStatus, {
        brandId: args.brandId,
        brandDnaStatus: "failed",
      });
      throw error;
    }
  },
});
