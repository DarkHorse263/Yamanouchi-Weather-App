import type { BaseTown, MountainLink, RegionConfig } from "@workspace/feelzlike-shell";
import {
  publishedRecords,
  publishedRegions,
  type PublicCatalogueRecord,
} from "@workspace/ski-catalogue/public-runtime";

export type CatalogueMountainLink = MountainLink & Pick<PublicCatalogueRecord, "facilityType" | "weatherEligible">;

function mountainFor(record: PublicCatalogueRecord): CatalogueMountainLink {
  return {
    id: record.publicId,
    name: record.name,
    elevationM: record.forecastElevationM,
    baseElevationM: record.baseElevationM,
    lat: record.coordinates.lat,
    lng: record.coordinates.lng,
    websiteUrl: record.officialUrl,
    blurb: record.publicCopy,
    facilityType: record.facilityType,
    weatherEligible: record.weatherEligible,
  };
}

function townFor(record: PublicCatalogueRecord, records: PublicCatalogueRecord[]): BaseTown {
  const points = records.map((item) => item.coordinates);
  return {
    id: record.localityId,
    name: record.localityName,
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length,
    nearbyMountainIds: records.map((item) => item.publicId),
    blurb: records.every((item) => item.facilityType === "indoor")
      ? "Indoor snow facility directory. No outdoor mountain weather or snow forecast is shown."
      : "Choose a nearby published mountain for its weather and forecast.",
    catalogueContentMode: "mountain-links",
  } as BaseTown & { catalogueContentMode: "mountain-links" };
}

/**
 * Adds only the framework's safe published projection. Existing authored
 * mountains win on public-id collisions, preventing duplicate browse/search
 * entries while preserving every established route.
 */
export function mergeSkiCatalogueRegions(existingRegions: RegionConfig[]): RegionConfig[] {
  const existingIds = new Set(
    existingRegions.flatMap((region) => (region.mountains ?? []).map((mountain) => mountain.id)),
  );
  const generatedIds = new Set<string>();
  for (const record of publishedRecords) {
    for (const id of [record.publicId, ...record.aliases]) {
      if (existingIds.has(id) || generatedIds.has(id)) {
        throw new Error(`Ski catalogue mountain id/alias collision: ${id}`);
      }
      generatedIds.add(id);
    }
  }
  const records = publishedRecords;
  const recordsByRegion = new Map<string, PublicCatalogueRecord[]>();
  for (const record of records) {
    const regionRecords = recordsByRegion.get(record.regionId) ?? [];
    regionRecords.push(record);
    recordsByRegion.set(record.regionId, regionRecords);
  }
  if (recordsByRegion.size === 0) return existingRegions;

  const existingById = new Map(existingRegions.map((region) => [region.id, region]));
  const brand = existingRegions[0]?.brand ?? { wordmarkUrl: "" };
  const additions = new Map<string, RegionConfig>();
  for (const [regionId, regionRecords] of recordsByRegion) {
    const current = existingById.get(regionId);
    const metadata = publishedRegions.find((region) => region.regionId === regionId);
    if (!metadata) throw new Error(`Missing published catalogue region: ${regionId}`);
    const recordsByTown = new Map<string, PublicCatalogueRecord[]>();
    for (const record of regionRecords) {
      const townRecords = recordsByTown.get(record.localityId) ?? [];
      townRecords.push(record);
      recordsByTown.set(record.localityId, townRecords);
    }
    const towns = [...recordsByTown.values()].map((townRecords) => townFor(townRecords[0]!, townRecords));
    if (current) {
      const townsById = new Map((current.baseTowns ?? []).map((town) => [town.id, town]));
      for (const town of towns) {
        const authored = townsById.get(town.id);
        townsById.set(town.id, authored ? {
          ...authored,
          nearbyMountainIds: [...new Set([...(authored.nearbyMountainIds ?? []), ...(town.nearbyMountainIds ?? [])])],
        } : town);
      }
      additions.set(regionId, {
        ...current,
        mountains: [...(current.mountains ?? []), ...regionRecords.map(mountainFor)],
        baseTowns: [...townsById.values()],
      });
    } else {
      additions.set(regionId, {
        id: regionId,
        name: metadata.name,
        subtitle: `${metadata.stateOrProvince} · ${metadata.country}`,
        shortTag: metadata.stateOrProvince,
        brand,
        seasons: !regionRecords.every((record) => record.facilityType === "indoor"),
        hemisphere: metadata.countryCode === "NZ" ? "south" : "north",
        resorts: [],
        mountains: regionRecords.map(mountainFor),
        baseTowns: towns,
        weatherSource: {
          label: regionRecords.every((record) => record.facilityType === "indoor")
            ? "Indoor facility information"
            : "Open-Meteo",
        },
      });
    }
  }
  return [
    ...existingRegions.map((region) => additions.get(region.id) ?? region),
    ...[...additions].filter(([id]) => !existingById.has(id)).map(([, region]) => region),
  ];
}

export const SKI_CATALOGUE_REGION_COUNTRIES = Object.fromEntries(
  publishedRegions.map((region) => [region.regionId, region.countryCode]),
);