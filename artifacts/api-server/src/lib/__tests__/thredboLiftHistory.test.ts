import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findLiftTransitions,
  fiveMinuteRunKey,
  finishReadinessMilestone,
  notifyReadyThredboLiftWindEvidenceWithDependencies,
  thredboWindReadinessRetryExpired,
  thredboWindReadinessRunKey,
  windColumns,
} from "../../jobs/thredboLiftHistory.js";
import { db, jobRunsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { classifyThredboHistoryFreshness } from "../../jobs/smokeTest.js";
import { parseFreshWindReading } from "../thredboWindObservation.js";
import type { ThredboLiveLiftStatus } from "../thredboLiftStatus.js";
import type { LiftWindAnalysis } from "../thredboLiftWindAnalysis.js";

const live: ThredboLiveLiftStatus = {
  updatedAt: "2026-08-30T03:05:00.000Z",
  lifts: [
    { id: "a", name: "Lift A", type: "chairlift", status: "wind-hold" },
    { id: "b", name: "Lift B", type: "t-bar", status: "open" },
  ],
};

test("findLiftTransitions records only changed and newly seen lifts", () => {
  assert.deepEqual(
    findLiftTransitions(live, [
      { liftId: "a", status: "open" },
      { liftId: "b", status: "open" },
    ]).map((lift) => lift.id),
    ["a"],
  );
  assert.deepEqual(findLiftTransitions(live, []).map((lift) => lift.id), ["a", "b"]);
});

test("fiveMinuteRunKey buckets every replica into the same UTC claim", () => {
  assert.equal(
    fiveMinuteRunKey(new Date("2026-08-30T03:09:59.999Z")),
    "2026-08-30T03:05:00.000Z",
  );
});

test("wind readiness uses one stable milestone per curated lift", () => {
  assert.equal(
    thredboWindReadinessRunKey({ seedLiftId: "kosciuszko-express" }),
    "minimum-evidence-v1:kosciuszko-express",
  );
});

test("wind readiness stops retries before provider deduplication expires", () => {
  const now = new Date("2026-08-31T12:00:00Z");
  assert.equal(
    thredboWindReadinessRetryExpired(
      new Date("2026-08-30T13:00:00.001Z"),
      now,
    ),
    false,
  );
  assert.equal(
    thredboWindReadinessRetryExpired(
      new Date("2026-08-30T13:00:00.000Z"),
      now,
    ),
    true,
  );
});

test("ready wind evidence without a recipient becomes a durable failed human-review item", async () => {
  const analysis: LiftWindAnalysis = {
    liveLiftIds: ["test-lift"],
    seedLiftId: "test-lift",
    name: "Test lift",
    currentThresholdKmh: 60,
    verifiedAt: "2026-08-31",
    windHoldStarts: [61, 63, 65],
    releases: [45, 47, 49],
    ignoredMissingWind: 0,
    flags: [],
    recommendation: {
      thresholdKmh: 55,
      startMedianKmh: 63,
      releaseMedianKmh: 47,
      basis: "3 wind-hold starts and 3 open releases",
    },
  };
  const finished: Array<{ runKey: string; ok: boolean; summary: string }> = [];
  let sends = 0;

  const sent = await notifyReadyThredboLiftWindEvidenceWithDependencies({
    loadReady: async () => [analysis],
    claim: async (_runKey, row) => row,
    finish: async (runKey, ok, summary) => {
      finished.push({ runKey, ok, summary });
      return true;
    },
    recipient: () => null,
    send: async () => {
      sends += 1;
      return { delivered: true, provider: "test" };
    },
  });

  assert.equal(sent, 0);
  assert.equal(sends, 0);
  assert.deepEqual(finished, [{
    runKey: "minimum-evidence-v1:test-lift",
    ok: false,
    summary:
      "Test lift: no THREDBO_WIND_REVIEW_EMAIL or ADMIN_EMAILS recipient was configured; human review required",
  }]);
});

test("a stale readiness worker cannot overwrite an acknowledged terminal failure", async () => {
  const runKey = `terminal-fence-test:${randomUUID()}`;
  await db.insert(jobRunsTable).values({
    jobName: "thredbo-lift-wind-readiness",
    runKey,
    summary: JSON.stringify({
      createdAt: new Date().toISOString(),
      analysis: { seedLiftId: "test-lift", name: "Test lift" },
    }),
  });
  try {
    assert.equal(await finishReadinessMilestone(runKey, false, "human review required"), true);
    await db
      .update(jobRunsTable)
      .set({
        acknowledgedAt: new Date(),
        acknowledgedByUserId: "test-admin",
        acknowledgedByEmail: "test-admin@example.com",
      })
      .where(
        and(
          eq(jobRunsTable.jobName, "thredbo-lift-wind-readiness"),
          eq(jobRunsTable.runKey, runKey),
        ),
      );

    assert.equal(await finishReadinessMilestone(runKey, true, "late stale success"), false);
    const [row] = await db
      .select()
      .from(jobRunsTable)
      .where(
        and(
          eq(jobRunsTable.jobName, "thredbo-lift-wind-readiness"),
          eq(jobRunsTable.runKey, runKey),
        ),
      );
    assert.equal(row?.ok, false);
    assert.ok(row?.acknowledgedAt instanceof Date);
    assert.match(row?.summary ?? "", /human review required/);
    assert.doesNotMatch(row?.summary ?? "", /late stale success/);
  } finally {
    await db
      .delete(jobRunsTable)
      .where(
        and(
          eq(jobRunsTable.jobName, "thredbo-lift-wind-readiness"),
          eq(jobRunsTable.runKey, runKey),
        ),
      );
  }
});

test("BOM wind parser keeps fresh readings and rejects stale ones", () => {
  const rows = [{
    aifstime_utc: "20260830030000",
    wind_spd_kmh: 48,
    gust_kmh: 67,
    wind_dir: "WNW",
  }];
  const fresh = parseFreshWindReading(rows, Date.parse("2026-08-30T04:00:00Z"));
  assert.equal(fresh?.windKmh, 48);
  assert.equal(fresh?.gustKmh, 67);
  assert.equal(fresh?.direction, "WNW");
  assert.equal(
    parseFreshWindReading(rows, Date.parse("2026-08-30T05:00:01Z")),
    null,
  );
  assert.equal(
    parseFreshWindReading(rows, Date.parse("2026-08-30T02:50:00Z")),
    null,
  );
});

test("wind evidence is stored only when it is concurrent with the lift feed", () => {
  const feedUpdatedAt = new Date("2026-08-30T03:05:00Z");
  const concurrent = {
    observedAt: new Date("2026-08-30T03:00:00Z"),
    windKmh: 48,
    gustKmh: 67,
    direction: "WNW",
  };
  const stale = {
    ...concurrent,
    observedAt: new Date("2026-08-30T01:00:00Z"),
  };
  assert.equal(windColumns({ village: concurrent, top: stale }, feedUpdatedAt).villageWindKmh, 48);
  assert.equal(windColumns({ village: concurrent, top: stale }, feedUpdatedAt).topWindKmh, null);
});

test("history freshness ignores expected off-season inactivity", () => {
  assert.equal(
    classifyThredboHistoryFreshness(new Date("2026-11-15T00:00:00Z"), null, null),
    "off-season",
  );
});

test("history freshness distinguishes a stopped scheduler from an unavailable feed", () => {
  const now = new Date("2026-08-30T04:00:00Z");
  assert.equal(
    classifyThredboHistoryFreshness(
      now,
      new Date("2026-08-30T03:20:00Z"),
      new Date("2026-08-30T03:55:00Z"),
    ),
    "scheduler-stopped",
  );
  assert.equal(
    classifyThredboHistoryFreshness(
      now,
      new Date("2026-08-30T03:55:00Z"),
      new Date("2026-08-30T03:20:00Z"),
    ),
    "feed-unavailable",
  );
  assert.equal(
    classifyThredboHistoryFreshness(
      now,
      new Date("2026-08-30T03:55:00Z"),
      new Date("2026-08-30T03:50:00Z"),
    ),
    "fresh",
  );
});