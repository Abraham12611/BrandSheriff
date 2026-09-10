import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { ConvexError } from "convex/values";

export const requireActiveMembership = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    allowedRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required.",
      });
    }

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", identity.subject),
      )
      .first();

    if (!membership || membership.status !== "active") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not an active member of this workspace.",
      });
    }

    if (args.allowedRoles && !args.allowedRoles.includes(membership.role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Insufficient role for this operation.",
      });
    }

    const org = await ctx.db.get("organizations", args.organizationId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workspace not found.",
      });
    }

    return { membership, org };
  },
});
