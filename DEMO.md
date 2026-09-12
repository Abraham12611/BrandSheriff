# BrandSheriff 3-Minute Demo Script

## Setup

Open the live app: https://rapid-peccary-734.convex.site

## Script

### 1. Create a workspace and crawl the demo brand (45s)

- Sign in, then create a workspace (e.g. "Judge Demo").
- Add a brand named **Northstar Atelier** with official domain `https://<deployment>.convex.site/demo/northstar/index.html`.
- On **Brand DNA**, click **Enable provider actions** (owner/admin only), then click **Crawl**.
- This runs a live Firecrawl scrape + map of the official Northstar Atelier storefront and stores pages/links as brand assets.
- Mention: the storefront is a real static page served on the same `*.convex.site` deployment; Firecrawl crawls it live.

### 2. Run a patrol and create a discovery (45s)

- Go to **Threat Radar** and click **Run patrol**.
- The patrol uses Firecrawl search for brand terms like "Northstar Atelier" and "Northstar Atelier sale".
- New discoveries appear in the review queue.
- Point out that one discovery is the controlled clone page (`/demo/clone/index.html`).

### 3. Investigate the clone (45s)

- Click **Investigate** on the clone discovery.
- The action scrapes the suspect URL and sends the page + official assets to OpenAI.
- The discovery updates with:
  - Identity similarity score
  - Authorization risk
  - Severity
  - Explanation and counter-signals
- Emphasize: the AI explains the match but does not make a legal determination.

### 4. Create a case and review evidence (30s)

- Click **Create case** from the discovery.
- Open the case. Show:
  - Case summary
  - Original discovery
  - Evidence locker (page scrape + forensic analysis)
- Mention evidence carries timestamp and source URL.

### 5. Generate and approve an enforcement draft (45s)

- In the case, click **Generate draft**.
- OpenAI writes a structured email from the confirmed evidence only.
- Show the editable body and the recipient field.
- Click **Approve & send**.
- The system records an approval snapshot and sends via AgentMail.
- Note: no consequential send happens without explicit approval.

### 6. Verify the outcome (30s)

- Click **Run verification**.
- Firecrawl re-scrapes the target and OpenAI classifies the result as removed/changed/still_present/inconclusive.
- The case state transitions automatically.

### 7. Watch for reappearance (15s)

- Click **Start watching for reappearance**.
- Explain Hydra: after resolution, the brand fingerprint stays under watch and future reappearances surface as new discoveries.

## Closing line

> BrandSheriff turns brand abuse from a manual guessing game into a live, evidence-based, human-approved workflow — from discovery through verification.
