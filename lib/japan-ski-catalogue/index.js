import japanCatalogue from "./generated/japan-catalogue.json" with { type: "json" };

export { japanCatalogue };
export const publishedCatalogueRecords = japanCatalogue.publishedCatalogueRecords;
export const travelRegions = japanCatalogue.travelRegions;
export { japanCatalogueSchema } from "./schema.js";