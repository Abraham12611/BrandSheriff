/**
 * Enforcement Router — turns a discovery/case into a set of channel-native
 * enforcement actions instead of one generic email.
 *
 * Model: every case fans out into `enforcementActions` rows — one per
 * complaint channel (host, platform, search, ads, social, marketplace,
 * registrar, counsel). Each route has its own lifecycle so the workspace can
 * track which actions were filed, what came back, and what still needs
 * attention. Routes are computed deterministically from discovery signals
 * (visual match, text similarity, keyword attribution, channel hints); the
 * AI is used later to draft each platform-native packet, not to decide the
 * legal basis.
 */

import { v } from "convex/values";
import {
  internalQuery,
  internalMutation,
  mutation,
  query,
  action,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import { requireOrganizationMembership, ADMIN_ROLES } from "./lib/authz";
import { assertProviderActionsEnabled } from "./providerSafety";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function openaiText(
  messages: Array<{ role: string; content: string }>,
  maxTokens = 900,
): Promise<string> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: maxTokens, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return content;
}

export const ROUTE_CHANNELS = [
  "storefront_platform",
  "host",
  "registrar",
  "search",
  "ads",
  "social",
  "marketplace",
  "counsel",
] as const;

type RouteChannel = (typeof ROUTE_CHANNELS)[number];
export type RouteBasis =
  | "copyright"
  | "trademark"
  | "counterfeit"
  | "impersonation"
  | "udrp"
  | "design";

interface RouteDef {
  route: string;
  channel: RouteChannel;
  basis: RouteBasis;
  label: string;
  reason: string;
  submissionUrl?: string;
  requiredFields: string[];
}

/** Static route catalog — submission URLs point at the official public
 * reporting mechanisms for each channel. */
