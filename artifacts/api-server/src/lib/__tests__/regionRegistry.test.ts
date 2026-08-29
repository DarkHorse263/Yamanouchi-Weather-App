/**
 * Region registry consistency · guards the parallel lists that must stay
 * in lockstep whenever a region is added or removed.
 *
 * Run via: pnpm --filter @workspace/api-server run test:registry
 *
 * Pattern: tsx --test + node:assert (matches bom-obs / metar-nz).
 *
 * Why this exists: adding a region touches several hand-maintained lists
 * across the spec and the server (openapi RegionId enum, REGION_IDS,
 * LOCATION_TO_REGION, the weather LOCATIONS table). Missing one is silent
 * in dev but breaks alerts, region resolution or the region index in
 * production. These assertions fail loudly at test time instead.
 *
 * Deliberately server-side only: the canonical region CONFIGS live in the
 * feelzlike app but import PNG wordmarks, which crash `tsx --test`. The
 * PNG-free source of truth for wiring is here in api-server, so the test
 * lives here and needs no asset stubbing or new dependencies.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import {
  CATALOGUE_ALERT_TARGETS,
  REGION_IDS,
  LOCATION_TO_REGION,
  normaliseAlertDestinations,
  regionForLocation,
  resolveCatalogueAlertTarget,
} from "../regions.js";
import { WEATHER_LOCATION_IDS, resolveWeatherLocation } from "../../routes/weather.js";

// Resolve the repo-root openapi spec relative to this test file so the
// test is location-independent (works from any cwd).
const here = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.resolve(here, "../../../../../lib/api-spec/openapi.yaml");
const openapiYaml = readFileSync(openapiPath, "utf8");

/**
 * Extract the `RegionId` schema's enum values from the openapi YAML.
 * Anchors on the schema key and stops at its `description:` so the
 * similarly-shaped StayEatRegionSlug enum elsewhere is never captured.
 */
function parseRegionIdEnum(yaml: string): string[] {
  const start = yaml.indexOf("\n    RegionId:");
  assert.ok(start >= 0, "RegionId schema not found in openapi.yaml");
  const after = yaml.slice(start);
  const enumIdx = after.indexOf("enum:");
  const descIdx = after.indexOf("description:");
  assert.ok(enumIdx >= 0, "RegionId enum not found in openapi.yaml");
  const block = after.slice(enumIdx, descIdx > enumIdx ? descIdx : undefined);
  return [...block.matchAll(/^\s+-\s+([a-z0-9-]+)\s*$/gm)].map((m) => m[1]);
}

test("openapi RegionId enum matches REGION_IDS exactly", () => {
  const enumIds = parseRegionIdEnum(openapiYaml);
  assert.equal(
    enumIds.length,
    new Set(enumIds).size,
    "openapi RegionId enum has duplicate entries",
  );
  assert.deepEqual(
    new Set(enumIds),
    new Set(REGION_IDS),
    "openapi RegionId enum and REGION_IDS have drifted (add the region to both)",
  );
});

test("every LOCATION_TO_REGION value is a canonical RegionId", () => {
  const idSet = new Set<string>(REGION_IDS);
  for (const [location, region] of Object.entries(LOCATION_TO_REGION)) {
    assert.ok(
      idSet.has(region),
      `location "${location}" maps to unknown region "${region}"`,
    );
  }
});

test("every region is wired into LOCATION_TO_REGION (roads tile + at least one location)", () => {
  const keys = Object.keys(LOCATION_TO_REGION);
  for (const id of REGION_IDS) {
    assert.ok(
      keys.includes(`${id}-roads`),
      `region "${id}" is missing its "${id}-roads" mapping`,
    );
    const nonRoads = keys.filter(
      (k) => k !== `${id}-roads` && LOCATION_TO_REGION[k] === id,
    );
    assert.ok(
      nonRoads.length > 0,
      `region "${id}" has no non-roads location mapped to it`,
    );
  }
});

test("every weather-served location id resolves to a region", () => {
  for (const id of WEATHER_LOCATION_IDS) {
    assert.ok(
      regionForLocation(id),
      `weather location "${id}" does not resolve to a region`,
    );
  }
});

test("weather-served location ids are unique", () => {
  assert.equal(
    new Set(WEATHER_LOCATION_IDS).size,
    WEATHER_LOCATION_IDS.length,
    "duplicate id in the weather LOCATIONS table",
  );
});

test("catalogue alert targets exactly match alert-eligible published mountains", () => {
  const eligible = publishedRecords.filter((record) => record.alertEligible);
  assert.equal(CATALOGUE_ALERT_TARGETS.size, eligible.length);
  assert.deepEqual(
    new Set(CATALOGUE_ALERT_TARGETS.keys()),
    new Set(eligible.map((record) => record.publicId)),
  );
});

test("catalogue alerts use the same runtime metadata and route as weather pages", () => {
  for (const record of publishedRecords.filter((candidate) => candidate.alertEligible)) {
    const target = resolveCatalogueAlertTarget(record.publicId);
    const weather = resolveWeatherLocation(record.publicId);
    assert.ok(target, `missing alert target for "${record.publicId}"`);
    assert.ok(weather, `missing weather location for "${record.publicId}"`);
    assert.deepEqual(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        elevation: target.elevation,
        timezone: target.timezone,
      },
      {
        latitude: weather.latitude,
        longitude: weather.longitude,
        elevation: weather.elevation,
        timezone: weather.timezone,
      },
    );
    assert.equal(target.route, record.route);
    assert.equal(target.route, `/${record.regionId}/mountain/${record.publicId}`);
  }
  assert.equal(resolveCatalogueAlertTarget("private-or-unknown-mountain"), undefined);
});

test("indoor catalogue facilities have neither weather nor powder-alert targets", () => {
  const indoor = publishedRecords.filter((record) => record.facilityType === "indoor");
  assert.ok(indoor.length > 0);
  for (const record of indoor) {
    assert.equal(record.weatherEligible, false);
    assert.equal(record.alertEligible, false);
    assert.equal(resolveWeatherLocation(record.publicId), undefined);
    assert.equal(resolveCatalogueAlertTarget(record.publicId), undefined);
  }
});

test("alert destination validation supports catalogue-mountain-only preferences", () => {
  const record = publishedRecords[0];
  assert.ok(record);
  assert.deepEqual(
    normaliseAlertDestinations([], [record.publicId, record.publicId, "private-or-unknown-mountain"]),
    { regions: [], mountains: [record.publicId] },
  );
  assert.deepEqual(
    normaliseAlertDestinations(["snowy-mountains", "not-a-region"], []),
    { regions: ["snowy-mountains"], mountains: [] },
  );
});
