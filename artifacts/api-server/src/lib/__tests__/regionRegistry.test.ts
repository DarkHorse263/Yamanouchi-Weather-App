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

import { REGION_IDS, LOCATION_TO_REGION } from "../regions.js";
import { WEATHER_LOCATION_IDS } from "../../routes/weather.js";

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

test("every weather-served location id is mapped in LOCATION_TO_REGION", () => {
  const keys = new Set(Object.keys(LOCATION_TO_REGION));
  for (const id of WEATHER_LOCATION_IDS) {
    assert.ok(
      keys.has(id),
      `weather location "${id}" is not present in LOCATION_TO_REGION`,
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
