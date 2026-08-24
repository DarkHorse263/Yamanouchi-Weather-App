/**
 * Dependency-free JSON Schema for storage/API boundaries. Runtime consumers can
 * import this without pulling frontend TypeScript or asset modules.
 */
export const japanCatalogueSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://feelzlike.com/schemas/japan-ski-catalogue-v1.json",
  title: "Canonical Japan ski-area catalogue",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "countryCode",
    "generatedAt",
    "sources",
    "policy",
    "frontendRegionSources",
    "intakeRecords",
    "publishedPages",
  ],
  properties: {
    schemaVersion: { const: 1 },
    countryCode: { const: "JP" },
    generatedAt: { type: "string", format: "date-time" },
    sources: { type: "array", items: { type: "object" } },
    policy: {
      type: "object",
      required: [
        "allowedLifecycles",
        "publishableOperatingStatuses",
        "marketingApproved",
        "marketingGateReason",
        "cleanGate",
      ],
      properties: {
        allowedLifecycles: {
          const: ["draft", "verified", "published"],
        },
        publishableOperatingStatuses: { const: ["operating"] },
        marketingApproved: { type: "boolean" },
        marketingGateReason: { type: "string", minLength: 1 },
        cleanGate: {
          type: "object",
          required: [
            "unresolvedOperatingCandidates",
            "evidenceCompleteCandidates",
            "requiredReviews",
          ],
          properties: {
            unresolvedOperatingCandidates: { type: "integer", minimum: 0 },
            evidenceCompleteCandidates: { type: "integer", minimum: 0 },
            requiredReviews: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    frontendRegionSources: { type: "array", items: { type: "object" } },
    intakeRecords: {
      type: "array",
      items: {
        type: "object",
        required: [
          "recordId",
          "lifecycle",
          "operatingStatus",
          "source",
          "raw",
          "evidence",
          "directoryRelationship",
          "readiness",
        ],
        properties: {
          lifecycle: { enum: ["draft", "verified"] },
          operatingStatus: {
            enum: [
              "operating",
              "temporarily_closed",
              "indoor",
              "dry_slope",
              "closed",
              "unknown",
            ],
          },
        },
      },
    },
    publishedPages: {
      type: "array",
      items: {
        type: "object",
        required: [
          "pageRecordId",
          "publicId",
          "aliases",
          "route",
          "lifecycle",
          "operatingStatus",
          "travelRegionId",
          "baseTownId",
          "coordinates",
          "elevationM",
          "verificationDate",
          "evidence",
          "intakeRelationship",
        ],
        properties: {
          lifecycle: { const: "published" },
          operatingStatus: { const: "operating" },
        },
      },
    },
  },
};