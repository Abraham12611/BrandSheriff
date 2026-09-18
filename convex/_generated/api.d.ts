/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as approvals from "../approvals.js";
import type * as auditEvents from "../auditEvents.js";
import type * as authzActions from "../authzActions.js";
import type * as brandAssets from "../brandAssets.js";
import type * as brandDna from "../brandDna.js";
import type * as brands from "../brands.js";
import type * as cases from "../cases.js";
import type * as contactResearch from "../contactResearch.js";
import type * as crons from "../crons.js";
import type * as discoveries from "../discoveries.js";
import type * as domainVerifications from "../domainVerifications.js";
import type * as draftNotices from "../draftNotices.js";
import type * as enforcement from "../enforcement.js";
import type * as enforcementFlow from "../enforcementFlow.js";
import type * as evidenceItems from "../evidenceItems.js";
import type * as files from "../files.js";
import type * as forensics from "../forensics.js";
import type * as http from "../http.js";
import type * as hydra from "../hydra.js";
import type * as images from "../images.js";
import type * as interact from "../interact.js";
import type * as invitations from "../invitations.js";
import type * as keywords from "../keywords.js";
import type * as lib_agentmailApi from "../lib/agentmailApi.js";
import type * as lib_authz from "../lib/authz.js";
import type * as lib_firecrawlApi from "../lib/firecrawlApi.js";
import type * as lib_openai from "../lib/openai.js";
import type * as lib_phash from "../lib/phash.js";
import type * as lib_platform from "../lib/platform.js";
import type * as mail from "../mail.js";
import type * as mailInbound from "../mailInbound.js";
import type * as mailProvision from "../mailProvision.js";
import type * as memberships from "../memberships.js";
import type * as monitors from "../monitors.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as patrol from "../patrol.js";
import type * as patrolRuns from "../patrolRuns.js";
import type * as providerSafety from "../providerSafety.js";
import type * as rechecks from "../rechecks.js";
import type * as replyClassification from "../replyClassification.js";
import type * as reports from "../reports.js";
import type * as scans from "../scans.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";
import type * as webhookSecrets from "../webhookSecrets.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  approvals: typeof approvals;
  auditEvents: typeof auditEvents;
  authzActions: typeof authzActions;
  brandAssets: typeof brandAssets;
  brandDna: typeof brandDna;
  brands: typeof brands;
  cases: typeof cases;
  contactResearch: typeof contactResearch;
  crons: typeof crons;
  discoveries: typeof discoveries;
  domainVerifications: typeof domainVerifications;
  draftNotices: typeof draftNotices;
  enforcement: typeof enforcement;
  enforcementFlow: typeof enforcementFlow;
  evidenceItems: typeof evidenceItems;
  files: typeof files;
  forensics: typeof forensics;
  http: typeof http;
  hydra: typeof hydra;
  images: typeof images;
  interact: typeof interact;
  invitations: typeof invitations;
  keywords: typeof keywords;
  "lib/agentmailApi": typeof lib_agentmailApi;
  "lib/authz": typeof lib_authz;
  "lib/firecrawlApi": typeof lib_firecrawlApi;
  "lib/openai": typeof lib_openai;
  "lib/phash": typeof lib_phash;
  "lib/platform": typeof lib_platform;
  mail: typeof mail;
  mailInbound: typeof mailInbound;
  mailProvision: typeof mailProvision;
  memberships: typeof memberships;
  monitors: typeof monitors;
  notifications: typeof notifications;
  organizations: typeof organizations;
  patrol: typeof patrol;
  patrolRuns: typeof patrolRuns;
  providerSafety: typeof providerSafety;
  rechecks: typeof rechecks;
  replyClassification: typeof replyClassification;
  reports: typeof reports;
  scans: typeof scans;
  seed: typeof seed;
  users: typeof users;
  verification: typeof verification;
  webhookSecrets: typeof webhookSecrets;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  agentmail: import("../../components/agentmail/_generated/component.js").ComponentApi<"agentmail">;
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
};
