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

- The current build is a **read-only prototype** while authentication, multi-tenancy, and approval controls are being implemented.
- Public Convex mutations and actions fail closed with `PROTOTYPE_READ_ONLY` until those controls land.
- Demo seeding is not exposed in the main dashboard; the controlled demo storefronts remain under `public/demo/`.
- `convex/_generated` is now versioned so CI can build and test without a live `convex dev` codegen step.

## Phase 1 — Authentication and multi-tenancy

- Clerk is integrated via `@clerk/react` and `convex/react-clerk`.
- A new `convex/auth.config.ts` reads `CLERK_FRONTEND_API_URL` from the Convex deployment environment.
- `convex/lib/authz.ts` provides `requireIdentity`, `requireOrganizationMembership`, record-level access helpers, and `listOrganizationIds`.
- New modules: `convex/users.ts`, `convex/memberships.ts`, `convex/invitations.ts`, `convex/domainVerifications.ts`.
- `organizations.create` creates a workspace, the caller's user record, and an `owner` membership.
- Public mutations (create brand, create case, edit draft, start patrol/hydra watch) now check workspace membership.
- Public queries are scoped to the calling user's workspace memberships.
- Provider/paid actions remain behind `PROTOTYPE_READ_ONLY` until Phase 3 provider contract work.

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
