export type CatalogueLifecycle = "draft" | "verified" | "published";
export type CandidateClassification =
  | "existing"
  | "duplicate_or_renamed"
  | "verified_operating"
  | "private_restricted"
  | "uncertain"
  | "closed";
export type OperatingStatus = "operating" | "temporarily_closed" | "closed" | "unknown";
export type PublicAccess = "public" | "private" | "restricted" | "unknown";
export type ReconciliationStatus = "verified_operating" | "uncertain" | "closed" | "existing";

export interface FieldEvidence {
  officialIdentityUrl: string;
  officialUrl: string;
  coordinatesUrl: string;
  baseElevationUrl: string;
  topElevationUrl: string;
  forecastElevationUrl: string;
  localityUrl: string;
  provinceUrl: string;
}
export interface CanadaSkiCandidate {
  id: string;
  lifecycle: CatalogueLifecycle;
  classification: CandidateClassification;
  /**
   * Separates source-list reconciliation from current operating verification.
   * A duplicate/renamed source candidate may still be verified_operating here.
   */
  reconciliationStatus?: ReconciliationStatus;
  operatingStatus: OperatingStatus;
  publicAccess: PublicAccess;
  source: { pdfId: string; candidateId: string; pdfUrl?: string; page?: number };
  officialIdentity?: string;
  officialUrl?: string;
  coordinates?: { lat: number; lng: number };
  elevations?: { baseM?: number; topM?: number; forecastM?: number };
  locality?: string;
  province?: string;
  provinceId?: string;
  publicId?: string;
  aliases?: string[];
  evidence?: Partial<FieldEvidence>;
  notes?: string;
}
export interface CanadaSourceManifest {
  expectedCandidateCount: number;
  expectedPublishedCount: number;
  sourceCandidates: Array<{ pdfId: string; candidateId: string }>;
}
export interface CanadaTravelRegion {
  travelRegionId: string;
  name: string;
  province: string;
  recordIds: string[];
}
export interface PublishedCanadaSkiRecord {
  recordId: string;
  publicId: string;
  aliases: string[];
  name: string;
  officialUrl: string;
  coordinates: { lat: number; lng: number };
  baseElevationM: number;
  topElevationM: number;
  forecastElevationM: number;
  locality: string;
  province: string;
  travelRegionId: string;
  route: string;
  country: "Canada";
  countryCode: "CA";
}
export interface CanadaSkiCatalogue {
  schemaVersion: 1;
  countryCode: "CA";
  generatedAt: string;
  policy: { launchPolicyId: "published_verified_public_complete_only"; description: string };
  travelRegions: CanadaTravelRegion[];
  candidates: CanadaSkiCandidate[];
  publishedCatalogueRecords: PublishedCanadaSkiRecord[];
}
export declare const canadaCatalogue: CanadaSkiCatalogue;
export declare const publishedCatalogueRecords: PublishedCanadaSkiRecord[];
export declare const travelRegions: CanadaTravelRegion[];
export { canadaCatalogueSchema } from "./schema.js";