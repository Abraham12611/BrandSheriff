/**
 * Offender Graph — groups discoveries that probably belong to one operation.
 *
 * v1 links discoveries sharing a host (the offender "entity" is the host
 * operation). Links record WHY they were connected (same_host, shared_image)
 * so the graph stays explainable. Scheduled when discoveries are created or
 * their visual match lands.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { requireOrganizationMembership, MEMBER_ROLES } from "./lib/authz";

function hostOf(url?: string): string {
  try {
    return new URL(url ?? "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Upsert an offender entity for a discovery and link it. Idempotent per
 * (offender, discovery). Call after cloneScore.compute so maxCloneScore
 * reflects the freshest score. */
export const upsertForDiscovery = internalMutation({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery) return { linked: false };
    const host = hostOf(discovery.canonicalUrl);
    if (!host) return { linked: false };

    const now = Date.now();
    let offender = await ctx.db
      .query("offenders")
      .withIndex("by_org_label", (q) =>
        q.eq("organizationId", discovery.organizationId).eq("label", host),
      )
      .first();

    if (!offender) {
      const offenderId = await ctx.db.insert("offenders", {
        organizationId: discovery.organizationId,
        brandId: discovery.brandId,
        label: host,
        status: "suspected",
        firstSeenAt: now,
        lastSeenAt: now,
        maxCloneScore: discovery.cloneScore,
      });
      offender = await ctx.db.get("offenders", offenderId);
    } else {
      await ctx.db.patch("offenders", offender._id, {
        lastSeenAt: now,
        maxCloneScore: Math.max(
          offender.maxCloneScore ?? 0,
          discovery.cloneScore ?? 0,
        ),
      });
    }
    if (!offender) return { linked: false };

    const existing = await ctx.db
      .query("offenderLinks")
      .withIndex("by_offender_discovery", (q) =>
        q.eq("offenderId", offender._id).eq("discoveryId", args.discoveryId),
      )
      .first();
    if (!existing) {
      await ctx.db.insert("offenderLinks", {
        organizationId: discovery.organizationId,
        offenderId: offender._id,
        discoveryId: args.discoveryId,
        matchType: "same_host",
        createdAt: now,
      });
    }
    if (discovery.offenderId !== offender._id) {
      await ctx.db.patch("discoveries", args.discoveryId, {
        offenderId: offender._id,
      });
    }
    return { linked: true, offenderId: offender._id };
  },
});

/** Cross-link discoveries that share a matched brand asset — different hosts
 * re-hosting the same stolen image is a strong same-operator hint. */
export const linkSharedAssets = internalMutation({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = await ctx.db.get(args.discoveryId);
    if (!discovery?.matchedAssetId || !discovery.offenderId) return { linked: 0 };
    const peers = await ctx.db
      .query("discoveries")
      .withIndex("by_org", (q) => q.eq("organizationId", discovery.organizationId))
      .collect();
    let linked = 0;
    const now = Date.now();
    const myOffender = discovery.offenderId;
    for (const peer of peers) {
      const peerOffender = peer.offenderId;
      if (
        peer._id === args.discoveryId ||
        peer.matchedAssetId !== discovery.matchedAssetId ||
        !peerOffender ||
        peerOffender === myOffender
      ) {
        continue;
      }
      const existing = await ctx.db
        .query("offenderLinks")
        .withIndex("by_offender_discovery", (q) =>
          q.eq("offenderId", peerOffender).eq("discoveryId", args.discoveryId),
        )
        .first();
      if (!existing) {
        await ctx.db.insert("offenderLinks", {
          organizationId: discovery.organizationId,
          offenderId: peerOffender,
          discoveryId: args.discoveryId,
          matchType: "shared_image",
          createdAt: now,
        });
        linked++;
      }
      const backlink = await ctx.db
        .query("offenderLinks")
        .withIndex("by_offender_discovery", (q) =>
          q.eq("offenderId", myOffender).eq("discoveryId", peer._id),
        )
        .first();
      if (!backlink) {
        await ctx.db.insert("offenderLinks", {
          organizationId: discovery.organizationId,
          offenderId: myOffender,
          discoveryId: peer._id,
          matchType: "shared_image",
          createdAt: now,
        });
        linked++;
      }
    }
    return { linked };
  },
});

export const listForOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const offenders = await ctx.db
      .query("offenders")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const out = [];
    for (const o of offenders) {
      const links = await ctx.db
        .query("offenderLinks")
        .withIndex("by_offender", (q) => q.eq("offenderId", o._id))
        .collect();
      const hosts = new Set<string>();
      for (const l of links) {
        const d = await ctx.db.get(l.discoveryId);
        if (d) hosts.add(hostOf(d.canonicalUrl));
      }
      out.push({
        ...o,
        discoveryCount: links.length,
        hosts: [...hosts],
        matchTypes: [...new Set(links.map((l: any) => l.matchType))],
      });
    }
    return out.sort(
      (a, b) => (b.maxCloneScore ?? 0) - (a.maxCloneScore ?? 0),
    );
  },
});

export const get = query({
  args: { offenderId: v.id("offenders"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const offender = await ctx.db.get(args.offenderId);
    if (!offender || offender.organizationId !== args.organizationId) {
      throw new Error("Offender not found");
    }
    const links = await ctx.db
      .query("offenderLinks")
      .withIndex("by_offender", (q) => q.eq("offenderId", args.offenderId))
      .collect();
    const discoveries = [];
    for (const l of links) {
      const d = await ctx.db.get(l.discoveryId);
      if (d) discoveries.push({ ...d, matchType: l.matchType });
    }
    const cases = await ctx.db
      .query("cases")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const discoveryCase = new Map(
      cases.filter((c) => c.discoveryId).map((c) => [c.discoveryId, c]),
    );
    return {
      offender,
      discoveries,
      relatedCases: discoveries
        .map((d) => discoveryCase.get(d._id))
        .filter(Boolean),
    };
  },
});

export const setStatus = internalMutation({
  args: { offenderId: v.id("offenders"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("offenders", args.offenderId, { status: args.status });
  },
});

export const listForDiscoveryInternal = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("offenderLinks")
      .withIndex("by_discovery", (q) => q.eq("discoveryId", args.discoveryId))
      .collect();
  },
});
