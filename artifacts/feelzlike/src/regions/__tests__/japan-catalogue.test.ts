import assert from "node:assert/strict";
import test from "node:test";
import { publishedCatalogueRecords } from "@workspace/japan-ski-catalogue/public-runtime";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import {
  getPublishedMountainCapabilities,
  mergeJapanCatalogueRegions,
} from "../japan-catalogue";
import { mountainPageMetadata } from "../../lib/mountainPageMetadata";

const authoredYamanouchi: RegionConfig = {
  id: "yamanouchi",
  name: "Yamanouchi",
  subtitle: "Nagano · Japan",
  shortTag: "JP",
  brand: { wordmarkUrl: "wordmark" },
  resorts: [],
  mountains: [{ id: "authored-mountain", name: "Authored Mountain" }],
  baseTowns: [{
    id: "yudanaka",
    name: "Yudanaka",
    lat: 36.74,
    lng: 138.42,
    nearbyMountainIds: ["authored-mountain"],
  }],
};

const regions = mergeJapanCatalogueRegions([authoredYamanouchi]);
const mountains = regions.flatMap((region) =>
  (region.mountains ?? []).map((mountain) => ({ regionId: region.id, mountain })),
);

test("projects every published Japan catalogue record", () => {
  assert.ok(publishedCatalogueRecords.length > 0);
  assert.equal(mountains.length, publishedCatalogueRecords.length + 1);
});

test("has no duplicate mountain ids or routes", () => {
  const ids = mountains.map(({ mountain }) => mountain.id);
  const routes = mountains.map(({ regionId, mountain }) => `/${regionId}/mountain/${mountain.id}`);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(routes).size, routes.length);
});

test("merges a published record into an authored region without replacing it", () => {
  const region = regions.find((candidate) => candidate.id === "yamanouchi");
  assert.ok(region);
  assert.equal(region.mountains?.[0]?.id, "authored-mountain");
  assert.ok(region.mountains?.some((mountain) => mountain.id === "shigakogen-mountain-resort"));
});

test("creates a routable generic region and has no live-lift assertion", () => {
  const record = publishedCatalogueRecords.find((candidate) => candidate.travelRegionId === "nagano-regional");
  assert.ok(record);
  const region = regions.find((candidate) => candidate.id === record.travelRegionId);
  const mountain = region?.mountains?.find((candidate) => candidate.id === record.publicId);
  assert.ok(mountain);
  assert.equal(`/${region!.id}/mountain/${mountain!.id}`, record.route);
  assert.equal("hasLiveLiftStatus" in mountain!, false);
  assert.equal("liveStatusKnown" in mountain!, false);
});

test("catalogue mountains expose no powder-alert CTA capability", () => {
  const capabilities = getPublishedMountainCapabilities(
    "nagano-regional",
    "togakushi-ski-resort",
  );
  assert.deepEqual(capabilities, {
    powderAlertsAvailable: false,
    contentMode: "weather-only",
  });
  assert.equal(getPublishedMountainCapabilities("yamanouchi", "authored-mountain"), undefined);
});

test("weather-only metadata makes no snow-report or lift claim", () => {
  const metadata = mountainPageMetadata({
    name: "Togakushi Ski Resort",
    regionName: "Regional Nagano",
    regionId: "nagano-regional",
    mountainId: "togakushi-ski-resort",
    weatherOnly: true,
  });
  assert.equal(metadata.path, "/nagano-regional/mountain/togakushi-ski-resort");
  assert.match(metadata.title, /weather & forecast/);
  assert.doesNotMatch(`${metadata.title} ${metadata.description}`, /snow report|lifts/i);
});

test("uses the public-runtime package export", async () => {
  const runtime = await import("@workspace/japan-ski-catalogue/public-runtime");
  assert.equal(runtime.publishedCatalogueRecords.length, publishedCatalogueRecords.length);
});