import { and, eq } from "drizzle-orm";
import { db, jobRunsTable, pool } from "@workspace/db";
import { runSubscriberRetention } from "../lib/subscriberRetention.js";
import { runAccountDeletionRecovery } from "../lib/accountDeletionRecovery.js";

let running = false;
/** Awake/request catch-up; session lock covers networked Clerk recovery too.
 * A failed/crashed run is retried; completed daily buckets are not repeated.
 */
export async function sweepSubscriberRetention(now = new Date()): Promise<void> {
  if (running) return;
  running = true;
  const client = await pool.connect().catch((error) => { running = false; throw error; });
  const runKey = now.toISOString().slice(0, 10);
  const jobName = "subscriber-retention";
  try {
    const lock = await client.query<{ locked: boolean }>("select pg_try_advisory_lock(hashtext('subscriber-retention-scheduler')) as locked");
    if (!lock.rows[0]?.locked) return;
    // Recovery is never gated on whether a retention bucket already completed.
    await runAccountDeletionRecovery();
    if (!retentionEnabled()) return;
    const [previous] = await db.select().from(jobRunsTable).where(and(eq(jobRunsTable.jobName, jobName), eq(jobRunsTable.runKey, runKey)));
    if (previous?.ok) return;
    await db.insert(jobRunsTable).values({ jobName, runKey })
      .onConflictDoUpdate({ target: [jobRunsTable.jobName, jobRunsTable.runKey], set: { startedAt: now, finishedAt: null, ok: null } });
    try {
      const result = await runSubscriberRetention(false, now);
      await db.update(jobRunsTable).set({ finishedAt: new Date(), ok: true, summary: JSON.stringify(result.counts) })
        .where(and(eq(jobRunsTable.jobName, jobName), eq(jobRunsTable.runKey, runKey)));
    } catch (error) {
      await db.update(jobRunsTable).set({ finishedAt: new Date(), ok: false, summary: "Retention failed; no partial purge committed. Check schema and persistent ALERT_TOKEN_SECRET." })
        .where(and(eq(jobRunsTable.jobName, jobName), eq(jobRunsTable.runKey, runKey)));
      throw error;
    }
  } finally {
    await client.query("select pg_advisory_unlock(hashtext('subscriber-retention-scheduler'))").finally(() => client.release());
    running = false;
  }
}

let lastWake = 0;
export function retentionEnabled(): boolean {
  // Owner approved production activation. Development stays opt-in, while
  // operators can explicitly pause production with RUN_SUBSCRIBER_RETENTION=0.
  return process.env.RUN_SUBSCRIBER_RETENTION === "1" ||
    (process.env.NODE_ENV === "production" && process.env.RUN_SUBSCRIBER_RETENTION !== "0");
}
export function requestRetentionWake(): void {
  if (Date.now() - lastWake < 60_000) return;
  lastWake = Date.now();
  void sweepSubscriberRetention().catch(() => console.error("[retention] recovery/retention sweep failed; will retry next wake"));
}
export function startSubscriberRetentionScheduler(): void {
  requestRetentionWake();
  setInterval(requestRetentionWake, 60_000).unref();
}