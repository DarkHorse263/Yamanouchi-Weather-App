import cron, { type ScheduledTask } from "node-cron";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import {
  db,
  jobRunsTable,
  pool,
  thredboLiftTransitionsTable,
  type ThredboLiftTransition,
} from "@workspace/db";
import {
  fetchFreshThredboLiftStatus,
  type LiveLift,
  type ThredboLiveLiftStatus,
} from "../lib/thredboLiftStatus.js";
import {
  fetchThredboWindSnapshot,
  type ThredboWindSnapshot,
} from "../lib/thredboWindObservation.js";

const JOB_NAME = "thredbo-lift-history";
const STALE_CLAIM_MINUTES = 15;
const SWEEP_INTERVAL_MS = 5 * 60_000;
const MAX_WIND_FEED_SKEW_MS = 90 * 60_000;

type PriorStatus = Pick<ThredboLiftTransition, "liftId" | "status">;

export function fiveMinuteRunKey(now: Date = new Date()): string {
  const bucket = Math.floor(now.getTime() / SWEEP_INTERVAL_MS) * SWEEP_INTERVAL_MS;
  return new Date(bucket).toISOString();
}

export function findLiftTransitions(live: ThredboLiveLiftStatus, prior: PriorStatus[]): LiveLift[] {
  const byLift = new Map(prior.map((row) => [row.liftId, row.status]));
  return live.lifts.filter((lift) => byLift.get(lift.id) !== lift.status);
}

async function claimRun(runKey: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000);
  const rows = await db
    .insert(jobRunsTable)
    .values({ jobName: JOB_NAME, runKey })
    .onConflictDoUpdate({
      target: [jobRunsTable.jobName, jobRunsTable.runKey],
      set: { startedAt: sql`now()` },
      setWhere: and(isNull(jobRunsTable.finishedAt), lt(jobRunsTable.startedAt, staleBefore)),
    })
    .returning({ id: jobRunsTable.id });
  return rows.length > 0;
}

async function finishRun(runKey: string, summary: string): Promise<void> {
  await db
    .update(jobRunsTable)
    .set({ finishedAt: sql`now()`, ok: true, summary })
    .where(and(eq(jobRunsTable.jobName, JOB_NAME), eq(jobRunsTable.runKey, runKey)));
}

async function latestStatuses(liftIds: string[]): Promise<PriorStatus[]> {
  if (liftIds.length === 0) return [];
  return db
    .selectDistinctOn([thredboLiftTransitionsTable.liftId], {
      liftId: thredboLiftTransitionsTable.liftId,
      status: thredboLiftTransitionsTable.status,
    })
    .from(thredboLiftTransitionsTable)
    .where(inArray(thredboLiftTransitionsTable.liftId, liftIds))
    .orderBy(thredboLiftTransitionsTable.liftId, desc(thredboLiftTransitionsTable.feedUpdatedAt));
}

function nearFeed(
  reading: ThredboWindSnapshot["village"],
  feedUpdatedAt: Date,
): ThredboWindSnapshot["village"] {
  if (!reading) return null;
  return Math.abs(reading.observedAt.getTime() - feedUpdatedAt.getTime()) <= MAX_WIND_FEED_SKEW_MS
    ? reading
    : null;
}

export function windColumns(snapshot: ThredboWindSnapshot, feedUpdatedAt: Date) {
  const village = nearFeed(snapshot.village, feedUpdatedAt);
  const top = nearFeed(snapshot.top, feedUpdatedAt);
  return {
    villageObservedAt: village?.observedAt ?? null,
    villageWindKmh: village?.windKmh ?? null,
    villageGustKmh: village?.gustKmh ?? null,
    villageWindDirection: village?.direction ?? null,
    topObservedAt: top?.observedAt ?? null,
    topWindKmh: top?.windKmh ?? null,
    topGustKmh: top?.gustKmh ?? null,
    topWindDirection: top?.direction ?? null,
  };
}

