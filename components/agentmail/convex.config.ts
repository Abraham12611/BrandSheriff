// Vendored from @agentmail/convex@0.1.0 (Apache-2.0). The published component
// reads AGENTMAIL_API_KEY from process.env but declares no env schema, so under
// typed env it never receives the key. This copy declares the env vars so the
// app can bind them via app.use(..., { env: ... }).
import { defineComponent } from "convex/server";
import { v } from "convex/values";
import workpool from "@convex-dev/workpool/convex.config";

const component = defineComponent("agentmail", {
  env: {
    AGENTMAIL_API_KEY: v.optional(v.string()),
    AGENTMAIL_BASE_URL: v.optional(v.string()),
    AGENTMAIL_WEBHOOK_SECRET: v.optional(v.string()),
  },
});
component.use(workpool, { name: "sendPool" });
component.use(workpool, { name: "callbackPool" });

export default component;
