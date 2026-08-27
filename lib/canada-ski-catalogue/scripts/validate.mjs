import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { canadaCatalogue } from "../index.js";
import manifest from "../data/source-manifest.json" with { type: "json" };

const root = fileURLToPath(new URL("../", import.meta.url));
const runtime = JSON.parse(await readFile(`${root}generated/canada-public-runtime.json`, "utf8"));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
check(canadaCatalogue.candidates.length === manifest.expectedCandidateCount, `Candidate count drift: expected ${manifest.expectedCandidateCount}, got ${canadaCatalogue.candidates.length}.`);
check(canadaCatalogue.publishedCatalogueRecords.length === manifest.expectedPublishedCount, `Published count drift: expected ${manifest.expectedPublishedCount}, got ${canadaCatalogue.publishedCatalogueRecords.length}.`);
const publishedRegionIds = new Set(canadaCatalogue.publishedCatalogueRecords.map((record) => record.travelRegionId));
check(JSON.stringify(runtime) === JSON.stringify({ schemaVersion: canadaCatalogue.schemaVersion, countryCode: "CA", generatedAt: canadaCatalogue.generatedAt, travelRegions: canadaCatalogue.travelRegions.filter((region) => publishedRegionIds.has(region.travelRegionId)).map(({ recordIds, ...r }) => r), publishedCatalogueRecords: canadaCatalogue.publishedCatalogueRecords }), "Public runtime is not the lean published projection.");
for (const record of canadaCatalogue.publishedCatalogueRecords) {
  const candidate = canadaCatalogue.candidates.find((item) => item.id === record.recordId);
  check(Boolean(candidate), `Published record has no candidate: ${record.recordId}`);
  const operatingVerified = candidate?.reconciliationStatus ?? candidate?.classification;
  check(operatingVerified === "verified_operating" && candidate?.classification !== "uncertain" && candidate?.classification !== "closed" && candidate?.classification !== "private_restricted" && candidate?.operatingStatus === "operating" && candidate?.publicAccess === "public", `Excluded, uncertain, or inaccessible candidate published: ${record.recordId}`);
  check(record.route === `/canada-${candidate?.provinceId}/mountain/${candidate?.publicId}`, `Province-first route unstable: ${record.recordId}`);
}
for (const forbidden of ["candidates", "evidence", "source", "notes", "recordIds"]) check(!JSON.stringify(runtime).includes(`"${forbidden}"`), `Public runtime leaks internal ${forbidden}.`);
if (process.argv.includes("--write-report")) {
  await mkdir(`${root}reports`, { recursive: true });
  await writeFile(`${root}reports/canada-catalogue-report.md`, `# Canada ski catalogue\n\n- Candidates: ${canadaCatalogue.candidates.length}\n- Published public records: ${canadaCatalogue.publishedCatalogueRecords.length}\n- Validation: ${errors.length ? "FAIL" : "PASS"}\n`);
}
if (errors.length) { errors.forEach((e) => process.stderr.write(`ERROR ${e}\n`)); process.exitCode = 1; }
else process.stdout.write(`Canada catalogue valid: ${canadaCatalogue.candidates.length} candidates; ${canadaCatalogue.publishedCatalogueRecords.length} published.\n`);