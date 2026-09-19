# BrandSheriff 3-Minute Demo Script

## Links

- **Live app:** https://cautious-elk-17.convex.site
- **Public live demo (no login):** https://cautious-elk-17.convex.site/showcase
- **Repo:** https://github.com/Abraham12611/BrandSheriff

## For judges — fastest path

Open `/showcase`. It's a read-only view of a seeded workspace where the real
pipeline already ran: a live Firecrawl crawl of a controlled storefront,
suspect-page scrapes, perceptual-hash image matching, OpenAI forensic
analysis, deterministic clone-risk scoring, enforcement-route computation,
and OpenAI-drafted platform packets. No mocking — every row was produced by
the production code path.

## Video script (~3 min)

### 1. Hook (15s)

- Open `/showcase`. "A brand owner's worst week: someone cloned their store.
  BrandSheriff found it, scored it, and routed enforcement to five channels —
  all from the real product."
- Scroll the discoveries grid — point at the clone's 100/100 clone-risk ring.

### 2. Explainable evidence (30s)

- Expand "Why 100/100?" on the clone discovery — walk 2–3 signal rows
  (exact image re-host, description similarity, domain impersonation pattern).
- Show the suspect-vs-original image pair: "perceptual-hash match, not vibes."
- Contrast: the authorized partner scored 47 — signals measure copying, not
  legality. "Explainable signals, never a legal conclusion."

### 3. Multi-channel enforcement (45s)

- Case BS-1000: 8 routes — host DMCA, storefront copyright, registrar abuse,
  Google delisting, ads trademark, marketplace counterfeit, counsel, C&D.
- Expand a prepared packet — OpenAI drafted channel-native complaint text;
  unverifiable facts are `[REQUIRED: …]` placeholders, never invented.
- "The LLM drafts. Deterministic code routes. Humans approve."

### 4. The live loop in your own workspace (60s)

- Sign in → workspace → Brand DNA → provider actions on → **Crawl** (real
  Firecrawl crawl of `/demo/northstar/`).
- Run a patrol → discovery lands → **Investigate** (scrape + OpenAI analysis)
  → **Create case** → routes auto-compute → **Generate draft** → edit →
  **Approve & send** — AgentMail sends from the workspace's own mailbox.
- Show the case inbox: the workspace mailbox provisioned per-org, inbound
  replies land in the case thread and get classified (acceptance, refusal,
  counter-notice → auto-escalation).

### 5. Persistence (30s)

- **Run verification** — re-scrapes the target, classifies
  removed/changed/still_present, transitions the case.
- **Hydra watch** — keeps the fingerprint under watch; reappearances surface
  as new discoveries and email alerts to the team.

### Closing (10s)

> "Discovery to enforcement to verification to rewatch — BrandSheriff is the
> evidence and operations layer for brand abuse. Convex runs it, Firecrawl
> feeds it, AgentMail gives it an inbox, OpenAI drafts under human control."

## Notes for the recording

- Do step 4 in the real workspace (mailbox provisioned); use `/showcase` for
  steps 1–3 so nothing depends on live latency.
- Keep `/demo/clone/index.html` open in a second tab to flash the clone site.
- If a provider call is slow on camera, cut to the showcase equivalent rather
  than waiting — it's the same data.
