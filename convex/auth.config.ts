import type { AuthConfig } from "convex/server";

declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      // Set CLERK_FRONTEND_API_URL on the Convex deployment (see Convex docs).
      domain: process.env.CLERK_FRONTEND_API_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
