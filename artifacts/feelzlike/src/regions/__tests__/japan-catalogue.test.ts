import assert from "node:assert/strict";
import test from "node:test";
import { publishedCatalogueRecords } from "@workspace/japan-ski-catalogue/public-runtime";
import type { RegionConfig } from "@workspace/feelzlike-shell";
import {
  catalogueTownLandingModel,
  getPublishedMountainCapabilities,
  isCatalogueMountainLinkTown,
  mountainDetailRouteMode,
  mergeJapanCatalogueRegions,
  publishedMountainBelongsToRegion,
} from "../japan-catalogue";
import {
  mountainDetailCopy,
  mountainPageMetadata,
  mountainWindSummary,
} from "../../lib/mountainPageMetadata";

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

test("weather-only Yamanouchi records bypass its bespoke resort detail", () => {
  const publicIds = [
    "shigakogen-mountain-resort",
    "yokoteyama-shibutoge",
    "takamagahara-mammoth",
  ];
  for (const publicId of publicIds) {
    const record = publishedCatalogueRecords.find(
      (candidate) =>
        candidate.travelRegionId === "yamanouchi" &&
        candidate.publicId === publicId,
    );
    assert.ok(record, `${publicId} must be in the public runtime`);
    assert.equal(
      mountainDetailRouteMode({
        regionId: "yamanouchi",
        mountainId: publicId,
        hasBespokeRouter: true,
      }),
      "generic",
    );
    assert.deepEqual(getPublishedMountainCapabilities("yamanouchi", publicId), {
      powderAlertsAvailable: false,
      contentMode: "weather-only",
    });
    const metadata = mountainPageMetadata({
      name: record.name,
      regionName: "Yamanouchi",
      regionId: "yamanouchi",
      mountainId: publicId,
      weatherOnly: true,
    });
    assert.doesNotMatch(
      `${metadata.title} ${metadata.description}`,
      /snow report|lifts|live conditions/i,
    );
    const copy = mountainDetailCopy(true);
    const wind = mountainWindSummary(10, true);
    assert.doesNotMatch(
      [
        copy.sourceBadge.en,
        copy.scrollCue.en,
        copy.heroCamAltPrefix,
        copy.heroCamBadge.en,
        wind?.en,
      ].join(" "),
      /live|lift report|live conditions|fine for lifts/i,
    );
  }
});

test("authored Yamanouchi mountains retain bespoke resort detail", () => {
  assert.equal(
    mountainDetailRouteMode({
      regionId: "yamanouchi",
      mountainId: "shiga-yakebitaiyama",
      hasBespokeRouter: true,
    }),
    "bespoke",
  );
  assert.equal(mountainDetailCopy(false).sourceBadge.en, "Live");
  assert.equal(mountainDetailCopy(false).scrollCue.en, "Live conditions below");
  assert.equal(mountainWindSummary(10, false)?.en, "fine for lifts");
});

test("catalogue-only base town resolves to honest published mountain links", () => {
  const record = publishedCatalogueRecords.find(
    (candidate) => candidate.travelRegionId === "nagano-regional",
  );
  assert.ok(record);
  const region = regions.find((candidate) => candidate.id === record.travelRegionId);
  const town = region?.baseTowns?.find((candidate) => candidate.id === record.baseTownId);
  assert.ok(region);
  assert.ok(town);
  assert.equal(isCatalogueMountainLinkTown(town), true);

  const landing = catalogueTownLandingModel(region, town);
  assert.ok(landing);
  assert.ok(landing.mountains.length > 0);
  for (const mountain of landing.mountains) {
    assert.ok(region.mountains?.some((candidate) => candidate.id === mountain.id));
    assert.equal(mountain.href, `/${region.id}/mountain/${mountain.id}`);
  }
  assert.match(landing.description, /town weather is not currently published/i);
  assert.doesNotMatch(
    `${landing.heading} ${landing.description}`,
    /lift status|snow report|alerts?.*(delivery|phone|push)|live operational/i,
  );
});

