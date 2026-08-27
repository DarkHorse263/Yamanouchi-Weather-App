import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedCatalogueRecords } from "@workspace/canada-ski-catalogue/public-runtime";
import { regionForLocation } from "../regions.js";
import { canadaCatalogueTimezone, resolveWeatherLocation } from "../../routes/weather.js";
import { CATALOGUE_REGION_METADATA } from "../../routes/regions.js";

test("all published Canada ids and aliases resolve to their exact region and province timezone", () => {
  assert.equal(publishedCatalogueRecords.length, 56);
  for (const record of publishedCatalogueRecords) {
    const location = resolveWeatherLocation(record.publicId);
    assert.ok(location, `${record.publicId} did not resolve`);
    assert.equal(location.region, "CA");
    assert.equal(location.timezone, canadaCatalogueTimezone(record.province));
    assert.equal(regionForLocation(record.publicId), record.travelRegionId);
    assert.equal(CATALOGUE_REGION_METADATA.get(record.travelRegionId)?.countryCode, "CA");
    for (const alias of record.aliases) {
      assert.equal(resolveWeatherLocation(alias)?.id, record.publicId);
      assert.equal(regionForLocation(alias), record.travelRegionId);
    }
  }
});

test("unknown Canada catalogue ids remain absent", () => {
  assert.equal(resolveWeatherLocation("canada-not-a-published-mountain"), undefined);
  assert.equal(regionForLocation("canada-not-a-published-mountain"), undefined);
});