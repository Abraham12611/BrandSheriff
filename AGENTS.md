# Agent notes

## Phase 0 verification commands

All commands below are intended to run from the repository root.

```bash
# Full CI-style verification (typecheck, lint, test, build)
npm run check

# Individual checks
npm run typecheck
npm run lint
npm run test
npm run build
```

## Project state

- Authentication, multi-tenancy, and provider-action controls are implemented.
- Provider actions (Firecrawl/OpenAI/AgentMail calls) are **off by default per workspace**; an owner/admin enables them via `organizations.enableProviderActions`. The guard lives in `convex/providerSafety.ts` (`assertProviderActionsEnabled`) with membership checks in `convex/authzActions.ts`.
- Demo seeding is not exposed in the main dashboard; the controlled demo storefronts remain under `public/demo/` and are served at `/demo/<name>/index.html` (exact paths only — the static host has no directory-index resolution).
- `convex/_generated` is now versioned so CI can build and test without a live `convex dev` codegen step.

## Phase 1 — Authentication and multi-tenancy

- Clerk is integrated via `@clerk/react` and `convex/react-clerk`.
- A new `convex/auth.config.ts` reads `CLERK_FRONTEND_API_URL` from the Convex deployment environment.
- `convex/lib/authz.ts` provides `requireIdentity`, `requireOrganizationMembership`, record-level access helpers, and `listOrganizationIds`.
- New modules: `convex/users.ts`, `convex/memberships.ts`, `convex/invitations.ts`, `convex/domainVerifications.ts`.
- `organizations.create` creates a workspace, the caller's user record, and an `owner` membership.
- Public mutations (create brand, create case, edit draft, start patrol/hydra watch) now check workspace membership.
- Public queries are scoped to the calling user's workspace memberships.
- Provider/paid actions are gated by the workspace `providerActionsEnabled` flag plus membership/role checks (Phase 3).

### Credentials needed

1. Create a Clerk application and copy the Frontend API URL.
2. Set it on the Convex deployment:
   ```bash
   npx convex env set CLERK_FRONTEND_API_URL "https://your-instance.clerk.accounts.dev"
   ```
3. Copy `.env.local.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY`.
4. Run `npx convex dev` / `npx convex deploy` to sync the auth config.

## Dependency audit

`npm audit` still reports known issues in `react-router-dom`, `vite`, `vitest`, and transitive `esbuild`. They require major-version upgrades and should be treated as a dedicated follow-up task; do not claim the audit is clean until `npm audit` passes after those upgrades.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
