import { defineApp } from "convex/server";
import { v } from "convex/values";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import agentmail from "@agentmail/convex/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp({
  env: {
    FIRECRAWL_API_KEY: v.string(),
    OPENAI_API_KEY: v.optional(v.string()),
    AGENTMAIL_API_KEY: v.optional(v.string()),
    AGENTMAIL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});

app.use(staticHosting, { httpPrefix: "/" });
app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
  },
});
app.use(agentmail);
app.use(agent);

export default app;
