import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ADMIN_ROLES, requireOrganizationMembership } from "./lib/authz";

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    domain: v.string(),
  },
  handler: async (ctx: any, args) => {
    const { identity } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );

    const normalizedDomain = args.domain.toLowerCase();
    const existing = await ctx.db
      .query("domainVerifications")
      .withIndex("by_domain", (q: any) => q.eq("domain", normalizedDomain))
      .first();
    if (existing) {
      throw new Error("Domain verification already exists.");
    }

    const token = crypto.randomUUID();
    const id = await ctx.db.insert("domainVerifications", {
      organizationId: args.organizationId,
      domain: normalizedDomain,
      status: "pending",
      token,
      createdAt: Date.now(),
    });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "created",
      entityType: "domainVerification",
      entityId: id,
      timestamp: Date.now(),
      metadataSafe: { domain: normalizedDomain },
    });

    return { id, token };
  },
});

export const verify = mutation({
  args: {
    domainVerificationId: v.id("domainVerifications"),
    token: v.string(),
  },
  handler: async (ctx: any, args) => {
    const record = await ctx.db.get("domainVerifications", args.domainVerificationId as any);
    if (!record) {
      throw new Error("Domain verification not found.");
    }
    const { identity } = await requireOrganizationMembership(
      ctx,
      record.organizationId as any,
      ADMIN_ROLES,
    );

    if (record.token !== args.token) {
      throw new Error("Invalid verification token.");
    }

    await ctx.db.patch(args.domainVerificationId, {
      status: "verified",
      verifiedAt: Date.now(),
    });

    await ctx.db.insert("auditEvents", {
      organizationId: record.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "verified",
      entityType: "domainVerification",
      entityId: record._id,
      timestamp: Date.now(),
      metadataSafe: { domain: record.domain },
    });
  },
});

export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx: any, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    return await ctx.db
      .query("domainVerifications")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});
