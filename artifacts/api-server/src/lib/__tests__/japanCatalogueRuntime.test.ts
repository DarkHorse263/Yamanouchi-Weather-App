import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { publishedCatalogueRecords } from "@workspace/japan-ski-catalogue/public-runtime";
import {
  CATALOGUE_LOCATION_ALERTS_AVAILABLE,
  BULK_WEATHER_CONCURRENCY,
  resetWeatherRuntimeForTests,
  resolveWeatherLocation,
  setWeatherFetcherForTests,
  WEATHER_LOCATION_ALIASES,
  WEATHER_LOCATION_IDS,
  default as weatherRouter,
} from "../../routes/weather.js";
import { regionForLocation } from "../regions.js";
import { CATALOGUE_REGION_METADATA } from "../../routes/regions.js";

function weatherPayload(location: NonNullable<ReturnType<typeof resolveWeatherLocation>>) {
  return {
    location: {
      id: location.id,
      name: location.name,
      elevation: location.elevation,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
    },
    current: {
      temperature: -2,
      feelsLike: -5,
      humidity: 90,
      windSpeed: 10,
      windDirection: 180,
      weatherCode: 71,
      weatherDescription: "Snow",
      isDay: true,
      precipitation: 1,
      cloudCover: 100,
    },
    daily: [],
    hourly: [],
    lastUpdated: new Date(0).toISOString(),
  };
}

async function startWeatherServer() {
  const app = express();
  app.use(weatherRouter);
  return new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
}

test("all published Japan catalogue public ids resolve uniquely", () => {
  assert.ok(publishedCatalogueRecords.length > 0);
  const ids = publishedCatalogueRecords.map((record) => record.publicId);
  assert.equal(new Set(ids).size, ids.length);
  for (const record of publishedCatalogueRecords) {
    assert.ok(resolveWeatherLocation(record.publicId), `${record.publicId} did not resolve`);
  }
});

test("catalogue aliases are collision-free and resolve to their record", () => {
  const seen = new Set(publishedCatalogueRecords.map((record) => record.publicId));
  for (const record of publishedCatalogueRecords) {
    for (const alias of record.aliases) {
      assert.ok(!seen.has(alias), `catalogue alias collision: ${alias}`);
      seen.add(alias);
      assert.equal(resolveWeatherLocation(alias)?.id, record.publicId);
    }
  }
  assert.equal(new Set(WEATHER_LOCATION_ALIASES).size, WEATHER_LOCATION_ALIASES.length);
});

test("catalogue weather lookup uses its published coordinates and forecast elevation", () => {
  const record = publishedCatalogueRecords.find((candidate) => candidate.publicId === "togakushi-ski-resort");
  assert.ok(record, "representative catalogue record is missing");
  const location = resolveWeatherLocation(record.publicId);
  assert.ok(location);
  assert.equal(location.latitude, record.coordinates.lat);
  assert.equal(location.longitude, record.coordinates.lng);
  assert.equal(location.elevation, record.forecastElevationM);
  assert.equal(location.region, "JP");
  assert.equal(location.timezone, "Asia/Tokyo");
});

test("catalogue region mapping preserves shared travel region and JP country metadata", () => {
  for (const record of publishedCatalogueRecords) {
    assert.equal(regionForLocation(record.publicId), record.travelRegionId);
    for (const alias of record.aliases) {
      assert.equal(regionForLocation(alias), record.travelRegionId);
    }
    const region = CATALOGUE_REGION_METADATA.get(record.travelRegionId);
    assert.ok(region, `${record.travelRegionId} metadata missing`);
    assert.equal(region.countryCode, "JP");
  }
});

test("hard-coded locations remain unchanged", () => {
  const thredbo = resolveWeatherLocation("thredbo");
  assert.deepEqual(
    thredbo && { latitude: thredbo.latitude, longitude: thredbo.longitude, elevation: thredbo.elevation },
    { latitude: -36.5054, longitude: 148.3089, elevation: 1737 },
  );
  assert.equal(resolveWeatherLocation("not-a-published-location"), undefined);
});

test("unknown weather id remains a 404", async () => {
  const server = await startWeatherServer();
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/weather/not-a-published-location`);
    assert.equal(response.status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("unfiltered bulk weather includes catalogue locations and is cached, coalesced, and concurrency-bounded", async () => {
  resetWeatherRuntimeForTests();
  let calls = 0;
  let active = 0;
  let maxActive = 0;
  setWeatherFetcherForTests(async (location) => {
    calls++;
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 15));
    active--;
    return weatherPayload(location);
  });

  assert.ok(WEATHER_LOCATION_IDS.length > BULK_WEATHER_CONCURRENCY);

  const server = await startWeatherServer();
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}/weather`;

    // Two simultaneous requests must join the same per-location in-flight
    // work. A subsequent request must be served by the ten-minute cache.
    const [first, simultaneous] = await Promise.all([fetch(url), fetch(url)]);
    assert.equal(first.status, 200);
    assert.equal(simultaneous.status, 200);
    const firstBody = await first.json() as { locations: Array<{ location: { id: string } }> };
    const secondBody = await simultaneous.json() as { locations: Array<{ location: { id: string } }> };
    assert.deepEqual(firstBody.locations.map((item) => item.location.id), WEATHER_LOCATION_IDS);
    assert.deepEqual(secondBody.locations.map((item) => item.location.id), WEATHER_LOCATION_IDS);
    assert.ok(
      firstBody.locations.some((item) => item.location.id === "togakushi-ski-resort"),
      "unfiltered response omitted a published catalogue location",
    );
    assert.equal(calls, WEATHER_LOCATION_IDS.length, "simultaneous bulk request duplicated upstream work");
    assert.ok(maxActive <= BULK_WEATHER_CONCURRENCY, `observed ${maxActive} simultaneous cache misses`);

    const repeated = await fetch(url);
    assert.equal(repeated.status, 200);
    assert.equal(calls, WEATHER_LOCATION_IDS.length, "fresh cache was not reused");

    const regionId = "gifu-aichi";
    const expectedRegionIds = publishedCatalogueRecords
      .filter((record) => record.travelRegionId === regionId)
      .map((record) => record.publicId);
    const filtered = await fetch(`${url}?region=${regionId}`);
    assert.equal(filtered.status, 200);
    const filteredBody = await filtered.json() as { locations: Array<{ location: { id: string } }> };
    assert.deepEqual(filteredBody.locations.map((item) => item.location.id), expectedRegionIds);
    assert.equal(calls, WEATHER_LOCATION_IDS.length, "region-filtered read did not share the bulk cache");
  } finally {
    resetWeatherRuntimeForTests();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("catalogue locations are honestly unavailable to alerts pending dynamic pipeline support", () => {
  assert.equal(CATALOGUE_LOCATION_ALERTS_AVAILABLE, false);
});