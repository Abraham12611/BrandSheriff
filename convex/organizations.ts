import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { ADMIN_ROLES, listOrganizationIds, requireIdentity, requireOrganizationMembership } from "./lib/authz";

export const setMailbox = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    mailboxId: v.string(),
    mailboxAddress: v.string(),
    podId: v.optional(v.string()),
    webhookId: v.optional(v.string()),
    provisioned: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args) => {
    await ctx.db.patch(args.organizationId, {
      mailboxId: args.mailboxId,
      mailboxAddress: args.mailboxAddress,
      ...(args.podId !== undefined ? { mailboxPodId: args.podId } : {}),
      ...(args.webhookId !== undefined ? { mailboxWebhookId: args.webhookId } : {}),
      ...(args.provisioned ? { mailboxProvisionedAt: Date.now() } : {}),
      updatedAt: Date.now(),
    });
  },
});

export const get = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await requireIdentity(ctx);

    const now = Date.now();
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name,
        imageUrl: identity.pictureUrl,
        lastSeenAt: now,
        createdAt: now,
      });
    }

    const slug =
      args.slug ??
      (args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace");
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug,
      ownerUserId: identity.subject,
      plan: "trial",
      settings: { providerActionsEnabled: false },
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: identity.subject,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditEvents", {
      organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "created",
      entityType: "organization",
      entityId: organizationId,
      timestamp: now,
      metadataSafe: { name: args.name },
    });

    return organizationId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { organizationIds } = await listOrganizationIds(ctx);
    const orgs = await Promise.all(
      [...organizationIds].map((id) => ctx.db.get("organizations", id as any)),
    );
    return orgs.filter((org) => org !== null);
  },
});

export const getById = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    return await ctx.db.get(args.organizationId);
  },
});

export const enableProviderActions = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { identity, membership } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Workspace not found");

    const settings = (org.settings ?? {}) as { providerActionsEnabled?: boolean };
    if (settings.providerActionsEnabled) {
      return { alreadyEnabled: true };
    }

    await ctx.db.patch(args.organizationId, {
      settings: { ...settings, providerActionsEnabled: true },
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "provider_actions_enabled",
      entityType: "organization",
      entityId: args.organizationId,
      timestamp: Date.now(),
      metadataSafe: { role: membership.role },
    });

    return { alreadyEnabled: false };
  },
});

/** Workspace settings — name, default severity, alert routing. Admin-gated. */
export const updateSettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { identity, membership } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Workspace not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (!trimmed) throw new Error("Workspace name cannot be empty.");
      patch.name = trimmed;
    }
    if (args.settings !== undefined) {
      patch.settings = { ...(org.settings ?? {}), ...args.settings };
    }
    await ctx.db.patch(args.organizationId, patch);

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "settings_updated",
      entityType: "organization",
      entityId: args.organizationId,
      timestamp: Date.now(),
      metadataSafe: { role: membership.role },
    });
  },
});
