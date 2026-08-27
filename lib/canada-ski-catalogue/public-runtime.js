import canadaPublicRuntime from "./generated/canada-public-runtime.json" with { type: "json" };

export { canadaPublicRuntime };
export const publishedCatalogueRecords = canadaPublicRuntime.publishedCatalogueRecords;
export const travelRegions = canadaPublicRuntime.travelRegions;