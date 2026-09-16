import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { guessPlatform } from "./lib/platform";

const firecrawl = new FirecrawlClient(components.firecrawl);

const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000;
const HOURLY_SCAN_CAP = 25;
const MAX_SUSPECTS = 10;

// Public free scan — the landing-page demo/growth loop. Deliberately
// bounded: one scrape + a few search rounds, a 24h per-domain cache, and
// a global hourly cap so the unauthenticated endpoint can't burn quota.

export const run = action({
  args: { url: v.string() },
  handler: async (ctx, args): Promise<{ token: string; cached: boolean }> => {
    let parsed: URL;
    try {
      parsed = new URL(/^https?:\/\//i.test(args.url) ? args.url : `https://${args.url}`);
    } catch {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Enter a valid site URL, e.g. yourstore.com",
      });
    }
    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const sourceUrl = parsed.toString();

    const cached: { token: string; scannedAt: number } | null = await ctx.runQuery(
      internal.scans.latestForDomain,
      { domain },
    );
    if (cached && cached.scannedAt > Date.now() - CACHE_WINDOW_MS) {
      return { token: cached.token, cached: true };
    }

    const recent = await ctx.runQuery(internal.scans.countRecent, {
      since: Date.now() - 60 * 60 * 1000,
    });
    if (recent >= HOURLY_SCAN_CAP) {
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: "Scanner is busy — too many scans this hour. Try again shortly.",
      });
    }

    let doc;
    try {
      doc = await firecrawl.scrape(ctx, sourceUrl, { formats: ["markdown"] });
    } catch {
      throw new ConvexError({
        code: "SCAN_FAILED",
        message:
          "Could not reach that site — check the URL, or the scanner may be unavailable right now.",
      });
    }

    const meta = (doc.metadata ?? {}) as { title?: string; ogTitle?: string; description?: string };
    const brandTerm = (meta.ogTitle ?? meta.title ?? domain)
      .replace(/\s*[|–—-]\s*.*$/, "")
      .trim()
      .slice(0, 80);

    const queries = [brandTerm, `${brandTerm} shop`, `${brandTerm} sale`].filter(
      (q) => q.trim().length > 1,
    );

    const selfDir = sourceUrl.slice(0, sourceUrl.lastIndexOf("/") + 1);
    const isSelf = (u: string) => u === sourceUrl || (selfDir.length > 8 && u.startsWith(selfDir));

    const found = new Map<string, { title?: string; description?: string }>();
    for (const q of queries.slice(0, 3)) {
      try {
        const result = await firecrawl.search(ctx, q, { limit: 8 });
        const web =
          (result as { web?: Array<{ url?: string; title?: string; description?: string }> }).web ??
          [];
        for (const item of web) {
          if (!item.url || isSelf(item.url)) continue;
          try {
            if (new URL(item.url).hostname.toLowerCase().replace(/^www\./, "") === domain) continue;
          } catch {
            continue;
          }
          found.set(item.url, { title: item.title, description: item.description });
        }
      } catch (e) {
        console.error("Scan search failed for query", q, e);
      }
    }

    const suspects = [...found.entries()].slice(0, MAX_SUSPECTS).map(([url, m]) => {
      let host = "";
      try {
        host = new URL(url).hostname;
      } catch {
        host = url;
      }
      return {
        url,
        host,
        title: m.title ?? null,
        description: m.description ?? null,
        platform: guessPlatform(url),
      };
    });

    const { token }: { token: string } = await ctx.runMutation(internal.scans.save, {
      domain,
      sourceUrl,
      scannedBrand: brandTerm || undefined,
      suspects,
    });

    return { token, cached: false };
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const scan = await ctx.db
      .query("scanResults")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!scan) return null;
    return {
      domain: scan.domain,
      sourceUrl: scan.sourceUrl,
      scannedBrand: scan.scannedBrand ?? null,
      suspects: scan.suspects as Array<{
        url: string;
        host: string;
        title: string | null;
        description: string | null;
        platform: string;
      }>,
      scannedAt: scan.scannedAt,
    };
  },
});

export const latestForDomain = internalQuery({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("scanResults")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain))
      .collect();
    return rows.sort((a, b) => b.scannedAt - a.scannedAt)[0] ?? null;
  },
});

export const countRecent = internalQuery({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("scanResults").collect();
    return rows.filter((r) => r.scannedAt >= args.since).length;
  },
});

export const save = internalMutation({
  args: {
    domain: v.string(),
    sourceUrl: v.string(),
    scannedBrand: v.optional(v.string()),
    suspects: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const token =
      crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    await ctx.db.insert("scanResults", {
      domain: args.domain,
      token,
      sourceUrl: args.sourceUrl,
      scannedBrand: args.scannedBrand,
      suspects: args.suspects,
      scannedAt: Date.now(),
    });
    return { token };
  },
});
