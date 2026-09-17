import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireCaseAccess } from "./lib/authz";
import { assertProviderActionsEnabled } from "./providerSafety";
import { firecrawlApi } from "./lib/firecrawlApi";
import type { Doc } from "./_generated/dataModel";

const CAPTURE_PROMPT =
  "This page is suspected of copying or counterfeiting a brand. Scroll through the " +
  "entire page, open any product image gallery or seller-info section that needs " +
  "interaction, and report: every product title and price visible, the seller or " +
  "shop name and any contact details, and whether the page appears removed or " +
  "unavailable. Be factual and concise.";

// The sandbox returns the last expression's value in `result` — the base64
// screenshot must be the final statement (console.log is not captured).
const SCREENSHOT_CODE = `await page.evaluate(() => window.scrollTo(0, 0));
const buf = await page.screenshot({ type: "jpeg", quality: 70, fullPage: true });
buf.toString("base64");`;

// How long a finished session stays alive for human takeover before we stop it.
const SESSION_KEEPALIVE_MS = 5 * 60 * 1000;

type InteractResponse = {
  success?: boolean;
  output?: string;
  stdout?: string;
  stderr?: string;
  result?: string;
  exitCode?: number;
  liveViewUrl?: string;
  interactiveLiveViewUrl?: string;
};

// Member-facing capture: scrape the suspect page, hand the browser session to
// Firecrawl's interact agent to scroll/extract what's behind galleries and
// modals, take a real screenshot into file storage, and leave the session
// alive briefly so a human can take over via the live-view URL.
export const captureEvidence = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const c = (await ctx.runQuery(internal.cases.getById, {
      caseId: args.caseId,
    })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");
    await assertProviderActionsEnabled(ctx, c.organizationId);

    const discovery = c.discoveryId
      ? ((await ctx.runQuery(internal.discoveries.getById, {
          discoveryId: c.discoveryId,
        })) as Doc<"discoveries"> | null)
      : null;
    const targetUrl = discovery?.canonicalUrl;
    if (!targetUrl) throw new Error("No target URL to capture");

    // Stop any still-live prior session before opening a new one.
    if (c.interactScrapeId) {
      try {
        await firecrawlApi(`/scrape/${c.interactScrapeId}/interact`, { method: "DELETE" });
      } catch {
        // Session may already be gone — proceed.
      }
    }

    try {
      const scrape = await firecrawlApi<{
        data?: { metadata?: { scrapeId?: string } };
      }>("/scrape", {
        method: "POST",
        body: { url: targetUrl, formats: ["markdown"], onlyMainContent: true },
      });
      const scrapeId = scrape?.data?.metadata?.scrapeId;
      if (!scrapeId) throw new Error("scrape returned no scrapeId");

      // Agent pass: scroll and extract everything interactive.
      const agent = await firecrawlApi<InteractResponse>(
        `/scrape/${scrapeId}/interact`,
        { method: "POST", body: { prompt: CAPTURE_PROMPT, timeout: 120 } },
      );

      // Screenshot pass on the same session state.
      let fileId: string | undefined;
      try {
        const shot = await firecrawlApi<InteractResponse>(
          `/scrape/${scrapeId}/interact`,
          { method: "POST", body: { code: SCREENSHOT_CODE, language: "node", timeout: 60 } },
        );
        const b64 = (shot?.result ?? "").replace(/^"|"$/g, "");
        if (b64.length > 100 && /^[A-Za-z0-9+/=]+$/.test(b64.slice(0, 200))) {
          const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
          fileId = await ctx.storage.store(new Blob([bytes], { type: "image/jpeg" }));
        } else {
          console.error(
            "interact screenshot: empty result",
            JSON.stringify({ exitCode: shot?.exitCode, stderr: shot?.stderr?.slice(0, 200), resultLen: shot?.result?.length }),
          );
        }
      } catch (e) {
        // Screenshot is best-effort — the agent's findings still get recorded.
        console.error("interact screenshot pass failed:", e instanceof Error ? e.message : String(e));
      }

      const expiresAt = Date.now() + SESSION_KEEPALIVE_MS;
      await ctx.runMutation(internal.interact.attachSession, {
        caseId: args.caseId,
        scrapeId,
        liveUrl: agent.liveViewUrl ?? null,
        takeoverUrl: agent.interactiveLiveViewUrl ?? null,
        expiresAt,
        agentOutput: agent.output ?? "",
        screenshotFileId: fileId ?? null,
        targetUrl,
      });

      // Leave the browser alive for the takeover window, then stop it.
      await ctx.scheduler.runAfter(
        SESSION_KEEPALIVE_MS,
        internal.interact.stopSession,
        { caseId: args.caseId, scrapeId },
      );

      return { captured: true, expiresAt };
    } catch (e) {
      await ctx.runMutation(internal.interact.recordFailure, {
        caseId: args.caseId,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  },
});

// Member-facing "end takeover early" — clears the banner immediately and
// schedules the remote stop.
export const endSession = mutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    const { case: c } = await requireCaseAccess(ctx, args.caseId);
    if (!c.interactScrapeId) return;
    await ctx.db.patch("cases", args.caseId, {
      interactScrapeId: undefined,
      interactLiveUrl: undefined,
      interactTakeoverUrl: undefined,
      interactSessionExpiresAt: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.interact.stopSession, {
      caseId: args.caseId,
      scrapeId: c.interactScrapeId,
    });
  },
});

