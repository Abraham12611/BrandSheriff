import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";
import { requireBrandAccess } from "./lib/authz";
import { assertProviderActionsEnabled, assertOrgProviderEnabled } from "./providerSafety";
import { openaiChat } from "./lib/openai";
import type { Doc, Id } from "./_generated/dataModel";

const CATEGORIES = ["brand", "product", "variant", "misspelling", "marketplace", "custom"];
const MAX_SUGGESTIONS = 30;
const MAX_MANUAL_TERMS = 100;

async function requireKeywordAccess(ctx: MutationCtx, keywordId: Id<"brandKeywords">) {
  const keyword = await ctx.db.get("brandKeywords", keywordId);
  if (!keyword) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Keyword not found." });
  }
  await requireBrandAccess(ctx, keyword.brandId);
  return keyword;
}

function normalizeTerm(term: string): string {
  return term.trim().replace(/\s+/g, " ").toLowerCase();
}

// ── Queries ──────────────────────────────────────────────────────────────

export const listForBrand = query({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    const rows = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const visible = rows
      .filter((k) => k.status !== "rejected")
      .sort((a, b) => b._creationTime - a._creationTime);
    return {
      suggested: visible.filter((k) => k.status === "suggested"),
      active: visible.filter((k) => k.status === "active"),
      inactive: visible.filter((k) => k.status === "inactive"),
    };
  },
});

// Terms patrol actually runs — the top of the fallback chain.
export const listActiveTerms = internalQuery({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand_status", (q) => q.eq("brandId", args.brandId).eq("status", "active"))
      .collect();
    return rows.map((k) => k.term);
  },
});

// ── User mutations ───────────────────────────────────────────────────────

