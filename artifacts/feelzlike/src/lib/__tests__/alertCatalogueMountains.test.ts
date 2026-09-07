import assert from "node:assert/strict";
import test from "node:test";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import { publishedCatalogueRecords as publishedWesternUsCatalogueRecords } from "@workspace/western-us-ski-catalogue/public-runtime";
import { alertCatalogueMountains } from "../alertCatalogueMountains";

test("USA alert picker exactly projects eligible records from both canonical catalogues", () => {
  const sharedUsEligible = publishedRecords.filter(
    (record) => record.countryCode === "US" && record.alertEligible,
  );
  const expected = [
    ...sharedUsEligible,
    ...publishedWesternUsCatalogueRecords,
  ];

  assert.equal(expected.length, 199, "current canonical USA alert-ready total");
  assert.equal(alertCatalogueMountains.length, expected.length);
  assert.deepEqual(
    new Set(alertCatalogueMountains.map((record) => record.publicId)),
    new Set(expected.map((record) => record.publicId)),
  );

  const nzAlertIds = new Set(
    publishedRecords
      .filter((record) => record.countryCode === "NZ" && record.alertEligible)
      .map((record) => record.publicId),
  );
  assert.ok(nzAlertIds.size > 0, "canonical shared catalogue includes eligible NZ records");
  assert.ok(
    alertCatalogueMountains.every((record) => !nzAlertIds.has(record.publicId)),
    "NZ records must not appear in the USA picker",
  );

  const representativeIds = [
    "norway-mountain",
    "crystal-mountain-mi",
    "holiday-valley",
    "jack-frost-pa",
    "whitecap-mountains-resort-wi",
    "spirit-mountain-mn",
    "giants-ridge-mn",
  ];
  const pickerIds = new Set(alertCatalogueMountains.map((record) => record.publicId));
  for (const id of representativeIds) {
    assert.ok(pickerIds.has(id), `eligible USA mountain "${id}" is missing from the picker`);
  }
});