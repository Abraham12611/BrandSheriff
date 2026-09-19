import { v, ConvexError } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { Doc, Id } from "./_generated/dataModel";
import { guessPlatform } from "./lib/platform";

const firecrawl = new FirecrawlClient(components.firecrawl);

// Controlled demo storefronts under public/demo/ — real pages the real
// pipeline crawls. Nothing downstream of the seed is simulated.
const DEMO_PAGES = [
  { key: "clone", title: "Northstar Atelier — Premium Travel Accessories" },
  { key: "hydra", title: "Northstar gear — outlet deals" },
  { key: "editorial", title: "Field notes: the Northstar carry-on reviewed" },
  { key: "authorized", title: "Northstar Atelier — authorized retail partner" },
] as const;

const DEMO_IMAGES = [
  "carryon",
  "cubes",
  "duffel",
  "pouch",
  "sling",
  "wallet",
] as const;

function assertSeedToken(token: string) {
  const expected = env.DEMO_SEED_TOKEN;
  if (!expected || token !== expected) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Invalid or missing demo seed token.",
    });
  }
}

// Public entrypoint — one call seeds the showcase workspace and kicks off
// the real crawl → ingest → score → route → packet pipeline. Gated by the
// DEMO_SEED_TOKEN deployment env var; exists so judges see live data.
export const seed = action({
  args: { token: v.string(), demoBaseUrl: v.string() },
  handler: async (ctx, args) => {
    assertSeedToken(args.token);
    const base = args.demoBaseUrl.replace(/\/$/, "");

    const rows = (await ctx.runMutation(internal.demoShowcase.insertSeedRows, {
      demoBaseUrl: base,
    })) as {
      organizationId: Id<"organizations">;
      brandId: Id<"brands">;
      caseId: Id<"cases">;
      discoveryIds: Id<"discoveries">[];
    };

    // Real Firecrawl crawl of the controlled official storefront. When it
    // finishes, afterCrawl ingests pages into the DNA library and runs the
    // rest of the pipeline.
    const { crawlId } = await firecrawl.startCrawl(ctx, {
      url: `${base}/demo/northstar/index.html`,
      options: {
        limit: 10,
        deduplicateSimilarURLs: true,
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      },
      storeContent: true,
      onComplete: internal.demoShowcase.afterCrawl,
      context: rows,
    });

    return { started: true, crawlId, ...rows };
  },
});

