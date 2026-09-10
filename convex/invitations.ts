import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const create = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
    token: v.string(),
    invitedBy: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx: any, args) => {
    return await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: args.email.toLowerCase(),
      role: args.role,
      token: args.token,
      status: "pending",
      invitedBy: args.invitedBy,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });
  },
});

export const getByToken = internalQuery({
  args: { token: v.string() },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .first();
  },
});

export const markAccepted = internalMutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx: any, args) => {
    await ctx.db.patch(args.invitationId, { status: "accepted" });
  },
});

export const expireStale = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();
    const stale = await ctx.db
      .query("invitations")
      .filter((q: any) => q.lt(q.field("expiresAt"), now))
      .collect();
    for (const invite of stale) {
      if (invite.status === "pending") {
        await ctx.db.patch(invite._id, { status: "expired" });
      }
    }
    return stale.length;
  },
});
