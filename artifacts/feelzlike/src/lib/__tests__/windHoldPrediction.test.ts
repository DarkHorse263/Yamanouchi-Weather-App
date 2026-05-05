import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  predictLiftStatus,
  summariseMountainWindHold,
  type HourlyWindSample,
} from "../windHoldPrediction";
import type { LiftSeed } from "@/data/lifts";

const baseLift: LiftSeed = {
  id: "test",
  mountainId: "test-mountain",
  name: "Test Chair",
  baseElevation: 1500,
  topElevation: 2000,
  exposure: "exposed",
  windHoldThresholdKmh: 70,
  type: "fixed_grip_chair",
  verifiedAt: "2026-05-05",
};

function calmHours(): HourlyWindSample[] {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `2026-07-15T${String(i).padStart(2, "0")}:00`,
    windSpeed: 15,
    windGust: 22,
  }));
}

function gnarlyHours(): HourlyWindSample[] {
  return Array.from({ length: 24 }, (_, i) => ({
    time: `2026-07-15T${String(i).padStart(2, "0")}:00`,
    windSpeed: 80,
    windGust: 110,
  }));
}

describe("predictLiftStatus", () => {
  it("returns likely_open for calm conditions on an exposed lift", () => {
    const pred = predictLiftStatus(baseLift, calmHours(), 1500);
    assert.equal(pred.status, "likely_open");
    assert.ok(pred.confidence > 0.5);
    assert.equal(pred.hoursAtRisk, 0);
  });

  it("returns likely_held for gnarly conditions", () => {
    const pred = predictLiftStatus(baseLift, gnarlyHours(), 1500);
    assert.equal(pred.status, "likely_held");
    assert.ok(pred.confidence > 0.5);
    assert.ok(pred.hoursAtRisk > 0);
  });

  it("applies exposure multiplier — sheltered lifts tolerate more wind", () => {
    const sheltered: LiftSeed = { ...baseLift, exposure: "sheltered" };
    const exposed: LiftSeed = { ...baseLift, exposure: "exposed" };
    // Borderline conditions (~60km/h)
    const borderline: HourlyWindSample[] = Array.from({ length: 24 }, (_, i) => ({
      time: `2026-07-15T${String(i).padStart(2, "0")}:00`,
      windSpeed: 50,
      windGust: 65,
    }));
    const shelteredPred = predictLiftStatus(sheltered, borderline, 1500);
    const exposedPred = predictLiftStatus(exposed, borderline, 1500);
    // Sheltered should have a higher effective threshold
    assert.ok(shelteredPred.effectiveThresholdKmh > exposedPred.effectiveThresholdKmh);
    // And should be more likely to spin
    const order: Record<string, number> = { likely_open: 0, possible_hold: 1, likely_held: 2 };
    assert.ok(order[shelteredPred.status] <= order[exposedPred.status]);
  });

  it("applies altitude lapse — taller lifts have higher effective wind", () => {
    const tallLift: LiftSeed = { ...baseLift, topElevation: 2500 }; // 1000m above ref
    const shortLift: LiftSeed = { ...baseLift, topElevation: 1600 }; // 100m above ref
    const moderate: HourlyWindSample[] = Array.from({ length: 24 }, (_, i) => ({
      time: `2026-07-15T${String(i).padStart(2, "0")}:00`,
      windSpeed: 60,
      windGust: 80,
    }));
    const tallPred = predictLiftStatus(tallLift, moderate, 1500);
    const shortPred = predictLiftStatus(shortLift, moderate, 1500);
    assert.ok(
      (tallPred.worstHour?.effectiveGustKmh ?? 0) > (shortPred.worstHour?.effectiveGustKmh ?? 0),
      "taller lift should see higher effective gusts at top",
    );
  });

  it("includes a human-readable reason with peak gust + threshold", () => {
    const pred = predictLiftStatus(baseLift, gnarlyHours(), 1500);
    assert.match(pred.reason, /km\/h/);
    assert.match(pred.reason, /threshold/);
  });

  it("handles empty forecast gracefully", () => {
    const pred = predictLiftStatus(baseLift, [], 1500);
    assert.equal(pred.status, "likely_open");
    assert.equal(pred.confidence, 0);
    assert.equal(pred.worstHour, null);
  });

  it("infers gusts from sustained wind when missing", () => {
    const noGusts: HourlyWindSample[] = Array.from({ length: 24 }, (_, i) => ({
      time: `2026-07-15T${String(i).padStart(2, "0")}:00`,
      windSpeed: 80,
    }));
    const pred = predictLiftStatus(baseLift, noGusts, 1500);
    // 80 sustained → ~112 inferred gust → with lapse correction → above 60km/h threshold
    assert.notEqual(pred.status, "likely_open");
    assert.ok(pred.worstHour !== null);
    assert.ok(pred.worstHour!.effectiveGustKmh > pred.worstHour!.effectiveWindKmh);
  });
});

describe("summariseMountainWindHold", () => {
  it("counts predictions by bucket and identifies worst-affected lift", () => {
    const calm = predictLiftStatus(baseLift, calmHours(), 1500);
    const gnarly = predictLiftStatus(
      { ...baseLift, id: "gnarly" },
      gnarlyHours(),
      1500,
    );
    const summary = summariseMountainWindHold([calm, gnarly]);
    assert.equal(summary.totalLifts, 2);
    assert.equal(summary.likelyOpen, 1);
    assert.equal(summary.likelyHeld, 1);
    assert.equal(summary.openFraction, 0.5);
    assert.equal(summary.worstLift?.liftId, "gnarly");
  });

  it("returns 0/0 cleanly for empty input", () => {
    const summary = summariseMountainWindHold([]);
    assert.equal(summary.totalLifts, 0);
    assert.equal(summary.openFraction, 0);
    assert.equal(summary.worstLift, null);
  });
});
