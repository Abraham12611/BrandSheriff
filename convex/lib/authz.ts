import { ConvexError } from "convex/values";
import type {
  DataModel,
  Id,
} from "../_generated/dataModel";
import type {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

export type AuthCtx =
  | GenericQueryCtx<DataModel>
  | GenericMutationCtx<DataModel>
  | GenericActionCtx<DataModel>;

export type DbAuthCtx =
  | GenericQueryCtx<DataModel>
  | GenericMutationCtx<DataModel>;

export const OWNER_ROLES = ["owner"] as const;
export const ADMIN_ROLES = ["owner", "admin"] as const;
export const APPROVER_ROLES = ["owner", "admin", "approver"] as const;
export const MEMBER_ROLES = ["owner", "admin", "approver", "member", "viewer"] as const;

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return identity;
}

export async function requireOrganizationMembership(
  ctx: DbAuthCtx,
  organizationId: Id<"organizations">,
  allowedRoles: readonly string[] = MEMBER_ROLES,
) {
  const identity = await requireIdentity(ctx);
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", identity.subject),
    )
    .first();
  if (!membership || membership.status !== "active") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Not an active member of this workspace.",
    });
  }
  if (!allowedRoles.includes(membership.role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Insufficient role for this operation.",
    });
  }
  return { identity, membership };
}

export async function listOrganizationIds(ctx: DbAuthCtx) {
  const identity = await requireIdentity(ctx);
  const memberships = await ctx.db
    .query("organizationMembers")
    .withIndex("by_user", (q) => q.eq("userId", identity.subject))
    .collect();
  return {
    identity,
    organizationIds: new Set(
      memberships
        .filter((m) => m.status === "active")
        .map((m) => m.organizationId),
    ),
  };
}

export async function requireBrandAccess(ctx: DbAuthCtx, brandId: Id<"brands">) {
  const brand = await ctx.db.get("brands", brandId);
  if (!brand) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Brand not found." });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    brand.organizationId,
  );
  return { brand, identity, membership };
}

export async function requireCaseAccess(ctx: DbAuthCtx, caseId: Id<"cases">) {
  const c = await ctx.db.get("cases", caseId);
  if (!c) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Case not found." });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    c.organizationId,
  );
  return { case: c, identity, membership };
}

export async function requireDiscoveryAccess(
  ctx: DbAuthCtx,
  discoveryId: Id<"discoveries">,
) {
  const discovery = await ctx.db.get("discoveries", discoveryId);
  if (!discovery) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Discovery not found.",
    });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    discovery.organizationId,
  );
  return { discovery, identity, membership };
}

export async function requireDraftAccess(
  ctx: DbAuthCtx,
  draftId: Id<"draftNotices">,
) {
  const draft = await ctx.db.get("draftNotices", draftId);
  if (!draft) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Draft not found." });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    draft.organizationId,
  );
  return { draft, identity, membership };
}

export async function requireWatchAccess(
  ctx: DbAuthCtx,
  watchId: Id<"hydraWatches">,
) {
  const watch = await ctx.db.get("hydraWatches", watchId);
  if (!watch) {
    throw new ConvexError({ code: "NOT_FOUND", message: "Watch not found." });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    watch.organizationId,
  );
  return { watch, identity, membership };
}

export async function requirePatrolRunAccess(
  ctx: DbAuthCtx,
  runId: Id<"patrolRuns">,
) {
  const run = await ctx.db.get("patrolRuns", runId);
  if (!run) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Patrol run not found.",
    });
  }
  const { identity, membership } = await requireOrganizationMembership(
    ctx,
    run.organizationId,
  );
  return { run, identity, membership };
}
