/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as approvals from "../approvals.js";
import type * as brandAssets from "../brandAssets.js";
import type * as brandDna from "../brandDna.js";
import type * as brands from "../brands.js";
import type * as cases from "../cases.js";
import type * as discoveries from "../discoveries.js";
import type * as domainVerifications from "../domainVerifications.js";
import type * as draftNotices from "../draftNotices.js";
import type * as enforcement from "../enforcement.js";
import type * as evidenceItems from "../evidenceItems.js";
import type * as forensics from "../forensics.js";
import type * as http from "../http.js";
import type * as hydra from "../hydra.js";
import type * as invitations from "../invitations.js";
import type * as lib_authz from "../lib/authz.js";
import type * as mail from "../mail.js";
import type * as memberships from "../memberships.js";
import type * as organizations from "../organizations.js";
import type * as patrol from "../patrol.js";
import type * as patrolRuns from "../patrolRuns.js";
import type * as prototypeSafety from "../prototypeSafety.js";
import type * as rechecks from "../rechecks.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as verification from "../verification.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  approvals: typeof approvals;
  brandAssets: typeof brandAssets;
  brandDna: typeof brandDna;
  brands: typeof brands;
  cases: typeof cases;
  discoveries: typeof discoveries;
  domainVerifications: typeof domainVerifications;
  draftNotices: typeof draftNotices;
  enforcement: typeof enforcement;
  evidenceItems: typeof evidenceItems;
  forensics: typeof forensics;
  http: typeof http;
  hydra: typeof hydra;
  invitations: typeof invitations;
  "lib/authz": typeof lib_authz;
  mail: typeof mail;
  memberships: typeof memberships;
  organizations: typeof organizations;
  patrol: typeof patrol;
  patrolRuns: typeof patrolRuns;
  prototypeSafety: typeof prototypeSafety;
  rechecks: typeof rechecks;
  seed: typeof seed;
  users: typeof users;
  verification: typeof verification;
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
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
};
