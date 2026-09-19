# Hackathon log

- **Project:** BrandSheriff
- **Event:** Convex All Gas Hackathon
- **What it does:** Multi-tenant brand-protection platform: crawls official brand assets, discovers suspected clones/counterfeits/impersonation across the web, scores matches with explainable signals, routes cases to platform-native enforcement channels (marketplace, host, registrar, search, social, counsel), drafts communications, sends after human approval, classifies inbound replies, and watches targets for reappearance.
- **Live app:** https://cautious-elk-17.convex.site
- **Repo:** https://github.com/Abraham12611/BrandSheriff
- **Frontend:** Convex static hosting
- **Convex deployment:** https://cautious-elk-17.convex.cloud
- **Components:** @convex-dev/static-hosting, @firecrawl/firecrawl-convex, @agentmail/convex (vendored), @convex-dev/workflow
- **Convex features:** schema, indexes, queries, mutations, actions, internal functions, HTTP actions, crons, scheduled functions, file storage, realtime queries, paginated queries, components
- **Auth:** Clerk
- **AI models:** gpt-4o-mini
- **Started:** 2026-09-08T12:34:04Z
- **Last updated:** 2026-09-19T09:40:00Z

## Log

### 2026-09-08 - working tree
Set up local Node.js 22.12.0 in `~/.local/bin`, configured the Convex MCP server in `~/.config/devin/mcp_config.json`, and installed the Convex hackathon build-log skill at `.agents/skills/convex-hackathon-skill/`. Extracted the AgentMail docs index into `.devin/docs/agentmail/` (228 markdown files) and the Firecrawl docs index into `.devin/docs/firecrawl/` (36 markdown files). Installed the official Convex agent skills globally (`npx skills add get-convex/agent-skills`), verified they appear in `npx skills list --global`, and confirmed `git` and `python3` are available after installing Xcode Command Line Tools.

### 2026-09-09 - working tree
Initialized the Convex project, connected the dev deployment `cautious-elk-17`, and installed Convex AI files. Built the React + TypeScript + Vite + Tailwind app shell with React Router, sidebar navigation, and pages for Command Center, Brand DNA onboarding, Threat Radar, and Cases. Created the initial Convex schema and public queries/mutations for brands, discoveries, cases, and patrol runs. Verified `npx convex dev --once` and `npm run build` both pass; the dev frontend is running locally on http://localhost:5173.

### 2026-09-09 - live deployment
Connected Convex actions to the Firecrawl API for live Brand DNA crawling and search patrols. Added a `seed.loadDemoWorkspace` mutation and a "Load Northstar demo" button so judges can seed a demo brand in one click. Built five live demo storefront pages under `public/demo/` (northstar, clone, authorized, editorial, hydra) and deployed the app plus the static demo sites to Convex static hosting at `https://rapid-peccary-734.convex.site`. The demo storefronts are intentionally separate sub-paths so Firecrawl can crawl real, controlled pages without mocking.

### 2026-09-09 - working tree
Extended the Threat Radar page to show discoveries needing review and a "Create case" action that converts a discovery into an active case and an initial evidence item. Added `cases.get`, `cases.createFromDiscovery`, and `discoveries.listByBrandStatus` to support the review queue. Rebuilt and redeployed the live app.

### 2026-09-09 - component refactor
Installed the official Convex components: `@firecrawl/firecrawl-convex`, `@agentmail/convex`, and `@convex-dev/agent`. Refactored Firecrawl actions to use `FirecrawlClient` from the component rather than hand-rolled `fetch`. Rebuilt and redeployed the production app; Firecrawl Brand DNA crawl and search patrol remain live.

### 2026-09-09 - forensics + OpenAI
Set `OPENAI_API_KEY` and `AGENTMAIL_API_KEY` from the provided `.env.local` on both dev and prod Convex deployments. Added `convex/forensics.ts` with an `investigateDiscovery` action that scrapes the suspect URL via the Firecrawl component, pulls the brand's official assets, and asks OpenAI (`gpt-4o-mini`) for a structured, evidence-based comparison (identity similarity, authorization risk, severity, match types, explanation, counter-signals). The result is stored on the discovery and as an evidence item. Updated the Threat Radar UI to show the confidence score, severity badge, summary, and an **Investigate** button.

### 2026-09-09 - case detail + AgentMail wiring
Built a case detail page (`/cases/:id`) that displays the case summary, original discovery, and evidence locker with all captured items. Wired the official `@agentmail/convex` component: added `convex/mail.ts` to create inboxes and send outbound messages, plus `convex/http.ts` to receive webhooks at `/agentmail/webhook`. Rebuilt and redeployed.

### 2026-09-09 - enforcement desk + approval gate
Added `convex/enforcement.ts` with a `generateDraft` action that uses OpenAI to write a structured enforcement email from the case evidence. Added `draftNotices`, `approvals`, and `auditEvents` tables. Added an editable draft panel in the case detail UI with **Approve & send**, which records an approval snapshot and sends the email through AgentMail. Rebuilt and redeployed.

