export interface WesternUsState {
  stateCode: string;
  name: string;
}

export interface WesternUsRegion {
  regionId: string;
  name: string;
  stateCode: string;
  timezone: WesternUsTimezone;
  baseTowns: Array<{ baseTownId: string; name: string }>;
}

export type WesternUsTimezone =
  | "America/Anchorage"
  | "America/Los_Angeles"
  | "America/Phoenix"
  | "America/Denver";

export interface WesternUsPublishedRecord {
  recordId: string;
  publicId: string;
  aliases: string[];
  name: string;
  coordinates: { lat: number; lng: number };
  forecastElevationM: number;
  baseElevationM: number;
  topElevationM: number;
  officialUrl: string;
  stateCode: string;
  regionId: string;
  timezone: WesternUsTimezone;
  baseTownId: string;
  route: string;
  country: "United States";
  countryCode: "US";
  lifecycle: "published";
  operatingStatus: "operating";
}

export interface WesternUsPublicRuntime {
  schemaVersion: 1;
  countryCode: "US";
  generatedAt: string;
  states: WesternUsState[];
  regions: WesternUsRegion[];
  publishedCatalogueRecords: WesternUsPublishedRecord[];
}

export declare const westernUsPublicRuntime: WesternUsPublicRuntime;
export declare const states: WesternUsState[];
export declare const regions: WesternUsRegion[];
export declare const publishedCatalogueRecords: WesternUsPublishedRecord[];