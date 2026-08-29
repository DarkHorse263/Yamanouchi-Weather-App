import type { BaseTown, MountainLink, RegionConfig } from "@workspace/feelzlike-shell";
import {
  publishedCatalogueRecords,
  regions as catalogueRegions,
  states,
  type WesternUsPublishedRecord,
  type WesternUsRegion,
} from "@workspace/western-us-ski-catalogue/public-runtime";

function mountainFor(record: WesternUsPublishedRecord): MountainLink {
  return {
    id: record.publicId,
    name: record.name,
    elevationM: record.forecastElevationM,
    baseElevationM: record.baseElevationM,
    lat: record.coordinates.lat,
    lng: record.coordinates.lng,
    websiteUrl: record.officialUrl,
  };
}

function catalogueTown(
  metadata: WesternUsRegion["baseTowns"][number],
  records: WesternUsPublishedRecord[],
): BaseTown {
  return {
    id: metadata.baseTownId,
    name: metadata.name,
    lat: records.reduce((sum, record) => sum + record.coordinates.lat, 0) / records.length,
    lng: records.reduce((sum, record) => sum + record.coordinates.lng, 0) / records.length,
    nearbyMountainIds: records.map((record) => record.publicId),
    blurb: "Open nearby published mountain weather. Town weather is not currently published.",
    catalogueContentMode: "mountain-links",
  } as BaseTown & { catalogueContentMode: "mountain-links" };
}

/**
 * Adds only manifest-published new pages. Existing regions remain the same
 * registry object shape and position; a matching catalogue region augments it
 * rather than creating a second region or changing an authored mountain route.
 */
export function mergeWesternUsCatalogueRegions(
  authoredRegions: RegionConfig[],
  records: WesternUsPublishedRecord[] = publishedCatalogueRecords,
  regionMetadata: WesternUsRegion[] = catalogueRegions,
): RegionConfig[] {
  const authoredById = new Map(authoredRegions.map((region) => [region.id, region]));
  const metadataById = new Map(regionMetadata.map((region) => [region.regionId, region]));
  const stateByCode = new Map(states.map((state) => [state.stateCode, state]));
  const knownMountainIds = new Set(
    authoredRegions.flatMap((region) => region.mountains?.map((mountain) => mountain.id) ?? []),
  );
  const byRegion = new Map<string, WesternUsPublishedRecord[]>();
  for (const record of records) {
    if (
      record.lifecycle !== "published" ||
      record.operatingStatus !== "operating" ||
      record.route !== `/${record.regionId}/mountain/${record.publicId}`
    ) {
      throw new Error(`Invalid western-US public runtime record: ${record.recordId}`);
    }
    if (knownMountainIds.has(record.publicId)) {
      throw new Error(`Western-US catalogue mountain id collision: ${record.publicId}`);
    }
    knownMountainIds.add(record.publicId);
    byRegion.set(record.regionId, [...(byRegion.get(record.regionId) ?? []), record]);
  }

  const mergedById = new Map<string, RegionConfig>();
  for (const [regionId, regionRecords] of byRegion) {
    const metadata = metadataById.get(regionId);
    if (!metadata) throw new Error(`Missing western-US region metadata: ${regionId}`);
    const recordsByTown = new Map<string, WesternUsPublishedRecord[]>();
    for (const record of regionRecords) {
      recordsByTown.set(record.baseTownId, [...(recordsByTown.get(record.baseTownId) ?? []), record]);
    }
    const towns = [...recordsByTown].map(([townId, townRecords]) => {
      const townMetadata = metadata.baseTowns.find((town) => town.baseTownId === townId);
      if (!townMetadata) throw new Error(`Missing western-US base town metadata: ${regionId}/${townId}`);
      return catalogueTown(townMetadata, townRecords);
    });
    const authored = authoredById.get(regionId);
    if (authored) {
      const townsById = new Map((authored.baseTowns ?? []).map((town) => [town.id, town]));
      for (const town of towns) {
        const existing = townsById.get(town.id);
        townsById.set(
          town.id,
          existing
            ? {
                ...existing,
                nearbyMountainIds: [...(existing.nearbyMountainIds ?? []), ...(town.nearbyMountainIds ?? [])],
              }
            : town,
        );
      }
      mergedById.set(regionId, {
        ...authored,
        mountains: [...(authored.mountains ?? []), ...regionRecords.map(mountainFor)],
        baseTowns: [...townsById.values()],
      });
      continue;
    }
    const state = stateByCode.get(metadata.stateCode);
    if (!state) throw new Error(`Missing western-US state metadata: ${metadata.stateCode}`);
    const brand = authoredRegions[0]?.brand ?? { wordmarkUrl: "" };
    mergedById.set(regionId, {
      id: regionId,
      name: metadata.name,
      subtitle: `${state.name} · USA`,
      shortTag: metadata.stateCode,
      brand,
      seasons: true,
      hemisphere: "north",
      resorts: [],
      mountains: regionRecords.map(mountainFor),
      baseTowns: towns,
      weatherSource: { label: "Open-Meteo" },
    });
  }

  return [
    ...authoredRegions.map((region) => mergedById.get(region.id) ?? region),
    ...[...byRegion.keys()]
      .filter((regionId) => !authoredById.has(regionId))
      .map((regionId) => mergedById.get(regionId)!),
  ];
}

const publishedRoutes = new Set(
  publishedCatalogueRecords.map((record) => `${record.regionId}/${record.publicId}`),
);
const publishedRegionById = new Map(
  publishedCatalogueRecords.flatMap((record) =>
    [record.publicId, ...record.aliases].map((id) => [id, record.regionId] as const),
  ),
);

export function isWesternUsCatalogueMountain(regionId: string, mountainId: string): boolean {
  return publishedRoutes.has(`${regionId}/${mountainId}`);
}

export function westernUsPublishedMountainBelongsToRegion(
  regionId: string,
  mountainId: string,
): boolean {
  const publishedRegion = publishedRegionById.get(mountainId);
  return publishedRegion === undefined || publishedRegion === regionId;
}