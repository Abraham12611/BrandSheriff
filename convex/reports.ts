import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  ADMIN_ROLES,
  MEMBER_ROLES,
  requireOrganizationMembership,
} from "./lib/authz";

// A report is a frozen snapshot of workspace activity over a period,
// shareable via an unguessable token URL. Anyone holding the link can
// read it until revoked — treat the token as the capability.

export const generate = mutation({
  args: {
    organizationId: v.id("organizations"),
    brandId: v.optional(v.id("brands")),
    rangeFrom: v.number(),
    rangeTo: v.number(),
    sections: v.array(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );
    if (args.rangeFrom >= args.rangeTo) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Range start must be before range end.",
      });
    }

    const org = await ctx.db.get("organizations", args.organizationId);
    if (!org) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Workspace not found." });
    }

    let brandName: string | undefined;
    if (args.brandId) {
      const brand = await ctx.db.get("brands", args.brandId);
      if (!brand || brand.organizationId !== args.organizationId) {
        throw new ConvexError({ code: "NOT_FOUND", message: "Brand not found." });
      }
      brandName = brand.name;
    }

    const { rangeFrom, rangeTo } = args;
    const inRange = (t: number) => t >= rangeFrom && t <= rangeTo;
    const inScope = <T extends { brandId: unknown }>(r: T) =>
      !args.brandId || r.brandId === args.brandId;

    const discoveries = (
      await ctx.db
        .query("discoveries")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect()
    ).filter((d) => inScope(d) && inRange(d._creationTime));

    const byStatus: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    let similaritySum = 0;
    let scoredCount = 0;
    for (const d of discoveries) {
      byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
      const platform = d.platformGuess ?? "web";
      byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;
      const sim = d.similarityScore ?? d.matchConfidence;
      if (sim !== undefined) {
        similaritySum += sim;
        scoredCount++;
      }
    }

    const topOffenders = discoveries
      .filter((d) => d.status !== "denied" && d.status !== "allowed")
      .sort(
        (a, b) =>
          (b.similarityScore ?? b.matchConfidence ?? 0) -
          (a.similarityScore ?? a.matchConfidence ?? 0),
      )
      .slice(0, 10)
      .map((d) => {
        let host = "";
        try {
          host = new URL(d.canonicalUrl).hostname;
        } catch {
          host = d.canonicalUrl;
        }
        return {
          url: d.canonicalUrl,
          host,
          platform: d.platformGuess ?? "web",
          similarity: d.similarityScore ?? d.matchConfidence ?? null,
          status: d.status,
        };
      });

    const allCases = (
      await ctx.db
        .query("cases")
        .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
        .collect()
    ).filter((c) => inScope(c));

    const casesOpened = allCases.filter((c) => inRange(c._creationTime)).length;
    const resolvedCases = allCases
      .filter((c) => c.resolvedAt !== undefined && inRange(c.resolvedAt))
      .map((c) => ({
        caseNumber: c.caseNumber,
        title: c.title,
        resolvedAt: c.resolvedAt,
        state: c.state,
      }))
      .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));

    const caseIds = new Set(allCases.map((c) => c._id));
    let noticesSent = 0;
    for (const caseId of caseIds) {
      const caseDrafts = await ctx.db
        .query("draftNotices")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      noticesSent += caseDrafts.filter(
        (d) => d.status === "sent" && inRange(d.updatedAt),
      ).length;
    }

    let verifiedRemovals = 0;
    for (const caseId of caseIds) {
      const caseRechecks = await ctx.db
        .query("rechecks")
        .withIndex("by_case", (q) => q.eq("caseId", caseId))
        .collect();
      verifiedRemovals += caseRechecks.filter(
        (r) =>
          r.status === "completed" &&
          r.availability === "removed" &&
          inRange(r.checkedAt),
      ).length;
    }

    const creator = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const snapshot = {
      generatedAt: Date.now(),
      organizationName: org.name,
      brandName,
      headline: {
        discoveriesFound: discoveries.length,
        needsReview: byStatus["needs_review"] ?? 0,
        approved: byStatus["approved"] ?? 0,
        denied: byStatus["denied"] ?? 0,
        watchlisted: byStatus["watchlisted"] ?? 0,
        casesOpened,
        casesResolved: resolvedCases.length,
        noticesSent,
        verifiedRemovals,
        avgSimilarity: scoredCount > 0 ? similaritySum / scoredCount : null,
      },
      channels: Object.entries(byPlatform)
        .map(([platform, count]) => ({ platform, count }))
        .sort((a, b) => b.count - a.count),
      topOffenders,
      resolvedCases,
    };

    const token = crypto.randomUUID().replaceAll("-", "") +
      crypto.randomUUID().replaceAll("-", "");
    const title =
      args.title?.trim() ||
      `Brand protection report — ${new Date(rangeFrom).toISOString().slice(0, 10)} to ${new Date(rangeTo).toISOString().slice(0, 10)}`;

    const reportId = await ctx.db.insert("reports", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      title,
      rangeFrom,
      rangeTo,
      sections: args.sections,
      snapshot,
      token,
      createdBy: identity.subject,
      createdByName: creator?.name ?? creator?.email,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      brandId: args.brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "report_generated",
      entityType: "report",
      entityId: reportId,
      timestamp: Date.now(),
      metadataSafe: { title, rangeFrom, rangeTo },
    });

    return { reportId, token };
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return reports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        _id: r._id,
        title: r.title,
        rangeFrom: r.rangeFrom,
        rangeTo: r.rangeTo,
        sections: r.sections,
        token: r.token,
        createdByName: r.createdByName ?? null,
        createdAt: r.createdAt,
        revokedAt: r.revokedAt ?? null,
        brandId: r.brandId ?? null,
      }));
  },
});

// Public: the share link IS the access control. Returns null for unknown
// or revoked tokens so the viewer can render an honest "unavailable" state.
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("reports")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!report || report.revokedAt !== undefined) {
      return null;
    }
    let brandName = report.snapshot?.brandName as string | undefined;
    if (report.brandId && !brandName) {
      brandName = (await ctx.db.get("brands", report.brandId))?.name;
    }
    return {
      title: report.title,
      rangeFrom: report.rangeFrom,
      rangeTo: report.rangeTo,
      sections: report.sections,
      snapshot: report.snapshot,
      brandName: brandName ?? null,
      createdAt: report.createdAt,
    };
  },
});

export const revoke = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get("reports", args.reportId);
    if (!report) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Report not found." });
    }
    await requireOrganizationMembership(ctx, report.organizationId, ADMIN_ROLES);
    if (report.revokedAt === undefined) {
      await ctx.db.patch("reports", args.reportId, { revokedAt: Date.now() });
    }
  },
});

export const remove = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const report = await ctx.db.get("reports", args.reportId);
    if (!report) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Report not found." });
    }
    const { identity } = await requireOrganizationMembership(
      ctx,
      report.organizationId,
      ADMIN_ROLES,
    );
    await ctx.db.delete("reports", args.reportId);
    await ctx.db.insert("auditEvents", {
      organizationId: report.organizationId,
      brandId: report.brandId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "report_deleted",
      entityType: "report",
      entityId: args.reportId,
      timestamp: Date.now(),
      metadataSafe: { title: report.title },
    });
  },
});
