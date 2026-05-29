/**
 * Trip planner · day-scoring tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:tripPlanner
 *
 * Pattern: tsx --test + node:assert (matches mountainScore / powderFactor).
 * Covers scoreTripDay's tone buckets against the thin daily forecast shape
 * the planner actually receives (no snowDepth / cloudCover).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTripDay } from "../tripDayScore";
import type { TownWeatherDaily } from "../town-weather";

function day(overrides: Partial<TownWeatherDaily>): TownWeatherDaily {
  return {
    date: "2026-07-01",
    weatherCode: 3,
    weatherDescription: "Overcast",
    tempMax: -2,
    tempMin: -8,
    feelsLikeMax: -5,
    feelsLikeMin: -12,
    sunrise: null,
    sunset: null,
    uvIndexMax: null,
    precipitationSum: 0,
    rainSum: 0,
    snowfallSum: 0,
    precipitationProbabilityMax: 0,
    windSpeedMax: 10,
    windGustMax: 15,
    ...overrides,
  };
}

test("heavy fresh snow + calm wind = powder", () => {
  const s = scoreTripDay(day({ weatherCode: 75, snowfallSum: 20, windGustMax: 20 }));
  assert.equal(s.tone, "powder");
  assert.ok(s.total >= 70, `expected high score, got ${s.total}`);
});

test("dry, calm, cold day with no fresh snow = bluebird", () => {
  const s = scoreTripDay(
    day({ weatherCode: 0, snowfallSum: 0, windSpeedMax: 8, windGustMax: 12, tempMax: -3, tempMin: -9 }),
  );
  assert.equal(s.tone, "bluebird");
});

test("gale-force wind drops to marginal or worse", () => {
  const s = scoreTripDay(day({ snowfallSum: 0, windGustMax: 95 }));
  assert.ok(s.tone === "marginal" || s.tone === "no-go", `got ${s.tone}`);
});

test("fresh snow with a non-snow dominant weather code still reads as powder", () => {
  // daily weatherCode is the day's headline (here: overcast) but 12cm fell ·
  // powder must be driven by the snowfall number, not the code.
  const s = scoreTripDay(day({ weatherCode: 3, snowfallSum: 12, windGustMax: 18 }));
  assert.equal(s.tone, "powder");
});

test("a day missing every usable signal is explicit no-data, not fair", () => {
  const s = scoreTripDay(
    day({
      tempMax: null,
      tempMin: null,
      snowfallSum: null,
      windSpeedMax: null,
      windGustMax: null,
    }),
  );
  assert.equal(s.tone, "no-data");
  assert.equal(s.total, 0);
});

test("partial fields never throw and produce a finite, bounded score", () => {
  const s = scoreTripDay(day({ tempMax: null, tempMin: null, snowfallSum: 4 }));
  assert.ok(Number.isFinite(s.total));
  assert.ok(s.total >= 0 && s.total <= 100);
  assert.notEqual(s.tone, "no-data");
});

test("warm wet day scores lower than cold dry day", () => {
  const warmWet = scoreTripDay(
    day({ tempMax: 8, tempMin: 3, snowfallSum: 0, precipitationProbabilityMax: 90, weatherCode: 61 }),
  );
  const coldDry = scoreTripDay(
    day({ tempMax: -3, tempMin: -9, snowfallSum: 0, precipitationProbabilityMax: 0, weatherCode: 3 }),
  );
  assert.ok(coldDry.total > warmWet.total, `cold ${coldDry.total} should beat warm ${warmWet.total}`);
});
