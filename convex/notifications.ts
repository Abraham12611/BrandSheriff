import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MEMBER_ROLES, requireOrganizationMembership } from "./lib/authz";

// Every notification type a member can toggle. Unknown/future types default
// to enabled until they're added here.
const NOTIFICATION_TYPES = [
  {
    type: "reply_received",
    label: "Replies to notices",
    description: "When a recipient replies to a sent notice",
  },
  {
    type: "watch_hit",
    label: "Watch alerts",
    description: "When a watched listing reappears or changes",
  },
  {
    type: "discovery_alert",
    label: "Urgent discoveries",
    description: "Exact asset matches and high-severity patrol findings",
  },
  {
    type: "counter_notice",
    label: "Legal escalations",
    description: "Counter-notices, legal responses and platform decisions needing attention",
  },
] as const;

function isMuted(prefs: Record<string, boolean> | undefined, type: string) {
  return prefs?.[type] === false;
}

export const listRecent = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { membership } = await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const prefs = (membership as { notificationPrefs?: Record<string, boolean> }).notificationPrefs;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows
      .filter((r) => !isMuted(prefs, r.type))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 15);
  },
});

export const unreadCount = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { membership } = await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const prefs = (membership as { notificationPrefs?: Record<string, boolean> }).notificationPrefs;
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows.filter((r) => r.readAt === undefined && !isMuted(prefs, r.type)).length;
  },
});

// Effective preferences for the calling member — every known type plus its
// current enabled state (default true when unset).
export const prefs = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { membership } = await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const stored = (membership as { notificationPrefs?: Record<string, boolean> }).notificationPrefs ?? {};
    return NOTIFICATION_TYPES.map((t) => ({
      ...t,
      enabled: stored[t.type] !== false,
    }));
  },
});

export const setPref = mutation({
  args: {
    organizationId: v.id("organizations"),
    type: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const stored = (membership as { notificationPrefs?: Record<string, boolean> }).notificationPrefs ?? {};
    await ctx.db.patch("organizationMembers", membership._id, {
      notificationPrefs: { ...stored, [args.type]: args.enabled },
      updatedAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const n = await ctx.db.get("notifications", args.notificationId);
    if (!n) return;
    await requireOrganizationMembership(ctx, n.organizationId, MEMBER_ROLES);
    if (n.readAt === undefined) {
      await ctx.db.patch("notifications", args.notificationId, { readAt: Date.now() });
    }
  },
});

export const markAllRead = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    const now = Date.now();
    for (const r of rows) {
      if (r.readAt === undefined) {
        await ctx.db.patch("notifications", r._id, { readAt: now });
      }
    }
  },
});
