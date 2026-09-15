import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";
import type { ComponentApi } from "@agentmail/convex/_generated/component.js";

const agentmail = new AgentMail(
  components.agentmail as unknown as ComponentApi<"agentmail">,
);
const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) =>
    agentmail.handleWebhook(ctx as any, req)
  ),
});

export default http;
