import assert from "node:assert/strict";
import test from "node:test";
import { forecastDaysForRegion } from "../../routes/weather.js";

test("Austria uses the supported seven-day weather horizon", () => {
  assert.equal(forecastDaysForRegion("AT"), 7);
});

test("existing country horizons retain their established behaviour", () => {
  assert.equal(forecastDaysForRegion("JP"), 7);
  assert.equal(forecastDaysForRegion("AU"), 14);
  assert.equal(forecastDaysForRegion("CA"), 14);
  assert.equal(forecastDaysForRegion(undefined), 14);
});