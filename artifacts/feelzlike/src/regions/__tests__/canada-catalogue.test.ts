import assert from "node:assert/strict";
import test from "node:test";
import { canadaCatalogue } from "@workspace/canada-ski-catalogue";
import { publishedCatalogueRecords, travelRegions } from "@workspace/canada-ski-catalogue/public-runtime";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import { mergeCanadaCatalogueRegions } from "../canada-catalogue";
import { getPublishedMountainCapabilities, mountainDetailRouteMode, publishedMountainBelongsToRegion } from "../japan-catalogue";
import { canadaDirectoryMatchingSummary } from "../../data/canadaDirectoryMatching";

const authored: RegionConfig = {
  id: "whistler", name: "Whistler", subtitle: "BC · Canada", shortTag: "CA",
  brand: { wordmarkUrl: "wordmark" }, resorts: [], mountains: [], baseTowns: [],
};
const regions = mergeCanadaCatalogueRegions([authored]);

test("projects the 56 published Canada records into province-first CA regions", () => {
  assert.equal(canadaCatalogue.candidates.length, 77);
  assert.equal(publishedCatalogueRecords.length, 56);
  assert.equal(regions.flatMap((region) => region.mountains ?? []).length, 56);
  for (const record of publishedCatalogueRecords) {
    const region = regions.find((candidate) => candidate.id === record.travelRegionId);
    assert.ok(region);
    assert.equal(region.shortTag, "CA");
    assert.ok(region.mountains?.some((mountain) => mountain.id === record.publicId));
    assert.equal(record.route, `/${region.id}/mountain/${record.publicId}`);
  }
  assert.deepEqual(regions.slice(1).map((region) => region.id), travelRegions.map((region) => region.travelRegionId));
});

test("published runtime contains only verified public candidates with complete evidence", () => {
  assert.equal(publishedCatalogueRecords.length, 56);
  const requiredEvidence = ["officialIdentityUrl", "officialUrl", "coordinatesUrl", "baseElevationUrl", "topElevationUrl", "forecastElevationUrl", "localityUrl", "provinceUrl"] as const;
  for (const record of publishedCatalogueRecords) {
    const candidate = canadaCatalogue.candidates.find((item) => item.id === record.recordId);
    assert.ok(candidate);
    assert.equal(candidate.lifecycle, "published");
    assert.equal(candidate.reconciliationStatus ?? candidate.classification, "verified_operating");
    assert.equal(candidate.operatingStatus, "operating");
    assert.equal(candidate.publicAccess, "public");
    assert.notEqual(candidate.classification, "closed");
    assert.notEqual(candidate.classification, "uncertain");
    assert.notEqual(candidate.classification, "private_restricted");
    assert.notEqual(candidate.classification, "existing");
    for (const field of requiredEvidence) assert.ok(candidate.evidence?.[field], `${record.recordId} lacks ${field}`);
  }
});

test("Canada records have weather-only ownership and no duplicate directory row", () => {
  for (const record of publishedCatalogueRecords) {
    assert.equal(publishedMountainBelongsToRegion(record.travelRegionId, record.publicId), true);
    assert.equal(publishedMountainBelongsToRegion("canada-ontario", record.publicId), record.travelRegionId === "canada-ontario");
    assert.deepEqual(getPublishedMountainCapabilities(record.travelRegionId, record.publicId), {
      hasAlerts: false,
      powderAlertsAvailable: false,
      contentMode: "weather-only",
    });
    assert.equal(mountainDetailRouteMode({ regionId: record.travelRegionId, mountainId: record.publicId, hasBespokeRouter: true }), "generic");
  }
  assert.equal(canadaDirectoryMatchingSummary.matchedRecords.length, 56);
  assert.equal(new Set(canadaDirectoryMatchingSummary.matchedEntries.map((entry) => entry.infoUrl)).size, 56);
  const outbound = new Set(canadaDirectoryMatchingSummary.outboundEntries.map((entry) => entry.infoUrl));
  assert.ok(canadaDirectoryMatchingSummary.matchedEntries.every((entry) => !outbound.has(entry.infoUrl)));
});

test("ten authored Canada regions remain present and ordered before generated provinces", () => {
  const authoredCanada = ["whistler", "powder-highway", "okanagan", "vancouver", "banff-lake-louise", "canmore", "jasper", "quebec-laurentians", "quebec-charlevoix", "quebec-eastern-townships"];
  const authoredRegions = authoredCanada.map((id) => ({ ...authored, id }));
  const projected = mergeCanadaCatalogueRegions(authoredRegions);
  assert.deepEqual(projected.slice(0, authoredCanada.length).map((region) => region.id), authoredCanada);
});

test("preserves authored region ids and rejects unsafe mountain collisions", () => {
  assert.equal(regions[0]?.id, "whistler");
  assert.throws(() => mergeCanadaCatalogueRegions([{
    ...authored,
    mountains: [{ id: publishedCatalogueRecords[0]!.publicId, name: "Collision" }],
  }]));
});