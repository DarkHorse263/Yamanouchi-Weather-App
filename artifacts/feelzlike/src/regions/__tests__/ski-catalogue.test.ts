import assert from "node:assert/strict";
import test from "node:test";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import {
  getPublishedMountainCapabilities,
  getPublishedRegionCapabilities,
  isCatalogueMountainLinkTown,
  regionAlertsAvailable,
} from "../japan-catalogue";
import { mergeSkiCatalogueRegions } from "../ski-catalogue";
import { catalogueTownLandingModel } from "../catalogue";
import { scoreCuratedEntry } from "../../components/home/placeSearchRanking";

test("generated state towns are mountain-link landings, never synthetic town weather", () => {
  const regions = mergeSkiCatalogueRegions([]);
  assert.ok(regions.length > 0);
  for (const region of regions) {
    for (const town of region.baseTowns ?? []) {
      assert.ok(isCatalogueMountainLinkTown(town), `${region.id}/${town.id} is not mountain-links mode`);
      assert.ok(town.nearbyMountainIds?.length);
    }
  }
});

test("every generated published record has its state-first mountain route", () => {
  const regions = mergeSkiCatalogueRegions([]);
  let realBaseCount = 0;
  for (const record of publishedRecords) {
    const region = regions.find((candidate) => candidate.id === record.regionId);
    assert.ok(region);
    const mountain = region.mountains?.find((candidate) => candidate.id === record.publicId);
    assert.ok(mountain);
    assert.equal(mountain.baseElevationM, record.baseElevationM);
    if (record.baseElevationM != null) realBaseCount += 1;
    assert.equal(record.route, `/${record.regionId}/mountain/${record.publicId}`);
  }
  assert.equal(realBaseCount, 17);
  assert.ok(publishedRecords
    .filter((record) => record.baseElevationM != null)
    .every((record) => record.countryCode === "NZ"));
  assert.equal(
    publishedRecords.find((record) => record.publicId === "craigieburn-valley")?.baseElevationM,
    1308,
  );
  assert.equal(
    publishedRecords.find((record) => record.countryCode === "US")?.baseElevationM,
    undefined,
  );
});

test("generated eastern US states and mountains expose catalogue-backed alerts", () => {
  const record = publishedRecords[0];
  assert.ok(record);
  assert.deepEqual(getPublishedMountainCapabilities(record.regionId, record.publicId), {
    hasAlerts: true,
    powderAlertsAvailable: true,
    contentMode: "weather-only",
  });
  assert.deepEqual(getPublishedRegionCapabilities(record.regionId), { hasAlerts: true });
  assert.equal(regionAlertsAvailable(record.regionId), true);
  // Authored alert-capable regions retain their existing alerts surface.
  assert.equal(regionAlertsAvailable("snowy-mountains"), true);
  assert.equal(regionAlertsAvailable("yamanouchi"), true);
});

test("published mountains match resort-and-state queries without broadening to the wrong state", () => {
  const regions = mergeSkiCatalogueRegions([]);
  const entries = regions.flatMap((region) =>
    (region.mountains ?? []).map((mountain) => ({
      kind: "mountain" as const,
      name: mountain.name,
      extraKeys: [region.name, region.subtitle, region.shortTag]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "")),
      jaKeys: [],
      route: `/${region.id}/mountain/${mountain.id}`,
    })),
  );

  const matches = entries.filter(
    (entry) =>
      scoreCuratedEntry(entry, "Crystal Mountain Resort, Michigan") != null,
  );
  assert.deepEqual(matches.map((entry) => entry.route), [
    "/us-mi/mountain/crystal-mountain-mi",
  ]);
  assert.ok(
    entries.some(
      (entry) =>
        entry.name === "Crystal Mountain Resort" &&
        scoreCuratedEntry(entry, "Crystal Mountain") === 0,
    ),
  );
});

test("New Zealand catalogue regions use southern seasons and preserve special facility capability", () => {
  const regions = mergeSkiCatalogueRegions([]);
  const canterbury = regions.find((region) => region.id === "canterbury");
  assert.equal(canterbury?.hemisphere, "south");
  assert.ok(canterbury?.mountains?.some((mountain) => mountain.id === "craigieburn-valley"));

  const snowplanet = publishedRecords.find((record) => record.publicId === "snowplanet");
  const auckland = regions.find((region) => region.id === "auckland");
  assert.ok(snowplanet);
  assert.equal(auckland?.seasons, false);
  assert.equal(auckland?.weatherSource?.label, "Indoor facility information");
  assert.match(auckland?.baseTowns?.[0]?.blurb ?? "", /Indoor snow facility directory/);
  const snowplanetLink = auckland?.mountains?.find((mountain) => mountain.id === "snowplanet") as
    | { facilityType?: string; weatherEligible?: boolean }
    | undefined;
  assert.equal(snowplanetLink?.facilityType, "indoor");
  assert.equal(snowplanetLink?.weatherEligible, false);
  assert.equal(snowplanetLink?.facilityType === "indoor" || snowplanetLink?.weatherEligible === false, true);
  const silverdale = auckland?.baseTowns?.find((town) => town.id === "silverdale");
  assert.ok(silverdale);
  const landing = catalogueTownLandingModel(auckland!, silverdale);
  assert.equal(landing?.indoorOnly, true);
  assert.equal(landing?.heading, "Indoor snow facility nearby");
  assert.match(landing?.description ?? "", /do not apply/);
  assert.equal(landing?.mountains[0]?.indoor, true);
  assert.equal(snowplanet.facilityType, "indoor");
  assert.equal(snowplanet.weatherEligible, false);
  assert.equal(snowplanet.alertEligible, false);
  assert.deepEqual(getPublishedMountainCapabilities("auckland", "snowplanet"), {
    hasAlerts: false,
    powderAlertsAvailable: false,
    contentMode: "weather-only",
  });
  assert.equal(regionAlertsAvailable("auckland"), false);
});
