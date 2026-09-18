/**
 * Clone Score — composite 0-100 risk score for a discovery, built from
 * explainable signal rows in `cloneSignals`.
 *
 * Every signal is a factual observation ("3 brand images re-hosted exactly",
 * "host follows brand+outlet impersonation pattern") with a weight — never a
 * legal conclusion. The score orders the review queue; a human still decides
 * what it means.
 */

import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
  action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireOrganizationMembership } from "./lib/authz";

interface Signal {
  signal: string;
  finding: string;
  weight: number;
  severity: "strong" | "medium" | "weak";
  detail?: Record<string, unknown>;
}

const IMPERSONATION_PATTERN =
  /official|outlet|sale|store|shop|clearance|discount|outlet|deal|cheap|wholesale/i;
const MARKETPLACE_HOSTS =
  /amazon\.|ebay\.|etsy\.|aliexpress\.|alibaba\.|temu\.|walmart\.|wish\.|dhgate\.|shopee\.|mercari\./i;
const SOCIAL_HOSTS =
  /facebook\.com|instagram\.com|fb\.me|tiktok\.com|twitter\.com|x\.com|pinterest\.|youtube\.|reddit\.com|snapchat\.|linkedin\.com/i;

function hostOf(url?: string): string {
  try {
    return new URL(url ?? "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Pure signal computation — unit-testable without a db. */
export function computeSignals(args: {
  discovery: {
    canonicalUrl?: string;
    visualMatchScore?: number;
    similarityScore?: number;
    matchedAssetId?: unknown;
    matchedQuery?: string;
    platformGuess?: string;
  };
  evidenceCount: number;
  relatedCount: number;
  brandAssetCount: number;
}): Signal[] {
  const { discovery, evidenceCount, relatedCount, brandAssetCount } = args;
  const host = hostOf(discovery.canonicalUrl);
  const signals: Signal[] = [];
  const visual = discovery.visualMatchScore ?? 0;
  const text = discovery.similarityScore ?? 0;

  if (visual >= 0.55) {
    const exact = visual >= 0.95;
    signals.push({
      signal: "product_image_match",
      finding: exact
        ? `Brand imagery re-hosted byte-similar (${Math.round(visual * 100)}% match)`
        : `Brand imagery visually similar (${Math.round(visual * 100)}% match)`,
      weight: Math.round(visual * 45),
      severity: exact ? "strong" : "medium",
      detail: { visualMatchScore: visual },
    });
  }

  if (discovery.matchedAssetId) {
    signals.push({
      signal: "brand_asset_match",
      finding: `Matched a fingerprinted brand asset in the vault`,
      weight: 15,
      severity: "strong",
      detail: { matchedAssetId: discovery.matchedAssetId },
    });
  }

  if (text >= 0.5) {
    signals.push({
      signal: "description_similarity",
      finding: `Page content ${Math.round(text * 100)}% similar to brand material`,
      weight: Math.round(text * 25),
      severity: text >= 0.8 ? "strong" : text >= 0.65 ? "medium" : "weak",
      detail: { similarityScore: text },
    });
  }

  if (IMPERSONATION_PATTERN.test(host)) {
    signals.push({
      signal: "domain_impersonation",
      finding: `Host "${host}" follows the brand+modifier pattern used by clone stores`,
      weight: 12,
      severity: "medium",
      detail: { host },
    });
  }

  if (relatedCount > 1) {
    signals.push({
      signal: "repeat_offender",
      finding: `${relatedCount} discoveries on this operator/host — probable repeat offender`,
      weight: Math.min(20, 8 + relatedCount * 3),
      severity: "strong",
      detail: { relatedCount },
    });
  }

  if (discovery.matchedQuery) {
    signals.push({
      signal: "keyword_attribution",
      finding: `Surfaced by monitored query "${discovery.matchedQuery}"`,
      weight: 5,
      severity: "weak",
      detail: { matchedQuery: discovery.matchedQuery },
    });
  }

  if (MARKETPLACE_HOSTS.test(host)) {
    signals.push({
      signal: "marketplace_listing",
      finding: `Listing on a monitored marketplace (${host})`,
      weight: 8,
      severity: "medium",
      detail: { host },
    });
  } else if (SOCIAL_HOSTS.test(host)) {
    signals.push({
      signal: "social_account",
      finding: `Content on a monitored social platform (${host})`,
      weight: 8,
      severity: "medium",
      detail: { host },
    });
  }

  if (evidenceCount > 0) {
    signals.push({
      signal: "evidence_strength",
      finding: `${evidenceCount} preserved evidence item${evidenceCount === 1 ? "" : "s"} attached`,
      weight: Math.min(10, evidenceCount * 2),
      severity: "weak",
      detail: { evidenceCount },
    });
  }

  if (brandAssetCount === 0 && signals.length > 0) {
    signals.push({
      signal: "coverage_gap",
      finding: "Brand has no fingerprinted assets — scoring relies on non-visual signals",
      weight: 0,
      severity: "weak",
      detail: {},
    });
  }

  return signals;
}

export function scoreFromSignals(signals: Signal[]): number {
  return Math.min(100, Math.round(signals.reduce((s, x) => s + x.weight, 0)));
}

export const getDiscoveryInternal = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => await ctx.db.get(args.discoveryId),
});

export const gatherInternal = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery) return null;
    const host = hostOf(discovery.canonicalUrl);
    const [evidence, brandAssets, related] = await Promise.all([
      ctx.db
        .query("evidenceItems")
        .withIndex("by_discovery", (q) => q.eq("discoveryId", args.discoveryId))
        .collect(),
      ctx.db
        .query("brandAssets")
        .withIndex("by_brand", (q) => q.eq("brandId", discovery.brandId))
        .collect(),
      ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", discovery.organizationId))
        .collect(),
    ]);
    return {
      discovery,
      evidenceCount: evidence.length,
      brandAssetCount: brandAssets.filter((a) => a.imageHash).length,
      relatedCount: host
        ? related.filter((d) => hostOf(d.canonicalUrl) === host).length
        : 0,
    };
  },
});

