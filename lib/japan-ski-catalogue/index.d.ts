export type CatalogueLifecycle = "draft" | "verified" | "published";
export type OperatingStatus =
  | "operating"
  | "temporarily_closed"
  | "indoor"
  | "dry_slope"
  | "closed"
  | "unknown";

export interface SourceEvidence {
  evidenceId: string;
  sourceType:
    | "national_intake_workbook"
    | "ski_directory"
    | "openstreetmap"
    | "wikidata"
    | "official_website"
    | "existing_frontend_projection";
  sourceRef: string;
  directoryUrl?: string;
  officialUrls?: string[];
  coordinates?: { lat: number; lng: number };
  elevation?: { baseM?: number; topM?: number; verticalM?: number };
  names?: { en?: string; ja?: string };
  externalIds?: { osm?: string; wikidata?: string };
}

export interface IntakeRecord {
  recordId: string;
  lifecycle: "draft" | "verified";
  operatingStatus: OperatingStatus;
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
    basis: "unique_exact_normalized_name" | "unresolved";
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
    allowedLifecycles: readonly ["draft", "verified", "published"];
    publishableOperatingStatuses: readonly ["operating"];
    marketingApproved: boolean;
    marketingGateReason: string;
    cleanGate: {
      unresolvedOperatingCandidates: number;
      evidenceCompleteCandidates: number;
      requiredReviews: Array<"operating_status" | "travel_cluster" | "weather_page">;
    };
  };
  frontendRegionSources: Array<{ regionId: string; sourcePath: string }>;
  intakeRecords: IntakeRecord[];
  publishedPages: PublishedPageRecord[];
}

export declare const japanCatalogue: JapanSkiCatalogue;
export { japanCatalogueSchema } from "./schema.js";