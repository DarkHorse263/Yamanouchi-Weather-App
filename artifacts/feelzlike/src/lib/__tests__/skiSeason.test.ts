// ─────────────────────────────────────────────────────────────────────────────
// skiSeason.test.ts - boundary tests for the lift-season gate.
//
// Run with:
//   pnpm --filter @workspace/feelzlike test:skiSeason
//
// tsx + node:test + node:assert, no vitest. Dates are constructed in LOCAL
// time (matching isLiftSeasonOpen's getMonth/getDate), with a fixed midday
// hour so DST never nudges a boundary across a day.
// ─────────────────────────────────────────────────────────────────────────────

import { test } from "node:test";
import assert from "node:assert/strict";
import { isLiftSeasonOpen, computeLiftOperationStatus, deriveSkiableNowRead } from "../skiSeason";

/** Local-time date at midday; `mo` is 1-indexed for readability. */
const d = (y: number, mo: number, day: number) => new Date(y, mo - 1, day, 12, 0, 0);

test("AU/NZ: closed the day before the Jun 10 opening", () => {
  assert.equal(isLiftSeasonOpen("AU", d(2026, 6, 9)), false);
  assert.equal(isLiftSeasonOpen("NZ", d(2026, 6, 9)), false);
});

test("AU/NZ: open exactly on the Jun 10 boundary", () => {
  assert.equal(isLiftSeasonOpen("AU", d(2026, 6, 10)), true);
  assert.equal(isLiftSeasonOpen("NZ", d(2026, 6, 10)), true);
});

test("AU/NZ: open mid-winter", () => {
  assert.equal(isLiftSeasonOpen("AU", d(2026, 6, 20)), true);
  assert.equal(isLiftSeasonOpen("NZ", d(2026, 8, 15)), true);
});

test("AU/NZ: open on Oct 10, closed from Oct 11", () => {
  assert.equal(isLiftSeasonOpen("AU", d(2026, 10, 10)), true);
  assert.equal(isLiftSeasonOpen("AU", d(2026, 10, 11)), false);
  assert.equal(isLiftSeasonOpen("NZ", d(2026, 10, 10)), true);
  assert.equal(isLiftSeasonOpen("NZ", d(2026, 10, 11)), false);
});

test("JP: closed in June (the reported bug case)", () => {
  assert.equal(isLiftSeasonOpen("JP", d(2026, 6, 20)), false);
});

test("JP: shoulder boundaries - closed Nov 30, open Dec 1, open Apr 30, closed May 1", () => {
  assert.equal(isLiftSeasonOpen("JP", d(2026, 11, 30)), false);
  assert.equal(isLiftSeasonOpen("JP", d(2026, 12, 1)), true);
  assert.equal(isLiftSeasonOpen("JP", d(2026, 4, 30)), true);
  assert.equal(isLiftSeasonOpen("JP", d(2026, 5, 1)), false);
});

test("JP: closed mid-summer", () => {
  assert.equal(isLiftSeasonOpen("JP", d(2026, 7, 15)), false);
});

// ─── computeLiftOperationStatus: the honesty priority matrix ──────────────────

test("op-status: off-season beats everything (the original bug)", () => {
  // Even with snow and a live feed full of open lifts, season closed wins.
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: false, snowDepthCm: 120, actualLiftsOpen: 8, actualTotalLifts: 8 }),
    "off_season",
  );
});

test("op-status: live feed reporting 0 of N open -> no_lifts_open", () => {
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 120, actualLiftsOpen: 0, actualTotalLifts: 8 }),
    "no_lifts_open",
  );
});

test("op-status: live feed with lifts open wins over a model snow read of 0", () => {
  // Authoritative feed says lifts ARE open; a ~0cm model snow read must not
  // override it into a false "no snow" closure.
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0, actualLiftsOpen: 3, actualTotalLifts: 8 }),
    "operating",
  );
});

