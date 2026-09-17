import { v } from "convex/values";
import { action, internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { env } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { agentmailApi } from "./lib/agentmailApi";
import { assertProviderActionsEnabled } from "./providerSafety";

const WEBHOOK_EVENT_TYPES = [
  "message.received",
  "message.sent",
  "message.delivered",
  "message.bounced",
  "message.complained",
  "message.rejected",
];

type Pod = { pod_id: string; client_id?: string; name?: string };
type Inbox = { inbox_id: string; email: string; display_name?: string };

// Provision a dedicated AgentMail pod + inbox for a workspace so each
// tenant sends from its own isolated identity (pod per workspace,
// client_id = organizationId). Also ensures an org-level webhook points
// at this deployment so inbound mail routes back.
export const provision = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await assertProviderActionsEnabled(ctx, args.organizationId);
    await ctx.runQuery(internal.authzActions.requireActiveMembership, {
      organizationId: args.organizationId,
      allowedRoles: ["owner", "admin"],
    });

    const org = (await ctx.runQuery(internal.organizations.get, {
      organizationId: args.organizationId,
    })) as Doc<"organizations"> | null;
    if (!org) throw new Error("Workspace not found");

    if (org.mailboxId && org.mailboxPodId) {
      return {
        alreadyProvisioned: true,
        podId: org.mailboxPodId,
        inboxId: org.mailboxId,
        email: org.mailboxAddress ?? "",
        webhookId: org.mailboxWebhookId ?? null,
        webhookCreated: false,
      };
    }

    // 1. Pod — find by client_id or create.
    const pods = await agentmailApi<{ pods?: Pod[] }>("/pods?limit=100");
    let pod = (pods.pods ?? []).find((p) => p.client_id === args.organizationId);
    if (!pod) {
      pod = await agentmailApi<Pod>("/pods", {
        method: "POST",
        body: { name: org.name, client_id: args.organizationId },
      });
    }
    const podId = pod.pod_id;

    // 2. Inbox — reuse the pod's first inbox or create one.
    const inboxes = await agentmailApi<{ inboxes?: Inbox[] }>(
      `/pods/${podId}/inboxes?limit=20`,
    );
    let inbox = (inboxes.inboxes ?? [])[0];
    if (!inbox) {
      const username = org.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 24);
      try {
        inbox = await agentmailApi<Inbox>(`/pods/${podId}/inboxes`, {
          method: "POST",
          body: {
            username: `bp-${username}`,
            display_name: `${org.name} Brand Protection`,
            client_id: args.organizationId,
          },
        });
      } catch {
        // Username may collide globally — let AgentMail pick one.
        inbox = await agentmailApi<Inbox>(`/pods/${podId}/inboxes`, {
          method: "POST",
          body: { display_name: `${org.name} Brand Protection`, client_id: args.organizationId },
        });
      }
    }

    // 3. Org-level webhook — one endpoint covers every pod's events.
    const siteUrl = env.CONVEX_SITE_URL;
    if (!siteUrl) throw new Error("CONVEX_SITE_URL is not set on this deployment.");
    const webhookUrl = `${siteUrl}/agentmail/webhook`;
    const webhooks = await agentmailApi<{
      webhooks?: Array<{ webhook_id: string; url: string; enabled?: boolean }>;
    }>("/webhooks?limit=50");
    let webhook = (webhooks.webhooks ?? []).find((w) => w.url === webhookUrl);
    let webhookCreated = false;
    if (!webhook) {
      const created = await agentmailApi<{
        webhook_id: string;
        secret?: string;
      }>("/webhooks", {
        method: "POST",
        body: {
          url: webhookUrl,
          event_types: WEBHOOK_EVENT_TYPES,
          client_id: "brandsheriff-platform",
        },
      });
      webhook = { webhook_id: created.webhook_id, url: webhookUrl };
      webhookCreated = true;
      if (created.secret) {
        await ctx.runMutation(internal.webhookSecrets.store, {
          scope: "platform",
          webhookId: created.webhook_id,
          secret: created.secret,
        });
      }
    }

    await ctx.runMutation(internal.mailProvision.commit, {
      organizationId: args.organizationId,
      mailboxId: inbox.inbox_id,
      mailboxAddress: inbox.email,
      podId,
      webhookId: webhook.webhook_id,
      actorId: (await ctx.auth.getUserIdentity())?.subject ?? "unknown",
      email: inbox.email,
    });

    return {
      alreadyProvisioned: false,
      podId,
      inboxId: inbox.inbox_id,
      email: inbox.email,
      webhookId: webhook.webhook_id,
      webhookCreated,
    };
  },
});

// Ops diagnostic: confirms the org-level AgentMail key works and reports how
// many pods exist. Returns status/counts only — never credentials.
export const probe = internalAction({
  args: {},
  returns: v.object({ ok: v.boolean(), pods: v.number(), webhooks: v.number() }),
  handler: async () => {
    const pods = await agentmailApi<{ pods?: Pod[] }>("/pods?limit=100");
    const webhooks = await agentmailApi<{ webhooks?: unknown[] }>("/webhooks?limit=50");
    return {
      ok: true,
      pods: (pods.pods ?? []).length,
      webhooks: (webhooks.webhooks ?? []).length,
    };
  },
});

export const commit = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    mailboxId: v.string(),
    mailboxAddress: v.string(),
    podId: v.string(),
    webhookId: v.string(),
    actorId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("organizations", args.organizationId, {
      mailboxId: args.mailboxId,
      mailboxAddress: args.mailboxAddress,
      mailboxPodId: args.podId,
      mailboxWebhookId: args.webhookId,
      mailboxProvisionedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("auditEvents", {
      organizationId: args.organizationId,
      actorType: "user",
      actorId: args.actorId,
      eventType: "mailbox_provisioned",
      entityType: "organization",
      entityId: args.organizationId,
      timestamp: Date.now(),
      metadataSafe: { podId: args.podId, inboxId: args.mailboxId, email: args.email },
    });
  },
});
