import cron, { type ScheduledTask } from "node-cron";
import { and, asc, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
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
import {
  analyzeThredboLiftWindHistory,
  hasMinimumThredboWindEvidence,
  type LiftWindAnalysis,
} from "../lib/thredboLiftWindAnalysis.js";
import { THREDBO_THRESHOLDS } from "../lib/thredboLiftThresholds.js";
import { sendEmail } from "../lib/emailSender.js";

const JOB_NAME = "thredbo-lift-history";
const READINESS_JOB_NAME = "thredbo-lift-wind-readiness";
const READINESS_MILESTONE_VERSION = "minimum-evidence-v1";
const READINESS_STALE_CLAIM_MINUTES = 15;
// Resend retains idempotency keys for 24 hours. Stop automatic retries before
// that window closes rather than risk duplicating an ambiguously accepted mail.
const READINESS_MAX_RETRY_HOURS = 23;
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

async function finishRun(runKey: string, ok: boolean, summary: string): Promise<void> {
  await db
    .update(jobRunsTable)
    .set({ finishedAt: sql`now()`, ok, summary })
    .where(and(eq(jobRunsTable.jobName, JOB_NAME), eq(jobRunsTable.runKey, runKey)));
}

export function thredboWindReadinessRunKey(
  analysis: Pick<LiftWindAnalysis, "seedLiftId">,
): string {
  return `${READINESS_MILESTONE_VERSION}:${analysis.seedLiftId}`;
}

interface ReadinessClaim {
  createdAt: string;
  analysis: LiftWindAnalysis;
}

export function thredboWindReadinessRetryExpired(
  createdAt: Date,
  now: Date = new Date(),
): boolean {
  return (
    now.getTime() - createdAt.getTime() >=
    READINESS_MAX_RETRY_HOURS * 60 * 60_000
  );
}

async function expireReadinessMilestone(
  runKey: string,
  retryWindowStarts: Date,
): Promise<boolean> {
  const expired = await db
    .update(jobRunsTable)
    .set({
      finishedAt: sql`now()`,
      ok: false,
      summary: sql`${jobRunsTable.summary}::jsonb || jsonb_build_object(
        'status', 'expired',
        'detail', 'automatic notification expired after transient delivery failures; human review required'
      )`,
    })
    .where(
      and(
        eq(jobRunsTable.jobName, READINESS_JOB_NAME),
        eq(jobRunsTable.runKey, runKey),
        isNull(jobRunsTable.finishedAt),
        sql`(${jobRunsTable.summary}::jsonb->>'createdAt')::timestamptz <= ${retryWindowStarts}`,
      ),
    )
    .returning({ id: jobRunsTable.id });
  return expired.length > 0;
}

async function claimReadinessMilestone(
  runKey: string,
  analysis: LiftWindAnalysis,
): Promise<LiftWindAnalysis | null> {
  const now = new Date();
  const staleBefore = new Date(
    now.getTime() - READINESS_STALE_CLAIM_MINUTES * 60_000,
  );
  const retryWindowStarts = new Date(
    now.getTime() - READINESS_MAX_RETRY_HOURS * 60 * 60_000,
  );
  const initialClaim: ReadinessClaim = {
    createdAt: now.toISOString(),
    analysis,
  };
  if (await expireReadinessMilestone(runKey, retryWindowStarts)) {
    console.error(
      `[thredboLiftHistory] readiness notification ${runKey} exhausted its safe retry window; milestone closed as failed for human review`,
    );
    return null;
  }
  const claimed = await db
    .insert(jobRunsTable)
    .values({
      jobName: READINESS_JOB_NAME,
      runKey,
      summary: JSON.stringify(initialClaim),
    })
    .onConflictDoUpdate({
      target: [jobRunsTable.jobName, jobRunsTable.runKey],
      set: { startedAt: sql`now()` },
      setWhere: and(
        isNull(jobRunsTable.finishedAt),
        lt(jobRunsTable.startedAt, staleBefore),
        sql`(${jobRunsTable.summary}::jsonb->>'createdAt')::timestamptz > ${retryWindowStarts}`,
      ),
    })
    .returning({ summary: jobRunsTable.summary });
  if (!claimed[0]?.summary) return null;
  try {
    return (JSON.parse(claimed[0].summary) as ReadinessClaim).analysis;
  } catch {
    console.error(
      `[thredboLiftHistory] invalid readiness claim payload for ${runKey}; automatic send suppressed`,
    );
    return null;
  }
}

export async function finishReadinessMilestone(
  runKey: string,
  ok: boolean,
  summary: string,
): Promise<boolean> {
  const finished = await db
    .update(jobRunsTable)
    .set({
      finishedAt: sql`now()`,
      ok,
      summary: sql`${jobRunsTable.summary}::jsonb || jsonb_build_object(
        'status', ${ok ? "sent" : "failed"}::text,
        'detail', ${summary}::text
      )`,
    })
    .where(
      and(
        eq(jobRunsTable.jobName, READINESS_JOB_NAME),
        eq(jobRunsTable.runKey, runKey),
        isNull(jobRunsTable.finishedAt),
      ),
    )
    .returning({ id: jobRunsTable.id });
  return finished.length > 0;
}

function readinessRecipient(): string | null {
  const explicit = process.env.THREDBO_WIND_REVIEW_EMAIL?.trim();
  if (explicit) return explicit;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  return admins[0] ?? null;
}

function readinessEmail(row: LiftWindAnalysis): {
  subject: string;
  html: string;
  text: string;
} {
  const starts = row.windHoldStarts.length;
  const releases = row.releases.length;
  const conflicts = row.flags.includes("conflicting_samples") ? "yes" : "no";
  const recommendation = row.recommendation
    ? `${row.recommendation.thresholdKmh} km/h (current public threshold: ${row.currentThresholdKmh} km/h)`
    : "none available; keep the current public threshold";
  const flags = row.flags.length ? row.flags.join(", ") : "none";
  const text = [
    `${row.name} now has enough wind evidence for human review.`,
    "",
    `Clean wind-hold starts: ${starts}`,
    `Clean reopen releases: ${releases}`,
    `Conflicting samples: ${conflicts}`,
    `Evidence flags: ${flags}`,
    `Analyzer recommendation: ${recommendation}`,
    "",
    "No public prediction threshold was changed. Run the Thredbo lift wind analysis and review the underlying samples before making any change.",
  ].join("\n");
  return {
    subject: `Thredbo wind evidence ready · ${row.name}`,
    text,
    html: `<p><strong>${row.name}</strong> now has enough wind evidence for human review.</p>
<ul>
<li>Clean wind-hold starts: ${starts}</li>
<li>Clean reopen releases: ${releases}</li>
<li>Conflicting samples: ${conflicts}</li>
<li>Evidence flags: ${flags}</li>
<li>Analyzer recommendation: ${recommendation}</li>
</ul>
<p><strong>No public prediction threshold was changed.</strong> Run the Thredbo lift wind analysis and review the underlying samples before making any change.</p>`,
  };
}

interface ReadinessEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: string;
  idempotencyKey: string;
}

