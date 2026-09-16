import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { MEMBER_ROLES, requireOrganizationMembership } from "./lib/authz";

export const listRecent = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, 15);
  },
});

export const unreadCount = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    return rows.filter((r) => r.readAt === undefined).length;
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
