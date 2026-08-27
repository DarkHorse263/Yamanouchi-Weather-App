const evidence = {
  type: "object",
  additionalProperties: false,
  required: ["sourceUrl", "checkedAt", "quote", "fields"],
  properties: {
    sourceUrl: { type: "string", format: "uri" },
    checkedAt: { type: "string", format: "date" },
    quote: { type: "string", minLength: 1 },
    fields: {
      type: "array",
      minItems: 1,
      items: {
        enum: ["operatingStatus", "officialUrl", "coordinates", "elevation", "identity"],
      },
    },
  },
};
const timezone = {
  enum: ["America/Anchorage", "America/Los_Angeles", "America/Phoenix", "America/Denver"],
};

export const westernUsCatalogueSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://feelzlike.com/schemas/western-us-ski-catalogue-v1.json",
  title: "Canonical western-US ski-area catalogue",
  type: "object",
  additionalProperties: false,
  required: [
    "schemaVersion",
    "countryCode",
    "generatedAt",
    "policy",
    "states",
    "regions",
    "intakeRecords",
    "publishedCatalogueRecords",
  ],
  properties: {
    schemaVersion: { const: 1 },
    countryCode: { const: "US" },
    generatedAt: { type: "string", format: "date-time" },
    policy: {
      type: "object",
      additionalProperties: false,
      required: ["allowedLifecycles", "publishableOperatingStatuses", "classificationRequired"],
      properties: {
        allowedLifecycles: { const: ["draft", "verified", "published"] },
        publishableOperatingStatuses: { const: ["operating"] },
        classificationRequired: { const: true },
      },
    },
    states: { type: "array", items: { type: "object" } },
    regions: {
      type: "array",
      items: {
        type: "object",
        required: ["regionId", "name", "stateCode", "timezone", "baseTowns"],
        properties: { timezone },
      },
    },
    intakeRecords: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "recordId",
          "candidateDisposition",
          "lifecycle",
          "classification",
          "operatingStatus",
          "stateCode",
          "routeMode",
          "evidence",
        ],
        properties: {
          recordId: { type: "string", minLength: 1 },
          publicId: { type: "string" },
          name: { type: "string" },
          aliases: { type: "array", items: { type: "string" } },
          lifecycle: { enum: ["draft", "verified", "published"] },
          candidateDisposition: {
            enum: ["existing", "duplicate_renamed", "verified_operating", "private_restricted", "uncertain", "closed"],
          },
          classification: {
            type: "object",
            additionalProperties: false,
            required: ["facilityType", "snowSurface", "publicAccess"],
            properties: {
              facilityType: { enum: ["ski_area", "indoor", "dry_slope", "backcountry_only", "unknown"] },
              snowSurface: { enum: ["snow", "synthetic", "mixed", "unknown"] },
              publicAccess: { enum: ["public", "private", "unknown"] },
            },
          },
          operatingStatus: {
            enum: ["operating", "temporarily_closed", "closed", "planned", "unknown"],
          },
          stateCode: { type: "string", pattern: "^[A-Z]{2}$" },
          regionId: { type: "string" },
          baseTownId: { type: "string" },
          routeMode: { enum: ["existing_page", "new_page"] },
          route: { type: ["string", "null"] },
          officialUrl: { type: ["string", "null"], format: "uri" },
          coordinates: {
            type: ["object", "null"],
            properties: { lat: { type: "number" }, lng: { type: "number" } },
            required: ["lat", "lng"],
            additionalProperties: false,
          },
          elevation: {
            type: ["object", "null"],
            properties: { baseM: { type: "number" }, topM: { type: "number" } },
            required: ["baseM", "topM"],
            additionalProperties: false,
          },
          forecastElevationM: { type: ["number", "null"] },
          evidence: { type: "array", items: evidence },
          researchClassification: { type: "string" },
        },
      },
    },
    publishedCatalogueRecords: {
      type: "array",
      items: {
        type: "object",
        required: ["timezone"],
        properties: { timezone },
      },
    },
  },
};