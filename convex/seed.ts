import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertDataSeedingEnabled } from "./providerSafety";

export const loadDemoWorkspace = mutation({
  args: { demoBaseUrl: v.string() },
  handler: async (ctx, args) => {
    assertDataSeedingEnabled();
    const existing = await ctx.db.query("organizations").first();
    const organizationId = existing?._id ?? await ctx.db.insert("organizations", {
      name: "Demo workspace",
      slug: "demo",
      ownerUserId: "demo-user",
      plan: "demo",
      settings: {},
    });

    const northstarUrl = `${args.demoBaseUrl.replace(/\/$/, "")}/demo/northstar/`;
    const brandId = await ctx.db.insert("brands", {
      organizationId,
      name: "Northstar Atelier",
      canonicalDomain: northstarUrl,
      description: "Premium travel accessories",
      status: "active",
      brandDnaStatus: "pending",
    });

    await ctx.db.insert("patrols", {
      organizationId,
      brandId,
      name: "Northstar brand patrol",
      type: "brand_name",
      enabled: true,
      config: { demoBaseUrl: args.demoBaseUrl },
    });

    return { brandId, organizationId };
  },
});
