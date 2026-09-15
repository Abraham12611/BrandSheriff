const PLATFORM_HOSTS: Array<[RegExp, string]> = [
  [/amazon\./i, "amazon"],
  [/ebay\./i, "ebay"],
  [/etsy\./i, "etsy"],
  [/walmart\./i, "walmart"],
  [/aliexpress\.|alibaba\./i, "alibaba"],
  [/dhgate\./i, "dhgate"],
  [/temu\./i, "temu"],
  [/shein\./i, "shein"],
  [/tiktok\./i, "tiktok"],
  [/instagram\.|facebook\./i, "meta"],
  [/myshopify\.|shopify\./i, "shopify"],
  [/convex\.site$/i, "demo"],
];

export function guessPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    for (const [pattern, name] of PLATFORM_HOSTS) {
      if (pattern.test(host)) return name;
    }
  } catch {
    // fall through
  }
  return "web";
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
