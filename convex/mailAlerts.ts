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
    return { sent: true, recipients: recipients.length };
  },
});
