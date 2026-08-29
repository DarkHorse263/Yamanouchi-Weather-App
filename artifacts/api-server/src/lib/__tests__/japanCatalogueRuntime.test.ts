import assert from "node:assert/strict";
import { test } from "node:test";
import express from "express";
import { publishedCatalogueRecords } from "@workspace/japan-ski-catalogue/public-runtime";
import {
  publishedCatalogueRecords as publishedWesternUsCatalogueRecords,
  regions as westernUsRegions,
  states as westernUsStates,
} from "@workspace/western-us-ski-catalogue/public-runtime";
import {
  publishedRecords as publishedSkiCatalogueRecords,
  publishedRegions as publishedSkiCatalogueRegions,
} from "@workspace/ski-catalogue/public-runtime";
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
import {
  API_REGION_CONFIGS,
  buildHeadlineQueryParams,
  CATALOGUE_REGION_METADATA,
} from "../../routes/regions.js";

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

test("published Western US catalogue mountains are represented by the public region projection only", () => {
  assert.equal(publishedWesternUsCatalogueRecords.length, 57);
  for (const metadata of westernUsRegions) {
    const region = API_REGION_CONFIGS.find((candidate) => candidate.id === metadata.regionId);
    assert.ok(region, `${metadata.regionId} metadata is missing from the API projection`);
    assert.equal(region.countryCode, "US");
    assert.equal(region.region, westernUsStates.find((state) => state.stateCode === metadata.stateCode)?.name);
  }
  for (const record of publishedWesternUsCatalogueRecords) {
    const region = API_REGION_CONFIGS.find((candidate) => candidate.id === record.regionId);
    assert.ok(region, `${record.regionId} is missing from the API region projection`);
    assert.ok(region.mountains.includes(record.name), `${record.name} is missing from ${record.regionId}`);
    assert.equal("evidence" in region, false, "intake evidence must not be exposed");
    assert.equal("intakeRecords" in region, false, "catalogue intake must not be exposed");
  }
});

test("catalogue-only ski regions use deterministic representative headlines with valid query parameters", () => {
  const catalogueOnly = publishedSkiCatalogueRegions.filter((metadata) =>
    API_REGION_CONFIGS.some(
      (region) => region.id === metadata.regionId && region.sourceLabel?.includes("Published"),
    ),
  );
  assert.ok(catalogueOnly.length > 0, "expected published catalogue-only regions");

  for (const metadata of catalogueOnly) {
    const region = API_REGION_CONFIGS.find((candidate) => candidate.id === metadata.regionId);
    assert.ok(region, `${metadata.regionId} is missing from the API projection`);
    const firstRecord = publishedSkiCatalogueRecords
      .filter((record) => record.regionId === metadata.regionId)
      .sort((left, right) => left.publicId.localeCompare(right.publicId))[0];
    assert.ok(firstRecord, `${metadata.regionId} has no representative record`);
    const representative = publishedSkiCatalogueRecords
      .filter((record) => record.regionId === metadata.regionId && record.weatherEligible)
      .sort((left, right) => left.publicId.localeCompare(right.publicId))[0];
    if (!representative) {
      assert.equal(region.headlineLabel, firstRecord.name);
      assert.equal(region.sourceLabel, "Published indoor facility directory");
      assert.equal(region.lat, undefined);
      assert.equal(region.lon, undefined);
      assert.equal(region.elevation, undefined);
      continue;
    }
    assert.equal(region.headlineLabel, representative.name);
    assert.equal(region.lat, representative.coordinates.lat);
    assert.equal(region.lon, representative.coordinates.lng);
    assert.equal(region.elevation, representative.forecastElevationM);
    assert.equal(region.timezone, representative.timezone);
  }

  for (const region of API_REGION_CONFIGS.filter(
    (candidate) => candidate.status === "live" && candidate.sourceLabel !== "Published indoor facility directory",
  )) {
    assert.ok(Number.isFinite(region.lat), `${region.id} has invalid headline latitude`);
    assert.ok(Number.isFinite(region.lon), `${region.id} has invalid headline longitude`);
    const params = buildHeadlineQueryParams(region);
    for (const [key, value] of params) {
      assert.notEqual(value, "undefined", `${region.id} query parameter ${key} is undefined`);
    }
  }
});