export const addKeyword = mutation({
  args: {
    brandId: v.id("brands"),
    term: v.string(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { brand } = await requireBrandAccess(ctx, args.brandId);
    const term = args.term.trim().replace(/\s+/g, " ");
    if (!term || term.length > 120) {
      throw new ConvexError({ code: "BAD_INPUT", message: "Keyword must be 1-120 characters." });
    }
    const existing = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const dup = existing.find((k) => normalizeTerm(k.term) === normalizeTerm(term));
    if (dup) {
      // Rejected or inactive term re-added by hand → revive as active.
      if (dup.status !== "active") {
        await ctx.db.patch("brandKeywords", dup._id, { status: "active", source: "user" });
      }
      return dup._id;
    }
    return await ctx.db.insert("brandKeywords", {
      organizationId: brand.organizationId,
      brandId: args.brandId,
      term,
      category: args.category && CATEGORIES.includes(args.category) ? args.category : "custom",
      source: "user",
      status: "active",
      hits: 0,
    });
  },
});

// Bulk add from paste/CSV — one term per line.
export const bulkAdd = mutation({
  args: { brandId: v.id("brands"), terms: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { brand } = await requireBrandAccess(ctx, args.brandId);
    const existing = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const seen = new Set(existing.map((k) => normalizeTerm(k.term)));
    let added = 0;
    for (const raw of args.terms.slice(0, MAX_MANUAL_TERMS)) {
      const term = raw.trim().replace(/\s+/g, " ");
      if (!term || term.length > 120 || seen.has(normalizeTerm(term))) continue;
      seen.add(normalizeTerm(term));
      await ctx.db.insert("brandKeywords", {
        organizationId: brand.organizationId,
        brandId: args.brandId,
        term,
        category: "custom",
        source: "user",
        status: "active",
        hits: 0,
      });
      added++;
    }
    return { added };
  },
});

// Track / Dismiss / Pause / Resume — status transitions with guardrails.
export const setStatus = mutation({
  args: {
    keywordId: v.id("brandKeywords"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("rejected"),
    ),
  },
  handler: async (ctx, args) => {
    await requireKeywordAccess(ctx, args.keywordId);
    await ctx.db.patch("brandKeywords", args.keywordId, { status: args.status });
  },
});

export const bulkSetStatus = mutation({
  args: {
    keywordIds: v.array(v.id("brandKeywords")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    for (const keywordId of args.keywordIds.slice(0, 200)) {
      try {
        await requireKeywordAccess(ctx, keywordId);
        await ctx.db.patch("brandKeywords", keywordId, { status: args.status });
        updated++;
      } catch {
        // skip rows the caller can't access
      }
    }
    return updated;
  },
});

export const remove = mutation({
  args: { keywordId: v.id("brandKeywords") },
  handler: async (ctx, args) => {
    await requireKeywordAccess(ctx, args.keywordId);
    await ctx.db.delete("brandKeywords", args.keywordId);
  },
});

export const bulkRemove = mutation({
  args: { keywordIds: v.array(v.id("brandKeywords")) },
  handler: async (ctx, args) => {
    let removed = 0;
    for (const keywordId of args.keywordIds.slice(0, 200)) {
      try {
        await requireKeywordAccess(ctx, keywordId);
        await ctx.db.delete("brandKeywords", keywordId);
        removed++;
      } catch {
        // skip rows the caller can't access
      }
    }
    return removed;
  },
});

// ── Attribution ──────────────────────────────────────────────────────────

// Called once per patrol run with the terms actually executed.
export const touchUsed = internalMutation({
  args: { brandId: v.id("brands"), terms: v.array(v.string()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const wanted = new Set(args.terms.map(normalizeTerm));
    const now = Date.now();
    for (const row of rows) {
      if (wanted.has(normalizeTerm(row.term))) {
        await ctx.db.patch("brandKeywords", row._id, { lastUsedAt: now });
      }
    }
  },
});

// ── AI suggestion pipeline ───────────────────────────────────────────────

// User-facing entry: gate, then hand off to the system-side core.
export const regenerate = action({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const brand = (await ctx.runQuery(internal.brands.get, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (!brand) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Brand not found." });
    }
    // Identity + active membership + provider flag, all in one check.
    await assertProviderActionsEnabled(ctx, brand.organizationId);
    await ctx.scheduler.runAfter(0, internal.keywords.suggestKeywords, {
      brandId: args.brandId,
      replace: true,
    });
  },
});

export const suggestKeywords = internalAction({
  args: { brandId: v.id("brands"), replace: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const brand = (await ctx.runQuery(internal.brands.get, {
      brandId: args.brandId,
    })) as Doc<"brands"> | null;
    if (!brand) return;
    await assertOrgProviderEnabled(ctx, brand.organizationId);

    const assets = (await ctx.runQuery(internal.brandAssets.listByBrand, {
      brandId: args.brandId,
    })) as Doc<"brandAssets">[];

    // Bound the context: page titles + text excerpts + image filenames give
    // the model the brand's vocabulary without shipping whole crawls.
    const pageSignals = assets
      .filter((a) => a.type === "page" && a.textContent)
      .slice(0, 6)
      .map((a) => ({
        title: a.title,
        text: (a.textContent ?? "").slice(0, 1200),
      }));
    const imageNames = assets
      .filter((a) => a.type === "image")
      .slice(0, 12)
      .map((a) => a.title);

    const prompt = `You generate search queries a brand-protection analyst would run to find copycats, counterfeits, and unauthorized sellers of this brand.

Brand: ${brand.name}
Official site: ${brand.canonicalDomain}
Product/page signals:
${JSON.stringify(pageSignals, null, 2)}
Image asset names: ${JSON.stringify(imageNames)}
Existing keywords (do not repeat): ${JSON.stringify(brand.keywords ?? [])}

Produce up to ${MAX_SUGGESTIONS} queries across these categories:
- product: brand name + product/product-type combos (e.g. "acme leather duffel")
- variant: alternate spellings, abbreviations, taglines used by the brand
- misspelling: plausible typos/slang a searcher or infringer might use
- marketplace: commerce-intent phrases (e.g. "acme dupe", "acme wholesale", "acme cheap", "acme aliexpress")
- brand: the brand name plus high-signal modifiers (e.g. "acme official", "acme store")

Rules: every term must include or clearly derive from the brand name or its products; no generic category words alone; 2-6 words per term; lowercase.

Return JSON: {"keywords": [{"term": "...", "category": "product|variant|misspelling|marketplace|brand", "rationale": "one short clause why this query surfaces infringers"}]}`;

    let parsed: { keywords?: Array<{ term?: string; category?: string; rationale?: string }> };
    try {
      parsed = (await openaiChat([
        { role: "system", content: "You generate copycat-hunting search queries for brand protection. Return only the JSON shape requested." },
        { role: "user", content: prompt },
      ])) as typeof parsed;
    } catch (e) {
      console.error("suggestKeywords OpenAI call failed:", e instanceof Error ? e.message : String(e));
      return;
    }

    const suggestions = (parsed.keywords ?? [])
      .filter((k) => typeof k.term === "string" && k.term.trim().length >= 2 && k.term.length <= 120)
      .slice(0, MAX_SUGGESTIONS)
      .map((k) => ({
        term: k.term!.trim().replace(/\s+/g, " ").toLowerCase(),
        category: k.category && CATEGORIES.includes(k.category) ? k.category : "product",
        rationale: typeof k.rationale === "string" ? k.rationale.slice(0, 200) : undefined,
      }));
    if (suggestions.length === 0) return;

    if (args.replace) {
      await ctx.runMutation(internal.keywords.clearSuggestions, { brandId: args.brandId });
    }
    await ctx.runMutation(internal.keywords.applySuggestions, {
      brandId: args.brandId,
      suggestions,
    });
  },
});

export const applySuggestions = internalMutation({
  args: {
    brandId: v.id("brands"),
    suggestions: v.array(
      v.object({
        term: v.string(),
        category: v.string(),
        rationale: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get("brands", args.brandId);
    if (!brand) return;
    const existing = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const seen = new Set(existing.map((k) => normalizeTerm(k.term)));
    for (const s of args.suggestions) {
      const norm = normalizeTerm(s.term);
      if (seen.has(norm)) continue;
      seen.add(norm);
      await ctx.db.insert("brandKeywords", {
        organizationId: brand.organizationId,
        brandId: args.brandId,
        term: s.term,
        category: s.category,
        source: "ai",
        status: "suggested",
        rationale: s.rationale,
        hits: 0,
      });
    }
  },
});

// Regenerate wipes only *unreviewed* suggestions — active/inactive/rejected
// rows keep their human-set state.
export const clearSuggestions = internalMutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("brandKeywords")
      .withIndex("by_brand_status", (q) => q.eq("brandId", args.brandId).eq("status", "suggested"))
      .collect();
    for (const row of rows) {
      await ctx.db.delete("brandKeywords", row._id);
    }
  },
});
