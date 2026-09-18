import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { fetchAndHash, hashBytes, similarity } from "./lib/phash";
import { assertOrgProviderEnabled } from "./providerSafety";
import type { Doc, Id } from "./_generated/dataModel";

const firecrawl = new FirecrawlClient(components.firecrawl);

const MAX_SUSPECT_IMAGES = 8;
const MATCH_FLOOR = 0.55; // below this, don't bother recording a match pair

const IMAGE_URL_RE = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)|https?:\/\/[^\s"'<>]+\.(?:jpe?g|png)(?:\?[^\s"'<>]*)?/gi;

// Pull candidate image URLs out of crawled markdown — product photos and
// content imagery the crawler embedded as markdown image syntax.
export function imageUrlsFromMarkdown(markdown: string): string[] {
  const urls = new Set<string>();
  for (const m of markdown.matchAll(IMAGE_URL_RE)) {
    const url = (m[1] ?? m[0]).trim();
    if (url.length < 2048) urls.add(url);
    if (urls.size >= 20) break;
  }
  return [...urls];
}

// Download one brand-site image, hash it, and store it as a monitored
// "image" brand asset. Skips silently on non-image/unreadable content —
// image extraction is best-effort enrichment, never a failure mode.
export const indexBrandImage = internalAction({
  args: { brandId: v.id("brands"), imageUrl: v.string() },
  handler: async (ctx, args) => {
    try {
      const got = await fetchAndHash(args.imageUrl);
      if (!got) return;
      const fileId = await ctx.storage.store(
        new Blob([got.bytes as unknown as BlobPart], { type: got.contentType }),
      );
      await ctx.runMutation(internal.images.attachBrandImage, {
        brandId: args.brandId,
        imageUrl: args.imageUrl,
        fileId,
        imageHash: got.hash,
      });
    } catch (e) {
      console.error("indexBrandImage failed:", e instanceof Error ? e.message : String(e));
    }
  },
});

export const attachBrandImage = internalMutation({
  args: {
    brandId: v.id("brands"),
    imageUrl: v.string(),
    fileId: v.string(),
    imageHash: v.string(),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get("brands", args.brandId);
    if (!brand) return;
    // Dedupe by source URL — crawls and manual extractions can overlap.
    const existing = await ctx.db
      .query("brandAssets")
      .withIndex("by_brand_type", (q) => q.eq("brandId", args.brandId).eq("type", "image"))
      .collect();
    if (
      existing.some(
        (a) => a.sourceUrl === args.imageUrl || a.imageHash === args.imageHash,
      )
    )
      return;
    const name = args.imageUrl.split("/").pop()?.split("?")[0] || args.imageUrl;
    await ctx.db.insert("brandAssets", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      type: "image",
      title: name.slice(0, 120),
      sourceUrl: args.imageUrl,
      fileId: args.fileId,
      imageHash: args.imageHash,
      status: "active",
      monitorEnabled: true,
    });
  },
});

// Scrape the suspect page's image list, hash each candidate, and compare
// against the brand's monitored image hashes. The best pair is recorded on
// the discovery with the suspect image stored for side-by-side display.
export const scoreSuspectImages = internalAction({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = (await ctx.runQuery(internal.discoveries.getById, {
      discoveryId: args.discoveryId,
    })) as Doc<"discoveries"> | null;
    if (!discovery) return;

    // System-side provider gate — this action makes paid Firecrawl calls.
    await assertOrgProviderEnabled(ctx, discovery.organizationId);

    const brandImages = (await ctx.runQuery(internal.images.listBrandImages, {
      brandId: discovery.brandId,
    })) as Doc<"brandAssets">[];
    const hashes = brandImages.filter((a) => a.imageHash);
    if (hashes.length === 0) return; // nothing to compare against yet

    let imageUrls: string[] = [];
    try {
      const scraped = await firecrawl.scrape(ctx, discovery.canonicalUrl, {
        formats: ["images"],
        onlyMainContent: false,
      });
      imageUrls = (scraped.images ?? []).slice(0, MAX_SUSPECT_IMAGES);
    } catch {
      return;
    }

    let best: { score: number; assetId: Doc<"brandAssets">["_id"]; fileId?: string } | null = null;
    for (const url of imageUrls) {
      try {
        const got = await fetchAndHash(url);
        if (!got) continue;
        for (const asset of hashes) {
          const score = similarity(got.hash, asset.imageHash!);
          if (score > (best?.score ?? -1)) {
            best = { score, assetId: asset._id };
            if (score >= MATCH_FLOOR) {
              best.fileId = await ctx.storage.store(
                new Blob([got.bytes as unknown as BlobPart], {
                  type: got.contentType || "image/jpeg",
                }),
              );
            }
          }
        }
      } catch {
        // Individual image failures don't stop the scan.
      }
    }
    if (!best) return;

    await ctx.runMutation(internal.discoveries.setVisualMatch, {
      discoveryId: args.discoveryId,
      visualMatchScore: Math.round(best.score * 1000) / 1000,
      matchedAssetId: best.score >= MATCH_FLOOR ? best.assetId : undefined,
      suspectImageFileId: best.score >= MATCH_FLOOR ? best.fileId : undefined,
    });

    // Re-score with the fresh visual match, then join the offender graph
    // (shared stolen assets link different hosts to one operation).
    await ctx.scheduler.runAfter(0, internal.cloneScore.compute, {
      discoveryId: args.discoveryId,
    });
    await ctx.scheduler.runAfter(0, internal.offenders.upsertForDiscovery, {
      discoveryId: args.discoveryId,
    });
    await ctx.scheduler.runAfter(0, internal.offenders.linkSharedAssets, {
      discoveryId: args.discoveryId,
    });

    // High-confidence image theft → alert workspace members via AgentMail.
    if (best.score >= 0.8) {
      await ctx.scheduler.runAfter(0, internal.mailAlerts.notifyDiscovery, {
        discoveryId: args.discoveryId,
        reason: "visual_match",
      });
    }
  },
});

// Hash an image that was manually uploaded to Convex storage — the bytes
// are already in storage, so this reads the blob directly and attaches the
// hash to the asset row.
export const indexUploadedImage = internalAction({
  args: { assetId: v.id("brandAssets"), fileId: v.string() },
  handler: async (ctx, args) => {
    try {
      const blob = await ctx.storage.get(args.fileId as Id<"_storage">);
      if (!blob) return;
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const hash = hashBytes(bytes, blob.type || undefined);
      if (!hash) return;
      await ctx.runMutation(internal.images.attachImageHash, {
        assetId: args.assetId,
        imageHash: hash,
      });
    } catch (e) {
      console.error("indexUploadedImage failed:", e instanceof Error ? e.message : String(e));
    }
  },
});

export const attachImageHash = internalMutation({
  args: { assetId: v.id("brandAssets"), imageHash: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("brandAssets", args.assetId, { imageHash: args.imageHash });
  },
});

export const listBrandImages = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandAssets")
      .withIndex("by_brand_type", (q) => q.eq("brandId", args.brandId).eq("type", "image"))
      .collect();
  },
});
