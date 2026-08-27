import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const generatedAt = "2026-08-27T00:00:00.000Z";
const readJson = (path) => readFile(`${root}${path}`, "utf8").then(JSON.parse);
const isHttpUrl = (value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const candidateDispositionFor = (record) => {
  if (record.name === "Snow King Mountain" || record.name === "Nordic Valley") return "existing";
  if (/duplicate|already-in-code/.test(record.researchClassification ?? "")) return "duplicate_renamed";
  if (/private/.test(record.researchClassification ?? "")) return "private_restricted";
  if (/uncertain|temporarily-closed|fire-pause/.test(record.researchClassification ?? "")) return "uncertain";
  if (/closed/.test(record.researchClassification ?? "")) return "closed";
  return "verified_operating";
};
const operatingStatusFor = (record, candidateDisposition) => {
  if (candidateDisposition === "closed") return "closed";
  if (record.name === "Meadowlark") return "planned";
  if (record.name === "Eagle Point Resort") return "temporarily_closed";
  if (candidateDisposition === "uncertain") return "unknown";
  return "operating";
};
const fail = (errors) => {
  if (errors.length) throw new Error(`Western-US catalogue validation failed:\n${errors.join("\n")}`);
};

export function buildCatalogue({ intakeSource, regionSource, stateSource, manifest }) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  check(intakeSource.schemaVersion === 1, "intake: unsupported schemaVersion");
  check(regionSource.schemaVersion === 1, "regions: unsupported schemaVersion");
  check(stateSource.schemaVersion === 1, "states: unsupported schemaVersion");
  check(manifest.schemaVersion === 1, "manifest: unsupported schemaVersion");

  const states = new Map();
  const supportedTimezones = new Set([
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Denver",
  ]);
  for (const state of stateSource.states ?? []) {
    check(/^[A-Z]{2}$/.test(state.stateCode ?? ""), `Invalid state code: ${state.stateCode}`);
    check(!states.has(state.stateCode), `Duplicate state: ${state.stateCode}`);
    states.set(state.stateCode, state);
  }
  const regions = new Map();
  for (const region of regionSource.regions ?? []) {
    const timezone = regionSource.timezoneByRegion?.[region.regionId];
    check(!regions.has(region.regionId), `Duplicate region: ${region.regionId}`);
    check(states.has(region.stateCode), `Unknown region state: ${region.regionId}`);
    check(Array.isArray(region.baseTowns) && region.baseTowns.length > 0, `Region has no base towns: ${region.regionId}`);
    check(supportedTimezones.has(timezone), `Missing/invalid region timezone: ${region.regionId}`);
    regions.set(region.regionId, { ...region, timezone });
  }
  for (const regionId of Object.keys(regionSource.timezoneByRegion ?? {})) {
    check(regions.has(regionId), `Timezone references unknown region: ${regionId}`);
  }
  const manifestIds = new Set(manifest.recordIds ?? []);
  check(manifestIds.size === (manifest.recordIds ?? []).length, "Duplicate publication manifest recordId");
  const ids = new Set();
  const publicNames = new Set();
  const intakeRecords = intakeSource.records ?? [];
  const publishedCatalogueRecords = [];

  for (const record of intakeRecords) {
    const label = record.recordId ?? "<missing recordId>";
    check(!ids.has(record.recordId), `Duplicate intake recordId: ${label}`);
    ids.add(record.recordId);
    check(["draft", "verified", "published"].includes(record.lifecycle), `Invalid lifecycle: ${label}`);
    check(
      ["existing", "duplicate_renamed", "verified_operating", "private_restricted", "uncertain", "closed"].includes(record.candidateDisposition),
      `Missing/invalid candidateDisposition: ${label}`,
    );
    check(
      ["operating", "temporarily_closed", "closed", "planned", "unknown"].includes(record.operatingStatus),
      `Missing/invalid operatingStatus: ${label}`,
    );
    check(
      ["ski_area", "indoor", "dry_slope", "backcountry_only", "unknown"].includes(record.classification?.facilityType),
      `Missing/invalid facility classification: ${label}`,
    );
    check(["snow", "synthetic", "mixed", "unknown"].includes(record.classification?.snowSurface), `Missing/invalid snow classification: ${label}`);
    check(["public", "private", "unknown"].includes(record.classification?.publicAccess), `Missing/invalid access classification: ${label}`);
    check(states.has(record.stateCode), `Unknown stateCode: ${label}`);
    check(["existing_page", "new_page"].includes(record.routeMode), `Invalid routeMode: ${label}`);
    check(Array.isArray(record.evidence), `Missing evidence array: ${label}`);
    for (const citation of record.evidence ?? []) {
      check(isHttpUrl(citation.sourceUrl), `Invalid evidence URL: ${label}`);
      check(/^\d{4}-\d{2}-\d{2}$/.test(citation.checkedAt ?? ""), `Invalid evidence date: ${label}`);
      check(typeof citation.quote === "string" && citation.quote.trim().length > 0, `Missing evidence quote: ${label}`);
      check(Array.isArray(citation.fields) && citation.fields.length > 0, `Missing evidence fields: ${label}`);
    }

    const evidenceFields = new Set((record.evidence ?? []).flatMap((citation) => citation.fields ?? []));
    const essentialsComplete =
      typeof record.publicId === "string" &&
      typeof record.name === "string" &&
      isHttpUrl(record.officialUrl) &&
      Number.isFinite(record.coordinates?.lat) &&
      Number.isFinite(record.coordinates?.lng) &&
      Number.isFinite(record.elevation?.baseM) &&
      Number.isFinite(record.elevation?.topM) &&
      record.elevation.topM > record.elevation.baseM &&
      regions.has(record.regionId) &&
      regions.get(record.regionId)?.stateCode === record.stateCode &&
      regions.get(record.regionId)?.baseTowns?.some((town) => town.baseTownId === record.baseTownId);
    const classificationEligible =
      record.classification?.facilityType === "ski_area" &&
      record.classification?.snowSurface !== "synthetic" &&
      record.classification?.publicAccess === "public";
    const verifiedGate =
      classificationEligible &&
      record.operatingStatus === "operating" &&
      essentialsComplete &&
      ["operatingStatus", "officialUrl", "coordinates", "elevation", "identity"].every((field) =>
        evidenceFields.has(field),
      );
    if (record.lifecycle !== "draft") check(verifiedGate, `Verified gate failed: ${label}`);
    if (record.lifecycle === "published") {
      check(record.candidateDisposition === "verified_operating", `Published record has non-operating disposition: ${label}`);
      check(record.routeMode === "new_page", `Published record must use new_page: ${label}`);
      check(manifestIds.has(record.recordId), `Published record missing from manifest: ${label}`);
      const expectedRoute = `/${record.regionId}/mountain/${record.publicId}`;
      check(record.route === expectedRoute, `Published route mismatch: ${label}`);
      for (const publicName of [record.publicId, ...(record.aliases ?? [])]) {
        check(!publicNames.has(publicName), `Published public id/alias collision: ${publicName}`);
        publicNames.add(publicName);
      }
      publishedCatalogueRecords.push({
        recordId: record.recordId,
        publicId: record.publicId,
        aliases: record.aliases ?? [],
        name: record.name,
        coordinates: record.coordinates,
        forecastElevationM: record.forecastElevationM ?? record.elevation.baseM,
        baseElevationM: record.elevation.baseM,
        topElevationM: record.elevation.topM,
        officialUrl: record.officialUrl,
        stateCode: record.stateCode,
        regionId: record.regionId,
        timezone: regions.get(record.regionId)?.timezone,
        baseTownId: record.baseTownId,
        route: record.route,
        country: "United States",
        countryCode: "US",
        lifecycle: "published",
        operatingStatus: "operating",
      });
    } else {
      check(!manifestIds.has(record.recordId), `Manifest record is not lifecycle published: ${label}`);
      if (["private_restricted", "uncertain", "closed"].includes(record.candidateDisposition)) {
        check(record.lifecycle !== "published", `Unpublishable disposition leaked: ${label}`);
      }
    }
  }
  for (const recordId of manifestIds) check(ids.has(recordId), `Manifest references unknown record: ${recordId}`);
  fail(errors);
  const publishedRegionIds = new Set(publishedCatalogueRecords.map((record) => record.regionId));
  return {
    schemaVersion: 1,
    countryCode: "US",
    generatedAt,
    policy: {
      allowedLifecycles: ["draft", "verified", "published"],
      publishableOperatingStatuses: ["operating"],
      classificationRequired: true,
    },
    states: [...states.values()],
    regions: [...regions.values()].filter((region) => publishedRegionIds.has(region.regionId)),
    intakeRecords,
    publishedCatalogueRecords,
  };
}

