import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { HourlyForecast } from "@workspace/api-client-react";
import { computePowderFactor } from "../powderFactor.js";

const NOW = "2026-01-15T12:00:00Z";
const NOW_MS = new Date(NOW).getTime();

function hour(
  offsetH: number,
  overrides: Partial<HourlyForecast> = {},
): HourlyForecast {
  return {
    time: new Date(NOW_MS + offsetH * 3600_000).toISOString(),
    temperature: -5,
    weatherCode: 0,
    weatherDescription: "Clear",
    precipitation: 0,
    snowfall: 0,
    windSpeed: 5,
    humidity: 50,
    feelsLike: -8,
    cloudCover: 0,
    ...overrides,
  };
}

describe("computePowderFactor", () => {
  it("returns empty score for null/empty input", () => {
    const a = computePowderFactor(null, NOW);
    const b = computePowderFactor([], NOW);
    assert.equal(a.score, 0);
    assert.equal(a.quality, "survival");
    assert.equal(b.score, 0);
    assert.equal(b.totalSnow, 0);
  });

  it("scores a fresh deep cold dump as bottomless or premium", () => {
    // 12 hours of heavy snowfall ending 1 hour ago.
    const hours: HourlyForecast[] = [];
    for (let i = -13; i <= -1; i++) {
      hours.push(
        hour(i, {
          snowfall: 2.5,
          temperature: -7,
          humidity: 35,
          windSpeed: 8,
          weatherCode: 73,
        }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.totalSnow >= 30, `expected >=30cm, got ${f.totalSnow}`);
    assert.ok(f.score >= 73, `expected >=73 for fresh deep cold dump, got ${f.score}`);
    assert.ok(
      f.quality === "premium" || f.quality === "bottomless",
      `expected premium/bottomless, got ${f.quality}`,
    );
    assert.ok(!f.rainedAfterSnow);
    assert.ok(!f.thawedAfterSnow);
  });

  it("penalises rain-after-snow as survival skiing", () => {
    const hours: HourlyForecast[] = [];
    // Heavy snow 36–24h ago
    for (let i = -36; i <= -24; i++) {
      hours.push(
        hour(i, { snowfall: 2, temperature: -6, humidity: 40, weatherCode: 73 }),
      );
    }
    // Rain 12–6h ago (destroys it)
    for (let i = -12; i <= -6; i++) {
      hours.push(
        hour(i, { precipitation: 3, temperature: 3, humidity: 90, weatherCode: 63 }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.rainedAfterSnow, "should detect rain after snow");
    assert.ok(f.score <= 30, `rain-destroyed snow should be <=30, got ${f.score}`);
    assert.equal(f.reason, "Rain after snow - icy crust");
  });

  it("penalises thaw-after-snow short of full destruction", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -36; i <= -24; i++) {
      hours.push(
        hour(i, { snowfall: 2, temperature: -6, humidity: 40, weatherCode: 73 }),
      );
    }
    // Thaw without precipitation (sun + warmth)
    for (let i = -12; i <= -6; i++) {
      hours.push(hour(i, { temperature: 5, humidity: 60, weatherCode: 0 }));
    }
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.thawedAfterSnow);
    assert.ok(!f.rainedAfterSnow);
    // Thaw multiplier (×0.5) is less harsh than rain (×0.3)
    assert.ok(f.score < 50 && f.score > 0);
    assert.equal(f.reason, "Thawed after snow - refrozen");
  });

  it("decays freshness - old snow with no destruction degrades to decent or worse", () => {
    const hours: HourlyForecast[] = [];
    // Snow 47–40h ago, then nothing
    for (let i = -47; i <= -40; i++) {
      hours.push(
        hour(i, { snowfall: 1.5, temperature: -6, humidity: 45, weatherCode: 73 }),
      );
    }
    for (let i = -39; i <= -1; i++) {
      hours.push(hour(i, { temperature: -3, weatherCode: 0 }));
    }
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.hoursSinceSnow >= 39, `freshness ~40h, got ${f.hoursSinceSnow}`);
    assert.ok(f.sub.freshness <= 5, `freshness sub-score should be low`);
    assert.ok(
      f.quality === "decent" || f.quality === "hardpack" || f.quality === "soft_fast",
      `expected stale powder bucket, got ${f.quality}`,
    );
  });

  it("ignores future hours - only scores what already happened", () => {
    const hours: HourlyForecast[] = [];
    // Future massive dump (should NOT count)
    for (let i = 1; i <= 24; i++) {
      hours.push(
        hour(i, { snowfall: 5, temperature: -7, humidity: 30, weatherCode: 75 }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.equal(f.totalSnow, 0);
    assert.equal(f.score, 0);
  });

  it("ignores hours older than the window (default 48h)", () => {
    const hours: HourlyForecast[] = [];
    // 3 days old - outside window
    for (let i = -72; i <= -50; i++) {
      hours.push(
        hour(i, { snowfall: 5, temperature: -7, humidity: 30, weatherCode: 75 }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.equal(f.totalSnow, 0);
    assert.equal(f.score, 0);
  });

  it("penalises high wind during snowfall", () => {
    const calm: HourlyForecast[] = [];
    const windy: HourlyForecast[] = [];
    for (let i = -10; i <= -1; i++) {
      calm.push(
        hour(i, { snowfall: 1.5, temperature: -6, humidity: 40, windSpeed: 5, weatherCode: 73 }),
      );
      windy.push(
        hour(i, { snowfall: 1.5, temperature: -6, humidity: 40, windSpeed: 45, weatherCode: 73 }),
      );
    }
    const fc = computePowderFactor(calm, NOW);
    const fw = computePowderFactor(windy, NOW);
    assert.ok(fc.sub.wind > fw.sub.wind);
    assert.ok(fc.score > fw.score, `calm (${fc.score}) should beat windy (${fw.score})`);
  });

  it("rewards low humidity (light dry snow) over wet snow", () => {
    const dry: HourlyForecast[] = [];
    const wet: HourlyForecast[] = [];
    for (let i = -10; i <= -1; i++) {
      dry.push(hour(i, { snowfall: 1.5, temperature: -7, humidity: 30, weatherCode: 73 }));
      wet.push(hour(i, { snowfall: 1.5, temperature: -1, humidity: 95, weatherCode: 73 }));
    }
    const fd = computePowderFactor(dry, NOW);
    const fw = computePowderFactor(wet, NOW);
    assert.ok(fd.sub.humidity > fw.sub.humidity);
    assert.ok(fd.sub.temp > fw.sub.temp);
    assert.ok(fd.score > fw.score);
  });

  it("returns sensible reason copy for fresh snow", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -5; i <= -1; i++) {
      hours.push(
        hour(i, { snowfall: 3, temperature: -7, humidity: 35, windSpeed: 8, weatherCode: 73 }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.match(f.reason, /fresh/i);
    assert.ok(f.reasonJa.length > 0);
  });

  it("survives missing/NaN per-hour fields without poisoning averages", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -10; i <= -1; i++) {
      hours.push(
        hour(i, {
          snowfall: 1.5,
          // Mix of valid and missing values - should compute averages from valid only.
          temperature: i % 2 === 0 ? -6 : (NaN as number),
          humidity: i % 3 === 0 ? (undefined as unknown as number) : 40,
          windSpeed: i % 4 === 0 ? (NaN as number) : 8,
          weatherCode: 73,
        }),
      );
    }
    const f = computePowderFactor(hours, NOW);
    assert.ok(Number.isFinite(f.score), `score must be finite, got ${f.score}`);
    assert.ok(Number.isFinite(f.sub.temp));
    assert.ok(Number.isFinite(f.sub.humidity));
    assert.ok(Number.isFinite(f.sub.wind));
    assert.ok(f.score >= 0 && f.score <= 100);
  });

  it("does NOT mark thaw for a single brief warm hour", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -36; i <= -24; i++) {
      hours.push(
        hour(i, { snowfall: 2, temperature: -6, humidity: 40, weatherCode: 73 }),
      );
    }
    // Single isolated warm hour at +3°C - brief midday spike, not destructive.
    hours.push(hour(-12, { temperature: 3, weatherCode: 0 }));
    // Surrounding hours stay cold.
    hours.push(hour(-11, { temperature: -1, weatherCode: 0 }));
    hours.push(hour(-10, { temperature: -2, weatherCode: 0 }));
    const f = computePowderFactor(hours, NOW);
    assert.ok(!f.thawedAfterSnow, "single brief warm hour should not condemn snow");
    assert.ok(!f.rainedAfterSnow);
  });

  it("DOES mark thaw for sustained warmth (2+ hours above +2°C)", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -36; i <= -24; i++) {
      hours.push(
        hour(i, { snowfall: 2, temperature: -6, humidity: 40, weatherCode: 73 }),
      );
    }
    // Two consecutive warm hours.
    hours.push(hour(-12, { temperature: 3, weatherCode: 0 }));
    hours.push(hour(-11, { temperature: 3, weatherCode: 0 }));
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.thawedAfterSnow);
  });

  it("DOES mark thaw for any single hour above +4°C (strong spike)", () => {
    const hours: HourlyForecast[] = [];
    for (let i = -36; i <= -24; i++) {
      hours.push(
        hour(i, { snowfall: 2, temperature: -6, humidity: 40, weatherCode: 73 }),
      );
    }
    // One strong warm hour - even brief +5°C will damage the surface.
    hours.push(hour(-12, { temperature: 5, weatherCode: 0 }));
    const f = computePowderFactor(hours, NOW);
    assert.ok(f.thawedAfterSnow, "+5°C single hour should still mark thaw");
  });

  it("never produces NaN/negative scores or out-of-range buckets", () => {
    const random: HourlyForecast[] = [];
    for (let i = -47; i <= -1; i++) {
      random.push(
        hour(i, {
          snowfall: Math.random() * 4,
          temperature: Math.random() * 20 - 15,
          humidity: Math.random() * 100,
          windSpeed: Math.random() * 60,
          weatherCode: [0, 73, 75, 63, 80][Math.floor(Math.random() * 5)],
          precipitation: Math.random() * 3,
        }),
      );
    }
    const f = computePowderFactor(random, NOW);
    assert.ok(Number.isFinite(f.score));
    assert.ok(f.score >= 0 && f.score <= 100);
    assert.ok(["bottomless", "premium", "soft_fast", "decent", "hardpack", "survival"].includes(f.quality));
  });
});
