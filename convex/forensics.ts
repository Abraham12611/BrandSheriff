import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { env } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { Doc } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import { assertProviderActionsEnabled, assertOrgProviderEnabled } from "./providerSafety";

const firecrawl = new FirecrawlClient(components.firecrawl);

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function openaiChat(messages: Array<{ role: string; content: string }>, model = "gpt-4o-mini") {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content);
}

export const investigateDiscovery = action({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = (await ctx.runQuery(internal.discoveries.getById, {
      discoveryId: args.discoveryId,
    })) as Doc<"discoveries"> | null;
    if (!discovery) throw new Error("Discovery not found");

    await assertProviderActionsEnabled(ctx, discovery.organizationId);
    return investigate(ctx, discovery);
  },
});

// Scheduled/internal callers (seed, crons) have no user identity — the
// workspace's own provider opt-in flag is the gate, same as crons.
export const investigateDiscoveryInternal = internalAction({
  args: { discoveryId: v.id("discoveries") },
  handler: async (ctx, args) => {
    const discovery = (await ctx.runQuery(internal.discoveries.getById, {
      discoveryId: args.discoveryId,
    })) as Doc<"discoveries"> | null;
    if (!discovery) throw new Error("Discovery not found");

    await assertOrgProviderEnabled(ctx, discovery.organizationId);
    return investigate(ctx, discovery);
  },
});

async function investigate(
  ctx: GenericActionCtx<DataModel>,
  discovery: Doc<"discoveries">,
) {
  {
    const args = { discoveryId: discovery._id as Id<"discoveries"> };

    const brand = (await ctx.runQuery(internal.brands.get, { brandId: discovery.brandId })) as Doc<"brands"> | null;
    if (!brand) throw new Error("Brand not found");

    const assets = (await ctx.runQuery(internal.brandAssets.listByBrand, {
      brandId: discovery.brandId,
    })) as Doc<"brandAssets">[];

    const scrapeResult = await firecrawl.scrape(ctx, discovery.canonicalUrl, {
      formats: ["markdown"],
      onlyMainContent: true,
    });
    const suspectText = (scrapeResult as { markdown?: string }).markdown ?? "";

    const assetSnippets = assets
      .filter((a) => a.textContent && a.textContent.length > 20)
      .slice(0, 5)
      .map((a) => ({ title: a.title, text: a.textContent?.slice(0, 2000) ?? "" }));

    const prompt = `Compare this suspect page to the official brand assets and determine whether the suspect page appears to be copying the brand, an authorized seller, an editorial review, or unrelated.

Official brand: ${brand.name}
Official domain: ${brand.canonicalDomain}
Official assets:
${JSON.stringify(assetSnippets, null, 2)}

Suspect URL: ${discovery.canonicalUrl}
Suspect page text:
${suspectText.slice(0, 4000)}

Return JSON with these fields:
- summary: a concise explanation of what the suspect page is doing
- identitySimilarity: number 0-1 estimating how much the page mimics the brand identity (names, taglines, products, pricing)
- authorizationRisk: number 0-1 estimating likelihood this is an unauthorized copy rather than authorized reseller or review
- severity: one of low, medium, high, critical
- matchTypes: array of strings such as brand_name, product_text, pricing, tagline, layout
- explanation: paragraph explaining the key signals and uncertainty
- counterSignals: array of reasons the page might be legitimate
Do not make a legal determination. Use cautious language like "appears", "likely", "suggests".`;

    const analysis = await openaiChat([
      { role: "system", content: "You are a brand-protection forensic assistant. You compare public web pages to official brand assets and return structured, evidence-based assessments. You never make legal conclusions." },
      { role: "user", content: prompt },
    ]);

    await ctx.runMutation(internal.discoveries.updateAnalysis, {
      discoveryId: args.discoveryId,
      summary: String(analysis.summary ?? ""),
      matchConfidence: Number(analysis.identitySimilarity ?? 0),
      identityRisk: Number(analysis.identitySimilarity ?? 0),
      authorizationRisk: Number(analysis.authorizationRisk ?? 0),
      severity: String(analysis.severity ?? "medium"),
      similarityScore: Number(analysis.identitySimilarity ?? 0),
    });

    await ctx.runMutation(internal.evidenceItems.createFromInvestigation, {
      organizationId: discovery.organizationId,
      discoveryId: args.discoveryId,
      type: "forensic_analysis",
      title: "Forensic analysis",
      sourceUrl: discovery.canonicalUrl,
      textContent: JSON.stringify(analysis, null, 2),
      capturedAt: Date.now(),
    });

    // Visual pass runs async — hash the suspect page's images and compare
    // against the brand's monitored imagery.
    await ctx.scheduler.runAfter(0, internal.images.scoreSuspectImages, {
      discoveryId: args.discoveryId,
    });

    return analysis;
  }
}
