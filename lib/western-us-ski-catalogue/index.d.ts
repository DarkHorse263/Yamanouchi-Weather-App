export * from "./public-runtime.js";
export { westernUsCatalogueSchema } from "./schema.js";
export declare const westernUsCatalogue: {
  schemaVersion: 1;
  countryCode: "US";
  generatedAt: string;
  policy: {
    allowedLifecycles: ["draft", "verified", "published"];
    publishableOperatingStatuses: ["operating"];
    classificationRequired: true;
  };
  states: import("./public-runtime.js").WesternUsState[];
  regions: import("./public-runtime.js").WesternUsRegion[];
  intakeRecords: unknown[];
  publishedCatalogueRecords: import("./public-runtime.js").WesternUsPublishedRecord[];
};