export async function recordThredboLiftTransitions(
  live: ThredboLiveLiftStatus,
  snapshot: ThredboWindSnapshot,
): Promise<number> {
  const prior = await latestStatuses(live.lifts.map((lift) => lift.id));
  const priorByLift = new Map(prior.map((row) => [row.liftId, row.status]));
  const transitions = findLiftTransitions(live, prior);
  if (transitions.length === 0) return 0;
  const feedUpdatedAt = new Date(live.updatedAt);
  const rows = await db
    .insert(thredboLiftTransitionsTable)
    .values(
      transitions.map((lift) => ({
        feedUpdatedAt,
        liftId: lift.id,
        liftName: lift.name,
        previousStatus: priorByLift.get(lift.id) ?? null,
        status: lift.status,
        ...windColumns(snapshot, feedUpdatedAt),
      })),
    )
    .onConflictDoNothing({
      target: [thredboLiftTransitionsTable.feedUpdatedAt, thredboLiftTransitionsTable.liftId],
    })
    .returning({ id: thredboLiftTransitionsTable.id });
  return rows.length;
}

let running = false;

export async function sweepThredboLiftHistory(now: Date = new Date()): Promise<void> {
  if (running) return;
  const lockClient = await pool.connect();
  try {
    const lock = await lockClient.query<{ acquired: boolean }>(
      "select pg_try_advisory_lock(hashtext($1)) as acquired",
      [JOB_NAME],
    );
    if (!lock.rows[0]?.acquired) return;
    running = true;
    const runKey = fiveMinuteRunKey(now);
    let claimed = false;
    try {
      claimed = await claimRun(runKey);
    } catch (error) {
      console.error("[thredboLiftHistory] claim failed; retrying next sweep:", error);
      return;
    }
    if (!claimed) return;
    const live = await fetchFreshThredboLiftStatus();
    if (!live) {
      await finishRun(runKey, "feed unavailable or stale; no transition recorded");
      return;
    }
    const prior = await latestStatuses(live.lifts.map((lift) => lift.id));
    const changed = findLiftTransitions(live, prior);
    if (changed.length === 0) {
      await finishRun(runKey, "no lift status changes");
      return;
    }
    const wind = await fetchThredboWindSnapshot();
    const inserted = await recordThredboLiftTransitions(live, wind);
    await finishRun(runKey, `${inserted} lift status transition${inserted === 1 ? "" : "s"} recorded`);
  } catch (error) {
    console.error("[thredboLiftHistory] claimed run failed:", error);
  } finally {
    running = false;
    try {
      await lockClient.query("select pg_advisory_unlock(hashtext($1))", [JOB_NAME]);
    } finally {
      lockClient.release();
    }
  }
}

let cronTask: ScheduledTask | null = null;
let sweepTimer: NodeJS.Timeout | null = null;

export function startThredboLiftHistoryCron(): void {
  if (process.env.RUN_THREDBO_LIFT_HISTORY !== "1") {
    console.log("[thredboLiftHistory] scheduler off (RUN_THREDBO_LIFT_HISTORY != 1)");
    return;
  }
  if (cronTask || sweepTimer) return;
  cronTask = cron.schedule("*/5 * * * *", () => {
    sweepThredboLiftHistory().catch((error) =>
      console.error("[thredboLiftHistory] scheduled sweep failed:", error),
    );
  });
  sweepTimer = setInterval(() => {
    sweepThredboLiftHistory().catch((error) =>
      console.error("[thredboLiftHistory] catch-up sweep failed:", error),
    );
  }, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
  setTimeout(() => {
    sweepThredboLiftHistory().catch((error) =>
      console.error("[thredboLiftHistory] wake-up sweep failed:", error),
    );
  }, 90_000).unref?.();
  console.log("[thredboLiftHistory] scheduler on: every 5 minutes, DB-claimed");
}
