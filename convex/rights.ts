/**
 * Rights Vault — the Brand Rights Graph's storage layer.
 *
 * Records what a business owns: trademarks, copyright registrations, design
 * rights, domains, official accounts, authorized sellers, ad accounts, and
 * proof documents. Enforcement routing reads this to decide which legal
 * bases are actually supported (e.g. no registered mark → no trademark
 * route recommended).
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOrganizationMembership, requireBrandAccess, ADMIN_ROLES, MEMBER_ROLES } from "./lib/authz";

export const RIGHTS_KINDS = [
  "trademark",
  "copyright_registration",
  "design_right",
  "domain",
  "official_account",
  "authorized_seller",
  "ad_account",
  "proof_document",
] as const;

const RIGHTS_STATUSES = ["registered", "pending", "unregistered", "active", "verified"] as const;

export const listForBrand = query({
  args: { brandId: v.id("brands"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    return await ctx.db
      .query("rightsObjects")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
  },
});

export const add = mutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.id("brands"),
    kind: v.string(),
    label: v.string(),
    value: v.optional(v.string()),
    territory: v.optional(v.string()),
    status: v.string(),
    fileId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireBrandAccess(ctx, args.brandId);
    if (args.brandId && args.organizationId) {
      const brand = await ctx.db.get("brands", args.brandId);
      if (brand?.organizationId !== args.organizationId) {
        throw new Error("Brand does not belong to this workspace.");
      }
    }
    if (!RIGHTS_KINDS.includes(args.kind as (typeof RIGHTS_KINDS)[number])) {
      throw new Error(`Unknown rights kind: ${args.kind}`);
    }
    const now = Date.now();
    const id = await ctx.db.insert("rightsObjects", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      kind: args.kind,
      label: args.label.trim(),
      value: args.value?.trim(),
      territory: args.territory?.trim(),
      status: args.status,
      fileId: args.fileId,
      sourceUrl: args.sourceUrl?.trim(),
      expiresAt: args.expiresAt,
      notes: args.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "rights_added",
      entityType: "rightsObject",
      entityId: id,
      timestamp: now,
      metadataSafe: { kind: args.kind, label: args.label },
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("rightsObjects"),
    label: v.optional(v.string()),
    value: v.optional(v.string()),
    territory: v.optional(v.string()),
    status: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get("rightsObjects", args.id);
    if (!row) throw new Error("Rights record not found");
    await requireOrganizationMembership(ctx, row.organizationId, MEMBER_ROLES);
    if (args.status && !RIGHTS_STATUSES.includes(args.status as (typeof RIGHTS_STATUSES)[number])) {
      throw new Error(`Unknown status: ${args.status}`);
    }
    const { id: _id, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch("rightsObjects", args.id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("rightsObjects") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get("rightsObjects", args.id);
    if (!row) throw new Error("Rights record not found");
    const { identity } = await requireOrganizationMembership(
      ctx,
      row.organizationId,
      ADMIN_ROLES,
    );
    await ctx.db.delete("rightsObjects", args.id);
    await ctx.db.insert("auditEvents", {
      organizationId: row.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "rights_removed",
      entityType: "rightsObject",
      entityId: args.id,
      timestamp: Date.now(),
      metadataSafe: { kind: row.kind, label: row.label },
    });
  },
});

/** Coverage gaps — where the documented rights don't match the monitored
 * footprint. Factual observations for the user to act on, not legal advice. */
export const coverage = query({
  args: { brandId: v.id("brands"), organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rights = await ctx.db
      .query("rightsObjects")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const assets = await ctx.db
      .query("brandAssets")
      .withIndex("by_brand", (q) => q.eq("brandId", args.brandId))
      .collect();
    const discoveries = await ctx.db
      .query("discoveries")
      .withIndex("by_brand_status", (q) => q.eq("brandId", args.brandId))
      .collect();

    const byKind = new Map<string, number>();
    for (const r of rights) byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1);

    const gaps: string[] = [];
    const marks = rights.filter((r) => r.kind === "trademark" && r.status === "registered");
    if (marks.length === 0) {
      gaps.push(
        "No registered trademark on file — trademark, counterfeit and UDRP routes can't be recommended with confidence.",
      );
    }
    const unproofed = assets.filter((a) => a.imageHash && !a.sourceUrl).length;
    if (unproofed > 0) {
      gaps.push(
        `${unproofed} fingerprinted asset${unproofed === 1 ? "" : "s"} lack a source URL — original-publication evidence strengthens takedown packets.`,
      );
    }
    if ((byKind.get("authorized_seller") ?? 0) === 0) {
      gaps.push(
        "No authorized sellers recorded — legitimate-reseller findings can't be filtered out of discoveries.",
      );
    }
    if ((byKind.get("official_account") ?? 0) === 0) {
      gaps.push(
        "No official accounts recorded — impersonation detection can't distinguish real social profiles.",
      );
    }
    const activeDiscoveries = discoveries.filter((d) =>
      ["needs_review", "case_created"].includes(d.status),
    ).length;
    if (activeDiscoveries > 0 && marks.length === 0 && (byKind.get("copyright_registration") ?? 0) === 0) {
      gaps.push(
        `${activeDiscoveries} active discoveries but no registered rights on file — enforcement packets will rely on unregistered copyright only.`,
      );
    }

    return {
      counts: Object.fromEntries(byKind),
      registeredMarks: marks.length,
      territories: [...new Set(rights.map((r) => r.territory).filter(Boolean))],
      gaps,
      total: rights.length,
    };
  },
});
