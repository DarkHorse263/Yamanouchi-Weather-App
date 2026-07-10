/**
 * Elevation-band precip partitioning · one cell, one precip story.
 *
 * Run via: npx tsx --test src/lib/__tests__/partitionPrecipByBand.test.ts
 *
 * Guards the July 2026 user report: mid-mountain showed MORE snow (17.0cm)
 * than the summit (13.9cm) because each band's Open-Meteo request landed on
 * a DIFFERENT model grid cell (default cell_selection=land matches terrain
 * to the requested elevation). With the cell pinned, Open-Meteo does not
 * re-partition precip phase per elevation, so we derive snow vs rain per
 * band from the hourly freezing level (snow line = FL - 300m).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { partitionPrecipByBand } from "../openMeteoElevation.js";

const H = (day: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${day}T${String(i).padStart(2, "0")}:00`);

const BANDS = { upper: 1737, mid: 1476, lower: 1216 };

test("snow is monotone with elevation: upper >= mid >= lower", () => {
  // FL sweeps 2100m -> 1200m across the day: high bands flip to snow earlier
  const times = H("2026-07-12", 10);
  const precip = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const fl = [2100, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1300, 1200];
  const upper = partitionPrecipByBand(times, precip, fl, BANDS.upper).get("2026-07-12")!;
  const mid = partitionPrecipByBand(times, precip, fl, BANDS.mid).get("2026-07-12")!;
  const lower = partitionPrecipByBand(times, precip, fl, BANDS.lower).get("2026-07-12")!;
  assert.ok(upper.snowfallCm >= mid.snowfallCm, "upper >= mid snow");
  assert.ok(mid.snowfallCm >= lower.snowfallCm, "mid >= lower snow");
  assert.ok(lower.rainfallMm >= upper.rainfallMm, "lower >= upper rain");
  // Water is conserved per band: snow water + rain = total precip
  for (const b of [upper, mid, lower]) {
    assert.ok(Math.abs(b.snowfallCm / 0.7 + b.rainfallMm - 10) < 0.2, "water conserved");
  }
});

test("cold day: all bands get all precip as snow", () => {
  const times = H("2026-07-12", 6);
  const precip = [2, 2, 0, 2, 2, 2];
  const fl = [900, 900, 900, 900, 900, 900]; // FL well below base
  for (const elev of Object.values(BANDS)) {
    const day = partitionPrecipByBand(times, precip, fl, elev).get("2026-07-12")!;
    assert.equal(day.snowfallCm, 7); // 10mm x 0.7
    assert.equal(day.rainfallMm, 0);
    assert.equal(day.reliable, true);
  }
});

test("warm day: all bands get rain", () => {
  const times = H("2026-07-13", 4);
  const precip = [3, 3, 3, 3];
  const fl = [2600, 2600, 2600, 2600]; // snow line 2300m, above the summit
  for (const elev of Object.values(BANDS)) {
    const day = partitionPrecipByBand(times, precip, fl, elev).get("2026-07-13")!;
    assert.equal(day.snowfallCm, 0);
    assert.equal(day.rainfallMm, 12);
  }
});

test("snow line between bands splits the story", () => {
  const times = H("2026-07-14", 5);
  const precip = [2, 2, 2, 2, 2];
  const fl = [1900, 1900, 1900, 1900, 1900]; // snow line 1600m: above mid/lower, below upper
  const upper = partitionPrecipByBand(times, precip, fl, BANDS.upper).get("2026-07-14")!;
  const mid = partitionPrecipByBand(times, precip, fl, BANDS.mid).get("2026-07-14")!;
  assert.equal(upper.snowfallCm, 7);
  assert.equal(upper.rainfallMm, 0);
  assert.equal(mid.snowfallCm, 0);
  assert.equal(mid.rainfallMm, 10);
});

test("missing FL carries the last known value forward", () => {
  const times = H("2026-07-15", 4);
  const precip = [1, 1, 1, 1];
  const fl = [1000, null, null, null]; // gap after first hour
  const day = partitionPrecipByBand(times, precip, fl, BANDS.lower).get("2026-07-15")!;
  assert.equal(day.reliable, true);
  assert.equal(day.snowfallCm, 2.8); // all 4 hours snow at carried FL 1000m
});

test("precip before any FL marks the day unreliable (caller falls back)", () => {
  const times = H("2026-07-16", 3);
  const precip = [2, 0, 0];
  const fl = [null, null, null];
  const day = partitionPrecipByBand(times, precip, fl, BANDS.mid).get("2026-07-16")!;
  assert.equal(day.reliable, false);
});

test("dry day stays zeroed and reliable", () => {
  const times = H("2026-07-17", 3);
  const day = partitionPrecipByBand(times, [0, 0, 0], [null, null, null], BANDS.upper).get("2026-07-17")!;
  assert.deepEqual(day, { snowfallCm: 0, rainfallMm: 0, reliable: true });
});

test("hours group by local date across a multi-day series", () => {
  const times = [...H("2026-07-18", 2), ...H("2026-07-19", 2)];
  const precip = [1, 1, 2, 2];
  const fl = [800, 800, 800, 800];
  const map = partitionPrecipByBand(times, precip, fl, BANDS.upper);
  assert.equal(map.get("2026-07-18")!.snowfallCm, 1.4);
  assert.equal(map.get("2026-07-19")!.snowfallCm, 2.8);
});
