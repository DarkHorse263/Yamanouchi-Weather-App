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