import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { setSubscriptionResolver } from "../../middlewares/require-entitlement.js";
import { publicEnsembleForecast, type EnsembleForecast } from "../ensemble-forecast.js";
import {
  canonicalSnowElevation, forecastDaysForRegion, freeWeatherHorizon,
  resetWeatherRuntimeForTests, resolveWeatherLocation, setWeatherFetcherForTests,
  default as weatherRouter,
} from "../../routes/weather.js";

test("Austria uses the supported seven-day weather horizon", () => {
  assert.equal(forecastDaysForRegion("AT"), 7);
});

test("existing country horizons retain their established behaviour", () => {
  assert.equal(forecastDaysForRegion("JP"), 7);
  assert.equal(forecastDaysForRegion("AU"), 14);
  assert.equal(forecastDaysForRegion("CA"), 14);
  assert.equal(forecastDaysForRegion(undefined), 14);
});

test("untrusted snow heights cannot create arbitrary upstream/cache variants", () => {
  const perisher = resolveWeatherLocation("perisher")!;
  for (const [id, height] of [
    ["thredbo", 1701],
    ["perisher", 1887],
    ["whistler-mountain", 1429],
    ["mt-buller", 1590],
    ["coronet-peak", 1398],
    ["charlottes-pass", 1860],
  ] as const) {
    assert.equal(canonicalSnowElevation(resolveWeatherLocation(id)!, String(height)), height, id);
  }
  assert.equal(canonicalSnowElevation(resolveWeatherLocation("thredbo")!, "1737"), undefined); // already the server forecast height
  assert.equal(canonicalSnowElevation(resolveWeatherLocation("shigakogen-mountain-resort")!, "1824"), 1824);
  for (const input of ["1888", "9000", "NaN", "Infinity", "0", "1887.5", ["1887"]]) {
    assert.equal(canonicalSnowElevation(perisher, input), undefined);
  }
  assert.equal(canonicalSnowElevation(resolveWeatherLocation("st-anton")!, "2058"), undefined);
});

test("public horizon removes premium days and hours without modifying cached input", () => {
  const payload = {
    daily: Array.from({ length: 14 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
    })),
    hourly: Array.from({ length: 14 }, (_, i) => ({
      time: `2026-01-${String(i + 1).padStart(2, "0")}T12:00`,
    })),
    stale: true,
    staleAgeSeconds: 900,
  };
  const free = freeWeatherHorizon(payload);
  assert.equal(free.daily.length, 7);
  assert.equal(free.hourly.length, 7);
  assert.equal(payload.daily.length, 14);
  assert.equal(payload.hourly.length, 14);
  assert.equal(free.stale, true);
  assert.equal(free.staleAgeSeconds, 900);
});

test("public ensemble preserves basic trip-planner days but strips model spread and day eight", () => {
  const source: EnsembleForecast = {
    generatedAt: "2026-01-01T00:00:00Z",
    sources: [],
    days: Array.from({ length: 9 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      tempMaxMean: 0, tempMinMean: -3, tempMaxSpread: 2, tempMinSpread: 2,
      precipMean: 1, precipSpread: 3, snowMean: 1, snowSpread: 4,
      feelsLikeMaxMean: -1, feelsLikeMinMean: -4, feelsLikeSources: ["ECMWF"],
      sourcesCount: 2, confidence: "medium" as const,
      perSource: [{ source: "ECMWF", snow: 2 }],
    })),
  };
  const free = publicEnsembleForecast(source);
  assert.equal(free.days.length, 7);
  assert.equal(free.days[0]?.snowMean, 1);
  assert.equal("snowSpread" in free.days[0]!, false);
  assert.equal("perSource" in free.days[0]!, false);
  assert.equal(source.days.length, 9);
  assert.equal(source.days[0]?.snowSpread, 4);
});

test("weather endpoint serves seven days anonymously, full horizon to entitled users, from one cache", async () => {
  resetWeatherRuntimeForTests();
  let subscribed = false;
  let upstreamCalls = 0;
  setSubscriptionResolver(() => subscribed ? { tier: "pro", status: "active" } : null);
  setWeatherFetcherForTests(async (location) => {
    upstreamCalls++;
    return {
      location: {
        id: location.id, name: location.name, elevation: location.elevation,
        latitude: location.latitude, longitude: location.longitude, description: location.description,
      },
      current: {
        temperature: 0, feelsLike: -1, humidity: 60, windSpeed: 10, windDirection: 180,
        weatherCode: 71, weatherDescription: "Snow", isDay: true, precipitation: 0, cloudCover: 80,
      },
      daily: Array.from({ length: 14 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        maxTemp: 0, minTemp: -2, weatherCode: 71, weatherDescription: "Snow",
        precipitationSum: 1, snowfallSum: 1, windSpeedMax: 10,
      })),
      hourly: Array.from({ length: 14 }, (_, i) => ({
        time: `2026-01-${String(i + 1).padStart(2, "0")}T12:00`,
        temperature: 0, weatherCode: 71, weatherDescription: "Snow",
        precipitation: 1, windSpeed: 10, humidity: 60, feelsLike: -1,
      })),
      lastUpdated: "2026-01-01T00:00:00Z",
    };
  });
  const app = express();
  app.use(weatherRouter);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/weather/perisher`;
    const free = await fetch(url);
    assert.equal(free.headers.get("cache-control"), "private, no-store");
    const freeBody = await free.json() as { daily: unknown[]; hourly: unknown[] };
    assert.equal(freeBody.daily.length, 7);
    assert.equal(freeBody.hourly.length, 7);
    subscribed = true;
    const premium = await fetch(url);
    assert.equal(premium.headers.get("cache-control"), "private, no-store");
    const premiumBody = await premium.json() as { daily: unknown[]; hourly: unknown[] };
    assert.equal(premiumBody.daily.length, 14);
    assert.equal(premiumBody.hourly.length, 14);
    assert.equal(upstreamCalls, 1);
    setSubscriptionResolver(() => { throw new Error("entitlement lookup unavailable"); });
    const denied = await fetch(url);
    assert.equal(denied.status, 503);
    const deniedBody = await denied.json() as { daily?: unknown[] };
    assert.equal(deniedBody.daily, undefined, "resolver failure leaked a cached premium forecast");
    assert.equal(upstreamCalls, 1);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    setSubscriptionResolver(() => null);
    resetWeatherRuntimeForTests();
  }
});