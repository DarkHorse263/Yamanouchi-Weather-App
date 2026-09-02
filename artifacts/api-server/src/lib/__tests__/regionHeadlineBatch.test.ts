import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  __primeHeadlineCacheForTests,
  __resetHeadlineCacheForTests,
  buildHeadlineBatchQueryParams,
  getCacheStats,
  loadRegionHeadlines,
  type HeadlineReading,
  type RegionConfig,
} from "../../routes/regions.js";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
  __resetHeadlineCacheForTests();
});

function region(id: string, lat: number, model?: string): RegionConfig {
  return {
    id,
    name: id,
    country: "Australia",
    countryCode: "AU",
    region: "Test",
    status: "live",
    href: `/${id}/`,
    baseTowns: [],
    mountains: [],
    headlineLabel: id,
    lat,
    lon: 145 + lat / 100,
    elevation: 1000 + lat,
    timezone: "Australia/Melbourne",
    model,
  };
}

function payload(temp: number | null, marker = 0) {
  return {
    elevation: 1000,
    utc_offset_seconds: 36000,
    current: {
      time: "2026-01-01T12:00",
      temperature_2m: temp,
      apparent_temperature: temp,
      wind_speed_10m: 10,
      wind_direction_10m: 90,
      weather_code: marker,
    },
    hourly: { snowfall: Array(24).fill(0) },
    daily: {
      time: ["2026-01-01"],
      temperature_2m_max: [temp],
      temperature_2m_min: [temp],
      precipitation_sum: [0],
      snowfall_sum: [0],
      weather_code: [marker],
    },
  };
}

function reading(locationName: string): HeadlineReading {
  return {
    locationName,
    tempC: 1,
    feelsLikeC: 1,
    windKph: 0,
    windDirection: "",
    windDirectionDeg: null,
    description: "Clear",
    weatherCode: 0,
    snowfallMmNext24h: 0,
    observedAt: "2026-01-01T00:00:00.000Z",
    source: "test",
    forecast: [],
  };
}

test("batch parameters preserve coordinate, elevation, timezone and model alignment", () => {
  const first = region("first", -37, "best_match");
  const second = { ...region("second", -36, "best_match"), elevation: undefined, timezone: "Pacific/Auckland" };
  const params = buildHeadlineBatchQueryParams([first, second]);
  assert.equal(params.get("latitude"), "-37,-36");
  assert.equal(params.get("longitude"), `${first.lon},${second.lon}`);
  assert.equal(params.get("elevation"), `${first.elevation},nan`);
  assert.equal(params.get("timezone"), "Australia/Melbourne,Pacific/Auckland");
  assert.equal(params.get("models"), "best_match");
  assert.throws(
    () => buildHeadlineBatchQueryParams([first, { ...second, model: "gfs_seamless" }]),
    /one model/,
  );
});

test("cold region loading uses bounded batches and aligns responses by index", async () => {
  __resetHeadlineCacheForTests();
  const regions = Array.from({ length: 25 }, (_, index) => region(`r${index}`, index + 1));
  const batchSizes: number[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const latitudes = url.searchParams.get("latitude")!.split(",").map(Number);
    batchSizes.push(latitudes.length);
    const body = latitudes.map((lat) => payload(lat, lat % 4));
    return new Response(JSON.stringify(body), { status: 200 });
  };

  const headlines = await loadRegionHeadlines(regions);
  assert.deepEqual(batchSizes.sort((a, b) => a - b), [5, 20]);
  assert.deepEqual(headlines.map((headline) => headline?.tempC), regions.map((item) => item.lat));
  assert.ok(batchSizes.every((size) => size <= 20));
});

test("concurrent cold loads coalesce onto one batch", async () => {
  __resetHeadlineCacheForTests();
  const regions = [region("one", 1), region("two", 2)];
  let calls = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  globalThis.fetch = async () => {
    calls++;
    await gate;
    return new Response(JSON.stringify([payload(1), payload(2)]), { status: 200 });
  };

  const first = loadRegionHeadlines(regions);
  const second = loadRegionHeadlines(regions);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.equal(getCacheStats().coalesced, 2);
});

test("a malformed item stays null without discarding valid batch neighbours", async () => {
  __resetHeadlineCacheForTests();
  const regions = [region("good-a", 1), region("bad", 2), region("good-b", 3)];
  globalThis.fetch = async () => new Response(
    JSON.stringify([payload(1), payload(null), payload(3)]),
    { status: 200 },
  );
  const headlines = await loadRegionHeadlines(regions);
  assert.deepEqual(headlines.map((headline) => headline?.tempC ?? null), [1, null, 3]);
  assert.equal(getCacheStats().upstreamFails, 1);
});

test("429 batches retry without falling back to per-region requests", async () => {
  __resetHeadlineCacheForTests();
  const regions = [region("one", 1), region("two", 2)];
  const requestedBatchSizes: number[] = [];
  globalThis.fetch = async (input) => {
    const count = new URL(String(input)).searchParams.get("latitude")!.split(",").length;
    requestedBatchSizes.push(count);
    if (requestedBatchSizes.length === 1) {
      return new Response("", { status: 429, headers: { "retry-after": "0" } });
    }
    return new Response(JSON.stringify([payload(1), payload(2)]), { status: 200 });
  };

  const headlines = await loadRegionHeadlines(regions);
  assert.deepEqual(headlines.map((headline) => headline?.tempC), [1, 2]);
  assert.deepEqual(requestedBatchSizes, [2, 2]);
});

test("fresh cache avoids fetch and stale cache is served while a failed refresh runs", async () => {
  __resetHeadlineCacheForTests();
  const cached = reading("cached");
  __primeHeadlineCacheForTests("fresh", cached, 60_000, 60_000);
  __primeHeadlineCacheForTests("stale", cached, -1, 60_000);
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ unexpected: true }), { status: 200 });
  };

  const values = await loadRegionHeadlines([region("fresh", 1), region("stale", 2)]);
  assert.equal(values[0], cached);
  assert.equal(values[1], cached);
  assert.equal(calls, 1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(getCacheStats().hits, 1);
  assert.equal(getCacheStats().staleServed, 1);
});