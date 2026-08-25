import japanPublicRuntime from "./generated/japan-public-runtime.json" with { type: "json" };

export { japanPublicRuntime };
export const travelRegions = japanPublicRuntime.travelRegions;
export const publishedCatalogueRecords = japanPublicRuntime.publishedCatalogueRecords;