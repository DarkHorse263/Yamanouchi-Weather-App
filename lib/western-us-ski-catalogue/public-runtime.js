import westernUsPublicRuntime from "./generated/western-us-public-runtime.json" with { type: "json" };

export { westernUsPublicRuntime };
export const states = westernUsPublicRuntime.states;
export const regions = westernUsPublicRuntime.regions;
export const publishedCatalogueRecords = westernUsPublicRuntime.publishedCatalogueRecords;