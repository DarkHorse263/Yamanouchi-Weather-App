import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const candidates = JSON.parse(await readFile(`${root}data/candidates.json`, "utf8"));
const manifestPath = `${root}data/source-manifest.json`;
const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => '{"sourceCandidates":[]}'));
if (!Array.isArray(candidates)) throw new Error("data/candidates.json must be a JSON array.");
if (!manifest || !Array.isArray(manifest.sourceCandidates)) {
  throw new Error("data/source-manifest.json must be an object with a sourceCandidates array.");
}

const lifecycle = new Set(["draft", "verified", "published"]);
const classifications = new Set(["existing", "duplicate_or_renamed", "verified_operating", "private_restricted", "uncertain", "closed"]);
const statuses = new Set(["operating", "temporarily_closed", "closed", "unknown"]);
const access = new Set(["public", "private", "restricted", "unknown"]);
const reconciliation = new Set(["verified_operating", "uncertain", "closed", "existing"]);
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const nonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const url = (value) => nonEmpty(value) && /^https?:\/\//.test(value);
const slug = (value) => nonEmpty(value) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const toSlug = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seen = new Set(), sourceCandidates = new Set(), routes = new Set();
check(Number.isInteger(manifest.expectedCandidateCount) && manifest.expectedCandidateCount >= 0, "Source manifest needs expectedCandidateCount.");
check(Number.isInteger(manifest.expectedPublishedCount) && manifest.expectedPublishedCount >= 0, "Source manifest needs expectedPublishedCount.");
check(candidates.length === manifest.expectedCandidateCount, `Candidate count drift: expected ${manifest.expectedCandidateCount}, got ${candidates.length}.`);

for (const record of candidates) {
  check(record && typeof record === "object", "Every candidate must be an object.");
  if (!record || typeof record !== "object") continue;
  check(nonEmpty(record.id), "Candidate has no id.");
  check(!seen.has(record.id), `Duplicate candidate id: ${record.id}`);
  seen.add(record.id);
  check(lifecycle.has(record.lifecycle), `Invalid lifecycle: ${record.id}`);
  check(classifications.has(record.classification), `Invalid classification: ${record.id}`);
  check(record.reconciliationStatus === undefined || reconciliation.has(record.reconciliationStatus), `Invalid reconciliationStatus: ${record.id}`);
  check(statuses.has(record.operatingStatus), `Invalid operatingStatus: ${record.id}`);
  check(access.has(record.publicAccess), `Invalid publicAccess: ${record.id}`);
  const sourceKey = `${record.source?.pdfId}::${record.source?.candidateId}`;
  check(nonEmpty(record.source?.pdfId) && nonEmpty(record.source?.candidateId), `Missing source PDF candidate identity: ${record.id}`);
  check(!sourceCandidates.has(sourceKey), `Source PDF candidate/exclusion represented more than once: ${sourceKey}`);
  sourceCandidates.add(sourceKey);
  const operatingVerified = record.reconciliationStatus ?? record.classification;
  const qualifies = record.lifecycle === "published" && operatingVerified === "verified_operating" &&
    record.classification !== "uncertain" && record.classification !== "closed" && record.classification !== "private_restricted" &&
    record.operatingStatus === "operating" && record.publicAccess === "public";
  if (record.lifecycle === "published" && !qualifies) check(false, `Ineligible candidate is published: ${record.id}`);
  if (qualifies) {
    check(slug(record.provinceId), `Published candidate needs ASCII provinceId: ${record.id}`);
    check(slug(record.publicId), `Published candidate needs ASCII publicId: ${record.id}`);
    check(nonEmpty(record.officialIdentity), `Published candidate needs officialIdentity: ${record.id}`);
    check(url(record.officialUrl), `Published candidate needs officialUrl: ${record.id}`);
    check(nonEmpty(record.locality) && nonEmpty(record.province), `Published candidate needs locality and province: ${record.id}`);
    check(Number.isFinite(record.coordinates?.lat) && Number.isFinite(record.coordinates?.lng), `Published candidate needs coordinates: ${record.id}`);
    check(Number.isFinite(record.elevations?.baseM) && Number.isFinite(record.elevations?.topM) && Number.isFinite(record.elevations?.forecastM), `Published candidate needs base/top/forecast elevations: ${record.id}`);
    for (const field of ["officialIdentityUrl", "officialUrl", "coordinatesUrl", "baseElevationUrl", "topElevationUrl", "forecastElevationUrl", "localityUrl", "provinceUrl"]) check(url(record.evidence?.[field]), `Published candidate lacks ${field}: ${record.id}`);
    const route = `/canada/${record.provinceId}/mountain/${record.publicId}`;
    check(!routes.has(route), `Duplicate public route: ${route}`); routes.add(route);
  }
}
const manifestKeys = new Set();
for (const item of manifest.sourceCandidates) {
  const key = `${item?.pdfId}::${item?.candidateId}`;
  check(nonEmpty(item?.pdfId) && nonEmpty(item?.candidateId), "Source manifest item needs pdfId and candidateId.");
  check(!manifestKeys.has(key), `Duplicate source manifest candidate: ${key}`);
  manifestKeys.add(key);
}
for (const key of manifestKeys) check(sourceCandidates.has(key), `Expected source PDF candidate/exclusion is missing: ${key}`);
for (const key of sourceCandidates) check(manifestKeys.has(key), `Candidate is not listed in source manifest: ${key}`);
if (errors.length) throw new Error(`Canadian catalogue input invalid:\n${errors.map((x) => `- ${x}`).join("\n")}`);

