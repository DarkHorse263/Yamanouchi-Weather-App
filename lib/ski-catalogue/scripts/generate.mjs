import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { publicProjection, validateCatalogue } from "../lifecycle.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const batchRoot = `${root}data/batches`;
const files = (await readdir(batchRoot)).filter((file) => file.endsWith(".json")).sort();
const [batches, ledger] = await Promise.all([Promise.all(files.map(async (file) => {
  const batch = JSON.parse(await readFile(`${batchRoot}/${file}`, "utf8"));
  if (batch.batchVersion !== 1 || typeof batch.batchId !== "string" || !Array.isArray(batch.records)) {
    throw new Error(`${file}: invalid batch envelope`);
  }
  return batch;
})), readFile(`${root}data/candidate-universe.json`, "utf8").then(JSON.parse)]);
const records = batches.flatMap((batch) => batch.records);
const errors = validateCatalogue(records);
const recordsById = new Map(records.map((record) => [record.recordId, record]));
const candidateIds = new Set();
const ledgerRecordIds = new Set();
for (const candidate of ledger.candidates ?? []) {
  if (candidateIds.has(candidate.candidateId)) errors.push(`duplicate ledger candidate: ${candidate.candidateId}`);
  candidateIds.add(candidate.candidateId);
  if (!Array.isArray(candidate.recordIds) || candidate.recordIds.length === 0) {
    errors.push(`ledger candidate has no record mapping: ${candidate.candidateId}`);
    continue;
  }
  if (!["one_to_one", "split"].includes(candidate.handling)) {
    errors.push(`ledger candidate has invalid handling: ${candidate.candidateId}`);
  }
  if (candidate.handling === "one_to_one" && candidate.recordIds.length !== 1) {
    errors.push(`one-to-one candidate has multiple records: ${candidate.candidateId}`);
  }
  for (const recordId of candidate.recordIds) {
    if (ledgerRecordIds.has(recordId)) errors.push(`record maps from multiple candidates: ${recordId}`);
    ledgerRecordIds.add(recordId);
    const record = recordsById.get(recordId);
    if (!record) continue;
    for (const field of ["classification", "lifecycle"]) {
      if (candidate[field] !== record[field]) {
        errors.push(`ledger candidate ${candidate.candidateId} ${field} does not match mapped record ${recordId}`);
      }
    }
  }
}
if (ledger.expectedCounts?.candidates !== candidateIds.size) errors.push("candidate ledger expected candidate count is stale");
if (ledger.expectedCounts?.records !== records.length) errors.push("candidate ledger expected record count is stale");
const splitCount = [...(ledger.candidates ?? [])].filter((candidate) => candidate.handling === "split").length;
const oneToOneCount = candidateIds.size - splitCount;
if (ledger.expectedCounts?.splits !== splitCount) errors.push("candidate ledger expected split count is stale");
if (ledger.expectedCounts?.oneToOne !== oneToOneCount) errors.push("candidate ledger expected one-to-one count is stale");
for (const key of ["byLifecycle", "byClassification"]) {
  const actual = Object.fromEntries(
    [...new Set(records.map((record) => record[key === "byLifecycle" ? "lifecycle" : "classification"]))].sort()
      .map((value) => [value, records.filter((record) => record[key === "byLifecycle" ? "lifecycle" : "classification"] === value).length]),
  );
  if (JSON.stringify(ledger.expectedCounts?.[key] ?? {}) !== JSON.stringify(actual)) {
    errors.push(`candidate ledger expected ${key} counts are stale`);
  }
}
for (const record of records) {
  if (!ledgerRecordIds.has(record.recordId)) errors.push(`record omitted from candidate ledger: ${record.recordId}`);
}
for (const recordId of ledgerRecordIds) {
  if (!recordsById.has(recordId)) errors.push(`ledger maps to missing record: ${recordId}`);
}
if (errors.length) throw new Error(`Catalogue validation failed:\n${errors.join("\n")}`);

const projectedRecords = records.map(publicProjection).filter(Boolean);
const publishedPublicIds = new Set(projectedRecords.map((record) => record.publicId));
const aliasCounts = new Map();
for (const record of projectedRecords) {
  for (const alias of record.aliases) aliasCounts.set(alias, (aliasCounts.get(alias) ?? 0) + 1);
}
// Aliases remain intact in the internal batch evidence record. Only a unique
// alias that cannot shadow a canonical route becomes part of public routing.
const publishedRecords = projectedRecords.map((record) => ({
  ...record,
  aliases: record.aliases.filter((alias) => aliasCounts.get(alias) === 1 && !publishedPublicIds.has(alias)),
}));
const regionsById = new Map();
for (const record of publishedRecords) {
  const region = regionsById.get(record.regionId) ?? {
    regionId: record.regionId,
    name: record.regionName,
    stateOrProvince: record.stateOrProvince,
    country: record.country,
    countryCode: record.countryCode,
    localities: [],
  };
  if (!region.localities.some((locality) => locality.localityId === record.localityId)) {
    region.localities.push({ localityId: record.localityId, name: record.localityName });
  }
  regionsById.set(record.regionId, region);
}
const generated = {
  schemaVersion: 1,
  batches: batches.map(({ batchId }) => batchId),
  publishedRegions: [...regionsById.values()],
  publishedRecords,
};
const serialized = `${JSON.stringify(generated, null, 2)}\n`;
const output = `${root}generated/public-runtime.json`;
if (process.argv.includes("--check")) {
  const current = await readFile(output, "utf8").catch(() => "");
  if (current !== serialized) throw new Error("Generated public runtime is stale; run catalogue generate");
} else {
  await writeFile(output, serialized, "utf8");
}