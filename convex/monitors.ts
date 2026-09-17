import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { firecrawlApi } from "./lib/firecrawlApi";
import { assertOrgProviderEnabled } from "./providerSafety";

const WATCH_GOAL =
  "Alert when this page is removed or taken down, the listed price changes materially, " +
  "or seller/contact details change. Ignore cosmetic changes like ads, related-item " +
  "recommendations, or layout tweaks.";

type MonitorPageResult = {
  monitorId: string;
  checkId?: string;
  url: string;
  status: "same" | "new" | "changed" | "removed" | "error" | string;
  error?: string | null;
  isMeaningful?: boolean;
  judgment?: {
    meaningful?: boolean;
    confidence?: string;
    reason?: string;
    meaningfulChanges?: Array<{ type?: string; after?: string; reason?: string }>;
  };
  diff?: { text?: string };
};

// Provision a real Firecrawl monitor for a hydra watch. Watches the suspect
// page itself (scrape target) with goal-based judging; webhook carries a
// per-watch bearer token so only genuine deliveries are accepted.
export const provision = internalAction({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = (await ctx.runQuery(internal.monitors.getWatch, {
      watchId: args.watchId,
    })) as { watch: Doc<"hydraWatches">; targetUrl: string | null } | null;
    if (!watch) return;

    // Scheduled path runs with no user identity — gate on the workspace flag.
    await assertOrgProviderEnabled(ctx, watch.watch.organizationId);

    const siteUrl = env.CONVEX_SITE_URL;
    if (!siteUrl || !watch.targetUrl) {
      await ctx.runMutation(internal.monitors.setError, {
        watchId: args.watchId,
        error: !siteUrl ? "CONVEX_SITE_URL not set" : "no target URL to monitor",
      });
      return;
    }

    const token = crypto.randomUUID();
    try {
      const res = await firecrawlApi<{ data?: { id?: string } }>("/monitor", {
        method: "POST",
        body: {
          name: `bs-watch-${args.watchId}`,
          schedule: { text: "every 2 hours", timezone: "UTC" },
          goal: WATCH_GOAL,
          judgeEnabled: true,
          targets: [
            {
              type: "scrape",
              urls: [watch.targetUrl],
              scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
            },
          ],
          webhook: {
            url: `${siteUrl}/monitor/webhook`,
            headers: { "X-BS-Token": token },
            metadata: { watchId: args.watchId },
            events: ["monitor.page"],
          },
          retentionDays: 90,
        },
      });
      const monitorId = res?.data?.id;
      if (!monitorId) throw new Error("monitor created without an id");
      await ctx.runMutation(internal.monitors.attach, {
        watchId: args.watchId,
        monitorId,
        webhookToken: token,
      });
    } catch (e) {
      await ctx.runMutation(internal.monitors.setError, {
        watchId: args.watchId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },
});

export const pause = internalAction({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = (await ctx.runQuery(internal.monitors.getById, {
      watchId: args.watchId,
    })) as Doc<"hydraWatches"> | null;
    if (!watch?.monitorId) return;
    try {
      await firecrawlApi(`/monitor/${watch.monitorId}`, {
        method: "PATCH",
        body: { status: "paused" },
      });
    } catch {
      // Best-effort: the watch is disabled locally either way.
    }
  },
});

// Webhook ingress — http.ts hands us the token header + parsed payload. We
// authenticate the delivery by matching the token to a watch, then record
// page results and raise watch_hit signals on meaningful changes.
export const handleEvent = internalMutation({
  args: { token: v.string(), payload: v.any() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    if (!args.token) return { ok: false };
    const watch = await ctx.db
      .query("hydraWatches")
      .withIndex("by_webhook_token", (q) => q.eq("webhookToken", args.token))
      .first();
    if (!watch) return { ok: false };

    const payload = args.payload as {
      type?: string;
      data?: MonitorPageResult[] | MonitorPageResult;
    };
    if (payload.type !== "monitor.page") return { ok: true };
    const pages = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];

    for (const page of pages) {
      const patch: Record<string, unknown> = {
        lastCheckAt: Date.now(),
        lastCheckStatus: page.status,
      };
      const judgment = page.judgment;
      const meaningful = page.isMeaningful === true || judgment?.meaningful === true;
      if (meaningful && (page.status === "changed" || page.status === "removed")) {
        const reason = judgment?.reason ?? "";
        const changes = (judgment?.meaningfulChanges ?? [])
          .map((c) => c.after ?? c.reason ?? "")
          .filter(Boolean)
          .slice(0, 3)
          .join("; ");
        const summary = (reason || changes || `Page ${page.status}`).slice(0, 400);
        patch.lastChangeAt = Date.now();
        patch.lastChangeSummary = summary;

        await ctx.db.insert("auditEvents", {
          organizationId: watch.organizationId,
          caseId: watch.caseId,
          actorType: "system",
          actorId: "firecrawl-monitor",
          eventType: "watch_hit",
          entityType: "hydraWatch",
          entityId: watch._id,
          timestamp: Date.now(),
          metadataSafe: {
            url: page.url,
            status: page.status,
            summary,
            confidence: judgment?.confidence,
            monitorId: page.monitorId,
          },
        });
        await ctx.db.insert("notifications", {
          organizationId: watch.organizationId,
          type: "watch_hit",
          title:
            page.status === "removed"
              ? `Monitored page removed — possible takedown`
              : `Monitored page changed`,
          body: summary.slice(0, 140),
          caseId: watch.caseId,
          href: watch.caseId ? `/cases/${watch.caseId}` : undefined,
          createdAt: Date.now(),
        });
      }
      await ctx.db.patch("hydraWatches", watch._id, patch);
    }
    return { ok: true };
  },
});

export const getById = internalQuery({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    return await ctx.db.get("hydraWatches", args.watchId);
  },
});

// Resolve the page this watch should monitor: case → discovery → canonicalUrl.
export const getWatch = internalQuery({
  args: { watchId: v.id("hydraWatches") },
  handler: async (ctx, args) => {
    const watch = await ctx.db.get("hydraWatches", args.watchId);
    if (!watch) return null;
    let targetUrl: string | null = null;
    if (watch.caseId) {
      const c = await ctx.db.get("cases", watch.caseId);
      if (c?.discoveryId) {
        const d = await ctx.db.get("discoveries", c.discoveryId);
        targetUrl = d?.canonicalUrl ?? null;
      }
    }
    return { watch, targetUrl };
  },
});

export const attach = internalMutation({
  args: {
    watchId: v.id("hydraWatches"),
    monitorId: v.string(),
    webhookToken: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("hydraWatches", args.watchId, {
      monitorId: args.monitorId,
      webhookToken: args.webhookToken,
      monitorError: undefined,
    });
  },
});

export const setError = internalMutation({
  args: { watchId: v.id("hydraWatches"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch("hydraWatches", args.watchId, {
      monitorError: args.error.slice(0, 300),
    });
  },
});
