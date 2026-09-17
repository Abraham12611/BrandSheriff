import { httpRouter, createFunctionHandle } from "convex/server";
import { httpAction } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import {
  verifyAgentMailWebhook,
  WebhookVerificationError,
} from "@agentmail/convex";

const http = httpRouter();

// Multi-secret verification: the platform webhook may come from the
// env-configured secret OR from a webhook we provisioned via the API
// (secrets live in the webhookSecrets table — backend-only).
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const raw = await req.text();
    const headers = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    };

    const stored = (await ctx.runQuery(internal.webhookSecrets.listAll, {})) as Array<{
      secret: string;
    }>;
    const secrets = new Set(
      [env.AGENTMAIL_WEBHOOK_SECRET, ...stored.map((s) => s.secret)].filter(
        (s): s is string => typeof s === "string" && s.length > 0,
      ),
    );

    if (secrets.size === 0) {
      return new Response("webhook not configured", { status: 500 });
    }

    for (const secret of secrets) {
      try {
        const event = verifyAgentMailWebhook(secret, raw, headers);
        await ctx.runMutation(components.agentmail.lib.handleEvent, {
          config: {
            retryAttempts: 5,
            initialBackoffMs: 30_000,
            onMessageReceived: {
              fnHandle: await createFunctionHandle(
                internal.mailInbound.onMessageReceived,
              ),
            },
          },
          event,
        });
        return new Response(null, { status: 204 });
      } catch (e) {
        if (!(e instanceof WebhookVerificationError)) throw e;
      }
    }
    return new Response("invalid signature", { status: 401 });
  }),
});

// Firecrawl monitor deliveries. Authenticated by a per-watch bearer token sent
// as the X-BS-Token header (configured on the monitor's webhook at provision).
// NOTE: lives off the /firecrawl/ prefix — the vendored component mounts its
// own crawl-callback route at /firecrawl/webhook, which we must not shadow.
http.route({
  path: "/monitor/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const token = req.headers.get("x-bs-token") ?? "";
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response("bad request", { status: 400 });
    }
    const res = (await ctx.runMutation(internal.monitors.handleEvent, {
      token,
      payload,
    })) as { ok: boolean };
    if (!res.ok) return new Response("unauthorized", { status: 401 });
    return new Response(null, { status: 204 });
  }),
});

export default http;
