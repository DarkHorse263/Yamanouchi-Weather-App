import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogue } from "./generate.mjs";
import { publishedCatalogueRecords, regions } from "../public-runtime.js";

const states = { schemaVersion: 1, states: [{ stateCode: "WY", name: "Wyoming" }] };
const empty = () =>
  buildCatalogue({
    intakeSource: { schemaVersion: 1, records: [] },
    regionSource: { schemaVersion: 1, regions: [] },
    stateSource: states,
    manifest: { schemaVersion: 1, recordIds: [] },
  });

test("empty research intake publishes no candidates", () => {
  const catalogue = empty();
  assert.deepEqual(catalogue.intakeRecords, []);
  assert.deepEqual(catalogue.regions, []);
  assert.deepEqual(catalogue.publishedCatalogueRecords, []);
  assert.deepEqual(catalogue.states, states.states);
});

test("draft records cannot leak into the public projection", () => {
  const catalogue = buildCatalogue({
    intakeSource: {
      schemaVersion: 1,
      records: [{
        recordId: "research:unverified",
        candidateDisposition: "uncertain",
        lifecycle: "draft",
        classification: { facilityType: "unknown", snowSurface: "unknown", publicAccess: "unknown" },
        operatingStatus: "unknown",
        stateCode: "WY",
        routeMode: "new_page",
        evidence: [],
      }],
    },
    regionSource: { schemaVersion: 1, regions: [] },
    stateSource: states,
    manifest: { schemaVersion: 1, recordIds: [] },
  });
  assert.equal(catalogue.intakeRecords.length, 1);
  assert.deepEqual(catalogue.publishedCatalogueRecords, []);
});

test("verified lifecycle requires classification, operating proof, and essentials", () => {
  assert.throws(
    () => buildCatalogue({
      intakeSource: {
        schemaVersion: 1,
        records: [{
          recordId: "research:premature",
        candidateDisposition: "verified_operating",
          lifecycle: "verified",
          classification: { facilityType: "ski_area", snowSurface: "snow", publicAccess: "public" },
          operatingStatus: "operating",
          stateCode: "WY",
          routeMode: "new_page",
          evidence: [],
        }],
      },
      regionSource: { schemaVersion: 1, regions: [] },
      stateSource: states,
      manifest: { schemaVersion: 1, recordIds: [] },
    }),
    /Verified gate failed/,
  );
});

test("manifest and lifecycle enforce candidate disposition policy", () => {
  const valid = {
    recordId: "wy:operating",
    publicId: "operating",
    name: "Operating",
    lifecycle: "published",
    candidateDisposition: "verified_operating",
    classification: { facilityType: "ski_area", snowSurface: "snow", publicAccess: "public" },
    operatingStatus: "operating",
    stateCode: "WY",
    regionId: "wyoming",
    baseTownId: "town",
    routeMode: "new_page",
    route: "/wyoming/mountain/operating",
    officialUrl: "https://example.com/",
    coordinates: { lat: 1, lng: 1 },
    elevation: { baseM: 1, topM: 2 },
    evidence: [{ sourceUrl: "https://example.com/", checkedAt: "2026-08-27", quote: "Operating.", fields: ["identity", "operatingStatus", "officialUrl", "coordinates", "elevation"] }],
  };
  assert.throws(() => buildCatalogue({
    intakeSource: { schemaVersion: 1, records: [{ ...valid, candidateDisposition: "uncertain" }] },
    regionSource: { schemaVersion: 1, regions: [{ regionId: "wyoming", stateCode: "WY", baseTowns: [{ baseTownId: "town" }] }] },
    stateSource: states,
    manifest: { schemaVersion: 1, recordIds: ["wy:operating"] },
  }), /Published record has non-operating disposition/);
});

test("every public region and record carries a supported explicit IANA timezone", () => {
  const supported = new Set([
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Denver",
  ]);
  assert.ok(regions.length > 0);
  assert.ok(publishedCatalogueRecords.length > 0);
  for (const region of regions) assert.ok(supported.has(region.timezone), region.regionId);
  for (const record of publishedCatalogueRecords) {
    assert.ok(supported.has(record.timezone), record.publicId);
    assert.equal(record.timezone, regions.find((region) => region.regionId === record.regionId)?.timezone);
  }
});

test("region timezone metadata is required and constrained", () => {
  assert.throws(
    () => buildCatalogue({
      intakeSource: { schemaVersion: 1, records: [] },
      regionSource: {
        schemaVersion: 1,
        timezoneByRegion: { wyoming: "America/Chicago" },
        regions: [{ regionId: "wyoming", stateCode: "WY", baseTowns: [{ baseTownId: "town" }] }],
      },
      stateSource: states,
      manifest: { schemaVersion: 1, recordIds: [] },
    }),
    /Missing\/invalid region timezone/,
  );
});