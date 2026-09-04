import assert from "node:assert/strict";
import test from "node:test";
import { mountainDetailCopy } from "../mountainPageMetadata";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";

test("Craigieburn's weather-eligible Open-Meteo page carries the LIVE badge", () => {
  const craigieburn = publishedRecords.find((record) => record.publicId === "craigieburn-valley");
  assert.ok(craigieburn);
  assert.equal(craigieburn.weatherEligible, true);
  assert.equal(mountainDetailCopy(true, craigieburn.weatherEligible).sourceBadge.en, "Live");
  assert.equal(mountainDetailCopy(true, craigieburn.weatherEligible).sourceBadge.ja, "ライブ");
});

test("weather-only pages without a live weather feed retain the WEATHER badge", () => {
  assert.equal(mountainDetailCopy(true, false).sourceBadge.en, "Weather");
});