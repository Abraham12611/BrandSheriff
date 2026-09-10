import { v } from "convex/values";
import { internalMutation, query, action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { AgentMail, vOutboundId } from "@agentmail/convex";
import { assertPrototypeWriteEnabled } from "./prototypeSafety";

const agentmail = new AgentMail(components.agentmail);

export const resolveInbox = action({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    assertPrototypeWriteEnabled();
    const inboxes = await agentmail.listInboxes(ctx);
    const list = (inboxes as { data?: Array<{ inbox_id: string; email: string; display_name?: string }> }).data ?? [];
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
  args: { outboundId: vOutboundId },
  handler: async (ctx, args) => {
    return await agentmail.status(ctx, args.outboundId);
  },
});