// Idempotent row seed: wipes prior demo data on the showcase org, then
// inserts brand, suspect-page discoveries, a case, and rights records.
// Everything after this point is produced by the real processing path.
export const insertSeedRows = internalMutation({
  args: { demoBaseUrl: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_public_demo", (q) => q.eq("isPublicDemo", true))
      .first();

    if (org) {
      // Re-seed clean: cascade-delete everything the last run produced.
      // Tables without an org index are removed through their parents.
      const oldCases = await ctx.db
        .query("cases")
        .withIndex("by_org", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const c of oldCases) {
        for (const [table, index] of [
          ["enforcementActions", "by_case"],
          ["draftNotices", "by_case"],
          ["evidenceItems", "by_case"],
        ] as const) {
          const rows = await ctx.db
            .query(table)
            .withIndex(index, (q) => q.eq("caseId", c._id))
            .collect();
          for (const r of rows) await ctx.db.delete(r._id);
        }
        await ctx.db.delete(c._id);
      }

      const oldDiscoveries = await ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const d of oldDiscoveries) {
        for (const [table, index] of [
          ["cloneSignals", "by_discovery"],
          ["offenderLinks", "by_discovery"],
          ["evidenceItems", "by_discovery"],
        ] as const) {
          const rows = await ctx.db
            .query(table)
            .withIndex(index, (q) => q.eq("discoveryId", d._id))
            .collect();
          for (const r of rows) await ctx.db.delete(r._id);
        }
        await ctx.db.delete(d._id);
      }

      const oldOffenders = await ctx.db
        .query("offenders")
        .withIndex("by_org", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const o of oldOffenders) {
        const links = await ctx.db
          .query("offenderLinks")
          .withIndex("by_offender", (q) => q.eq("offenderId", o._id))
          .collect();
        for (const l of links) await ctx.db.delete(l._id);
        await ctx.db.delete(o._id);
      }

      const oldRights = await ctx.db
        .query("rightsObjects")
        .withIndex("by_org_kind", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const r of oldRights) await ctx.db.delete(r._id);

      const oldNotifs = await ctx.db
        .query("notifications")
        .withIndex("by_org", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const n of oldNotifs) await ctx.db.delete(n._id);

      const oldAudits = await ctx.db
        .query("auditEvents")
        .withIndex("by_org_time", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const a of oldAudits) await ctx.db.delete(a._id);

      const oldBrands = await ctx.db
        .query("brands")
        .withIndex("by_org", (q) => q.eq("organizationId", org!._id))
        .collect();
      for (const b of oldBrands) {
        const assets = await ctx.db
          .query("brandAssets")
          .withIndex("by_brand", (q) => q.eq("brandId", b._id))
          .collect();
        for (const r of assets) await ctx.db.delete(r._id);
        const patrols = await ctx.db
          .query("patrols")
          .withIndex("by_brand", (q) => q.eq("brandId", b._id))
          .collect();
        for (const r of patrols) await ctx.db.delete(r._id);
        const runs = await ctx.db
          .query("patrolRuns")
          .withIndex("by_brand_status", (q) => q.eq("brandId", b._id))
          .collect();
        for (const r of runs) await ctx.db.delete(r._id);
        await ctx.db.delete(b._id);
      }
      await ctx.db.patch(org._id, { defaultBrandId: undefined });
    } else {
      org = await ctx.db
        .query("organizations")
        .withIndex("by_slug", (q) => q.eq("slug", "demo-showcase"))
        .first();
      if (org) {
        await ctx.db.patch(org._id, {
          isPublicDemo: true,
          settings: { ...(org.settings ?? {}), providerActionsEnabled: true },
        });
      } else {
        const organizationId = await ctx.db.insert("organizations", {
          name: "Northstar Demo Workspace",
          slug: "demo-showcase",
          ownerUserId: "demo-seed",
          plan: "demo",
          isPublicDemo: true,
          settings: { providerActionsEnabled: true },
          createdAt: now,
        });
        org = (await ctx.db.get(organizationId))!;
      }
    }

    const organizationId = org._id;
    const northstarUrl = `${args.demoBaseUrl}/demo/northstar/index.html`;

    const brandId = await ctx.db.insert("brands", {
      organizationId,
      name: "Northstar Atelier",
      canonicalDomain: northstarUrl,
      description: "Premium travel accessories — carry-ons, duffels, slings",
      status: "active",
      brandDnaStatus: "pending",
    });
    await ctx.db.patch(organizationId, { defaultBrandId: brandId });

    const discoveryIds: Id<"discoveries">[] = [];
    for (const page of DEMO_PAGES) {
      const url = `${args.demoBaseUrl}/demo/${page.key}/index.html`;
      discoveryIds.push(
        await ctx.db.insert("discoveries", {
          organizationId,
          brandId,
          canonicalUrl: url,
          title: page.title,
          status: "needs_review",
          platformGuess: guessPlatform(url),
          source: "patrol",
          matchedQuery: "northstar atelier",
        }),
      );
    }

    const cloneId = discoveryIds[0];
    const caseId = await ctx.db.insert("cases", {
      organizationId,
      brandId,
      discoveryId: cloneId,
      caseNumber: "BS-1000",
      title: "Suspected clone storefront copying Northstar Atelier",
      state: "active",
      severity: "high",
      summary:
        "A lookalike storefront appears to reproduce Northstar product imagery, copy and pricing without authorization.",
      primaryThreatType: "suspected_infringement",
    });
    await ctx.db.patch(cloneId, { status: "case_created" });

    for (const right of [
      {
        kind: "trademark",
        label: "NORTHSTAR ATELIER word mark",
        value: "pending application",
        territory: "US",
        status: "pending",
      },
      {
        kind: "domain",
        label: "Official storefront",
        value: northstarUrl,
        territory: "global",
        status: "active",
      },
      {
        kind: "official_account",
        label: "@northstaratelier",
        value: "instagram",
        territory: "global",
        status: "verified",
      },
    ]) {
      await ctx.db.insert("rightsObjects", {
        organizationId,
        brandId,
        createdAt: now,
        updatedAt: now,
        ...right,
      });
    }

    return {
      organizationId,
      brandId,
      caseId,
      discoveryIds,
      demoBaseUrl: args.demoBaseUrl,
    };
  },
});

// Re-run scoring on seeded discoveries — e.g. after image indexing settled.
// Same gate as seed.
export const rescore = action({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    assertSeedToken(args.token);
    const org = (await ctx.runQuery(internal.demoShowcase.getDemoOrg, {})) as {
      organizationId: Id<"organizations">;
      brandId: Id<"brands">;
      demoBaseUrl: string | null;
      discoveryIds: Id<"discoveries">[];
    } | null;
    if (!org) throw new Error("No showcase workspace seeded");
    if (org.demoBaseUrl) {
      for (const name of DEMO_IMAGES) {
        try {
          await ctx.runAction(internal.images.indexBrandImage, {
            brandId: org.brandId,
            imageUrl: `${org.demoBaseUrl}/demo/northstar/img/${name}.jpg`,
          });
        } catch (e) {
          console.error("rescore image indexing failed", name, e);
        }
      }
    }
    for (const discoveryId of org.discoveryIds) {
      try {
        await ctx.runAction(internal.images.scoreSuspectImages, { discoveryId });
        await ctx.runAction(internal.cloneScore.compute, { discoveryId });
        await ctx.runMutation(internal.offenders.upsertForDiscovery, {
          discoveryId,
        });
        await ctx.runMutation(internal.offenders.linkSharedAssets, {
          discoveryId,
        });
      } catch (e) {
        console.error("rescore failed", discoveryId, e);
      }
    }
    return { rescored: org.discoveryIds.length };
  },
});