test("Hakugindai is grouped with Churui, not distant Tsurui", () => {
  const record = publishedCatalogueRecords.find(
    (candidate) => candidate.publicId === "hakugindai-ski-area",
  );
  assert.ok(record);
  assert.equal(record.travelRegionId, "hokkaido-regional");
  assert.equal(record.baseTownId, "hokkaido-regional-churui");

  const region = regions.find((candidate) => candidate.id === record.travelRegionId);
  const town = region?.baseTowns?.find((candidate) => candidate.id === record.baseTownId);
  assert.ok(town);
  assert.equal(town.name, "Churui");
  assert.ok(town.nearbyMountainIds?.includes(record.publicId));
  assert.equal(
    region?.baseTowns?.some((candidate) => candidate.id === "hokkaido-regional-tsurui"),
    false,
  );
});

test("publication geography audit keeps the corrected resorts in their local regions", () => {
  const expectedAssignments = [
    {
      publicId: "yunomaru-ski-resort",
      travelRegionId: "nagano-regional",
      baseTownId: "nagano-regional-tomi",
    },
    {
      publicId: "blanche-takayama-ski-resort",
      travelRegionId: "nagano-regional",
      baseTownId: "nagano-regional-tateshina",
    },
    {
      publicId: "anpeizan-ski-area",
      travelRegionId: "sapporo",
      baseTownId: "sapporo-eniwa",
    },
    {
      publicId: "takeshi-banshogahara-ski-area",
      travelRegionId: "nagano-regional",
      baseTownId: "nagano-regional-ueda",
    },
  ];
  for (const expected of expectedAssignments) {
    const record = publishedCatalogueRecords.find(
      (candidate) => candidate.publicId === expected.publicId,
    );
    assert.ok(record, `${expected.publicId} must be in the public runtime`);
    assert.equal(record.travelRegionId, expected.travelRegionId);
    assert.equal(record.baseTownId, expected.baseTownId);
    assert.equal(
      record.route,
      `/${expected.travelRegionId}/mountain/${expected.publicId}`,
    );
    assert.equal(
      publishedMountainBelongsToRegion(expected.travelRegionId, expected.publicId),
      true,
    );
  }
  assert.equal(
    publishedMountainBelongsToRegion("yamanouchi", "yunomaru-ski-resort"),
    false,
  );
  assert.equal(
    publishedMountainBelongsToRegion("iiyama", "blanche-takayama-ski-resort"),
    false,
  );
  assert.equal(
    publishedMountainBelongsToRegion("niseko", "anpeizan-ski-area"),
    false,
  );
  assert.equal(
    publishedMountainBelongsToRegion("iiyama", "takeshi-banshogahara-ski-area"),
    false,
  );
  assert.equal(
    publishedMountainBelongsToRegion("yamanouchi", "authored-mountain"),
    true,
  );
});

test("shared-region catalogue base town keeps authored town behavior and valid mountain links", () => {
  const region = regions.find((candidate) => candidate.id === "yamanouchi");
  const town = region?.baseTowns?.find((candidate) => candidate.id === "yudanaka");
  assert.ok(region);
  assert.ok(town);
  assert.equal(isCatalogueMountainLinkTown(town), false);
  assert.equal(catalogueTownLandingModel(region, town), undefined);

  const catalogueIds = publishedCatalogueRecords
    .filter(
      (record) =>
        record.travelRegionId === "yamanouchi" &&
        record.baseTownId === "yudanaka",
    )
    .map((record) => record.publicId);
  assert.ok(catalogueIds.length > 0);
  for (const id of catalogueIds) {
    assert.ok(town.nearbyMountainIds?.includes(id));
    assert.ok(region.mountains?.some((mountain) => mountain.id === id));
    assert.equal(
      `/${region.id}/mountain/${id}`,
      publishedCatalogueRecords.find((record) => record.publicId === id)?.route,
    );
  }
});