export const ROUTE_DEFS: Record<string, RouteDef> = {
  storefront_copyright: {
    route: "storefront_copyright",
    channel: "storefront_platform",
    basis: "copyright",
    label: "Store-platform copyright complaint",
    reason:
      "Copied imagery, copy or page design hosted on a commerce platform (e.g. Shopify/WooCommerce) — platforms remove content on a complete valid copyright notice.",
    submissionUrl: "https://www.shopify.com/legal/dmca",
    requiredFields: ["original_urls", "infringing_urls", "rights_statement", "contact"],
  },
  host_dmca: {
    route: "host_dmca",
    channel: "host",
    basis: "copyright",
    label: "Hosting provider copyright notice",
    reason:
      "DMCA-style notice to the clone's hosting provider for copied photos, video, or text.",
    requiredFields: ["work_identification", "infringing_urls", "good_faith", "signature"],
  },
  search_delisting: {
    route: "search_delisting",
    channel: "search",
    basis: "copyright",
    label: "Google Search removal (copyright)",
    reason:
      "Removes infringing pages from search results even while the source site stays up — run in parallel with the site-level takedown.",
    submissionUrl: "https://support.google.com/legal/troubleshooter/1114905",
    requiredFields: ["original_urls", "infringing_urls", "rights_statement"],
  },
  ads_trademark: {
    route: "ads_trademark",
    channel: "ads",
    basis: "trademark",
    label: "Google Ads trademark complaint",
    reason:
      "Trademark used in ad copy in a confusing or deceptive way. Google may restrict TM use on rights-holder complaint; keyword bidding alone is generally not restricted.",
    submissionUrl: "https://support.google.com/adspolicy/troubleshooter/14327740",
    requiredFields: ["trademark_registration", "ad_evidence", "confusing_use"],
  },
  ads_counterfeit: {
    route: "ads_counterfeit",
    channel: "ads",
    basis: "counterfeit",
    label: "Google Ads counterfeit complaint",
    reason:
      "Ads promoting goods bearing a mark identical/substantially indistinguishable from yours — Google's counterfeit policy is stronger than its trademark route.",
    submissionUrl: "https://support.google.com/adspolicy/contact/counterfeit",
    requiredFields: ["trademark_registration", "ad_evidence", "counterfeit_basis"],
  },
  meta_ip: {
    route: "meta_ip",
    channel: "social",
    basis: "copyright",
    label: "Meta IP report (copyright/trademark)",
    reason:
      "Stolen images, video or copy in Facebook/Instagram content or ads; trademark route for name/logo misuse.",
    submissionUrl: "https://www.facebook.com/help/contact/1758255661104383",
    requiredFields: ["rights_info", "infringing_content_urls", "work_description"],
  },
  instagram_ip: {
    route: "instagram_ip",
    channel: "social",
    basis: "copyright",
    label: "Instagram IP report",
    reason: "Copied imagery/video or impersonating accounts on Instagram.",
    submissionUrl: "https://help.instagram.com/contact/372592039493026",
    requiredFields: ["rights_info", "infringing_urls"],
  },
  marketplace_counterfeit: {
    route: "marketplace_counterfeit",
    channel: "marketplace",
    basis: "counterfeit",
    label: "Marketplace counterfeit/IP complaint",
    reason:
      "Counterfeit or IP-infringing listings on Amazon/eBay/Etsy/AliExpress/Temu — each marketplace runs its own rights-owner program (Amazon RAV, eBay VeRO, Etsy IP portal, Alibaba IPP).",
    submissionUrl: "https://www.amazon.com/report/infringement",
    requiredFields: ["rights_registration", "listing_urls", "test_buy_optional"],
  },
  registrar_abuse: {
    route: "registrar_abuse",
    channel: "registrar",
    basis: "impersonation",
    label: "Registrar abuse report",
    reason:
      "Domain used for impersonation/phishing — registrar abuse desks can suspend under registration agreements.",
    submissionUrl: "https://www.icann.org/compliance/complaint",
    requiredFields: ["domain", "abuse_evidence", "impersonation_detail"],
  },
  udrp_assessment: {
    route: "udrp_assessment",
    channel: "counsel",
    basis: "udrp",
    label: "UDRP readiness assessment",
    reason:
      "Domain confusingly similar to a registered mark. UDRP requires: confusing similarity, no legitimate rights/interests, bad-faith registration and use. Assessment package for counsel — not an automated filing.",
    submissionUrl: "https://www.wipo.int/amc/en/domains/",
    requiredFields: ["trademark_registration", "domain", "bad_faith_evidence"],
  },
  cease_desist: {
    route: "cease_desist",
    channel: "counsel",
    basis: "copyright",
    label: "Cease & desist to operator",
    reason:
      "Direct notice to the infringer demanding they stop selling, advertising and using your assets/marks — the existing AgentMail route.",
    requiredFields: ["contact_address", "rights_summary", "demands", "deadline"],
  },
  counsel_escalation: {
    route: "counsel_escalation",
    channel: "counsel",
    basis: "design",
    label: "Attorney escalation package",
    reason:
      "Repeat offender, high-value loss, or rights needing legal judgment (design/trade dress). Package rights docs, evidence and history for counsel.",
    requiredFields: ["rights_docs", "evidence_report", "offender_history"],
  },
};

const STATUS_ORDER = [
  "recommended",
  "prepared",
  "submitted",
  "platform_reviewing",
  "actioned",
  "rejected",
  "counter_notice",
  "withdrawn",
];

const MARKETPLACE_HOSTS =
  /amazon\.|ebay\.|etsy\.|aliexpress\.|alibaba\.|temu\.|walmart\.|wish\.|dhgate\.|shopee\.|mercari\./i;
const SOCIAL_HOSTS =
  /facebook\.com|instagram\.com|fb\.me|tiktok\.com|twitter\.com|x\.com|pinterest\.|youtube\.|reddit\.com|snapchat\.|linkedin\.com/i;

