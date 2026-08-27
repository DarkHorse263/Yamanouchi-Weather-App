import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { westernUsCatalogue as catalogue } from "../index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const runtime = JSON.parse(await readFile(`${root}generated/western-us-public-runtime.json`, "utf8"));
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

check(
  JSON.stringify(runtime) === JSON.stringify({
    schemaVersion: catalogue.schemaVersion,
    countryCode: catalogue.countryCode,
    generatedAt: catalogue.generatedAt,
    states: catalogue.states,
    regions: catalogue.regions,
    publishedCatalogueRecords: catalogue.publishedCatalogueRecords,
  }),
  "Public runtime is not the exact public projection",
);
const serialized = JSON.stringify(runtime);
for (const forbidden of ["evidence", "intakeRecords", "quote", "checkedAt", "publication-manifest"]) {
  check(!serialized.includes(forbidden), `Public runtime leaks internal field: ${forbidden}`);
}
for (const record of runtime.publishedCatalogueRecords) {
  check(record.lifecycle === "published", `Runtime record is not published: ${record.recordId}`);
  check(record.operatingStatus === "operating", `Runtime record is not operating: ${record.recordId}`);
}
if (errors.length) throw new Error(`Western-US public runtime validation failed:\n${errors.join("\n")}`);
process.stdout.write(`Western-US catalogue valid: ${runtime.publishedCatalogueRecords.length} published records.\n`);