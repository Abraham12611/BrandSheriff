import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/authz";

export const upsert = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        lastSeenAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      lastSeenAt: now,
      createdAt: now,
    });
  },
});

export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const ensureCurrent = mutation({
  args: {},
  handler: async (ctx: any) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
        lastSeenAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      imageUrl: identity.pictureUrl,
      lastSeenAt: now,
      createdAt: now,
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
  },
});
