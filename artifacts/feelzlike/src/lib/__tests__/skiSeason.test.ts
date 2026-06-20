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
import { isLiftSeasonOpen, computeLiftOperationStatus } from "../skiSeason";

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

test("op-status: no live feed + known near-zero snow -> no_snow", () => {
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0 }),
    "no_snow",
  );
  assert.equal(
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 1.9 }),
    "no_snow",
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
    computeLiftOperationStatus({ seasonOpen: true, snowDepthCm: 0, actualLiftsOpen: null, actualTotalLifts: 8 }),
    "no_snow",
  );
});