export const applyScore = internalMutation({
  args: {
    discoveryId: v.id("discoveries"),
    score: v.number(),
    signals: v.array(
      v.object({
        signal: v.string(),
        finding: v.string(),
        weight: v.number(),
        severity: v.string(),
        detail: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery) return;
    const old = await ctx.db
      .query("cloneSignals")
      .withIndex("by_discovery", (q) => q.eq("discoveryId", args.discoveryId))
      .collect();
    for (const s of old) await ctx.db.delete("cloneSignals", s._id);
    const now = Date.now();
    for (const s of args.signals) {
      await ctx.db.insert("cloneSignals", {
        organizationId: discovery.organizationId,
        discoveryId: args.discoveryId,
        signal: s.signal,
        finding: s.finding,
        weight: s.weight,
        severity: s.severity,
        detail: s.detail,
        computedAt: now,
      });
    }
    await ctx.db.patch("discoveries", args.discoveryId, {
      cloneScore: args.score,
      cloneScoreComputedAt: now,
    });
  },
});

/** Recompute a discovery's clone score — scheduled after scoring inputs land
 * (visual match, keyword attribution, evidence capture, offender linking). */
export const compute = internalAction({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args): Promise<any> => {
    const g: any = await ctx.runQuery(internal.cloneScore.gatherInternal, {
      discoveryId: args.discoveryId,
    });
    if (!g) return { ok: false };
    const signals = computeSignals(g);
    await ctx.runMutation(internal.cloneScore.applyScore, {
      discoveryId: args.discoveryId,
      score: scoreFromSignals(signals),
      signals,
    });
    return { ok: true, signals: signals.length };
  },
});

/** Manual recompute from the UI — member-gated, no provider calls needed
 * (pure signal re-evaluation over stored data). */
export const recompute = action({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args): Promise<any> => {
    const d: any = await ctx.runQuery(internal.cloneScore.getDiscoveryInternal, {
      discoveryId: args.discoveryId,
    });
    if (!d) throw new Error("Discovery not found");
    await ctx.runQuery(internal.authzActions.requireActiveMembership, {
      organizationId: d.organizationId,
    });
    return await ctx.runAction(internal.cloneScore.compute, {
      discoveryId: args.discoveryId,
    });
  },
});

/** Signal rows for a discovery — the explainable breakdown. */
export const listSignals = query({
  args: { discoveryId: v.id("discoveries"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    const d = await ctx.db.get(args.discoveryId);
    if (!d || d.organizationId !== args.organizationId) return [];
    return await ctx.db
      .query("cloneSignals")
      .withIndex("by_discovery", (q) => q.eq("discoveryId", args.discoveryId))
      .collect();
  },
});
