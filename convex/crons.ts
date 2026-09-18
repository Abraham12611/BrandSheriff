import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every hour, pick up enabled Hydra watches that haven't swept in the
// last 6 hours and schedule a run for each.
crons.interval("hydra-sweep", { minutes: 60 }, internal.hydra.sweepDue, {});

// Weekly workspace digest — new discoveries, case movement, enforcement
// outcomes — emailed to members who haven't opted out.
crons.weekly(
  "weekly-digest",
  { dayOfWeek: "monday", hourUTC: 8, minuteUTC: 0 },
  internal.mailAlerts.sendWeeklyDigest,
  {},
);

export default crons;