### 2026-09-09 - AgentMail inbox resolution
Switched the case-detail action from "provision inbox" to "connect inbox" using the provided inbox-scoped AgentMail key. Added `mail.resolveInbox` which lists available inboxes and stores the inbox ID/address on the organization. Outbound email is now wired end-to-end; inbound webhook verification still needs the webhook secret.

### 2026-09-09 - verification + Hydra watch
Added `convex/verification.ts` with a `recheckTarget` action that re-scrapes the case's target URL and uses OpenAI to classify the outcome as `removed`, `changed`, `still_present`, or `inconclusive`, then transitions the case state. Added `convex/hydra.ts` with `startWatch` and `runWatch` so a resolved case can be watched for reappearance; `runWatch` searches Firecrawl for the brand and creates new discoveries. Wired both into the case detail UI. Rebuilt and redeployed.

### 2026-09-09 - GitHub repo + AgentMail webhook secret
Created public GitHub repo `https://github.com/Abraham12611/BrandSheriff` via the GitHub MCP, initialized the local repo, committed the project code, and added a `.gitignore` that excludes `node_modules`, `.env.local`, generated Convex bindings, build output, and local skill/context packs. Set `AGENTMAIL_WEBHOOK_SECRET` on both dev and prod Convex deployments from the provided `.env.local` so the inbound AgentMail webhook at `/agentmail/webhook` is verified.

### 2026-09-09 - pushed to GitHub
Pushed the committed code to `main` on `https://github.com/Abraham12611/BrandSheriff` using a temporary GitHub PAT. Removed the PAT from `.env.local` after use. Verified the public repo shows the project files.

### 2026-09-09 - dashboard, landing page, demo script
Enhanced the Command Center dashboard with KPI cards, quick actions, demo-store links, recent patrol runs, discoveries needing review, and active cases. Added a standalone marketing landing page at `/landing/index.html` with the product loop and a judge CTA. Created `DEMO.md` with a 3-minute walkthrough script covering demo seeding, patrol, forensics, case creation, draft approval/send, verification, and Hydra watch. Rebuilt and redeployed.

### 2026-09-10 - ed96363
Phase 0+1: containment and tenancy. Added `npm run check` (typecheck, lint, vitest, build) as the CI gate, labeled prototype-only surfaces, and wired Clerk end-to-end: `convex/auth.config.ts` reads `CLERK_FRONTEND_API_URL`, `convex/lib/authz.ts` adds `requireIdentity`/`requireOrganizationMembership`/record-level access, and new `users`, `organizationMembers`, `invitations`, and `domainVerifications` modules scope every public query/mutation to workspace membership. `organizations.create` now mints the workspace, user record, and owner membership together.

### 2026-09-10 - ea6211e
Phase 2+3: real shell and provider safety. BrowserRouter with workspace-aware routes and empty states, design tokens, responsive shell. Provider actions are off by default per workspace — `convex/providerSafety.ts` gates Firecrawl/OpenAI/AgentMail spend behind `organizations.settings.providerActionsEnabled` plus membership/role checks; owners/admins enable it from the UI. Brand DNA crawl UI surfaced with truthful live/queued states.

### 2026-09-12 - 1c2fa0b
Hardening pass: fixed provider response unwrapping for Firecrawl component results, corrected demo storefront URLs to exact static paths (`/demo/<name>/index.html` — the static host has no directory-index resolution), fixed onboarding redirect when a workspace already exists, and updated the provider-enabled safety banner.

### 2026-09-15 - 43b8c19
Vendored the AgentMail component into `components/agentmail/` to fix env scoping and internal-action visibility, and tightened the patrol action for live end-to-end runs. Added a brand asset viewer and real product images on the demo storefronts so image-based matching has controlled fixtures to find.

### 2026-09-15 - 0a26b48
Dashboard rebuild in five slices: discoveries inbox with review queue, case detail rebuilt with tabs/rendered evidence/timeline, Brand Profile page (asset library, keywords, allowlist), dashboard home, and an analytics page. Dark sidebar + design tokens across the app.

### 2026-09-15 - c81ab49
Added toast notifications, a Hydra sweep cron that re-runs watches on a schedule (`convex/crons.ts`), IP-document upload into Convex file storage, and quick actions on discovery cards (review, watch, create case).

### 2026-09-16 - b27c3d6
Added a report generator: cases render into a shareable enforcement report behind token links with a print view (`/report/:token`). Rebuilt the public landing page with a real free-scan flow so visitors can run an actual check before signing up.

