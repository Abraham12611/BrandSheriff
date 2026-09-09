import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";

export const setMailbox = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    mailboxId: v.string(),
    mailboxAddress: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.organizationId, {
      mailboxId: args.mailboxId,
      mailboxAddress: args.mailboxAddress,
    });
  },
});

export const get = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});
