import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { ADMIN_ROLES, requireIdentity, requireOrganizationMembership } from "./lib/authz";

async function countActiveOwners(ctx: any, organizationId: string) {
  const members = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
    .collect();
  return members.filter(
    (m: any) => m.status === "active" && m.role === "owner",
  ).length;
}

export const create = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.string(),
    invitedBy: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const now = Date.now();
    return await ctx.db.insert("organizationMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      status: "active",
      invitedBy: args.invitedBy,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const invite = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx: any, args) => {
    const { identity } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );

    const normalizedEmail = args.email.toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", normalizedEmail))
      .first();
    if (user) {
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_user", (q: any) =>
          q.eq("organizationId", args.organizationId).eq("userId", user.clerkId),
        )
        .first();
      if (existingMember?.status === "active") {
        throw new Error("This user is already an active member of the workspace.");
      }
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: normalizedEmail,
      role: args.role,
      token,
      status: "pending",
      invitedBy: identity.subject,
      createdAt: Date.now(),
      expiresAt,
    });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "invited",
      entityType: "invitation",
      entityId: invitationId,
      timestamp: Date.now(),
      metadataSafe: { email: normalizedEmail, role: args.role },
    });

    return { token, invitationId };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx: any, args) => {
    const identity = await requireIdentity(ctx);
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .first();
    if (!invitation || invitation.status !== "pending") {
      throw new Error("Invitation not found or already used.");
    }
    if (invitation.expiresAt < Date.now()) {
      throw new Error("Invitation has expired.");
    }
    const userEmail = (identity.email ?? "").toLowerCase();
    if (userEmail !== invitation.email) {
      throw new Error("This invitation was sent to a different email address.");
    }

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

    const existingMember = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", invitation.organizationId).eq("userId", identity.subject),
      )
      .first();

    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        role: invitation.role,
        status: "active",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("organizationMembers", {
        organizationId: invitation.organizationId,
        userId: identity.subject,
        role: invitation.role,
        status: "active",
        invitedBy: invitation.invitedBy,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(invitation._id, { status: "accepted" });

    await ctx.db.insert("auditEvents", {
      organizationId: invitation.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "accepted_invitation",
      entityType: "invitation",
      entityId: invitation._id,
      timestamp: now,
      metadataSafe: { role: invitation.role },
    });

    return { organizationId: invitation.organizationId };
  },
});

export const remove = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.string(),
  },
  handler: async (ctx: any, args) => {
    const { identity, membership } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );

    if (membership.userId === args.userId && membership.role === "owner") {
      throw new Error("You cannot remove yourself as an owner.");
    }

    const target = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();
    if (!target) {
      throw new Error("Member not found.");
    }

    if (target.role === "owner" && (await countActiveOwners(ctx, args.organizationId)) <= 1) {
      throw new Error("Cannot remove the last owner.");
    }

    await ctx.db.patch(target._id, { status: "revoked", updatedAt: Date.now() });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "removed",
      entityType: "organizationMember",
      entityId: args.userId,
      timestamp: Date.now(),
      metadataSafe: { role: target.role },
    });
  },
});

export const updateRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.string(),
  },
  handler: async (ctx: any, args) => {
    const { identity, membership } = await requireOrganizationMembership(
      ctx,
      args.organizationId,
      ADMIN_ROLES,
    );

    if (membership.userId === args.userId && membership.role === "owner" && args.role !== "owner") {
      if ((await countActiveOwners(ctx, args.organizationId)) <= 1) {
        throw new Error("Cannot downgrade the last owner.");
      }
    }

    const target = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_user", (q: any) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();
    if (!target) {
      throw new Error("Member not found.");
    }

    await ctx.db.patch(target._id, { role: args.role, updatedAt: Date.now() });

    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: identity.subject,
      eventType: "role_changed",
      entityType: "organizationMember",
      entityId: args.userId,
      timestamp: Date.now(),
      metadataSafe: { from: target.role, to: args.role },
    });
  },
});

export const listByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx: any, args) => {
    await requireOrganizationMembership(ctx, args.organizationId);
    return await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q: any) => q.eq("organizationId", args.organizationId))
      .collect();
  },
});