### 2026-09-16 - bdc3551
Inbound mail now lands in case threads: the signed AgentMail webhook routes replies to the right case and stores them as `caseMessages`. Added contact-route research (`convex/contactResearch.ts`) — Firecrawl finds abuse/legal/contact pages on the target's domain and stores them on the case for routing.

### 2026-09-17 - 3857e82
Per-workspace AgentMail pod provisioning (`convex/mailProvision.ts`): each organization gets its own mailbox, with ID/address/webhook stored on the org record. Added member notification preferences and first-pass AI reply triage on inbound messages.

### 2026-09-17 - 5741533
Watches became real monitoring (`convex/monitors.ts`): scheduled Firecrawl scrapes compare page state and fire `watch_hit` events with in-app notifications. Post-send enforcement workflow got durable state (`convex/enforcement.ts`), and live-browser evidence capture via Firecrawl interact lets a case record clicks/screenshots on a suspect page (`convex/browserCapture.ts`).

### 2026-09-17 - 8257f34
Surfaced AgentMail delivery status on sent mail and an unmatched-inbox view for replies that can't be routed to a case. Dropped the unused `@convex-dev/agent` component — the app calls OpenAI directly, so the dependency was removed rather than left looking load-bearing.

### 2026-09-18 - b5915c4
Replaced the hollow Brand DNA crawl with the real Firecrawl crawl lifecycle (start → poll → persist pages/assets), and inbound email attachments are now captured into Convex file storage as case evidence items.

### 2026-09-18 - 0134c36
Image pipeline (`convex/images.ts`): patrol scrapes extract suspect product images, hash them perceptually, and compare against the brand's fingerprinted asset library — `visualMatchScore`/`matchedAssetId` land on the discovery. Added the AI keyword engine (`convex/keywords.ts`): OpenAI generates monitoring keywords from crawled brand material, members review/edit them, and approved keywords feed patrol queries.

### 2026-09-18 - bbfe57b
Enforcement router (`convex/enforcementRoutes.ts` + `enforcementActions` table): every case fans out into tracked, platform-native actions — storefront-platform copyright, host DMCA, Google Search delisting, Google Ads trademark/counterfeit, Meta/Instagram IP, marketplace counterfeit (Amazon/eBay/Etsy/AliExpress/Temu), registrar abuse, UDRP readiness, cease-and-desist, counsel escalation. Deterministic signal-based routing (the LLM drafts packets but never picks legal basis), lifecycle states recommended→actioned/counter_notice, official submission URLs and required fields, and `[REQUIRED: …]` placeholders instead of invented facts. UI: `/enforcement` pipeline board, case RoutesPanel, `/people` member+invite+role management, `/settings` workspace/provider/mailbox/notification controls. AgentMail member alerts on urgent findings. All org-scoped with explicit case-ownership checks.

### 2026-09-18 - ff65cd8
Data-moat layer: `cloneSignals` + deterministic 0–100 `cloneScore` on discoveries (image re-host, vault asset match, text similarity, domain-impersonation pattern, repeat offender, keyword attribution, channel, evidence count) with expandable Signal/Finding breakdown in the UI. `rightsObjects` Rights Vault (`/rights`) records trademarks/registrations/domains/accounts/authorized-sellers with coverage-gap analysis feeding route confidence. `offenders`/`offenderLinks` graph links discoveries by host and shared stolen assets (`/networks`). Reply classification v2 detects platform senders, extracts ticket refs/deadlines, and auto-escalates counter-notices into `enforcementActions`. `enforcementStats` per-channel outcome stats on `/enforcement`; watch hits now email members; weekly digest cron lands Mondays 08:00 UTC. Backend tests cover routing, authz, clone scoring, offender linking, and status transitions (41 passing via `npm run check`).

### 2026-09-19 - working tree
Public judge access: `/showcase` is a no-auth, read-only view of a seeded demo workspace — patrol discoveries with clone scores and expandable signal rows, suspect-vs-original image comparisons, the case's 8 enforcement routes with prepared-packet excerpts, offender networks, and the rights vault. `convex/demoShowcase.ts` adds a `DEMO_SEED_TOKEN`-gated `seed` action (idempotent wipe + insert of brand/discoveries/case/rights, then a real Firecrawl crawl of the controlled Northstar storefront) and a `pipeline` internalAction that runs the production path end-to-end: crawl ingest, brand-image hashing, suspect-image scoring, forensic analysis, clone scoring, offender linking, deterministic route computation, and OpenAI packet drafting. Extracted shared internals (`forensics.investigateDiscoveryInternal`, `enforcementRoutes.ensureForCaseInternal`) so scheduled callers use the org-flag provider gate like crons. `organizations.isPublicDemo` + `by_public_demo` index hard-scope every public read. Fixed a real platform bug found while seeding: static hosting was uploaded with `--no-spa`, which 404'd every client route on direct hit (including `/report/:token` share links) — re-uploaded with SPA fallback so `/showcase`, report links, and demo pages all resolve.
