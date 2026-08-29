import assert from "node:assert/strict";
import test from "node:test";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import { baseBandElevation, resolveVillageElevation } from "../../lib/elevation";
import { UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS } from "../authored-village-elevation-unknowns";
import {
  applyVerifiedVillageElevations,
  VERIFIED_AUTHORED_VILLAGE_ELEVATIONS,
} from "../verified-village-elevations";

function region(id: string, mountains: NonNullable<RegionConfig["mountains"]>): RegionConfig {
  return {
    id,
    name: "Fixture",
    subtitle: "Test",
    shortTag: "T",
    brand: { wordmarkUrl: "" },
    seasons: true,
    resorts: [],
    mountains,
    baseTowns: [],
    tourismLinks: [],
    weatherSource: { label: "Open-Meteo" },
    roadsSource: { label: "Seasonal guidance", dataAvailable: false },
  };
}

test("strict mode rejects an unsourced direct base elevation", () => {
  assert.throws(
    () => applyVerifiedVillageElevations([
      region("fixture-region", [
        { id: "new-mountain", name: "New", elevationM: 1000, baseElevationM: 700, lat: 1, lng: 1, blurb: "" },
      ]),
    ], { strict: true }),
    /fixture-region\/new-mountain \(no provenance manifest record\)/,
  );
});

test("strict mode rejects a direct base elevation that differs from its source", () => {
  assert.throws(
    () => applyVerifiedVillageElevations([
      region("park-city", [
        { id: "park-city-mountain", name: "Park City", elevationM: 3056, baseElevationM: 2099, lat: 40.65, lng: -111.51, blurb: "" },
      ]),
    ], { strict: true }),
    /park-city\/park-city-mountain \(authored 2099, verified 2100\)/,
  );
});

test("strict mode retains a direct base elevation that exactly matches its source", () => {
  const mountain = applyVerifiedVillageElevations([
    region("bend", [
        { id: "mt-bachelor", name: "Mt Bachelor", elevationM: 2763, baseElevationM: 1737, lat: 43.9794, lng: -121.6885, blurb: "" },
    ]),
  ], { strict: true })[0].mountains![0];

  assert.equal(mountain.baseElevationM, 1737);
});

test("Mt Bachelor and Sandia use factual base elevations instead of forecast-point terrain", () => {
  const mountains = applyVerifiedVillageElevations([
    region("bend", [
      { id: "mt-bachelor", name: "Mt Bachelor", elevationM: 2763, baseElevationM: 1737, lat: 43.9794, lng: -121.6885, blurb: "" },
    ]),
    region("albuquerque-sandia", [
      { id: "sandia-peak", name: "Sandia Peak", elevationM: 2630, baseElevationM: 2630, lat: 35.2062, lng: -106.4475, blurb: "" },
    ]),
  ], { strict: true });

  const bachelor = mountains[0].mountains![0];
  const sandia = mountains[1].mountains![0];
  assert.equal(resolveVillageElevation(bachelor.baseElevationM, bachelor.elevationM), 1737);
  assert.equal(resolveVillageElevation(sandia.baseElevationM, sandia.elevationM), 2630);
  assert.notEqual(resolveVillageElevation(bachelor.baseElevationM, bachelor.elevationM), baseBandElevation(bachelor.elevationM));
  assert.notEqual(resolveVillageElevation(sandia.baseElevationM, sandia.elevationM), 3152);
});

test("strict mode rejects a new undocumented mountain key", () => {
  const regions = [
    region("fixture-region", [
      { id: "new-mountain", name: "New", elevationM: 1000, lat: 1, lng: 1, blurb: "" },
    ]),
  ];

  assert.throws(
    () => applyVerifiedVillageElevations(regions, { strict: true }),
    /Missing authored village elevations: fixture-region\/new-mountain/,
  );
  assert.doesNotThrow(() => applyVerifiedVillageElevations(regions));
});

test("unsupported Yamanouchi elevations remain unset and use the fallback", () => {
  const mountains = applyVerifiedVillageElevations([
    region("yamanouchi", [
      { id: "shiga-sun-valley", name: "Sun Valley", elevationM: 1500, lat: 36.791, lng: 138.503, blurb: "" },
    ]),
  ], { strict: true })[0].mountains!;
  const sunValley = mountains.find((mountain) => mountain.id === "shiga-sun-valley")!;

  assert.equal(sunValley.baseElevationM, undefined);
  assert.equal(
    resolveVillageElevation(sunValley.baseElevationM, sunValley.elevationM),
    baseBandElevation(sunValley.elevationM),
  );
  assert.ok(UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.has("yamanouchi/shiga-sun-valley"));
});

test("keeps all 258 authored keys sourced or documented unknown and disjoint", () => {
  const sourcedKeys = Object.keys(VERIFIED_AUTHORED_VILLAGE_ELEVATIONS);
  assert.equal(sourcedKeys.length, 18);
  assert.equal(UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.size, 240);
  assert.equal(sourcedKeys.length + UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.size, 258);
  assert.deepEqual(sourcedKeys.filter((key) => UNKNOWN_AUTHORED_VILLAGE_ELEVATIONS.has(key)), []);
});

test("keeps every source-backed elevation finite and traceable", () => {
  for (const value of Object.values(VERIFIED_AUTHORED_VILLAGE_ELEVATIONS)) {
    assert.ok(Number.isFinite(value.elevationM));
    assert.match(value.sourceUrl, /^https:\/\//);
    assert.ok(value.citation.trim().length >= 20);
    assert.match(value.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${value.verifiedAt}T00:00:00.000Z`).toISOString().slice(0, 10), value.verifiedAt);
  }
});