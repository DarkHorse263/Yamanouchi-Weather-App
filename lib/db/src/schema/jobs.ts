import { pgTable, varchar, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Cross-replica claim ledger for scheduled jobs on autoscale deployments.
 *
 * Autoscale replicas cannot run a trustworthy in-process cron alone: the
 * replica may be asleep at the scheduled minute (silent miss) or several
 * replicas may be awake (duplicate runs). Instead each replica, whenever it
 * happens to be awake, checks whether the current period's run is still
 * outstanding and tries to claim it here. The unique (job_name, run_key)
 * row makes the claim atomic: exactly one replica wins, the rest see the
 * existing row and stand down. A claim whose owner died mid-run (finished_at
 * still null after a staleness window) may be atomically re-taken.
 */
export const jobRunsTable = pgTable(
  "job_runs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    jobName: text("job_name").notNull(),
    // One claim per period, e.g. "2026-07-19" for a daily job.
    runKey: text("run_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ok: boolean("ok"),
    summary: text("summary"),
  },
  (t) => [uniqueIndex("job_runs_name_key_uidx").on(t.jobName, t.runKey)],
);

export type JobRun = typeof jobRunsTable.$inferSelect;
