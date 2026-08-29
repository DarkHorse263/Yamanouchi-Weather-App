import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import { regionForLocation } from "../regions.js";
import { resolveWeatherLocation } from "../../routes/weather.js";

test("weather-eligible catalogue records resolve to their exact route and weather location", () => {
  assert.ok(publishedRecords.length > 0);
  for (const record of publishedRecords.filter((candidate) => candidate.weatherEligible)) {
    const location = resolveWeatherLocation(record.publicId);
    assert.ok(location, `${record.publicId} did not resolve`);
    assert.equal(regionForLocation(record.publicId), record.regionId);
    assert.equal(location.latitude, record.coordinates.lat);
    assert.equal(location.longitude, record.coordinates.lng);
    assert.equal(location.elevation, record.forecastElevationM);
    assert.equal(location.timezone, record.timezone);
    assert.equal(location.region, record.countryCode);
  }
});

test("published catalogue routes are region-first and unique", () => {
  const routes = publishedRecords.map((record) => record.route);
  assert.equal(new Set(routes).size, routes.length);
  for (const record of publishedRecords) {
    assert.match(record.route, new RegExp(`^/${record.regionId}/mountain/${record.publicId}$`));
  }
});