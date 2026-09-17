import { v } from "convex/values";
import { internalMutation, query, action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";
import type { OutboundId } from "@agentmail/convex";
import type { ComponentApi } from "@agentmail/convex/_generated/component.js";
import { requireIdentity } from "./lib/authz";
import { assertProviderActionsEnabled } from "./providerSafety";
import { agentmailApi } from "./lib/agentmailApi";
import type { Doc } from "./_generated/dataModel";

const agentmail = new AgentMail(
  components.agentmail as unknown as ComponentApi<"agentmail">,
);

export const resolveInbox = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await assertProviderActionsEnabled(ctx, args.organizationId);

    const org = (await ctx.runQuery(internal.organizations.get, {
      organizationId: args.organizationId,
    })) as Doc<"organizations"> | null;

    // Pod-provisioned workspace: prefer the pod's own inbox.
    if (org?.mailboxPodId) {
      const podInboxes = await agentmailApi<{ inboxes?: Array<{ inbox_id: string; email: string }> }>(
        `/pods/${org.mailboxPodId}/inboxes?limit=20`,
      );
      const inbox = (podInboxes.inboxes ?? [])[0];
      if (inbox) {
        await ctx.runMutation(internal.organizations.setMailbox, {
          organizationId: args.organizationId,
          mailboxId: inbox.inbox_id,
          mailboxAddress: inbox.email,
        });
        return inbox;
      }
    }

    let inboxes;
    try {
      inboxes = await agentmail.listInboxes(ctx);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("403") || msg.toLowerCase().includes("permission")) {
        throw new Error(
          "The configured AgentMail API key cannot list inboxes (inbox-scoped key). " +
            "Use an organization-level key, or connect manually with the inbox address.",
        );
      }
      throw e;
    }
    // The component returns the raw AgentMail API response: { inboxes: [...] }.
    const list =
      (inboxes as { inboxes?: Array<{ inbox_id: string; email: string; display_name?: string }> }).inboxes ??
      (Array.isArray(inboxes) ? inboxes : []);
    const inbox = list[0];
    if (!inbox) throw new Error("No AgentMail inbox found for this API key");
    await ctx.runMutation(internal.organizations.setMailbox, {
      organizationId: args.organizationId,
      mailboxId: inbox.inbox_id,
      mailboxAddress: inbox.email,
    });
    return inbox;
  },
});

// For inbox-scoped API keys that cannot call listInboxes: verify the key can
// read the given inbox address directly, then store it on the workspace.
export const connectInboxManual = action({
  args: { organizationId: v.id("organizations"), inboxAddress: v.string() },
  handler: async (ctx, args) => {
    await assertProviderActionsEnabled(ctx, args.organizationId);
    const address = args.inboxAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      throw new Error("Enter a valid inbox email address.");
    }
    let inbox;
    try {
      inbox = await agentmail.getInbox(ctx, address);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not reach inbox "${address}" with the configured API key: ${msg}`);
    }
    const record = inbox as { inbox_id?: string; email?: string } | null;
    await ctx.runMutation(internal.organizations.setMailbox, {
      organizationId: args.organizationId,
      mailboxId: record?.inbox_id ?? address,
      mailboxAddress: record?.email ?? address,
    });
    return inbox;
  },
});

export const sendFromCase = internalMutation({
  args: {
    inboxId: v.string(),
    to: v.string(),
    subject: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await agentmail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: args.subject,
      text: args.text,
    });
  },
});

export const sendStatus = query({
  // Plain string at the API edge — the component's branded OutboundId doesn't
  // exist in our dataModel, so clients can't produce it.
  args: { outboundId: v.string() },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const draft = await ctx.db
      .query("draftNotices")
      .withIndex("by_outbound", (q) => q.eq("outboundId", args.outboundId))
      .first();
    if (!draft) {
      throw new Error("Not found or insufficient permissions.");
    }
    const c = await ctx.db.get("cases", draft.caseId);
    if (!c) {
      throw new Error("Case not found.");
    }
    return await agentmail.status(ctx, args.outboundId as OutboundId);
  },
});
