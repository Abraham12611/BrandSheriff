import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { Doc } from "./_generated/dataModel";
import { assertProviderActionsEnabled } from "./providerSafety";
import { guessPlatform } from "./lib/platform";

const firecrawl = new FirecrawlClient(components.firecrawl);

type Route = {
  type: "site_email" | "contact_page" | "registrar_abuse" | "platform_report";
  label: string;
  value: string; // email address or URL
  source: string; // where it came from — shown to the user for trust
};

// Platform reporting channels — only well-known stable endpoints; when a
// platform isn't listed we simply don't fabricate one.
const PLATFORM_CHANNELS: Record<string, { label: string; url: string }> = {
  amazon: { label: "Amazon Report Infringement", url: "https://www.amazon.com/report/infringement" },
  ebay: { label: "eBay VeRO reporting portal", url: "https://ir.ebay.com/" },
  etsy: { label: "Etsy IP reporting portal", url: "https://www.etsy.com/legal/report" },
  shopify: { label: "Shopify AUP/IP violation report", url: "https://www.shopify.com/legal/report-aup-violation" },
  instagram: { label: "Instagram IP report form", url: "https://help.instagram.com/contact/372592039493026" },
  facebook: { label: "Meta IP report form", url: "https://www.facebook.com/help/contact/634636770043106" },
  tiktok: { label: "TikTok trademark report", url: "https://www.tiktok.com/legal/report/Trademark" },
  aliexpress: { label: "Alibaba IP protection platform", url: "https://ipp.alibabagroup.com/" },
};

const SECOND_LEVEL_TLDS = new Set(["co", "com", "net", "org", "ac", "gov", "edu"]);

function registrableDomain(host: string): string {
  const parts = host.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];
  if (tld.length === 2 && SECOND_LEVEL_TLDS.has(sld) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  return parts.slice(-2).join(".");
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const SKIP_EMAIL = /^(no-?reply|donotreply|mailer-daemon|postmaster)@|\.(png|jpe?g|gif|webp|svg)$/i;

async function rdapAbuseContact(domain: string): Promise<Route | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json, application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      entities?: Array<{
        roles?: string[];
        vcardArray?: [string, Array<[string, unknown, string, unknown]>];
      }>;
    };
    for (const ent of data.entities ?? []) {
      const roles = ent.roles ?? [];
      if (!roles.includes("abuse")) continue;
      const vcard = ent.vcardArray?.[1] ?? [];
      const emailRow = vcard.find((row) => row[0] === "email");
      const nameRow = vcard.find((row) => row[0] === "fn");
      const email = typeof emailRow?.[3] === "string" ? emailRow[3] : null;
      if (!email) continue;
      const registrar = typeof nameRow?.[3] === "string" ? nameRow[3] : "Registrar";
      return {
        type: "registrar_abuse",
        label: `${registrar} abuse contact`,
        value: email,
        source: `RDAP record for ${domain}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const research = action({
  args: { caseId: v.id("cases") },
  handler: async (ctx, args): Promise<{ routes: Route[]; targetHost: string | null }> => {
    const c = (await ctx.runQuery(internal.cases.getById, {
      caseId: args.caseId,
    })) as Doc<"cases"> | null;
    if (!c) throw new Error("Case not found");
    await assertProviderActionsEnabled(ctx, c.organizationId);

    const discovery = c.discoveryId
      ? ((await ctx.runQuery(internal.discoveries.getById, {
          discoveryId: c.discoveryId,
        })) as Doc<"discoveries"> | null)
      : null;
    const targetUrl = discovery?.canonicalUrl;
    if (!targetUrl) return { routes: [], targetHost: null };

    let host: string;
    try {
      host = new URL(targetUrl).hostname;
    } catch {
      return { routes: [], targetHost: null };
    }
    const routes: Route[] = [];
    const seen = new Set<string>();

    // 1. Scrape the suspect page — pull mailto/contact emails + contact links.
    try {
      const doc = await firecrawl.scrape(ctx, targetUrl, { formats: ["markdown"] });
      const markdown = (doc.markdown ?? "") as string;
      const links = (doc.links ?? []) as string[];

      for (const email of markdown.match(EMAIL_RE) ?? []) {
        if (SKIP_EMAIL.test(email) || seen.has(email.toLowerCase())) continue;
        seen.add(email.toLowerCase());
        routes.push({
          type: "site_email",
          label: "Address published on the page",
          value: email,
          source: `Found on ${host}`,
        });
      }
      for (const link of links) {
        if (!/\/(contact|support|about|help|legal)/i.test(link)) continue;
        if (seen.has(link)) continue;
        seen.add(link);
        routes.push({
          type: "contact_page",
          label: "Contact / support page",
          value: link,
          source: `Linked from ${host}`,
        });
        if (routes.length > 12) break;
      }
    } catch (e) {
      console.error("Contact research scrape failed", e);
    }

    // 2. Public RDAP — the registrar's declared abuse contact.
    const abuse = await rdapAbuseContact(registrableDomain(host));
    if (abuse) routes.push(abuse);

    // 3. Known platform reporting channel.
    const platform = guessPlatform(targetUrl);
    const channel = PLATFORM_CHANNELS[platform];
    if (channel) {
      routes.push({
        type: "platform_report",
        label: channel.label,
        value: channel.url,
        source: "Platform reporting channel",
      });
    }

    await ctx.runMutation(internal.contactResearch.save, {
      caseId: args.caseId,
      routes,
    });

    return { routes, targetHost: host };
  },
});

export const save = internalMutation({
  args: { caseId: v.id("cases"), routes: v.array(v.any()) },
  handler: async (ctx, args) => {
    await ctx.db.patch("cases", args.caseId, {
      contactRoutes: args.routes,
      contactResearchedAt: Date.now(),
    });
  },
});
