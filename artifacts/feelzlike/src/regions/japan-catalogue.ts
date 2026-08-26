import type { BaseTown, MountainLink, RegionConfig } from "@workspace/feelzlike-shell";
import {
  publishedCatalogueRecords,
  travelRegions,
  type PublicRuntimeCatalogueRecord,
} from "@workspace/japan-ski-catalogue/public-runtime";

/**
 * The catalogue is the publication authority for these records. This adapter
 * deliberately only projects fields it publishes into the UI's existing
 * region/town/mountain model; it does not invent operational amenities.
 */
function mountainFor(record: PublicRuntimeCatalogueRecord): MountainLink {
  return {
    id: record.publicId,
    name: record.name,
    nameJa: record.nameJa,
    elevationM: record.forecastElevationM,
    lat: record.coordinates.lat,
    lng: record.coordinates.lng,
    websiteUrl: record.officialUrl,
  };
}

function townFor(
  id: string,
  name: string,
  nameJa: string,
  records: PublicRuntimeCatalogueRecord[],
): BaseTown {
  const points = records.map((record) => record.coordinates);
  return {
    id,
    name,
    nameJa,
    lat: points.reduce((total, point) => total + point.lat, 0) / points.length,
    lng: points.reduce((total, point) => total + point.lng, 0) / points.length,
    nearbyMountainIds: records.map((record) => record.publicId),
    blurb: "Open nearby published mountain weather. Town weather is not currently published.",
    blurbJa: "近隣の公開済み山岳天気を表示します。町の天気は現在未公開です。",
    catalogueContentMode: "mountain-links",
  } as BaseTown & { catalogueContentMode: "mountain-links" };
}

export interface CatalogueTownLandingItem {
  id: string;
  name: string;
  nameJa?: string;
  href: string;
}

export interface CatalogueTownLandingModel {
  heading: string;
  description: string;
  mountains: CatalogueTownLandingItem[];
}

export function isCatalogueMountainLinkTown(town: BaseTown | undefined): boolean {
  return (town as (BaseTown & { catalogueContentMode?: string }) | undefined)
    ?.catalogueContentMode === "mountain-links";
}

/**
 * Generated catalogue towns use mountain coordinates only as a deterministic
 * map centroid. They must never pass that centroid to town-weather and label
 * the result as town conditions. Their honest destination is a list of the
 * published nearby mountain-weather routes.
 */
export function catalogueTownLandingModel(
  region: RegionConfig,
  town: BaseTown,
): CatalogueTownLandingModel | undefined {
  if (!isCatalogueMountainLinkTown(town)) return undefined;
  const mountainsById = new Map((region.mountains ?? []).map((mountain) => [mountain.id, mountain]));
  const mountains = (town.nearbyMountainIds ?? []).map((id) => {
    const mountain = mountainsById.get(id);
    if (!mountain) {
      throw new Error(`Catalogue base town references missing mountain: ${region.id}/${town.id}/${id}`);
    }
    return {
      id,
      name: mountain.name,
      nameJa: mountain.nameJa,
      href: `/${region.id}/mountain/${id}`,
    };
  });
  if (mountains.length === 0) {
    throw new Error(`Catalogue base town has no published mountains: ${region.id}/${town.id}`);
  }
  return {
    heading: "Published mountain weather nearby",
    description:
      "Town weather is not currently published for this base. Choose a nearby mountain for its weather and forecast.",
    mountains,
  };
}

function assertUniqueRoutes(regions: RegionConfig[]) {
  const mountainIds = new Set<string>();
  const routes = new Set<string>();
  for (const region of regions) {
    for (const mountain of region.mountains ?? []) {
      const route = `/${region.id}/mountain/${mountain.id}`;
      if (mountainIds.has(mountain.id)) {
        throw new Error(`Japan catalogue mountain id collision: ${mountain.id}`);
      }
      if (routes.has(route)) {
        throw new Error(`Japan catalogue route collision: ${route}`);
      }
      mountainIds.add(mountain.id);
      routes.add(route);
    }
  }
}

/**
 * Merges the published, new-page Japan projection once at module load.
 * Existing region objects retain their order and all authored fields.
 */