async function main() {
  await mkdir(`${root}generated`, { recursive: true });
  const [rawIntakeSource, regionSource, stateSource, manifest] = await Promise.all([
    readJson("data/intake.json"),
    readJson("data/regions.json"),
    readJson("data/states.json"),
    readJson("data/publication-manifest.json"),
  ]);
  const intakeSource = {
    ...rawIntakeSource,
    records: rawIntakeSource.records.map((record) => {
      const candidateDisposition = record.candidateDisposition ?? candidateDispositionFor(record);
      return {
        ...record,
        candidateDisposition,
        operatingStatus: operatingStatusFor(record, candidateDisposition),
      };
    }),
  };
  const catalogue = buildCatalogue({ intakeSource, regionSource, stateSource, manifest });
  const runtime = {
    schemaVersion: catalogue.schemaVersion,
    countryCode: catalogue.countryCode,
    generatedAt: catalogue.generatedAt,
    states: catalogue.states,
    regions: catalogue.regions,
    publishedCatalogueRecords: catalogue.publishedCatalogueRecords,
  };
  const outputs = [
    ["generated/western-us-catalogue.json", catalogue],
    ["generated/western-us-public-runtime.json", runtime],
  ];
  if (!process.argv.includes("--check")) outputs.unshift(["data/intake.json", intakeSource]);
  for (const [path, value] of outputs) {
    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    if (process.argv.includes("--check")) {
      if (await readFile(`${root}${path}`, "utf8") !== serialized) throw new Error(`Generated file is stale: ${path}`);
    } else {
      await writeFile(`${root}${path}`, serialized);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();