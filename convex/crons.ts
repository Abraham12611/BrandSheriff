import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every hour, pick up enabled Hydra watches that haven't swept in the
// last 6 hours and schedule a run for each.
crons.interval("hydra-sweep", { minutes: 60 }, internal.hydra.sweepDue, {});

export default crons;