export const getDemoOrg = internalQuery({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_public_demo", (q) => q.eq("isPublicDemo", true))
      .first();
    if (!org) return null;
    const discoveries = await ctx.db
      .query("discoveries")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
    const brand = org.defaultBrandId ? await ctx.db.get(org.defaultBrandId) : null;
    return {
      organizationId: org._id,
      brandId: brand?._id,
      demoBaseUrl: brand
        ? brand.canonicalDomain.replace(/\/demo\/northstar\/index\.html$/, "")
        : null,
      discoveryIds: discoveries.map((d) => d._id),
    };
  },
});

// Component crawl-completion hook — mirrors brandDna.onCrawlComplete but
// also kicks off the showcase pipeline once the DNA library is ingested.
export const afterCrawl = internalMutation({
  args: {
    crawlId: v.string(),
    jobId: v.optional(v.string()),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    pageCount: v.number(),
    unstored: v.optional(v.number()),
    error: v.optional(v.string()),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const context = args.context as
      | {
          organizationId: Id<"organizations">;
          brandId: Id<"brands">;
          caseId: Id<"cases">;
          discoveryIds: Id<"discoveries">[];
          demoBaseUrl: string;
        }
      | undefined;
    if (!context?.brandId || args.status !== "completed") return;

    await ctx.scheduler.runAfter(0, internal.brandDna.ingestCrawl, {
      crawlId: args.crawlId,
      brandId: context.brandId,
    });
    // Ingest + image hashing need a couple of minutes; the pipeline waits,
    // then every discovery goes through the real processing path.
    await ctx.scheduler.runAfter(120_000, internal.demoShowcase.pipeline, context);
  },
});

// Real pipeline — every step is the production code path against real
// crawled data. Individual failures are logged, never fatal to the rest.
export const pipeline = internalAction({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    caseId: v.id("cases"),
    discoveryIds: v.array(v.id("discoveries")),
    demoBaseUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Index the brand's own imagery through the production hashing path —
    // crawl-ingest only finds images embedded in markdown, which sparse
    // HTML fixtures don't reliably carry.
    if (args.demoBaseUrl) {
      for (const name of DEMO_IMAGES) {
        try {
          await ctx.runAction(internal.images.indexBrandImage, {
            brandId: args.brandId,
            imageUrl: `${args.demoBaseUrl}/demo/northstar/img/${name}.jpg`,
          });
        } catch (e) {
          console.error("pipeline image indexing failed", name, e);
        }
      }
    }

    for (const discoveryId of args.discoveryIds) {
      try {
        await ctx.runAction(internal.forensics.investigateDiscoveryInternal, {
          discoveryId,
        });
      } catch (e) {
        console.error("pipeline investigate failed", discoveryId, e);
      }
      try {
        await ctx.runAction(internal.images.scoreSuspectImages, { discoveryId });
      } catch (e) {
        console.error("pipeline image scoring failed", discoveryId, e);
      }
      try {
        await ctx.runAction(internal.cloneScore.compute, { discoveryId });
      } catch (e) {
        console.error("pipeline cloneScore failed", discoveryId, e);
      }
      try {
        await ctx.runMutation(internal.offenders.upsertForDiscovery, {
          discoveryId,
        });
        await ctx.runMutation(internal.offenders.linkSharedAssets, {
          discoveryId,
        });
      } catch (e) {
        console.error("pipeline offender linking failed", discoveryId, e);
      }
    }

    try {
      await ctx.runMutation(internal.enforcementRoutes.ensureForCaseInternal, {
        caseId: args.caseId,
        organizationId: args.organizationId,
      });
      const actions = await ctx.runQuery(
        internal.enforcementRoutes.listForCaseInternal,
        { caseId: args.caseId },
      );
      for (const a of (actions as Doc<"enforcementActions">[]).slice(0, 6)) {
        try {
          await ctx.runAction(
            internal.enforcementRoutes.generatePacketInternal,
            { actionId: a._id },
          );
        } catch (e) {
          console.error("pipeline packet generation failed", a._id, e);
        }
      }
    } catch (e) {
      console.error("pipeline enforcement routing failed", e);
    }

    return { done: true };
  },
});

