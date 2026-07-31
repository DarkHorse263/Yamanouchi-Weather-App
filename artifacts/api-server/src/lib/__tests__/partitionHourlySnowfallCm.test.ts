/**
 * Headline hourly snow partition · same physics as the elevation bands.
 *
 * Run via: npx tsx --test src/lib/__tests__/partitionHourlySnowfallCm.test.ts
 *
 * Guards the Whakapapa July 2026 bug: the headline daily snow (7cm, the
 * model's own grid-cell phase) disagreed with the Elevation forecast mid
 * band (21cm, freezing-level partitioned). Both surfaces now derive snow
 * from hourly precip + freezing level at the same elevation, so these
 * helpers must keep telling one story.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  partitionHourlySnowfallCm,
  partitionPrecipByBand,
  hourCountsByDay,
} from "../openMeteoElevation.js";

test("dry hours are 0, snow hours convert at 0.7cm per mm", () => {
  const out = partitionHourlySnowfallCm([0, 2, null, 1], [1000, 1000, 1000, 1000], 1500);
  assert.deepEqual(out, [0, 1.4, 0, 0.7]);
});

test("snow-line boundary sits exactly at FL - 300m", () => {
  const fl = [1800, 1800, 1800];
  const precip = [1, 1, 1];
  // elevation exactly at FL-300 → snow (>= comparison)
  assert.deepEqual(partitionHourlySnowfallCm(precip, fl, 1500), [0.7, 0.7, 0.7]);
  // 1m below the snow line → rain, reported as 0 snow
  assert.deepEqual(partitionHourlySnowfallCm(precip, fl, 1499), [0, 0, 0]);
});

test("missing FL carries the last known value forward", () => {
  const out = partitionHourlySnowfallCm([1, 1, 1, 1], [1200, null, undefined, null], 1000);
  // carried FL 1200 → snow line 900 → 1000m stays snow all four hours
  assert.deepEqual(out, [0.7, 0.7, 0.7, 0.7]);
});

test("FL rising mid-series flips later hours to rain via carry-forward", () => {
  const out = partitionHourlySnowfallCm([1, 1, 1], [1200, 2600, null], 1500);
  // hour 0: snow line 900 → snow; hours 1-2: carried FL 2600 → snow line 2300 → rain
  assert.deepEqual(out, [0.7, 0, 0]);
});

test("precip hour before any FL returns null (caller falls back to model value)", () => {
  const out = partitionHourlySnowfallCm([2, 0, 1], [null, null, 1000], 1500);
  assert.equal(out[0], null); // no FL yet — unknown, never a confident number
  assert.equal(out[1], 0); // dry hour is safely 0 even without FL
  assert.equal(out[2], 0.7);
});

test("all-null FL yields null for every precip hour", () => {
  const out = partitionHourlySnowfallCm([1, 1], [null, null], 1500);
  assert.deepEqual(out, [null, null]);
});

test("agrees with partitionPrecipByBand day totals at the same elevation", () => {
  const times = Array.from({ length: 24 }, (_, i) => `2026-07-20T${String(i).padStart(2, "0")}:00`);
  const precip = times.map((_, i) => (i % 3 === 0 ? 1.5 : 0));
  const fl = times.map((_, i) => 1900 - i * 40); // cooling day, FL descends
  for (const elev of [1737, 1476, 1216]) {
    const hourly = partitionHourlySnowfallCm(precip, fl, elev);
    const hourlySum = Math.round(hourly.reduce<number>((a, b) => a + (b ?? 0), 0) * 10) / 10;
    const day = partitionPrecipByBand(times, precip, fl, elev).get("2026-07-20")!;
    assert.equal(day.reliable, true);
    assert.equal(hourlySum, day.snowfallCm, `one snow story at ${elev}m`);
  }
});

test("partial-day exclusion: hourCountsByDay flags days without 24 rows", () => {
  const full = Array.from({ length: 24 }, (_, i) => `2026-07-21T${String(i).padStart(2, "0")}:00`);
  const partial = Array.from({ length: 7 }, (_, i) => `2026-07-22T${String(i).padStart(2, "0")}:00`);
  const counts = hourCountsByDay([...full, ...partial, null, undefined, ""]);
  assert.equal(counts.get("2026-07-21"), 24); // fully covered → partition trusted
  assert.ok((counts.get("2026-07-22") ?? 0) < 24, "trailing partial day must be excluded by callers");
  assert.equal(counts.size, 2);
});
