# Hackathon log

- **Project:** BrandSheriff
- **Event:** Convex All Gas Hackathon
- **What it does:** AI-assisted brand-defense command center that discovers suspected online brand/copyright abuse, preserves evidence, explains matches, routes cases to enforcement workflows, drafts communications, sends after approval, verifies outcomes, and watches for reappearance.
- **Live app:** https://rapid-peccary-734.convex.site
- **Repo:** https://github.com/Abraham12611/BrandSheriff
- **Frontend:** Convex static hosting
- **Convex deployment:** https://rapid-peccary-734.convex.cloud
- **Components:** @convex-dev/static-hosting
- **Convex features:** schema, queries, mutations, actions, static hosting
- **Auth:** none
- **AI models:** none
- **Started:** 2026-09-08T12:34:04Z
- **Last updated:** 2026-09-09T11:28:00Z

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
