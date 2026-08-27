import type { CanadaTravelRegion, PublishedCanadaSkiRecord } from "./index.js";
export interface CanadaPublicRuntime {
  schemaVersion: 1;
  countryCode: "CA";
  generatedAt: string;
  travelRegions: CanadaTravelRegion[];
  publishedCatalogueRecords: PublishedCanadaSkiRecord[];
}
export declare const canadaPublicRuntime: CanadaPublicRuntime;
export declare const publishedCatalogueRecords: PublishedCanadaSkiRecord[];
export declare const travelRegions: CanadaTravelRegion[];