import type { BaseTown, MountainLink, RegionConfig } from "@workspace/feelzlike-shell";
import {
  publishedCatalogueRecords,
  travelRegions,
} from "@workspace/canada-ski-catalogue/public-runtime";
import type { PublishedCanadaSkiRecord } from "@workspace/canada-ski-catalogue";

function mountainFor(record: PublishedCanadaSkiRecord): MountainLink {
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

function localityId(regionId: string, locality: string): string {
  return `${regionId}-${locality
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;
}

function townFor(id: string, locality: string, records: PublishedCanadaSkiRecord[]): BaseTown {
  const points = records.map((record) => record.coordinates);
  return {
    id,
    name: locality,
    lat: points.reduce((total, point) => total + point.lat, 0) / points.length,
    lng: points.reduce((total, point) => total + point.lng, 0) / points.length,
    nearbyMountainIds: records.map((record) => record.publicId),
    blurb: "Open nearby published mountain weather. Locality weather is not currently published.",
    catalogueContentMode: "mountain-links",
  } as BaseTown & { catalogueContentMode: "mountain-links" };
}

/**
 * Projects only the verified public runtime into weather-only Canada regions.
 * Province ids are publication ids, rather than inferred destination labels.
 */
export function mergeCanadaCatalogueRegions(existingRegions: RegionConfig[]): RegionConfig[] {
  const existingById = new Map(existingRegions.map((region) => [region.id, region]));
  const canadaBrand =
    existingById.get("whistler")?.brand ??
    existingRegions.find((region) => region.shortTag === "CA")?.brand ??
    { wordmarkUrl: "" };
  const recordsByRegion = new Map<string, PublishedCanadaSkiRecord[]>();
  for (const record of publishedCatalogueRecords) {
    if (!/^canada-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.travelRegionId) ||
      record.route !== `/${record.travelRegionId}/mountain/${record.publicId}`) {
      throw new Error(`Published Canada catalogue route does not match public id: ${record.recordId}`);
    }
    const records = recordsByRegion.get(record.travelRegionId) ?? [];
    records.push(record);
    recordsByRegion.set(record.travelRegionId, records);
  }

  const mountainIds = new Set(existingRegions.flatMap((region) => region.mountains?.map((mountain) => mountain.id) ?? []));
  for (const record of publishedCatalogueRecords) {
    if (mountainIds.has(record.publicId)) throw new Error(`Canada catalogue mountain id collision: ${record.publicId}`);
    mountainIds.add(record.publicId);
  }

  const generated: RegionConfig[] = [];
  for (const [regionId, records] of recordsByRegion) {
    if (existingById.has(regionId)) throw new Error(`Canada catalogue region id collision: ${regionId}`);
    const metadata = travelRegions.find((region) => region.travelRegionId === regionId);
    if (!metadata) throw new Error(`Missing Canada travel region metadata: ${regionId}`);
    const byLocality = new Map<string, PublishedCanadaSkiRecord[]>();
    for (const record of records) {
      const localityRecords = byLocality.get(record.locality) ?? [];
      localityRecords.push(record);
      byLocality.set(record.locality, localityRecords);
    }
    const towns = [...byLocality].map(([locality, localityRecords]) =>
      townFor(localityId(regionId, locality), locality, localityRecords),
    );
    if (new Set(towns.map((town) => town.id)).size !== towns.length) {
      throw new Error(`Canada catalogue locality id collision: ${regionId}`);
    }
    generated.push({
      id: regionId,
      name: metadata.name,
      subtitle: `${metadata.province} · Canada`,
      shortTag: "CA",
      brand: canadaBrand,
      seasons: true,
      language: { locales: ["en"] },
      resorts: [],
      mountains: records.map(mountainFor),
      baseTowns: towns,
      weatherSource: { label: "Open-Meteo" },
    });
  }
  return [...existingRegions, ...generated];
}