function suspectHost(discovery: any): string {
  try {
    return new URL(discovery?.canonicalUrl ?? "").hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Repeat-offender check: another discovery in the org on the same host. */
async function countRelatedDiscoveries(ctx: any, organizationId: string, host: string) {
  if (!host) return 0;
  const all = await ctx.db
    .query("discoveries")
    .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
    .collect();
  return all.filter((d: any) => suspectHost(d) === host).length;
}

/** Deterministic route recommendation from discovery signals. */
export function computeRoutes(args: {
  discovery: any;
  evidenceCount: number;
  hasPriorCases: boolean;
}): Array<{ def: RouteDef; confidence: "high" | "medium" | "low"; reason: string }> {
  const { discovery, evidenceCount, hasPriorCases } = args;
  const host = suspectHost(discovery);
  const visual = discovery?.visualMatchScore ?? 0;
  const text = discovery?.similarityScore ?? 0;
  const out: Array<{ def: RouteDef; confidence: "high" | "medium" | "low"; reason: string }> = [];
  const push = (key: string, confidence: "high" | "medium" | "low", extra?: string) =>
    out.push({ def: ROUTE_DEFS[key], confidence, reason: extra ?? ROUTE_DEFS[key].reason });

  if (MARKETPLACE_HOSTS.test(host)) {
    push("marketplace_counterfeit", visual >= 0.8 ? "high" : "medium");
  }
  if (SOCIAL_HOSTS.test(host)) {
    push(host.includes("instagram") ? "instagram_ip" : "meta_ip", visual >= 0.8 ? "high" : "medium");
  }

  if (!MARKETPLACE_HOSTS.test(host) && !SOCIAL_HOSTS.test(host)) {
    // Standalone storefront/site — platform + host + search pressure.
    if (visual > 0 || text >= 0.6 || evidenceCount > 0) {
      push(
        "storefront_copyright",
        visual >= 0.9 ? "high" : visual > 0 || text >= 0.8 ? "medium" : "low",
      );
      push("host_dmca", visual >= 0.9 ? "high" : "medium");
      push("search_delisting", "high");
    }
    // Registrar + UDRP when the domain itself is the abuse.
    if (/official|outlet|sale|store|shop|clearance|discount/i.test(host) || discovery?.matchedQuery) {
      push("registrar_abuse", "medium");
      push("udrp_assessment", "low", ROUTE_DEFS.udrp_assessment.reason + " Requires a registered mark and counsel review.");
    }
  }

  // Direct contact is always available once contact research exists.
  push("cease_desist", "medium");

  // Repeat-offender escalation.
  if (hasPriorCases) {
    push("counsel_escalation", "medium", "Prior cases exist against related operators — counsel escalation recommended.");
  }

  // Ads routes are advisory until ad-channel evidence exists.
  push("ads_trademark", "low", "Advisory — attach ad-library evidence when available. " + ROUTE_DEFS.ads_trademark.reason);

  return out;
}

/** List stored actions for a case, merged with any missing recommendations. */
export const listForCase = query({
  args: { caseId: v.id("cases"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    const stored = await ctx.db
      .query("enforcementActions")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const theCase = await ctx.db.get(args.caseId);
    if (!theCase || theCase.organizationId !== args.organizationId) {
      throw new Error("Case not found");
    }
    const discovery = theCase?.discoveryId ? await ctx.db.get(theCase.discoveryId) : null;
    const evidence = await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const related = await countRelatedDiscoveries(
      ctx,
      args.organizationId,
      suspectHost(discovery),
    );
    const recs = computeRoutes({
      discovery,
      evidenceCount: evidence.length,
      hasPriorCases: related > 1,
    });
    const storedRoutes = new Set(stored.map((s: any) => s.route));
    const missing = recs
      .filter((r) => !storedRoutes.has(r.def.route))
      .map((r) => ({
        _id: null,
        route: r.def.route,
        channel: r.def.channel,
        basis: r.def.basis,
        label: r.def.label,
        reason: r.reason,
        confidence: r.confidence,
        status: "recommended",
        submissionUrl: r.def.submissionUrl,
        requiredFields: r.def.requiredFields,
      }));
    return {
      stored,
      recommended: missing,
      statusOrder: STATUS_ORDER,
    };
  },
});

/** Materialize all current recommendations as tracked action rows. */
export const ensureForCase = mutation({
  args: { caseId: v.id("cases"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    const theCase = await ctx.db.get(args.caseId);
    if (!theCase || theCase.organizationId !== args.organizationId) {
      throw new Error("Case not found");
    }
    const discovery = theCase.discoveryId ? await ctx.db.get(theCase.discoveryId) : null;
    const evidence = await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const related = await countRelatedDiscoveries(
      ctx,
      args.organizationId,
      suspectHost(discovery),
    );
    const recs = computeRoutes({
      discovery,
      evidenceCount: evidence.length,
      hasPriorCases: related > 1,
    });
    const existing = await ctx.db
      .query("enforcementActions")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect();
    const have = new Set(existing.map((e: any) => e.route));
    const now = Date.now();
    let created = 0;
    for (const r of recs) {
      if (have.has(r.def.route)) continue;
      await ctx.db.insert("enforcementActions", {
        organizationId: args.organizationId,
        caseId: args.caseId,
        route: r.def.route,
        channel: r.def.channel,
        basis: r.def.basis,
        status: "recommended",
        confidence: r.confidence,
        reason: r.reason,
        submissionUrl: r.def.submissionUrl,
        requiredFields: r.def.requiredFields,
        updatedAt: now,
      });
      created++;
    }
    return { created, total: existing.length + created };
  },
});

export const listForOrganization = query({
  args: { organizationId: v.id("organizations"), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    let rows;
    if (args.status) {
      rows = await ctx.db
        .query("enforcementActions")
        .withIndex("by_org_status", (q) =>
          q.eq("organizationId", args.organizationId).eq("status", args.status!),
        )
        .collect();
    } else {
      rows = await ctx.db
        .query("enforcementActions")
        .withIndex("by_org_status", (q) => q.eq("organizationId", args.organizationId))
        .collect();
    }
    const cases = new Map<string, any>();
    for (const r of rows) {
      if (!cases.has(r.caseId)) cases.set(r.caseId, await ctx.db.get(r.caseId));
    }
    return rows.map((r: any) => ({
      ...r,
      routeLabel: ROUTE_DEFS[r.route]?.label ?? r.route,
      caseNumber: cases.get(r.caseId)?.caseNumber,
      caseTitle: cases.get(r.caseId)?.title,
    }));
  },
});

export const updateStatus = mutation({
  args: {
    actionId: v.id("enforcementActions"),
    status: v.string(),
    externalRef: v.optional(v.string()),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.actionId);
    if (!row) throw new Error("Action not found");
    await requireOrganizationMembership(ctx, row.organizationId, ADMIN_ROLES);
    if (!STATUS_ORDER.includes(args.status)) throw new Error("Invalid status");
    const patch: any = { status: args.status, updatedAt: Date.now() };
    if (args.externalRef !== undefined) patch.externalRef = args.externalRef;
    if (args.outcome !== undefined) patch.outcome = args.outcome;
    if (args.status === "submitted" && !row.submittedAt) patch.submittedAt = Date.now();
    await ctx.db.patch(args.actionId, patch);
  },
});

export const withdraw = mutation({
  args: { actionId: v.id("enforcementActions") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.actionId);
    if (!row) throw new Error("Action not found");
    await requireOrganizationMembership(ctx, row.organizationId, ADMIN_ROLES);
    await ctx.db.patch(args.actionId, { status: "withdrawn", updatedAt: Date.now() });
  },
});

/** Prepare a platform-native packet for a route — generates the draft text
 * via OpenAI with route-specific instructions, stores it as a draftNotice
 * and marks the action prepared. Provider-gated. */
export const prepare = action({
  args: { actionId: v.id("enforcementActions") },
  handler: async (ctx, args): Promise<any> => {
    const actionRow: any = await ctx.runQuery(internal.enforcementRoutes.getInternal, {
      actionId: args.actionId,
    });
    if (!actionRow) throw new Error("Action not found");
    await assertProviderActionsEnabled(ctx, actionRow.organizationId);
    await ctx.runMutation(internal.enforcementRoutes.markPreparingInternal, {
      actionId: args.actionId,
    });
    await ctx.runAction(internal.enforcementRoutes.generatePacketInternal, {
      actionId: args.actionId,
    });
    return { ok: true };
  },
});

export const getInternal = internalQuery({
  args: { actionId: v.id("enforcementActions") },
  handler: async (ctx, args) => await ctx.db.get(args.actionId),
});

export const markPreparingInternal = internalMutation({
  args: { actionId: v.id("enforcementActions") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.actionId, { updatedAt: Date.now() });
  },
});

export const generatePacketInternal = internalAction({
  args: { actionId: v.id("enforcementActions") },
  handler: async (ctx, args): Promise<any> => {
    const row: any = await ctx.runQuery(internal.enforcementRoutes.getInternal, {
      actionId: args.actionId,
    });
    if (!row) throw new Error("Action not found");
    const def = ROUTE_DEFS[row.route];
    const theCase: any = await ctx.runQuery(internal.enforcementRoutes.getCaseInternal, {
      caseId: row.caseId,
    });
    const discovery: any = theCase?.discoveryId
      ? await ctx.runQuery(internal.enforcementRoutes.getDiscoveryInternal, {
          discoveryId: theCase.discoveryId,
        })
      : null;
    const evidence: any[] = await ctx.runQuery(internal.enforcementRoutes.listEvidenceInternal, {
      caseId: row.caseId,
    });
    const org: any = await ctx.runQuery(internal.enforcementRoutes.getOrgInternal, {
      organizationId: row.organizationId,
    });

    const prompt = `You are preparing a ${def?.label ?? row.route} complaint for a brand-protection workspace.

Channel: ${row.channel} | Legal basis category: ${row.basis}
Required fields for this channel: ${(row.requiredFields ?? []).join(", ")}

Suspected infringing URL: ${discovery?.canonicalUrl ?? "unknown"}
Case number: ${theCase?.caseNumber ?? ""} | Severity: ${theCase?.severity ?? ""}
Evidence items: ${evidence.length}
Visual match score: ${discovery?.visualMatchScore ?? "n/a"}
Text similarity: ${discovery?.similarityScore ?? "n/a"}
Organization: ${org?.name ?? ""}

Write the complaint text appropriate for THIS channel's submission form:
- Copyright/DMCA channels: identify the copyrighted work, the infringing material URLs, good-faith belief statement, accuracy-under-penalty statement placeholder, and signature block placeholder.
- Trademark channels: identify the mark, registration details placeholders, and the confusing/deceptive use.
- Counterfeit channels: focus on the mark and counterfeit nature; do not overclaim.
- Registrar/UDRP: structure the three UDRP elements as an assessment draft, clearly marked as for counsel review.
- Counsel escalation: a concise brief summarizing the offender, evidence and prior actions.
Mark every fact you cannot verify as [REQUIRED: ...] rather than inventing it. No legal conclusions — describe observable facts. Keep it under 500 words, plain text, ready to paste into the platform's form.`;

    const text = await openaiText([
      { role: "system", content: "You draft precise, factual platform IP complaints. Never invent registrations, dates or facts — use placeholders." },
      { role: "user", content: prompt },
    ]);
    await ctx.runMutation(internal.enforcementRoutes.attachDraftInternal, {
      actionId: args.actionId,
      text,
      label: def?.label ?? row.route,
    });
    return { ok: true };
  },
});

export const getCaseInternal = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) => await ctx.db.get(args.caseId),
});

export const getDiscoveryInternal = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => await ctx.db.get(args.discoveryId),
});

export const listEvidenceInternal = internalQuery({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args) =>
    await ctx.db
      .query("evidenceItems")
      .withIndex("by_case", (q) => q.eq("caseId", args.caseId))
      .collect(),
});

export const getOrgInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => await ctx.db.get(args.organizationId),
});

export const attachDraftInternal = internalMutation({
  args: { actionId: v.id("enforcementActions"), text: v.string(), label: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.actionId);
    if (!row) throw new Error("Action not found");
    const draftId = await ctx.db.insert("draftNotices", {
      organizationId: row.organizationId,
      caseId: row.caseId,
      routeType: row.route,
      status: "draft",
      body: args.text,
      generatedBy: "enforcement_router",
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.patch(args.actionId, {
      draftId,
      status: "prepared",
      updatedAt: Date.now(),
    });
  },
});
