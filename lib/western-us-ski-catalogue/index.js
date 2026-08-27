import westernUsCatalogue from "./generated/western-us-catalogue.json" with { type: "json" };

export { westernUsCatalogue };
export const publishedCatalogueRecords = westernUsCatalogue.publishedCatalogueRecords;
export const states = westernUsCatalogue.states;
export const regions = westernUsCatalogue.regions;
export { westernUsCatalogueSchema } from "./schema.js";