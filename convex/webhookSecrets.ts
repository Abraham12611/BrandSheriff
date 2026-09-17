import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Signing secrets for webhooks we create via the AgentMail API. Only
// internal functions touch this table — never expose secrets to the client.
export const store = internalMutation({
  args: { scope: v.string(), webhookId: v.string(), secret: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookSecrets")
      .withIndex("by_scope", (q) => q.eq("scope", args.scope))
      .first();
    if (existing) {
      await ctx.db.patch("webhookSecrets", existing._id, {
        webhookId: args.webhookId,
        secret: args.secret,
      });
      return;
    }
    await ctx.db.insert("webhookSecrets", {
      scope: args.scope,
      webhookId: args.webhookId,
      secret: args.secret,
      createdAt: Date.now(),
    });
  },
});

export const listAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("webhookSecrets").collect();
  },
});
