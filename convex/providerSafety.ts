import { ConvexError } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export async function assertProviderActionsEnabled(
  ctx: GenericActionCtx<DataModel>,
  organizationId: Id<"organizations">,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }

  const { org } = await ctx.runQuery(internal.authzActions.requireActiveMembership, {
    organizationId,
  });

  const settings = (org.settings ?? {}) as { providerActionsEnabled?: boolean };
  if (!settings.providerActionsEnabled) {
    throw new ConvexError({
      code: "PROVIDER_ACTIONS_DISABLED",
      message:
        "Provider and paid actions are not enabled for this workspace. An owner or admin must enable them first.",
    });
  }
}

export function assertDataSeedingEnabled(): void {
  throw new ConvexError({
    code: "DEMO_SEEDING_DISABLED",
    message:
      "Demo workspace seeding is disabled in the main application. Use the separate demo experience.",
  });
}