// Read-only public aggregate for /showcase. Everything below is hard-scoped
// to the single org flagged isPublicDemo — there is no way to address any
// other workspace through this query.
export const getShowcase = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_public_demo", (q) => q.eq("isPublicDemo", true))
      .first();
    if (!org) return null;

    const brand = org.defaultBrandId ? await ctx.db.get(org.defaultBrandId) : null;

    const discoveries = await ctx.db
      .query("discoveries")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
    discoveries.sort((a, b) => (b.cloneScore ?? 0) - (a.cloneScore ?? 0));

    const enriched = await Promise.all(
      discoveries.slice(0, 12).map(async (d) => {
        const signals = await ctx.db
          .query("cloneSignals")
          .withIndex("by_discovery", (q) => q.eq("discoveryId", d._id))
          .collect();
        const suspectImageUrl = d.suspectImageFileId
          ? await ctx.storage.getUrl(d.suspectImageFileId)
          : null;
        const asset = d.matchedAssetId ? await ctx.db.get(d.matchedAssetId) : null;
        const assetImageUrl = asset?.fileId
          ? await ctx.storage.getUrl(asset.fileId)
          : null;
        return {
          _id: d._id,
          canonicalUrl: d.canonicalUrl,
          title: d.title,
          status: d.status,
          severity: d.severity,
          summary: d.summary,
          matchConfidence: d.matchConfidence,
          authorizationRisk: d.authorizationRisk,
          platformGuess: d.platformGuess,
          visualMatchScore: d.visualMatchScore,
          cloneScore: d.cloneScore,
          matchedQuery: d.matchedQuery,
          source: d.source,
          suspectImageUrl,
          matchedAssetTitle: asset?.title ?? null,
          assetImageUrl,
          signals: signals
            .sort((a, b) => b.weight - a.weight)
            .map((s) => ({
              signal: s.signal,
              finding: s.finding,
              weight: s.weight,
              severity: s.severity,
            })),
        };
      }),
    );

    const cases = await ctx.db
      .query("cases")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
    const enrichedCases = await Promise.all(
      cases.slice(0, 6).map(async (c) => {
        const actions = await ctx.db
          .query("enforcementActions")
          .withIndex("by_case", (q) => q.eq("caseId", c._id))
          .collect();
        const discovery = c.discoveryId ? await ctx.db.get(c.discoveryId) : null;
        const drafts = await ctx.db
          .query("draftNotices")
          .withIndex("by_case", (q) => q.eq("caseId", c._id))
          .collect();
        return {
          _id: c._id,
          caseNumber: c.caseNumber,
          title: c.title,
          state: c.state,
          severity: c.severity,
          summary: c.summary,
          discoveryUrl: discovery?.canonicalUrl ?? null,
          actions: actions
            .sort((a, b) => a.route.localeCompare(b.route))
            .map((a) => ({
              _id: a._id,
              route: a.route,
              channel: a.channel,
              basis: a.basis,
              status: a.status,
              confidence: a.confidence,
              reason: a.reason,
              submissionUrl: a.submissionUrl,
              requiredFields: a.requiredFields,
            })),
          packets: drafts.slice(0, 2).map((d) => ({
            routeType: d.routeType,
            status: d.status,
            excerpt: (d.body ?? "").slice(0, 900),
          })),
        };
      }),
    );

    const offenders = await ctx.db
      .query("offenders")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();
    const enrichedOffenders = await Promise.all(
      offenders.slice(0, 8).map(async (o) => {
        const links = await ctx.db
          .query("offenderLinks")
          .withIndex("by_offender", (q) => q.eq("offenderId", o._id))
          .collect();
        return {
          _id: o._id,
          label: o.label,
          status: o.status,
          maxCloneScore: o.maxCloneScore,
          linkedDiscoveries: links.length,
          matchTypes: [...new Set(links.map((l) => l.matchType))],
        };
      }),
    );

    const rights = brand
      ? await ctx.db
          .query("rightsObjects")
          .withIndex("by_brand", (q) => q.eq("brandId", brand._id))
          .collect()
      : [];

    return {
      workspace: { name: org.name, mailboxAddress: org.mailboxAddress },
      brand: brand
        ? {
            name: brand.name,
            canonicalDomain: brand.canonicalDomain,
            description: brand.description,
            brandDnaStatus: brand.brandDnaStatus,
          }
        : null,
      stats: {
        discoveries: discoveries.length,
        cases: cases.length,
        enforcementActions: (
          await ctx.db
            .query("enforcementActions")
            .withIndex("by_org_status", (q) => q.eq("organizationId", org._id))
            .collect()
        ).length,
        offenders: offenders.length,
        rights: rights.length,
      },
      discoveries: enriched,
      cases: enrichedCases,
      offenders: enrichedOffenders,
      rights: rights.map((r) => ({
        kind: r.kind,
        label: r.label,
        value: r.value,
        territory: r.territory,
        status: r.status,
      })),
    };
  },
});
