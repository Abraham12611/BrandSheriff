import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireBrandAccess } from "./lib/authz";

export const generateUploadUrl = mutation({
  args: { brandId: v.id("brands") },
  handler: async (ctx, args) => {
    await requireBrandAccess(ctx, args.brandId);
    return await ctx.storage.generateUploadUrl();
  },
});
