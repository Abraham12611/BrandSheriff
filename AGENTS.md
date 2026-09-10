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

## Dependency audit

`npm audit` still reports known issues in `react-router-dom`, `vite`, `vitest`, and transitive `esbuild`. They require major-version upgrades and should be treated as a dedicated follow-up task; do not claim the audit is clean until `npm audit` passes after those upgrades.
