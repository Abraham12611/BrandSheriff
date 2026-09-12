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

      // The component already unwraps the Firecrawl envelope: the returned
      // value IS the scrape document ({ markdown, links, metadata, ... }).
      const data = scrapeResult as {
        markdown?: string;
        links?: string[];
        metadata?: { title?: string; description?: string };
      };
      if (!data.markdown?.trim() && !(data.links && data.links.length > 0)) {
        throw new Error(`Firecrawl scrape returned no content for ${args.url}`);
      }

      await ctx.runMutation(internal.brandAssets.createFromCrawl, {
        organizationId: brand.organizationId,
        brandId: args.brandId,
        sourceUrl: args.url,
        title: data.metadata?.title ?? "Homepage",
        textContent: data.markdown ?? "",
        links: data.links ?? [],
      });

      const mapResult = await firecrawl.map(ctx, args.url, { limit: 50 });
      // The component returns links as { url } objects.
      const links = ((mapResult as { links?: Array<string | { url?: string }> }).links ?? [])
        .map((link) => (typeof link === "string" ? link : link.url))
        .filter((link): link is string => !!link && link !== args.url);
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
