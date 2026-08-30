import { test } from "node:test";
import assert from "node:assert/strict";
import { findLiftTransitions, fiveMinuteRunKey, windColumns } from "../../jobs/thredboLiftHistory.js";
import { parseFreshWindReading } from "../thredboWindObservation.js";
import type { ThredboLiveLiftStatus } from "../thredboLiftStatus.js";

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