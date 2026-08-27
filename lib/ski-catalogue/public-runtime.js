import cataloguePublicRuntime from "./generated/public-runtime.json" with { type: "json" };

export { cataloguePublicRuntime };
export const publishedRegions = cataloguePublicRuntime.publishedRegions;
export const publishedRecords = cataloguePublicRuntime.publishedRecords;