export interface ThredboReadinessNotifierDependencies {
  loadReady: () => Promise<LiftWindAnalysis[]>;
  claim: (
    runKey: string,
    analysis: LiftWindAnalysis,
  ) => Promise<LiftWindAnalysis | null>;
  finish: (runKey: string, ok: boolean, summary: string) => Promise<boolean>;
  recipient: () => string | null;
  send: (email: ReadinessEmail) => Promise<{
    delivered: boolean;
    provider: string;
    error?: string;
    permanent?: boolean;
  }>;
}

export async function notifyReadyThredboLiftWindEvidenceWithDependencies(
  dependencies: ThredboReadinessNotifierDependencies,
): Promise<number> {
  const recipient = dependencies.recipient();
  const ready = await dependencies.loadReady();
  let sent = 0;

  for (const row of ready) {
    const runKey = thredboWindReadinessRunKey(row);
    const claimedAnalysis = await dependencies.claim(runKey, row);
    if (!claimedAnalysis) continue;
    if (!recipient) {
      await dependencies.finish(
        runKey,
        false,
        `${claimedAnalysis.name}: no THREDBO_WIND_REVIEW_EMAIL or ADMIN_EMAILS recipient was configured; human review required`,
      );
      console.error(
        `[thredboLiftHistory] readiness notification for ${claimedAnalysis.name} closed as failed because no review recipient is configured`,
      );
      continue;
    }

    const result = await dependencies.send({
      ...readinessEmail(claimedAnalysis),
      to: recipient,
      tag: "thredbo-wind-ready",
      idempotencyKey: `${READINESS_JOB_NAME}:${runKey}`,
    });
    if (!result.delivered) {
      if (result.permanent) {
        await dependencies.finish(
          runKey,
          false,
          `${claimedAnalysis.name}: permanent email failure (${result.error ?? result.provider})`,
        );
      }
      console.warn(
        `[thredboLiftHistory] readiness email for ${claimedAnalysis.name} not delivered; ${result.permanent ? "milestone closed as a permanent failure" : "milestone lease left for an idempotent retry within 23 hours"}`,
      );
      continue;
    }
    await dependencies.finish(
      runKey,
      true,
      `${claimedAnalysis.name}: ${claimedAnalysis.windHoldStarts.length} starts, ${claimedAnalysis.releases.length} releases, conflicts=${claimedAnalysis.flags.includes("conflicting_samples")}, recommendation=${claimedAnalysis.recommendation?.thresholdKmh ?? "none"}`,
    );
    sent += 1;
  }
  return sent;
}

export async function notifyReadyThredboLiftWindEvidence(): Promise<number> {
  const transitions = await db
    .select()
    .from(thredboLiftTransitionsTable)
    .orderBy(asc(thredboLiftTransitionsTable.feedUpdatedAt));
  const ready = analyzeThredboLiftWindHistory(
    transitions,
    THREDBO_THRESHOLDS,
  ).filter(hasMinimumThredboWindEvidence);
  return notifyReadyThredboLiftWindEvidenceWithDependencies({
    loadReady: async () => ready,
    claim: claimReadinessMilestone,
    finish: finishReadinessMilestone,
    recipient: readinessRecipient,
    send: sendEmail,
  });
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
    await notifyReadyThredboLiftWindEvidence();
    const live = await fetchFreshThredboLiftStatus();
    if (!live) {
      await finishRun(runKey, false, "feed unavailable or stale; no transition recorded");
      return;
    }
    const prior = await latestStatuses(live.lifts.map((lift) => lift.id));
    const changed = findLiftTransitions(live, prior);
    if (changed.length === 0) {
      await finishRun(runKey, true, "no lift status changes");
      return;
    }
    const wind = await fetchThredboWindSnapshot();
    const inserted = await recordThredboLiftTransitions(live, wind);
    await finishRun(runKey, true, `${inserted} lift status transition${inserted === 1 ? "" : "s"} recorded`);
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