test("op-status: no live feed + known near-zero REPORTED snow -> no_snow", () => {
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0, snowDepthSource: "reported" }),
    "no_snow",
  );
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 1.9, snowDepthSource: "reported" }),
    "no_snow",
  );
});

test("op-status: MODEL near-zero snow never forces no_snow (snowmaking-blind)", () => {
  // Weather models cannot see machine-made base - mid-season AU resorts run
  // lifts on snowmaking while the model reads ~0. Model depth must never
  // assert a closure; only a reported figure may. Default source is "model"
  // so a forgetful caller fails safe.
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0, snowDepthSource: "model" }),
    "operating",
  );
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0 }),
    "operating",
  );
});

test("op-status: snow at/above the 2cm threshold is operating", () => {
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 2 }),
    "operating",
  );
});

test("op-status: unknown snow (null/undefined) never forces a closure", () => {
  // In-season with no snow report must still show the normal wind forecast.
  assert.equal(computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: null }), "operating");
  assert.equal(computeLiftOperationStatus({ seasonOpen: true }), "operating");
});

test("op-status: a total-lift count with unknown open count falls back to snow", () => {
  // totalLifts known but liftsOpen null = not actionable; defer to snow rule.
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0, snowDepthSource: "reported", actualLiftsOpen: null, actualTotalLifts: 8 }),
    "no_snow",
  );
});

// ─── deriveSkiableNowRead: the "skiable now" split (never contradicts above) ───

test("skiable-now: off-season -> off_season", () => {
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: false, snowDepthCm: 120 }),
    { kind: "off_season" },
  );
});

test("skiable-now: known near-zero REPORTED base -> no_base (the fresh-snow-no-base case)", () => {
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 0, snowDepthSource: "reported" }),
    { kind: "no_base" },
  );
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 1.9, snowDepthSource: "reported" }),
    { kind: "no_base" },
  );
});

test("skiable-now: MODEL near-zero base -> unverified, never no_base", () => {
  // The July 2026 bug: lifts spinning on snowmaking while the model read ~0
  // and the UI shouted "no skiable base". Model depth is snowmaking-blind, so
  // it surfaces as an unverified base reading instead of a false negative.
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 0 }),
    { kind: "unverified", baseCm: 0 },
  );
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 1, snowDepthSource: "model" }),
    { kind: "unverified", baseCm: 1 },
  );
});

test("skiable-now: base at/above the 2cm floor is unverified, not no_base", () => {
  // >=2cm is not a positive 'skiable' claim - model depth never asserts that -
  // so it surfaces neutrally as an unverified base reading.
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 2 }),
    { kind: "unverified", baseCm: 2 },
  );
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: 45 }),
    { kind: "unverified", baseCm: 45 },
  );
});

test("skiable-now: unknown base -> unverified with null (never implies skiable OR unskiable)", () => {
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, snowDepthCm: null }),
    { kind: "unverified", baseCm: null },
  );
  assert.deepEqual(deriveSkiableNowRead({ seasonOpen: true }), { kind: "unverified", baseCm: null });
});

test("skiable-now: live feed 0 of N open -> lifts_closed", () => {
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, actualLiftsOpen: 0, actualTotalLifts: 8, liveStatusKnown: true }),
    { kind: "lifts_closed" },
  );
});

test("skiable-now: verified live feed with lifts open -> lifts_open (the only positive)", () => {
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, actualLiftsOpen: 3, actualTotalLifts: 8, liveStatusKnown: true }),
    { kind: "lifts_open", liftsOpen: 3, totalLifts: 8 },
  );
});

test("skiable-now: lifts open but status UNVERIFIED never claims lifts_open", () => {
  // Without a verified live source we must not assert a positive - fall back to
  // the honest base read (here unknown -> null).
  assert.deepEqual(
    deriveSkiableNowRead({ seasonOpen: true, actualLiftsOpen: 3, actualTotalLifts: 8, liveStatusKnown: false }),
    { kind: "unverified", baseCm: null },
  );
});