test("catalogue-only Western regions have deterministic valid headline query inputs", () => {
  const supportedTimezones = new Set([
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Denver",
  ]);
  const catalogueOnlyRegions = API_REGION_CONFIGS.filter(
    (region) => region.sourceLabel === "Open-Meteo · Published Western US ski catalogue",
  );
  assert.ok(catalogueOnlyRegions.length > 0);
  for (const region of catalogueOnlyRegions) {
    assert.ok(Number.isFinite(region.lat), `${region.id} latitude`);
    assert.ok(Number.isFinite(region.lon), `${region.id} longitude`);
    assert.ok(Number.isFinite(region.elevation) && Number(region.elevation) > 0, `${region.id} elevation`);
    assert.ok(region.timezone && supportedTimezones.has(region.timezone), `${region.id} timezone`);

    const records = publishedWesternUsCatalogueRecords
      .filter((record) => record.regionId === region.id)
      .sort((left, right) => left.publicId.localeCompare(right.publicId));
    const representative = records[0];
    assert.ok(representative, `${region.id} has no published representative`);
    assert.equal(region.headlineLabel, representative.name);
    assert.deepEqual(
      [region.lat, region.lon, region.elevation, region.timezone],
      [
        representative.coordinates.lat,
        representative.coordinates.lng,
        representative.forecastElevationM,
        representative.timezone,
      ],
    );

    const params = buildHeadlineQueryParams(region);
    assert.equal(params.get("latitude"), String(representative.coordinates.lat));
    assert.equal(params.get("longitude"), String(representative.coordinates.lng));
    assert.equal(params.get("elevation"), String(representative.forecastElevationM));
    assert.equal(params.get("timezone"), representative.timezone);
    assert.ok(!params.toString().includes("undefined"), `${region.id} emitted undefined query input`);
  }
});

test("Western augmentation preserves authored region headline location", () => {
  const bend = API_REGION_CONFIGS.find((region) => region.id === "bend");
  assert.ok(bend);
  assert.deepEqual(
    {
      headlineLabel: bend.headlineLabel,
      lat: bend.lat,
      lon: bend.lon,
      timezone: bend.timezone,
      sourceLabel: bend.sourceLabel,
    },
    {
      headlineLabel: "Bend",
      lat: 44.05806,
      lon: -121.31528,
      timezone: "America/Los_Angeles",
      sourceLabel: "Open-Meteo · ECMWF + GFS + ICON",
    },
  );
  assert.ok(bend.mountains.includes("Mt. Bachelor"));
  assert.ok(bend.mountains.includes("Hoodoo Ski Area"));
});

test("headline query projection rejects invalid coordinates and elevation", () => {
  assert.throws(
    () => buildHeadlineQueryParams({ lat: undefined, lon: -110, elevation: 2000, timezone: "America/Denver" }),
    /coordinates must be finite/,
  );
  assert.throws(
    () => buildHeadlineQueryParams({ lat: 43, lon: -110, elevation: 0, timezone: "America/Denver" }),
    /elevation must be a positive finite number/,
  );
});

test("all published Western US catalogue ids and aliases resolve to US forecast locations", () => {
  assert.equal(publishedWesternUsCatalogueRecords.length, 57);
  const seen = new Set<string>();
  for (const record of publishedWesternUsCatalogueRecords) {
    assert.ok(!seen.has(record.publicId), `duplicate Western public id: ${record.publicId}`);
    seen.add(record.publicId);
    const location = resolveWeatherLocation(record.publicId);
    assert.ok(location, `${record.publicId} did not resolve`);
    assert.equal(location.id, record.publicId);
    assert.equal(location.region, "US");
    assert.equal(location.latitude, record.coordinates.lat);
    assert.equal(location.longitude, record.coordinates.lng);
    assert.equal(location.elevation, record.forecastElevationM);
    assert.equal(regionForLocation(record.publicId), record.regionId);
    for (const alias of record.aliases) {
      assert.ok(!seen.has(alias), `Western alias collision: ${alias}`);
      seen.add(alias);
      assert.equal(resolveWeatherLocation(alias)?.id, record.publicId);
      assert.equal(regionForLocation(alias), record.regionId);
    }
  }
});

test("catalogue aliases are collision-free and resolve to their record", () => {
  const seen = new Set<string>();
  for (const record of [...publishedCatalogueRecords, ...publishedWesternUsCatalogueRecords]) {
    assert.ok(!seen.has(record.publicId), `catalogue public id collision: ${record.publicId}`);
    seen.add(record.publicId);
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

test("Western catalogue weather lookup uses its published coordinates and elevation", () => {
  const record = publishedWesternUsCatalogueRecords[0];
  assert.ok(record, "representative Western catalogue record is missing");
  const location = resolveWeatherLocation(record.publicId);
  assert.ok(location);
  assert.deepEqual(
    { latitude: location.latitude, longitude: location.longitude, elevation: location.elevation, region: location.region },
    { latitude: record.coordinates.lat, longitude: record.coordinates.lng, elevation: record.forecastElevationM, region: "US" },
  );
});

test("Western catalogue weather uses explicit region IANA timezones", () => {
  const expected = new Map([
    ["soldier-mountain", "America/Denver"],
    ["silver-mountain-resort", "America/Los_Angeles"],
    ["lookout-pass-ski-and-recreation-area", "America/Los_Angeles"],
    ["mount-lemmon-ski-valley", "America/Phoenix"],
    ["arctic-valley-ski-area", "America/Anchorage"],
  ]);
  for (const [id, timezone] of expected) {
    assert.equal(resolveWeatherLocation(id)?.timezone, timezone, `${id} timezone`);
  }
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