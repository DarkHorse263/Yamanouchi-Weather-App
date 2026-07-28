// ─────────────────────────────────────────────────────────────────────────────
// lifts.test.ts - invariant checks for the curated lift seed corpus.
//
// Run with:
//   pnpm --filter @workspace/feelzlike test:lifts
//
// tsx + node:test + node:assert, no vitest. Deliberately does NOT import
// `@/regions` (its PNG asset imports crash `tsx --test`), so mountainId
// membership against region configs is checked in review, not here.
// ─────────────────────────────────────────────────────────────────────────────

import { test } from "node:test";
import assert from "node:assert/strict";

import { LIFT_SEED, type LiftExposure, type LiftType } from "../lifts";

const TYPES: readonly LiftType[] = ["gondola", "detachable", "fixed_grip_chair", "t-bar", "rope_tow"];
const EXPOSURES: readonly LiftExposure[] = ["sheltered", "moderate", "exposed", "highly_exposed"];

test("lift ids are globally unique", () => {
  const seen = new Set<string>();
  for (const lift of LIFT_SEED) {
    assert.ok(!seen.has(lift.id), `duplicate lift id: ${lift.id}`);
    seen.add(lift.id);
  }
});

test("every entry has sane fields", () => {
  assert.ok(LIFT_SEED.length > 100, `expected a full corpus, got ${LIFT_SEED.length}`);
  for (const lift of LIFT_SEED) {
    assert.ok(lift.id.length > 0 && lift.mountainId.length > 0 && lift.name.length > 0, `empty field on ${lift.id}`);
    assert.ok(TYPES.includes(lift.type), `${lift.id}: bad type ${lift.type}`);
    assert.ok(EXPOSURES.includes(lift.exposure), `${lift.id}: bad exposure ${lift.exposure}`);
    assert.ok(
      lift.topElevation >= lift.baseElevation,
      `${lift.id}: top ${lift.topElevation} below base ${lift.baseElevation}`,
    );
    assert.ok(lift.baseElevation > 0 && lift.topElevation < 3200, `${lift.id}: implausible elevations`);
    assert.ok(
      lift.windHoldThresholdKmh >= 40 && lift.windHoldThresholdKmh <= 120,
      `${lift.id}: threshold ${lift.windHoldThresholdKmh} outside 40-120`,
    );
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(lift.verifiedAt), `${lift.id}: bad verifiedAt ${lift.verifiedAt}`);
  }
});
