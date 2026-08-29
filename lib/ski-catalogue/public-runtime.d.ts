export interface PublicCatalogueRegion {
  regionId: string;
  name: string;
  stateOrProvince: string;
  country: string;
  countryCode: string;
  localities: Array<{ localityId: string; name: string }>;
}
export interface PublicCatalogueRecord {
  recordId: string;
  publicId: string;
  aliases: string[];
  name: string;
  coordinates: { lat: number; lng: number };
  forecastElevationM: number;
  officialUrl: string;
  regionId: string;
  regionName: string;
  stateOrProvince: string;
  localityId: string;
  localityName: string;
  route: string;
  country: string;
  countryCode: string;
  timezone: string;
  facilityType: "alpine" | "club_field" | "hike_in_club_field" | "nordic" | "indoor";
  accessModel: string;
  publicCopy: string;
  weatherEligible: boolean;
  alertEligible: boolean;
}
export interface CataloguePublicRuntime {
  schemaVersion: 1;
  batches: string[];
  publishedRegions: PublicCatalogueRegion[];
  publishedRecords: PublicCatalogueRecord[];
}
export declare const cataloguePublicRuntime: CataloguePublicRuntime;
export declare const publishedRegions: PublicCatalogueRegion[];
export declare const publishedRecords: PublicCatalogueRecord[];