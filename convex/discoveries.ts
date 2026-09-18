import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { listOrganizationIds, requireBrandAccess, requireDiscoveryAccess } from "./lib/authz";
import { guessPlatform, hostOf } from "./lib/platform";
import type { Doc, Id } from "./_generated/dataModel";

const INBOX_LIMIT = 300;

type ReviewAction = "approve" | "dismiss" | "watchlist" | "allow" | "reopen";

const ACTION_STATUS: Record<ReviewAction, string> = {
  approve: "approved",
  dismiss: "dismissed",
  watchlist: "watchlisted",
  allow: "allowed",
  reopen: "needs_review",
};

const ACTION_EVENT: Record<ReviewAction, string> = {
  approve: "discovery_approved",
  dismiss: "discovery_dismissed",
  watchlist: "discovery_watchlisted",
  allow: "discovery_allowed",
  reopen: "discovery_reopened",
};

async function applyReview(
  ctx: MutationCtx,
  discovery: Doc<"discoveries">,
  action: ReviewAction,
  actorId: string,
  reason?: string,
) {
  const status = ACTION_STATUS[action];
  await ctx.db.patch("discoveries", discovery._id, {
    status,
    reviewedBy: actorId,
    reviewedAt: Date.now(),
    denialReason: action === "dismiss" ? reason : undefined,
  });

  if (action === "watchlist") {
    const existing = await ctx.db
      .query("hydraWatches")
      .withIndex("by_discovery", (q) => q.eq("discoveryId", discovery._id))
      .first();
    if (!existing) {
      await ctx.db.insert("hydraWatches", {
        organizationId: discovery.organizationId,
        brandId: discovery.brandId,
        discoveryId: discovery._id,
        fingerprint: { url: discovery.canonicalUrl, kind: "watchlist" },
        enabled: true,
      });
    }
  }

  if (action === "allow") {
    const brand = await ctx.db.get("brands", discovery.brandId);
    if (brand) {
      const host = hostOf(discovery.canonicalUrl).toLowerCase();
      const current = new Set(brand.allowlist ?? []);
      if (host && !current.has(host)) {
        current.add(host);
        await ctx.db.patch("brands", brand._id, { allowlist: [...current] });
      }
    }
  }

  await ctx.db.insert("auditEvents", {
    organizationId: discovery.organizationId,
    brandId: discovery.brandId,
    actorType: "user",
    actorId,
    eventType: ACTION_EVENT[action],
    entityType: "discovery",
    entityId: discovery._id,
    timestamp: Date.now(),
    metadataSafe: { url: discovery.canonicalUrl, ...(reason ? { reason } : {}) },
  });

  return status;
}

export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const discoveries: any[] = [];
    for (const orgId of organizationIds) {
      const orgDiscoveries = await ctx.db
        .query("discoveries")
        .withIndex("by_org_status", (q) =>
          q.eq("organizationId", orgId).eq("status", args.status),
        )
        .collect();
      discoveries.push(...orgDiscoveries);
    }
    return discoveries;
  },
});

export const listForInbox = query({
  args: {
    status: v.optional(v.string()),
    brandId: v.optional(v.id("brands")),
  },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const all: Doc<"discoveries">[] = [];
    for (const orgId of organizationIds) {
      const rows = await ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      all.push(...rows);
    }
    const rows = all
      .filter((d) => (!args.brandId || d.brandId === args.brandId) && (!args.status || d.status === args.status))
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, INBOX_LIMIT);

    // Resolve storage URLs for visual-match pairs so cards can render the
    // real brand image next to the suspect's copy.
    return await Promise.all(
      rows.map(async (d) => {
        let matchedAssetUrl: string | null = null;
        if (d.matchedAssetId) {
          const asset = await ctx.db.get("brandAssets", d.matchedAssetId);
          if (asset?.fileId) {
            matchedAssetUrl = await ctx.storage.getUrl(asset.fileId as Id<"_storage">);
          }
        }
        return {
          ...d,
          suspectImageUrl: d.suspectImageFileId
            ? await ctx.storage.getUrl(d.suspectImageFileId as Id<"_storage">)
            : null,
          matchedAssetUrl,
        };
      }),
    );
  },
});

export const countsByStatus = query({
  args: { brandId: v.optional(v.id("brands")) },
  handler: async (ctx, args) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const counts: Record<string, number> = {};
    for (const orgId of organizationIds) {
      const rows = await ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", orgId))
        .collect();
      for (const d of rows) {
        if (args.brandId && d.brandId !== args.brandId) continue;
        counts[d.status] = (counts[d.status] ?? 0) + 1;
      }
    }
    return counts;
  },
});

