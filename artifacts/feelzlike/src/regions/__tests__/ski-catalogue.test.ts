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
  for (const record of publishedRecords) {
    const region = regions.find((candidate) => candidate.id === record.regionId);
    assert.ok(region);
    assert.ok(region.mountains?.some((mountain) => mountain.id === record.publicId));
    assert.equal(record.route, `/${record.regionId}/mountain/${record.publicId}`);
  }
});

test("generated states and mountains cannot expose unsupported alert forms or routes", () => {
  const record = publishedRecords[0];
  assert.ok(record);
  assert.deepEqual(getPublishedMountainCapabilities(record.regionId, record.publicId), {
    hasAlerts: false,
    powderAlertsAvailable: false,
    contentMode: "weather-only",
  });
  assert.deepEqual(getPublishedRegionCapabilities(record.regionId), { hasAlerts: false });
  assert.equal(regionAlertsAvailable(record.regionId), false);
  // Authored alert-capable regions retain their existing alerts surface.
  assert.equal(regionAlertsAvailable("snowy-mountains"), true);
  assert.equal(regionAlertsAvailable("yamanouchi"), true);
});