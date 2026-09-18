/**
 * Mail alerts — dynamic AgentMail notifications to workspace members.
 *
 * Sends from the workspace's provisioned AgentMail inbox to the email
 * addresses of owner/admin members (and any member whose
 * notificationPrefs.alerts isn't explicitly false). Triggered by
 * system-side events like a high-confidence visual match on a discovery.
 * Deduped per discovery via `alertSentAt`.
 */

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

/** Members who should receive alert emails: active owners/admins, plus any
 * active member who hasn't opted out via notificationPrefs.alerts. */
export const recipientsInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const eligible = members.filter(
      (m: any) =>
        m.status === "active" &&
        (m.role === "owner" || m.role === "admin" || m.notificationPrefs?.alerts !== false),
    );
    const emails: string[] = [];
    for (const m of eligible) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", m.userId))
        .first();
      if (user?.email) emails.push(user.email);
    }
    return emails;
  },
});

export const getDiscoveryInternal = internalQuery({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => await ctx.db.get(args.discoveryId),
});

export const getOrgInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => await ctx.db.get(args.organizationId),
});

export const markAlertedInternal = internalMutation({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.discoveryId, { alertSentAt: Date.now() });
  },
});

/** Send an urgent-discovery alert to the workspace. No-op without a
 * provisioned mailbox, without recipients, or if already alerted. */
export const notifyDiscovery = internalAction({
  args: {
    discoveryId: v.id("discoveries"),
    reason: v.string(), // "visual_match" | "severity" | "watch_hit" | "recurrence"
  },
  handler: async (ctx, args): Promise<any> => {
    const discovery: any = await ctx.runQuery(internal.mailAlerts.getDiscoveryInternal, {
      discoveryId: args.discoveryId,
    });
    if (!discovery || discovery.alertSentAt) return { sent: false, reason: "deduped" };

    const org: any = await ctx.runQuery(internal.mailAlerts.getOrgInternal, {
      organizationId: discovery.organizationId,
    });
    if (!org?.mailboxId) return { sent: false, reason: "no_mailbox" };

    const recipients: string[] = await ctx.runQuery(internal.mailAlerts.recipientsInternal, {
      organizationId: discovery.organizationId,
    });
    if (recipients.length === 0) return { sent: false, reason: "no_recipients" };

    const host = (() => {
      try {
        return new URL(discovery.canonicalUrl).hostname;
      } catch {
        return discovery.canonicalUrl;
      }
    })();
    const score =
      discovery.visualMatchScore !== undefined
        ? `Visual match: ${Math.round(discovery.visualMatchScore * 100)}%`
        : null;
    const reasonLabel =
      args.reason === "visual_match"
        ? "Exact/re-hosted brand imagery detected"
        : args.reason === "watch_hit"
          ? "Watched target resurfaced"
          : args.reason === "recurrence"
            ? "Probable repeat offender"
            : "High-severity patrol finding";

    const subject = `[BrandSheriff] ${reasonLabel} — ${host}`;
    const text = [
      `${reasonLabel} on ${host}.`,
      ``,
      `URL: ${discovery.canonicalUrl}`,
      score,
      discovery.severity ? `Severity: ${discovery.severity}` : null,
      discovery.matchedQuery ? `Matched query: ${discovery.matchedQuery}` : null,
      ``,
      `Review it in BrandSheriff → Discoveries.`,
    ]
      .filter(Boolean)
      .join("\n");

    for (const to of recipients) {
      try {
        await ctx.runMutation(internal.mail.sendFromCase, {
          inboxId: org.mailboxId,
          to,
          subject,
          text,
        });
      } catch {
        // A bad recipient shouldn't block the rest.
      }
    }
    await ctx.runMutation(internal.mailAlerts.markAlertedInternal, {
      discoveryId: args.discoveryId,
    });
    await ctx.runMutation(internal.mailAlerts.insertNotificationInternal, {
      organizationId: discovery.organizationId,
      type: "discovery_alert",
      title: `${reasonLabel} — ${host}`,
      body: score ?? discovery.canonicalUrl,
      href: "/discoveries",
    });
    return { sent: true, recipients: recipients.length };
  },
});

export const insertNotificationInternal = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    caseId: v.optional(v.id("cases")),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      organizationId: args.organizationId,
      type: args.type,
      title: args.title,
      body: args.body,
      caseId: args.caseId,
      href: args.href,
      createdAt: Date.now(),
    });
  },
});

export const listEnabledOrgs = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    return orgs.filter(
      (o: any) => o.mailboxId && o.settings?.providerActionsEnabled === true,
    );
  },
});

