/**
 * Outcome learning — aggregates enforcementActions into per-channel
 * effectiveness stats. This is the data the vision doc calls the moat:
 * which routes, on which channels, actually produce removals.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireOrganizationMembership, MEMBER_ROLES } from "./lib/authz";

const TERMINAL = ["actioned", "rejected", "withdrawn"];

export const routeStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await requireOrganizationMembership(ctx, args.organizationId, MEMBER_ROLES);
    const rows = await ctx.db
      .query("enforcementActions")
      .withIndex("by_org_status", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const byChannel = new Map<
      string,
      {
        channel: string;
        total: number;
        submitted: number;
        actioned: number;
        rejected: number;
        inFlight: number;
        counterNotices: number;
        actionedRate: number | null;
        medianDaysToAction: number | null;
      }
    >();

    const toAction = new Map<string, number[]>();

    for (const r of rows) {
      if (!byChannel.has(r.channel)) {
        byChannel.set(r.channel, {
          channel: r.channel,
          total: 0,
          submitted: 0,
          actioned: 0,
          rejected: 0,
          inFlight: 0,
          counterNotices: 0,
          actionedRate: null,
          medianDaysToAction: null,
        });
      }
      const c = byChannel.get(r.channel)!;
      c.total++;
      if (r.status === "actioned") c.actioned++;
      else if (r.status === "rejected") c.rejected++;
      else if (r.status === "counter_notice") c.counterNotices++;
      else if (!TERMINAL.includes(r.status)) c.inFlight++;
      if (r.submittedAt) c.submitted++;
      if (r.status === "actioned" && r.submittedAt) {
        const days = (r.updatedAt - r.submittedAt) / (1000 * 60 * 60 * 24);
        if (!toAction.has(r.channel)) toAction.set(r.channel, []);
        toAction.get(r.channel)!.push(days);
      }
    }

    for (const c of byChannel.values()) {
      const decided = c.actioned + c.rejected;
      c.actionedRate = decided > 0 ? Math.round((c.actioned / decided) * 100) : null;
      const times = toAction.get(c.channel);
      if (times && times.length > 0) {
        times.sort((a, b) => a - b);
        c.medianDaysToAction =
          Math.round(times[Math.floor(times.length / 2)] * 10) / 10;
      }
    }

    const channels = [...byChannel.values()].sort((a, b) => b.total - a.total);
    const totals = {
      total: rows.length,
      actioned: rows.filter((r) => r.status === "actioned").length,
      inFlight: rows.filter(
        (r) => !TERMINAL.includes(r.status) && r.status !== "recommended",
      ).length,
      recommended: rows.filter((r) => r.status === "recommended").length,
      counterNotices: rows.filter((r) => r.status === "counter_notice").length,
    };
    return { channels, totals };
  },
});
