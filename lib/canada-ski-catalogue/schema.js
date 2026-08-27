export const canadaCatalogueSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://feelzlike.com/schemas/canada-ski-catalogue-v1.json",
  title: "Canonical Canadian ski-area catalogue",
  type: "object",
  additionalProperties: false,
  required: ["schemaVersion", "countryCode", "generatedAt", "policy", "travelRegions", "candidates", "publishedCatalogueRecords"],
  properties: {
    schemaVersion: { const: 1 },
    countryCode: { const: "CA" },
    generatedAt: { type: "string", format: "date-time" },
    policy: { type: "object" },
    travelRegions: { type: "array", items: { type: "object" } },
    candidates: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "lifecycle", "classification", "operatingStatus", "publicAccess", "source"],
        properties: {
          lifecycle: { enum: ["draft", "verified", "published"] },
          classification: { enum: ["existing", "duplicate_or_renamed", "verified_operating", "private_restricted", "uncertain", "closed"] },
          reconciliationStatus: { enum: ["verified_operating", "uncertain", "closed", "existing"] },
          operatingStatus: { enum: ["operating", "temporarily_closed", "closed", "unknown"] },
          publicAccess: { enum: ["public", "private", "restricted", "unknown"] },
          source: {
            type: "object",
            required: ["pdfId", "candidateId"],
            properties: { pdfId: { type: "string", minLength: 1 }, candidateId: { type: "string", minLength: 1 } }
          }
        }
      }
    },
    publishedCatalogueRecords: { type: "array", items: { type: "object" } }
  }
};