export const stopSession = internalAction({
  args: { caseId: v.id("cases"), scrapeId: v.string() },
  handler: async (ctx, args) => {
    try {
      await firecrawlApi(`/scrape/${args.scrapeId}/interact`, { method: "DELETE" });
    } catch {
      // Already gone or expired — still clear local state.
    }
    await ctx.runMutation(internal.interact.clearSession, { caseId: args.caseId });
  },
});

export const attachSession = internalMutation({
  args: {
    caseId: v.id("cases"),
    scrapeId: v.string(),
    liveUrl: v.union(v.string(), v.null()),
    takeoverUrl: v.union(v.string(), v.null()),
    expiresAt: v.number(),
    agentOutput: v.string(),
    screenshotFileId: v.union(v.string(), v.null()),
    targetUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.get("cases", args.caseId);
    if (!c) return;
    await ctx.db.patch("cases", args.caseId, {
      interactScrapeId: args.scrapeId,
      interactLiveUrl: args.liveUrl ?? undefined,
      interactTakeoverUrl: args.takeoverUrl ?? undefined,
      interactSessionExpiresAt: args.expiresAt,
    });
    await ctx.db.insert("evidenceItems", {
      organizationId: c.organizationId,
      caseId: args.caseId,
      discoveryId: c.discoveryId,
      type: "interact_capture",
      title: "Live browser capture — agent findings",
      sourceUrl: args.targetUrl,
      textContent: args.agentOutput.slice(0, 8000),
      capturedAt: Date.now(),
    });
    if (args.screenshotFileId) {
      await ctx.db.insert("evidenceItems", {
        organizationId: c.organizationId,
        caseId: args.caseId,
        discoveryId: c.discoveryId,
        type: "screenshot",
        title: "Live browser capture — full-page screenshot",
        sourceUrl: args.targetUrl,
        fileId: args.screenshotFileId,
        capturedAt: Date.now(),
      });
    }
    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      caseId: args.caseId,
      actorType: "system",
      actorId: "firecrawl-interact",
      eventType: "evidence_captured",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: { targetUrl: args.targetUrl, screenshot: !!args.screenshotFileId },
    });
  },
});

export const clearSession = internalMutation({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => {
    await ctx.db.patch("cases", args.caseId, {
      interactScrapeId: undefined,
      interactLiveUrl: undefined,
      interactTakeoverUrl: undefined,
      interactSessionExpiresAt: undefined,
    });
  },
});

export const recordFailure = internalMutation({
  args: { caseId: v.id("cases"), error: v.string() },
  handler: async (ctx, args) => {
    const c = await ctx.db.get("cases", args.caseId);
    if (!c) return;
    await ctx.db.insert("auditEvents", {
      organizationId: c.organizationId,
      caseId: args.caseId,
      actorType: "system",
      actorId: "firecrawl-interact",
      eventType: "evidence_capture_failed",
      entityType: "case",
      entityId: args.caseId,
      timestamp: Date.now(),
      metadataSafe: { error: args.error.slice(0, 300) },
    });
  },
});
