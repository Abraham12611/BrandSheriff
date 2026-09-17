import { v } from "convex/values";
import {
  action,
  internalAction,
  mutation,
  query,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { requireCaseAccess } from "./lib/authz";
import { assertOrgProviderEnabled, assertProviderActionsEnabled } from "./providerSafety";
import { guessPlatform } from "./lib/platform";
import type { Doc } from "./_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const startWatch = mutation({
  args: { caseId: v.id("cases"), brandId: v.id("brands"), fingerprint: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    if (c.brandId !== args.brandId) {
      throw new Error("Brand does not match case brand.");
    }
    // Watching provisions a paid monitor + paid searches — require opt-in.
    const org = await ctx.db.get("organizations", c.organizationId);
    if (!(org?.settings as { providerActionsEnabled?: boolean } | undefined)?.providerActionsEnabled) {
      throw new Error("Provider actions are not enabled for this workspace.");
    }
    const watchId = await ctx.db.insert("hydraWatches", {
      organizationId: c.organizationId,
      brandId: args.brandId,
      caseId: args.caseId,
      fingerprint: args.fingerprint ?? {},
      enabled: true,
      lastRunAt: Date.now(),
    });
    await ctx.db.patch(args.caseId, { state: "watching" });
    // Provision a real Firecrawl monitor on the suspect page — falls back
    // gracefully (monitorError) if provisioning fails; the cron sweep still runs.
    await ctx.scheduler.runAfter(0, internal.monitors.provision, { watchId });
  },
});

export const stopWatch = mutation({
  args: { caseId: v.id("cases"), watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    const watch = await ctx.db.get("hydraWatches", args.watchId);
    if (!watch || watch.organizationId !== c.organizationId) {
      throw new Error("Watch not found.");
    }
    await ctx.db.patch("hydraWatches", args.watchId, { enabled: false });
    if (watch.monitorId) {
      await ctx.scheduler.runAfter(0, internal.monitors.pause, { watchId: args.watchId });
    }
  },
});

async function performWatchSweep(
  ctx: GenericActionCtx<DataModel>,
  watch: Doc<"hydraWatches">,
) {
  const brand = (await ctx.runQuery(internal.brands.get, { brandId: watch.brandId })) as Doc<"brands"> | null;
  if (!brand) throw new Error("Brand not found");

  const queries = [brand.name, `${brand.name} sale`, `${brand.name} discount`];
  const foundUrls = new Set<string>();
  for (const query of queries.slice(0, 3)) {
    try {
      const result = await firecrawl.search(ctx, query, { limit: 10 });
      const data = (result as { web?: Array<{ url?: string }> }).web ?? [];
      for (const item of data) {
        if (item.url) foundUrls.add(item.url);
      }
    } catch (e) {
      console.error("Hydra search failed for", query, e);
    }
  }

  for (const url of foundUrls) {
    const existing = await ctx.runQuery(internal.discoveries.getByUrl, {
      organizationId: watch.organizationId,
      canonicalUrl: url,
    });
    if (existing) continue;
    await ctx.runMutation(internal.discoveries.createFromPatrol, {
      organizationId: watch.organizationId,
      brandId: watch.brandId,
      canonicalUrl: url,
      title: "Hydra reappearance",
      status: "needs_review",
      platformGuess: guessPlatform(url),
      source: "watch",
    });
  }

  await ctx.runMutation(internal.hydra.markRun, { watchId: watch._id });
  return { discovered: foundUrls.size };
}

export const runWatch = action({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = (await ctx.runQuery(internal.hydra.getById, { watchId: args.watchId })) as Doc<"hydraWatches"> | null;
    if (!watch) throw new Error("Watch not found");

    await assertProviderActionsEnabled(ctx, watch.organizationId);
    return await performWatchSweep(ctx, watch);
  },
});

// System-side entry for the cron sweep — same bug class as recheckTarget:
// no user identity exists in scheduled contexts, so the workspace's own
// provider flag is the gate.
export const runWatchSystem = internalAction({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = (await ctx.runQuery(internal.hydra.getById, { watchId: args.watchId })) as Doc<"hydraWatches"> | null;
    if (!watch || !watch.enabled) return { skipped: true };
    await assertOrgProviderEnabled(ctx, watch.organizationId);
    return await performWatchSweep(ctx, watch);
  },
});

export const list = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await requireCaseAccess(ctx, args.caseId);
    return await ctx.db
      .query("hydraWatches")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const listEnabled = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("hydraWatches").collect();
    return all.filter((w) => w.enabled);
  },
});

const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const sweepDue = internalAction({
  args: {},
  handler: async (ctx) => {
    const watches = (await ctx.runQuery(internal.hydra.listEnabled, {})) as Doc<"hydraWatches">[];
    const due = watches.filter(
      (w) => !w.lastRunAt || Date.now() - w.lastRunAt > SWEEP_INTERVAL_MS,
    );
    for (const w of due) {
      await ctx.scheduler.runAfter(0, internal.hydra.runWatchSystem, { watchId: w._id });
    }
    return { scheduled: due.length, enabled: watches.length };
  },
});

export const getById = internalQuery({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    return await ctx.db.get("hydraWatches", args.watchId);
  },
});

export const markRun = internalMutation({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.watchId, { lastRunAt: Date.now() });
  },
});