export function mergeJapanCatalogueRegions(existingRegions: RegionConfig[]): RegionConfig[] {
  const existingById = new Map(existingRegions.map((region) => [region.id, region]));
  // Generic catalogue regions deliberately share the established Japan brand;
  // no separate visual identity is inferred from a catalogue record.
  const japanBrand =
    existingById.get("yamanouchi")?.brand ??
    existingRegions[0]?.brand ??
    { wordmarkUrl: "" };
  const catalogueByRegion = new Map<string, PublicRuntimeCatalogueRecord[]>();
  for (const record of publishedCatalogueRecords) {
    const expectedRoute = `/${record.travelRegionId}/mountain/${record.publicId}`;
    if (record.route !== expectedRoute) {
      throw new Error(`Published catalogue route does not match public id: ${record.recordId}`);
    }
    const records = catalogueByRegion.get(record.travelRegionId) ?? [];
    records.push(record);
    catalogueByRegion.set(record.travelRegionId, records);
  }

  assertUniqueRoutes(existingRegions);
  const seenNewIds = new Set<string>(existingRegions.flatMap((region) => region.mountains?.map((mountain) => mountain.id) ?? []));
  const mergedById = new Map<string, RegionConfig>();

  for (const [regionId, records] of catalogueByRegion) {
    const existing = existingById.get(regionId);
    const regionMeta = travelRegions.find((region) => region.travelRegionId === regionId);
    if (!regionMeta) throw new Error(`Missing travel region metadata: ${regionId}`);

    for (const record of records) {
      if (seenNewIds.has(record.publicId)) {
        throw new Error(`Japan catalogue mountain id collision: ${record.publicId}`);
      }
      seenNewIds.add(record.publicId);
    }

    const recordsByTown = new Map<string, PublicRuntimeCatalogueRecord[]>();
    for (const record of records) {
      const townRecords = recordsByTown.get(record.baseTownId) ?? [];
      townRecords.push(record);
      recordsByTown.set(record.baseTownId, townRecords);
    }
    const townMetadata = new Map(regionMeta.baseTowns.map((town) => [town.baseTownId, town]));

    const catalogueTowns = [...recordsByTown].map(([townId, townRecords]) => {
      const metadata = townMetadata.get(townId);
      if (!metadata) throw new Error(`Missing base town metadata: ${townId}`);
      return townFor(townId, metadata.name, metadata.nameJa, townRecords);
    });

    if (existing) {
      const townsById = new Map((existing.baseTowns ?? []).map((town) => [town.id, town]));
      for (const town of catalogueTowns) {
        const authoredTown = townsById.get(town.id);
        if (authoredTown) {
          townsById.set(town.id, {
            ...authoredTown,
            nearbyMountainIds: [...(authoredTown.nearbyMountainIds ?? []), ...town.nearbyMountainIds!],
          });
        } else {
          townsById.set(town.id, town);
        }
      }
      mergedById.set(regionId, {
        ...existing,
        mountains: [...(existing.mountains ?? []), ...records.map(mountainFor)],
        baseTowns: [...townsById.values()],
      });
    } else {
      mergedById.set(regionId, {
        id: regionId,
        name: regionMeta.name,
        subtitle: `${regionMeta.prefectures.join(" · ")} · Japan`,
        shortTag: "JP",
        brand: japanBrand,
        seasons: true,
        language: { locales: ["en", "ja"] },
        resorts: [],
        mountains: records.map(mountainFor),
        baseTowns: catalogueTowns,
        weatherSource: { label: "Open-Meteo", labelJa: "Open-Meteo" },
      });
    }
  }

  const merged = [
    ...existingRegions.map((region) => mergedById.get(region.id) ?? region),
    ...[...catalogueByRegion.keys()]
      .filter((regionId) => !existingById.has(regionId))
      .map((regionId) => mergedById.get(regionId)!)
  ];
  assertUniqueRoutes(merged);
  return merged;
}

export interface PublishedMountainCapabilities {
  powderAlertsAvailable: false;
  contentMode: "weather-only";
}

const CATALOGUE_CAPABILITIES = new Map(
  publishedCatalogueRecords.map((record) => [
    `${record.travelRegionId}/${record.publicId}`,
    {
      powderAlertsAvailable: false,
      contentMode: "weather-only",
    } satisfies PublishedMountainCapabilities,
  ]),
);

export function getPublishedMountainCapabilities(
  regionId: string,
  mountainId: string,
): PublishedMountainCapabilities | undefined {
  return CATALOGUE_CAPABILITIES.get(`${regionId}/${mountainId}`);
}

export type MountainDetailRouteMode = "generic" | "bespoke";

/**
 * Weather-only publication capability takes precedence over a region-level
 * bespoke router. Authored mountains have no catalogue capability entry and
 * continue through the richer regional detail page where one exists.
 */
export function mountainDetailRouteMode({
  regionId,
  mountainId,
  hasBespokeRouter,
}: {
  regionId: string;
  mountainId: string;
  hasBespokeRouter: boolean;
}): MountainDetailRouteMode {
  if (getPublishedMountainCapabilities(regionId, mountainId)?.contentMode === "weather-only") {
    return "generic";
  }
  return hasBespokeRouter ? "bespoke" : "generic";
}