export const review = mutation({
  args: {
    discoveryId: v.id("discoveries"),
    action: v.union(
      v.literal("approve"),
      v.literal("dismiss"),
      v.literal("watchlist"),
      v.literal("allow"),
      v.literal("reopen"),
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { discovery, identity } = await requireDiscoveryAccess(ctx, args.discoveryId);
    const status = await applyReview(ctx, discovery, args.action, identity.subject, args.reason);
    return { status };
  },
});

export const bulkReview = mutation({
  args: {
    discoveryIds: v.array(v.id("discoveries")),
    action: v.union(
      v.literal("approve"),
      v.literal("dismiss"),
      v.literal("watchlist"),
      v.literal("allow"),
      v.literal("reopen"),
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Array<{ discoveryId: Id<"discoveries">; status?: string; error?: string }> = [];
    for (const discoveryId of args.discoveryIds.slice(0, 100)) {
      try {
        const { discovery, identity } = await requireDiscoveryAccess(ctx, discoveryId);
        const status = await applyReview(ctx, discovery, args.action, identity.subject, args.reason);
        results.push({ discoveryId, status });
      } catch (e) {
        results.push({ discoveryId, error: e instanceof Error ? e.message : "failed" });
      }
    }
    return results;
  },
});

export const createManual = mutation({
  args: {
    brandId: v.id("brands"),
    url: v.string(),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { brand, identity } = await requireBrandAccess(ctx, args.brandId);

    let normalized = args.url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      new URL(normalized);
    } catch {
      throw new Error("Invalid URL");
    }

    const existing = await ctx.db
      .query("discoveries")
      .withIndex("by_url", (q) => q.eq("canonicalUrl", normalized))
      .first();
    if (existing && existing.organizationId === brand.organizationId) {
      return { discoveryId: existing._id, existed: true };
    }

    const discoveryId = await ctx.db.insert("discoveries", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      canonicalUrl: normalized,
      title: args.title?.trim() || hostOf(normalized),
      status: "needs_review",
      severity: args.severity,
      summary: args.note,
      platformGuess: guessPlatform(normalized),
      source: "manual",
    });

    await ctx.db.insert("auditEvents", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "discovery_created_manual",
      entityType: "discovery",
      entityId: discoveryId,
      timestamp: Date.now(),
      metadataSafe: { url: normalized },
    });

    return { discoveryId, existed: false };
  },
});

export const update = mutation({
  args: {
    discoveryId: v.id("discoveries"),
    priority: v.optional(v.string()),
    severity: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireDiscoveryAccess(ctx, args.discoveryId);
    const patch: Record<string, string> = {};
    if (args.priority !== undefined) patch.priority = args.priority;
    if (args.severity !== undefined) patch.severity = args.severity;
    if (args.summary !== undefined) patch.summary = args.summary;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("discoveries", args.discoveryId, patch);
    }
  },
});

export const get = query({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const { discovery } = await requireDiscoveryAccess(ctx, args.discoveryId);
    return discovery;
  },
});

export const listByBrandStatus = query({
  args: {
    brandId: v.id("brands"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    const all = await ctx.db
      .query("discoveries")
      .withIndex("by_brand_status", (q) =>
        q.eq("brandId", args.brandId).eq("status", args.status),
      )
      .collect();
    return all.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getById = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    return await ctx.db.get("discoveries", args.discoveryId);
  },
});

export const getByUrl = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    canonicalUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const hit = await ctx.db
      .query("discoveries")
      .withIndex("by_url", (q) => q.eq("canonicalUrl", args.canonicalUrl))
      .first();
    return hit && hit.organizationId === args.organizationId ? hit : null;
  },
});

export const createFromPatrol = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    runId: v.optional(v.id("patrolRuns")),
    canonicalUrl: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    status: v.string(),
    platformGuess: v.optional(v.string()),
    source: v.optional(v.string()),
    matchedQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const discoveryId = await ctx.db.insert("discoveries", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      patrolRunId: args.runId,
      canonicalUrl: args.canonicalUrl,
      title: args.title,
      summary: args.summary,
      status: args.status,
      platformGuess: args.platformGuess,
      source: args.source,
      matchedQuery: args.matchedQuery,
    });
    // Attribute the hit to the keyword that produced it — powers the
    // per-term performance stats on the keywords page.
    if (args.matchedQuery) {
      const norm = args.matchedQuery.trim().replace(/\s+/g, " ").toLowerCase();
      const rows = await ctx.db
        .query("brandKeywords")
        .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
        .collect();
      const kw = rows.find(
        (k) => k.term.trim().replace(/\s+/g, " ").toLowerCase() === norm,
      );
      if (kw) {
        await ctx.db.patch("brandKeywords", kw._id, {
          hits: (kw.hits ?? 0) + 1,
        });
      }
    }
    return { discoveryId };
  },
});

export const setVisualMatch = internalMutation({
  args: {
    discoveryId: v.id("discoveries"),
    visualMatchScore: v.number(),
    matchedAssetId: v.optional(v.id("brandAssets")),
    suspectImageFileId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("discoveries", args.discoveryId, {
      visualMatchScore: args.visualMatchScore,
      matchedAssetId: args.matchedAssetId,
      suspectImageFileId: args.suspectImageFileId,
    });
  },
});

export const updateAnalysis = internalMutation({
  args: {
    discoveryId: v.id("discoveries"),
    summary: v.string(),
    matchConfidence: v.number(),
    identityRisk: v.number(),
    authorizationRisk: v.number(),
    severity: v.string(),
    similarityScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("discoveries", args.discoveryId, {
      summary: args.summary,
      matchConfidence: args.matchConfidence,
      identityRisk: args.identityRisk,
      authorizationRisk: args.authorizationRisk,
      severity: args.severity,
      similarityScore: args.similarityScore,
    });
  },
});