const published = candidates.filter((r) => r.lifecycle === "published").map((r) => ({
  recordId: r.id, publicId: r.publicId, aliases: [...new Set((r.aliases ?? []).map(toSlug).filter(Boolean))], name: r.officialIdentity, officialUrl: r.officialUrl,
  coordinates: r.coordinates, baseElevationM: r.elevations.baseM, topElevationM: r.elevations.topM,
  forecastElevationM: r.elevations.forecastM, locality: r.locality, province: r.province,
  travelRegionId: `canada-${r.provinceId}`, route: `/canada-${r.provinceId}/mountain/${r.publicId}`,
  country: "Canada", countryCode: "CA"
}));
check(published.length === manifest.expectedPublishedCount, `Published count drift: expected ${manifest.expectedPublishedCount}, got ${published.length}.`);
const publicIds = new Set();
for (const record of published) {
  for (const id of [record.publicId, ...record.aliases]) {
    check(slug(id), `Published route alias is not URL-safe: ${record.recordId} (${id})`);
    check(!publicIds.has(id), `Published id or alias collision: ${id}`);
    publicIds.add(id);
  }
}
const travelRegions = [...new Map(candidates.filter((r) => slug(r.provinceId) && nonEmpty(r.province)).map((r) => [
  r.provinceId, { travelRegionId: `canada-${r.provinceId}`, name: r.province, province: r.province, recordIds: [] }
])).values()];
for (const region of travelRegions) region.recordIds = candidates.filter((r) => `canada-${r.provinceId}` === region.travelRegionId).map((r) => r.id);
const generatedAt = "1970-01-01T00:00:00.000Z";
const catalogue = { schemaVersion: 1, countryCode: "CA", generatedAt, policy: { launchPolicyId: "published_verified_public_complete_only", description: "Only published, verified-operating, operating public candidates with complete per-field evidence are emitted." }, travelRegions, candidates, publishedCatalogueRecords: published };
const publishedRegionIds = new Set(published.map((record) => record.travelRegionId));
const runtime = { schemaVersion: 1, countryCode: "CA", generatedAt, travelRegions: travelRegions.filter((region) => publishedRegionIds.has(region.travelRegionId)).map(({ recordIds, ...region }) => region), publishedCatalogueRecords: published };
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;
const outputs = [[`${root}generated/canada-catalogue.json`, serialize(catalogue)], [`${root}generated/canada-public-runtime.json`, serialize(runtime)]];
if (process.argv.includes("--check")) {
  for (const [path, expected] of outputs) check(await readFile(path, "utf8").catch(() => "") === expected, `Generated file is stale: ${path}`);
  if (errors.length) throw new Error(errors.join("\n"));
} else {
  await mkdir(`${root}generated`, { recursive: true });
  await Promise.all(outputs.map(([path, content]) => writeFile(path, content)));
}