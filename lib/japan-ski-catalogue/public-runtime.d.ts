export interface PublicRuntimeTravelRegion {
  travelRegionId: string;
  name: string;
  nameJa: string;
  prefectures: string[];
  baseTowns: Array<{ baseTownId: string; name: string; nameJa: string }>;
}

export interface PublicRuntimeCatalogueRecord {
  recordId: string;
  publicId: string;
  aliases: string[];
  name: string;
  nameJa: string;
  coordinates: { lat: number; lng: number };
  forecastElevationM: number;
  baseElevationM: number;
  topElevationM: number;
  officialUrl: string;
  travelRegionId: string;
  baseTownId: string;
  route: string;
  prefecture: string;
  country: "Japan";
  countryCode: "JP";
  honesty: {
    operatingStatusVerified: true;
    evidenceComplete: true;
    manifestApproved: true;
    runtimeIntegrated: true;
  };
}

export interface JapanPublicRuntime {
  schemaVersion: 1;
  countryCode: "JP";
  generatedAt: string;
  travelRegions: PublicRuntimeTravelRegion[];
  publishedCatalogueRecords: PublicRuntimeCatalogueRecord[];
}

export declare const japanPublicRuntime: JapanPublicRuntime;
export declare const travelRegions: PublicRuntimeTravelRegion[];
export declare const publishedCatalogueRecords: PublicRuntimeCatalogueRecord[];