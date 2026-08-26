export type CatalogueLifecycle = "draft" | "verified" | "published";
export type OperatingStatus =
  | "operating"
  | "temporarily_closed"
  | "indoor"
  | "dry_slope"
  | "closed"
  | "unknown";
export type ReviewStatus =
  | "verified_operating"
  | "temporarily_closed"
  | "closed"
  | "merged_into"
  | "unclear";

export interface SourceEvidence {
  evidenceId: string;
  sourceType:
    | "national_intake_workbook"
    | "ski_directory"
    | "openstreetmap"
    | "wikidata"
    | "official_website"
    | "existing_frontend_projection"
    | "verified_evidence_supplement";
  sourceRef: string;
  directoryUrl?: string;
  officialUrls?: string[];
  coordinates?: { lat: number; lng: number };
  elevation?: { baseM?: number; topM?: number; verticalM?: number };
  names?: { en?: string; ja?: string };
  externalIds?: { osm?: string; wikidata?: string };
  sourceUrl?: string;
  evidenceAsOf?: string;
  citationSourceType?: string;
  note?: string;
  fields?: string[];
}

export interface IntakeRecord {
  recordId: string;
  lifecycle: CatalogueLifecycle;
  operatingStatus: OperatingStatus;
  reviewedOperatingStatus?: "operating" | "temporarily_closed" | "closed" | "merged_into";
  travelRegionId?: string;
  baseTownId?: string;
  publicId?: string;
  aliases?: string[];
  routeMode?: "existing_page" | "new_page";
  existingPageId?: string;
  source: {
    sourceId: "japan-ski-resorts-558";
    rowIdentity: string;
    rawName: string;
  };
  raw: {
    workbookNo: string;
    name: string;
    townVillage: string;
    consumerArea: string;
    municipality: string;
    prefecture: string;
    macroRegion: string;
    skiAreaValley: string;
    passAccess: string;
    status: string;
    rating: number | null;
    notes: string;
  };
  review?: {
    reviewBatch: string;
    reviewedAt: string;
    reviewStatus: ReviewStatus;
    officialNameEn?: string;
    officialNameJa?: string;
    officialUrl?: string;
    statusEvidenceUrl?: string;
    statusEvidenceQuote?: string;
    evidenceAsOf: string;
    notes?: string;
    travelClusterLabelSuggestion: string;
    baseTownLabelSuggestion: string;
    clusterConfidence: "high" | "medium" | "low";
    successor?: { recordId?: string; officialName?: string };
  };
  evidence: SourceEvidence[];
  directoryRelationship:
    | {
        state: "candidate_match";
        method: "unique_exact_normalized_name";
        directorySlug: string;
      }
    | {
        state: "unresolved";
        reason: string;
      };
  readiness: {
    basis: "unique_exact_normalized_name" | "supplement_only" | "unresolved";
    essentials: {
      coordinates: boolean;
      defensibleElevation: boolean;
      japaneseName: boolean;
      officialUrl: boolean;
    };
    evidenceComplete: boolean;
    missingReasons: string[];
    requiredReviews: Array<"operating_status" | "travel_cluster">;
  };
  publicationReadiness: {
    publishable: boolean;
    routeAlreadyPublished?: boolean;
    missingReasons: string[];
  };
  resolved: {
    name?: string;
    nameJa?: string;
    officialUrl?: string;
    coordinates?: { lat: number; lng: number };
    elevation?: { baseM?: number; topM?: number; verticalM?: number };
  };
}

export interface TravelRegion {
  travelRegionId: string;
  name: string;
  nameJa: string;
  prefectures: string[];
  baseTowns: Array<{ baseTownId: string; name: string; nameJa: string }>;
  recordIds: string[];
}

export interface PublicationCandidate {
  recordId: string;
  publicId: string;
  aliases: string[];
  travelRegionId: string;
  baseTownId: string;
  route: string;
  name: string;
  nameJa: string;
  coordinates: { lat: number; lng: number };
  elevation: { baseM: number; topM: number; verticalM?: number };
  officialUrl: string;
  evidence: SourceEvidence[];
}

export interface PublishedCatalogueRecord {
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

export interface PublishedPageRecord {
  pageRecordId: string;
  publicId: string;
  aliases: string[];
  route: string;
  lifecycle: "published";
  operatingStatus: "operating";
  name: string;
  nameJa?: string;
  prefecture: string;
  travelRegionId: string;
  baseTownId: string;
  coordinates: { lat: number; lng: number };
  elevationM: number;
  officialUrl?: string;
  verificationDate: string;
  verificationScope: "existing_public_projection_migration";
  evidence: SourceEvidence[];
  intakeRelationship:
    | {
        state: "candidate_match";
        method: "unique_exact_normalized_name";
        intakeRecordId: string;
      }
    | {
        state: "unresolved";
        reason: string;
      };
}

export interface JapanSkiCatalogue {
  schemaVersion: 1;
  countryCode: "JP";
  generatedAt: string;
  sources: Array<{
    sourceId: string;
    kind: string;
    recordCount: number;
    location: string;
    summary?: {
      directoryRows: number;
      detailDerivedOfficialLinks: number;
      mergedOfficialCoverage: number;
      evidenceCompleteRows: number;
    };
  }>;
  policy: {
    launchPolicyId: "verified_evidence_complete_only";
    launchPolicyDescription: string;
    allowedLifecycles: readonly ["draft", "verified", "published"];
    publishableOperatingStatuses: readonly ["operating"];
    marketingApproved: boolean;
    marketingGateReason: string;
    cleanGate: {
      verifiedEvidenceCompleteRecords: number;
      lifecyclePublishedRecords: number;
      routeReadyNewCandidates: number;
      manifestIntegratedNewRecords: number;
      reviewQueueExcludedPendingEvidence: number;
      unclearOrNotVerifiableRecords: number;
      verifiedEssentialGapRecords: number;
    };
  };
  frontendRegionSources: Array<{ regionId: string; sourcePath: string }>;
  travelRegions: TravelRegion[];
  intakeRecords: IntakeRecord[];
  publishedPages: PublishedPageRecord[];
  publicationCandidates: PublicationCandidate[];
  publishedCatalogueRecords: PublishedCatalogueRecord[];
}

export declare const japanCatalogue: JapanSkiCatalogue;
export declare const publishedCatalogueRecords: PublishedCatalogueRecord[];
export declare const travelRegions: TravelRegion[];
export { japanCatalogueSchema } from "./schema.js";