export const digestStatsInternal = internalQuery({
  args: { organizationId: v.id("organizations"), sinceMs: v.number() },
  handler: async (ctx, args) => {
    const since = Date.now() - args.sinceMs;
    const discoveries = await ctx.db
      .query("discoveries")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const actions = await ctx.db
      .query("enforcementActions")
      .withIndex("by_org_status", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();
    const cases = await ctx.db
      .query("cases")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const fresh = discoveries.filter((d) => d._creationTime >= since);
    return {
      newDiscoveries: fresh.length,
      highRisk: fresh.filter((d) => (d.cloneScore ?? 0) >= 70).length,
      needsReview: discoveries.filter((d) => d.status === "needs_review").length,
      activeCases: cases.filter((c) => c.state !== "resolved").length,
      actioned: actions.filter((a) => a.status === "actioned").length,
      inFlight: actions.filter((a) =>
        ["submitted", "platform_reviewing"].includes(a.status),
      ).length,
      topDiscoveries: fresh
        .filter((d) => d.cloneScore !== undefined)
        .sort((a, b) => (b.cloneScore ?? 0) - (a.cloneScore ?? 0))
        .slice(0, 5)
        .map((d) => ({ url: d.canonicalUrl, score: d.cloneScore })),
    };
  },
});

/** Weekly digest — summary email to members who haven't opted out of
 * `digest` notifications. Runs via cron. */
export const sendWeeklyDigest = internalAction({
  args: {},
  handler: async (ctx): Promise<any> => {
    const orgs: any[] = await ctx.runQuery(internal.mailAlerts.listEnabledOrgs, {});
    const sent: string[] = [];
    for (const org of orgs) {
      const recipients: string[] = await ctx.runQuery(
        internal.mailAlerts.digestRecipientsInternal,
        { organizationId: org._id },
      );
      if (recipients.length === 0) continue;
      const stats: any = await ctx.runQuery(internal.mailAlerts.digestStatsInternal, {
        organizationId: org._id,
        sinceMs: 7 * 24 * 60 * 60 * 1000,
      });
      const lines = [
        `Weekly BrandSheriff digest for ${org.name}`,
        ``,
        `${stats.newDiscoveries} new discoveries this week (${stats.highRisk} high-risk)`,
        `${stats.needsReview} still awaiting review`,
        `${stats.activeCases} open cases · ${stats.inFlight} complaints in flight · ${stats.actioned} actioned`,
      ];
      if (stats.topDiscoveries.length > 0) {
        lines.push(``, `Top findings:`);
        for (const t of stats.topDiscoveries) {
          lines.push(`  ${t.score}/100 — ${t.url}`);
        }
      }
      lines.push(``, `Open BrandSheriff → Discoveries to review.`);
      for (const to of recipients) {
        try {
          await ctx.runMutation(internal.mail.sendFromCase, {
            inboxId: org.mailboxId,
            to,
            subject: `[BrandSheriff] Weekly digest — ${stats.newDiscoveries} new, ${stats.highRisk} high-risk`,
            text: lines.join("\n"),
          });
        } catch {
          // keep going
        }
      }
      sent.push(org._id);
    }
    return { sent: sent.length };
  },
});

/** Members opted into digest emails (default on). */
export const digestRecipientsInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const eligible = members.filter(
      (m: any) => m.status === "active" && m.notificationPrefs?.digest !== false,
    );
    const emails: string[] = [];
    for (const m of eligible) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", m.userId))
        .first();
      if (user?.email) emails.push(user.email);
    }
    return emails;
  },
});

/** Watch-hit email — a monitored target changed or was removed. */
export const notifyWatchHit = internalAction({
  args: {
    caseId: v.id("cases"),
    summary: v.string(),
    removed: v.boolean(),
  },
  handler: async (ctx, args): Promise<any> => {
    const theCase: any = await ctx.runQuery(internal.enforcementRoutes.getCaseInternal, {
      caseId: args.caseId,
    });
    if (!theCase) return { sent: false };
    const org: any = await ctx.runQuery(internal.mailAlerts.getOrgInternal, {
      organizationId: theCase.organizationId,
    });
    if (!org?.mailboxId) return { sent: false, reason: "no_mailbox" };
    const recipients: string[] = await ctx.runQuery(internal.mailAlerts.recipientsInternal, {
      organizationId: theCase.organizationId,
    });
    if (recipients.length === 0) return { sent: false };
    const subject = `[BrandSheriff] ${args.removed ? "Monitored page removed — possible takedown" : "Monitored page changed"} — ${theCase.caseNumber}`;
    const text = [
      args.removed
        ? `A monitored page tied to case ${theCase.caseNumber} was removed — possible takedown.`
        : `A monitored page tied to case ${theCase.caseNumber} changed.`,
      ``,
      args.summary,
      ``,
      `Open the case in BrandSheriff for details.`,
    ].join("\n");
    for (const to of recipients) {
      try {
        await ctx.runMutation(internal.mail.sendFromCase, {
          inboxId: org.mailboxId,
          to,
          subject,
          text,
        });
      } catch {
        // keep going
      }
    }
    return { sent: true, recipients: recipients.length };
  },
});
