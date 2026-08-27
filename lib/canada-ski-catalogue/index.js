import canadaCatalogue from "./generated/canada-catalogue.json" with { type: "json" };

export { canadaCatalogue };
export const publishedCatalogueRecords = canadaCatalogue.publishedCatalogueRecords;
export const travelRegions = canadaCatalogue.travelRegions;
export { canadaCatalogueSchema } from "./schema.js";