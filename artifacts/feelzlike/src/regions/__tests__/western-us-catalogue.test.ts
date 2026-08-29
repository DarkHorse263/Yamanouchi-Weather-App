import assert from "node:assert/strict";
import test from "node:test";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import type { WesternUsPublishedRecord, WesternUsRegion } from "@workspace/western-us-ski-catalogue/public-runtime";
import { mergeWesternUsCatalogueRegions } from "../western-us-catalogue";
import { catalogueTownLandingModel, isCatalogueMountainLinkTown } from "../catalogue";

const authored: RegionConfig = {
  id: "jackson-hole",
  name: "Jackson Hole",
  subtitle: "Wyoming · USA",
  shortTag: "WY",
  brand: { wordmarkUrl: "wordmark" },
  resorts: [{ path: "/mountain/snow-king-mountain", label: "Snow King Mountain" }],
  mountains: [{ id: "snow-king-mountain", name: "Snow King Mountain" }],
  baseTowns: [{
    id: "jackson",
    name: "Jackson",
    lat: 43.48,
    lng: -110.76,
    nearbyMountainIds: ["snow-king-mountain"],
  }],
};

const metadata: WesternUsRegion = {
  regionId: "jackson-hole",
  name: "Jackson Hole",
  stateCode: "WY",
  baseTowns: [{ baseTownId: "jackson", name: "Jackson" }],
};
const published: WesternUsPublishedRecord = {
  recordId: "fixture:published",
  publicId: "fixture-mountain",
  aliases: [],
  name: "Fixture Mountain",
  coordinates: { lat: 43.5, lng: -110.8 },
  forecastElevationM: 2000,
  topElevationM: 2500,
  officialUrl: "https://example.com",
  stateCode: "WY",
  regionId: "jackson-hole",
  baseTownId: "jackson",
  route: "/jackson-hole/mountain/fixture-mountain",
  country: "United States",
  countryCode: "US",
  lifecycle: "published",
  operatingStatus: "operating",
};

test("empty catalogue leaves authored registry and Snow King route untouched", () => {
  const merged = mergeWesternUsCatalogueRegions([authored], [], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0], authored);
  assert.equal(merged[0].resorts[0]?.path, "/mountain/snow-king-mountain");
});

test("published records augment an authored region without duplicating it", () => {
  const [merged] = mergeWesternUsCatalogueRegions([authored], [published], [metadata]);
  assert.equal(merged.id, "jackson-hole");
  assert.deepEqual(merged.mountains?.map((mountain) => mountain.id), [
    "snow-king-mountain",
    "fixture-mountain",
  ]);
  assert.deepEqual(merged.baseTowns?.[0]?.nearbyMountainIds, [
    "snow-king-mountain",
    "fixture-mountain",
  ]);
  assert.equal(
    merged.mountains?.find((mountain) => mountain.id === "fixture-mountain")?.baseElevationM,
    published.baseElevationM,
  );
  assert.equal(merged.resorts[0]?.path, "/mountain/snow-king-mountain");
});

test("merged registry exposes catalogue additions to REGIONS consumers such as search", () => {
  const registry = mergeWesternUsCatalogueRegions([authored], [published], [metadata]);
  assert.ok(
    registry
      .find((region) => region.id === "jackson-hole")
      ?.mountains?.some((mountain) => mountain.id === "fixture-mountain"),
  );
});

test("an existing mountain id is rejected rather than replacing its route", () => {
  assert.throws(
    () => mergeWesternUsCatalogueRegions(
      [authored],
      [{
        ...published,
        recordId: "fixture:collision",
        publicId: "snow-king-mountain",
        route: "/jackson-hole/mountain/snow-king-mountain",
      }],
      [metadata],
    ),
    /mountain id collision/,
  );
});

test("generated Western catalogue towns are mountain-link landings, not town weather", () => {
  const generatedMetadata = { ...metadata, regionId: "fixture-west", baseTowns: [{ baseTownId: "fixture-town", name: "Fixture Town" }] };
  const generatedRecord = {
    ...published,
    regionId: "fixture-west",
    baseTownId: "fixture-town",
    route: "/fixture-west/mountain/fixture-mountain",
  };
  const [region] = mergeWesternUsCatalogueRegions([], [generatedRecord], [generatedMetadata]);
  const town = region.baseTowns?.[0];
  assert.ok(town);
  assert.equal(isCatalogueMountainLinkTown(town), true);
  assert.deepEqual(catalogueTownLandingModel(region, town)?.mountains, [{
    id: "fixture-mountain",
    name: "Fixture Mountain",
    nameJa: undefined,
    href: "/fixture-west/mountain/fixture-mountain",
  }]);
  assert.equal(isCatalogueMountainLinkTown(authored.baseTowns?.[0]), false);
});