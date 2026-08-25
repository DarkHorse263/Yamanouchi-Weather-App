import { readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { japanCatalogue as catalogue } from "../index.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const errors = [];
const publicRuntimePath = `${packageRoot}generated/japan-public-runtime.json`;
const [publicRuntime, catalogueFileSize, publicRuntimeFileSize] = await Promise.all([
  readFile(publicRuntimePath, "utf8").then(JSON.parse),
  stat(`${packageRoot}generated/japan-catalogue.json`).then((file) => file.size),
  stat(publicRuntimePath).then((file) => file.size),
]);

function check(condition, message) {
  if (!condition) errors.push(message);
}

function walkPublicRuntime(value, path = "$") {
  const forbiddenKeys = new Set([
    "intakeRecords",
    "review",
    "reviews",
    "evidence",
    "raw",
    "source",
    "sources",
    "notes",
    "statusEvidenceQuote",
    "statusEvidenceUrl",
    "publicationCandidates",
    "directoryRelationship",
    "readiness",
    "publicationReadiness",
    "recordIds",
  ]);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPublicRuntime(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      check(!forbiddenKeys.has(key), `Public runtime contains forbidden key: ${path}.${key}`);
      walkPublicRuntime(item, `${path}.${key}`);
    }
  }
}

const expectedPublicRuntime = {
  schemaVersion: catalogue.schemaVersion,
  countryCode: catalogue.countryCode,
  generatedAt: catalogue.generatedAt,
  travelRegions: catalogue.travelRegions.map(({ travelRegionId, name, nameJa, prefectures, baseTowns }) => ({
    travelRegionId,
    name,
    nameJa,
    prefectures,
    baseTowns,
  })),
  publishedCatalogueRecords: catalogue.publishedCatalogueRecords,
};
check(
  JSON.stringify(publicRuntime) === JSON.stringify(expectedPublicRuntime),
  "Public runtime projection does not exactly match the canonical published projection",
);
walkPublicRuntime(publicRuntime);
const publicRuntimeSerialized = JSON.stringify(publicRuntime);
for (const forbiddenText of [
  "Japan_Ski_Resorts_558",
  "verified-evidence-supplement",
  "data/reviews",
  "statusEvidence",
  "national_intake_workbook",
]) {
  check(!publicRuntimeSerialized.includes(forbiddenText), `Public runtime contains forbidden internal string: ${forbiddenText}`);
}

function extractBalancedArray(source, propertyName) {
  const marker = source.indexOf(`${propertyName}:`);
  if (marker < 0) throw new Error(`Missing ${propertyName} property`);
  const start = source.indexOf("[", marker);
  if (start < 0) throw new Error(`Missing ${propertyName} array`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
    } else if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Unclosed ${propertyName} array`);
}

async function readFrontendMountainIds() {
  const ids = [];
  for (const region of catalogue.frontendRegionSources) {
    const source = await readFile(`${workspaceRoot}${region.sourcePath}`, "utf8");
    const mountains = extractBalancedArray(source, "mountains");
    for (const match of mountains.matchAll(/\bid\s*:\s*["']([^"']+)["']/g)) {
      ids.push(match[1]);
    }
  }
  return ids;
}

const intakeIds = new Set();
const intakeStatusCounts = {
  operating: 0,
  temporarily_closed: 0,
  indoor: 0,
  dry_slope: 0,
  closed: 0,
  unknown: 0,
};
for (const record of catalogue.intakeRecords) {
  check(!intakeIds.has(record.recordId), `Duplicate intake recordId: ${record.recordId}`);
  intakeIds.add(record.recordId);
  check(record.operatingStatus in intakeStatusCounts, `Invalid operating status: ${record.recordId}`);
  if (record.operatingStatus in intakeStatusCounts) intakeStatusCounts[record.operatingStatus] += 1;
  check(record.source.rowIdentity.length > 0, `Missing source row identity: ${record.recordId}`);
  check(record.source.rawName === record.raw.name, `Raw name changed: ${record.recordId}`);
  check(
    record.lifecycle === "draft" || record.lifecycle === "verified" || record.lifecycle === "published",
    `Invalid intake lifecycle: ${record.recordId}`,
  );
  const expectedComplete = Object.values(record.readiness.essentials).every(Boolean);
  check(
    record.readiness.evidenceComplete === expectedComplete,
    `Readiness completeness is inconsistent: ${record.recordId}`,
  );
  if (record.directoryRelationship.state === "candidate_match") {
    check(
      record.readiness.basis === "unique_exact_normalized_name",
      `Exact match has incorrect readiness basis: ${record.recordId}`,
    );
  } else {
    check(
      record.readiness.basis === "unresolved" || record.readiness.basis === "supplement_only",
      `Unresolved match has incorrect readiness basis: ${record.recordId}`,
    );
  }
  if (record.operatingStatus === "operating") {
    check(Boolean(record.review), `Missing normalized review: ${record.recordId}`);
  }
  check(
    typeof record.publicationReadiness?.publishable === "boolean" &&
      Array.isArray(record.publicationReadiness?.missingReasons),
    `Missing publication readiness: ${record.recordId}`,
  );
  if (record.publicationReadiness?.publishable) {
    check(
      record.lifecycle === "verified" || record.lifecycle === "published",
      `Publishable intake is not verified/published: ${record.recordId}`,
    );
    check(record.reviewedOperatingStatus === "operating", `Non-operating intake is publishable: ${record.recordId}`);
    check(record.publicationReadiness.missingReasons.length === 0, `Publishable intake has missing reasons: ${record.recordId}`);
    check(record.routeMode === "new_page", `Publishable intake is not a new page: ${record.recordId}`);
    check(Boolean(record.travelRegionId && record.baseTownId && record.publicId), `Publishable intake lacks route IDs: ${record.recordId}`);
  }
  if (record.routeMode === "existing_page") {
    check(record.publicationReadiness.routeAlreadyPublished === true, `Existing-page mapping is not explicit: ${record.recordId}`);
    check(record.publicationReadiness.publishable === false, `Existing page is also a new-page candidate: ${record.recordId}`);
  }
  if (record.review?.reviewStatus === "unclear") {
    check(record.lifecycle === "draft", `Unclear review must remain draft: ${record.recordId}`);
    check(
      record.publicationReadiness.missingReasons.includes("unresolved_status"),
      `Unclear review lacks unresolved_status: ${record.recordId}`,
    );
  }
}
check(catalogue.intakeRecords.length === 563, `Expected 563 national intake rows; found ${catalogue.intakeRecords.length}`);
check(intakeStatusCounts.operating === 522, `Expected 522 open intake rows; found ${intakeStatusCounts.operating}`);
check(
  intakeStatusCounts.temporarily_closed === 26,
  `Expected 26 temporarily closed intake rows; found ${intakeStatusCounts.temporarily_closed}`,
);
check(intakeStatusCounts.indoor === 11, `Expected 11 indoor intake rows; found ${intakeStatusCounts.indoor}`);
check(intakeStatusCounts.dry_slope === 4, `Expected 4 dry-slope intake rows; found ${intakeStatusCounts.dry_slope}`);

const publicNames = new Map();
const publicRoutes = new Set();
for (const page of catalogue.publishedPages) {
  for (const publicName of [page.publicId, ...page.aliases]) {
    check(
      !publicNames.has(publicName),
      `Public ID/alias collision: ${publicName} (${publicNames.get(publicName)} and ${page.pageRecordId})`,
    );
    publicNames.set(publicName, page.pageRecordId);
  }
  check(!publicRoutes.has(page.route), `Duplicate public route: ${page.route}`);
  publicRoutes.add(page.route);
  check(page.lifecycle === "published", `Invalid page lifecycle: ${page.pageRecordId}`);
  check(page.operatingStatus === "operating", `Non-operating page published: ${page.pageRecordId}`);
  check(
    Number.isFinite(page.coordinates.lat) &&
      page.coordinates.lat >= 24 &&
      page.coordinates.lat <= 46 &&
      Number.isFinite(page.coordinates.lng) &&
      page.coordinates.lng >= 122 &&
      page.coordinates.lng <= 154,
    `Published coordinates outside Japan bounds: ${page.pageRecordId}`,
  );
  check(
    Number.isFinite(page.elevationM) && page.elevationM >= 0 && page.elevationM <= 4000,
    `Invalid published elevation: ${page.pageRecordId}`,
  );
  check(page.evidence.length > 0, `Missing published source evidence: ${page.pageRecordId}`);
  check(
    page.evidence.some((item) => item.sourceRef || item.officialUrls?.length),
    `Missing official/source reference: ${page.pageRecordId}`,
  );
  check(/^\d{4}-\d{2}-\d{2}$/.test(page.verificationDate), `Missing verification date: ${page.pageRecordId}`);
  check(Boolean(page.travelRegionId), `Missing travelRegionId: ${page.pageRecordId}`);
  check(Boolean(page.baseTownId), `Missing baseTownId: ${page.pageRecordId}`);
  if (page.intakeRelationship.state === "candidate_match") {
    const intake = catalogue.intakeRecords.find(
      (record) => record.recordId === page.intakeRelationship.intakeRecordId,
    );
    check(Boolean(intake), `Published candidate relationship target is missing: ${page.pageRecordId}`);
    check(
      intake?.operatingStatus === "operating",
      `Published page relates to a non-operating intake row: ${page.pageRecordId}`,
    );
  }
}
const frontendIds = await readFrontendMountainIds();
check(frontendIds.length === 82, `Expected 82 current frontend Japan mountain IDs; found ${frontendIds.length}`);
check(new Set(frontendIds).size === frontendIds.length, "Current frontend Japan mountain IDs are not unique");
for (const id of frontendIds) {
  check(publicNames.has(id), `Current frontend Japan mountain ID not represented: ${id}`);
}
for (const page of catalogue.publishedPages) {
  check(frontendIds.includes(page.publicId), `Catalogue publishes a non-current page: ${page.publicId}`);
}

const unresolvedOperating = catalogue.intakeRecords.filter(
  (record) =>
    record.operatingStatus === "operating" &&
    (record.review?.reviewStatus === "unclear" || record.lifecycle === "draft"),
);
const openWithoutPublishedPage = catalogue.intakeRecords.filter(
  (record) =>
    record.operatingStatus === "operating" &&
    !catalogue.publishedPages.some(
      (page) =>
        page.intakeRelationship.state === "candidate_match" &&
        page.intakeRelationship.intakeRecordId === record.recordId,
    ),
);
const openExactMatched = catalogue.intakeRecords.filter(
  (record) =>
    record.operatingStatus === "operating" && record.directoryRelationship.state === "candidate_match",
);
const evidenceCompleteOpen = openExactMatched.filter((record) => record.readiness.evidenceComplete);
const currentVerified = catalogue.intakeRecords.filter(
  (record) => record.review?.reviewStatus === "verified_operating",
);
const mappedExisting = currentVerified.filter((record) => record.routeMode === "existing_page");
const newIdentities = currentVerified.filter((record) => record.routeMode === "new_page");
const publishedPagesById = new Map(catalogue.publishedPages.map((page) => [page.pageRecordId, page]));
for (const record of mappedExisting) {
  const page = publishedPagesById.get(record.existingPageId);
  check(Boolean(page), `Existing-page target is missing: ${record.recordId}`);
  check(page?.publicId === record.publicId, `Existing-page public ID mismatch: ${record.recordId}`);
  check(
    page?.route === `/${page?.travelRegionId}/mountain/${record.publicId}`,
    `Existing-page route mismatch: ${record.recordId}`,
  );
  if (record.lifecycle === "published") {
    check(record.readiness.evidenceComplete, `Published intake lacks essentials: ${record.recordId}`);
    check(record.reviewedOperatingStatus === "operating", `Published intake is not operating: ${record.recordId}`);
  }
}
const evidenceCompleteVerifiedOperating = catalogue.intakeRecords.filter(
  (record) =>
    record.review?.reviewStatus === "verified_operating" &&
    record.readiness.evidenceComplete,
);
const publicationReady = catalogue.intakeRecords.filter((record) => record.publicationReadiness.publishable);
const unresolvedEssentialGaps = currentVerified.filter((record) => !record.readiness.evidenceComplete);
const reviewStatusCounts = Object.fromEntries(
  ["verified_operating", "temporarily_closed", "closed", "merged_into", "unclear"].map((status) => [
    status,
    catalogue.intakeRecords.filter((record) => record.review?.reviewStatus === status).length,
  ]),
);
const reviewedClosures = (reviewStatusCounts.closed ?? 0) + (reviewStatusCounts.temporarily_closed ?? 0);
check(currentVerified.length === 288, `Expected 288 current verified records; found ${currentVerified.length}`);
check(mappedExisting.length === 56, `Expected 56 existing-page mappings; found ${mappedExisting.length}`);
check(newIdentities.length === 232, `Expected 232 new-page identities; found ${newIdentities.length}`);
check(catalogue.travelRegions.length === 36, `Expected 36 travel regions; found ${catalogue.travelRegions.length}`);
check(
  catalogue.publicationCandidates.length === publicationReady.length,
  "Publication candidate projection is inconsistent with publication readiness",
);
for (const candidate of catalogue.publicationCandidates) {
  const intake = catalogue.intakeRecords.find((record) => record.recordId === candidate.recordId);
  check(Boolean(intake?.publicationReadiness.publishable), `Invalid publication candidate: ${candidate.recordId}`);
  check(
    Boolean(
      candidate.name &&
        candidate.nameJa &&
        candidate.officialUrl &&
        candidate.travelRegionId &&
        candidate.baseTownId &&
        Number.isFinite(candidate.coordinates?.lat) &&
        Number.isFinite(candidate.coordinates?.lng) &&
        Number.isFinite(candidate.elevation?.baseM) &&
        Number.isFinite(candidate.elevation?.topM),
    ),
    `Incomplete publication candidate: ${candidate.recordId}`,
  );
}
const publicationCandidateIds = new Set(catalogue.publicationCandidates.map((candidate) => candidate.recordId));
const publishedCatalogueIds = new Set();
for (const record of catalogue.publishedCatalogueRecords) {
  check(!publishedCatalogueIds.has(record.recordId), `Duplicate published catalogue record: ${record.recordId}`);
  publishedCatalogueIds.add(record.recordId);
  const intake = catalogue.intakeRecords.find((candidate) => candidate.recordId === record.recordId);
  check(publicationCandidateIds.has(record.recordId), `Published record is not a current candidate: ${record.recordId}`);
  check(intake?.lifecycle === "published", `Manifest-approved intake is not published: ${record.recordId}`);
  check(intake?.routeMode === "new_page", `Published catalogue record is not new_page: ${record.recordId}`);
  check(
    record.honesty?.operatingStatusVerified === true &&
      record.honesty?.evidenceComplete === true &&
      record.honesty?.manifestApproved === true &&
      record.honesty?.runtimeIntegrated === true,
    `Invalid honesty flags: ${record.recordId}`,
  );
  check(
    !("review" in record) &&
      !("statusEvidenceQuote" in record) &&
      !("notes" in record) &&
      !("evidence" in record),
    `Browser projection leaks internal review evidence: ${record.recordId}`,
  );
}
check(
  publishedCatalogueIds.size === publicationCandidateIds.size &&
    [...publicationCandidateIds].every((recordId) => publishedCatalogueIds.has(recordId)),
  "Publication manifest must currently cover every route-ready new-page candidate",
);
check(
  catalogue.policy.cleanGate.unresolvedOperatingCandidates === unresolvedOperating.length,
  "cleanGate unresolved operating count is stale",
);
check(
  catalogue.policy.cleanGate.evidenceCompleteCandidates === evidenceCompleteOpen.length,
  "cleanGate evidence-complete count is stale",
);
if (unresolvedOperating.length > 0) {
  check(
    catalogue.policy.marketingApproved === false,
    "marketingApproved must remain false while national operating candidates are unresolved",
  );
}
if (unresolvedOperating.length > 0 || openWithoutPublishedPage.length > 0) {
  check(
    catalogue.policy.marketingApproved === false,
    "marketingApproved must remain false while an open candidate is unclear or lacks a published page",
  );
}
if (catalogue.policy.marketingApproved) {
  check(unresolvedOperating.length === 0, "Marketing cannot be approved with unresolved operating candidates");
  check(
    catalogue.policy.cleanGate.unresolvedOperatingCandidates === 0,
    "Marketing cannot be approved before the clean gate reaches zero unresolved candidates",
  );
  check(
    catalogue.policy.cleanGate.requiredReviews.length === 0,
    "Marketing cannot be approved while clean-gate reviews remain",
  );
}

const prefectures = new Map();
for (const record of catalogue.intakeRecords) {
  const totals = prefectures.get(record.raw.prefecture) ?? {
    open: 0,
    published: 0,
    verified: 0,
    unresolved: 0,
    closures: 0,
  };
  if (record.operatingStatus === "operating") totals.open += 1;
  if (record.lifecycle === "verified") totals.verified += 1;
  if (
    record.operatingStatus === "operating" &&
    (record.review?.reviewStatus === "unclear" || record.lifecycle === "draft")
  )
    totals.unresolved += 1;
  if (["temporarily_closed", "closed", "merged_into"].includes(record.review?.reviewStatus)) totals.closures += 1;
  prefectures.set(record.raw.prefecture, totals);
}
for (const page of catalogue.publishedPages) {
  const totals = prefectures.get(page.prefecture) ?? {
    open: 0,
    published: 0,
    verified: 0,
    unresolved: 0,
    closures: 0,
  };
  totals.published += 1;
  prefectures.set(page.prefecture, totals);
}

function reportMarkdown() {
  const statuses = {};
  for (const record of catalogue.intakeRecords) {
    (statuses[record.operatingStatus] ??= []).push(record);
  }
  const evidenceCount = catalogue.intakeRecords.filter((record) => record.evidence.length > 1).length;
  const readinessEssentialCounts = Object.fromEntries(
    Object.keys(openExactMatched[0]?.readiness.essentials ?? {}).map((essential) => [
      essential,
      openExactMatched.filter((record) => record.readiness.essentials[essential]).length,
    ]),
  );
  const missingReasonCounts = {};
  const evidenceSnapshot = catalogue.sources.find(
    (source) => source.sourceId === "ski-directory-wikidata-osm-merge",
  )?.summary;
  for (const record of openExactMatched) {
    for (const reason of record.readiness.missingReasons) {
      missingReasonCounts[reason] = (missingReasonCounts[reason] ?? 0) + 1;
    }
  }
  const lines = [
    "# Japan ski-area catalogue validation",
    "",
    `Generated from catalogue snapshot: ${catalogue.generatedAt}`,
    "",
    "## Launch gate",
    "",
    `- **marketingApproved: ${catalogue.policy.marketingApproved}**`,
    `- ${catalogue.policy.marketingGateReason}`,
    `- Unresolved operating intake candidates: ${unresolvedOperating.length}`,
    "",
    "## National totals",
    "",
    `- Intake rows: ${catalogue.intakeRecords.length}`,
    `- Open intake rows: ${statuses.operating?.length ?? 0}`,
    `- Temporarily closed: ${statuses.temporarily_closed?.length ?? 0}`,
    `- Indoor: ${statuses.indoor?.length ?? 0}`,
    `- Dry slope: ${statuses.dry_slope?.length ?? 0}`,
    `- Review status — verified operating: ${reviewStatusCounts.verified_operating ?? 0}`,
    `- Review status — temporarily closed: ${reviewStatusCounts.temporarily_closed ?? 0}`,
    `- Review status — closed: ${reviewStatusCounts.closed ?? 0}`,
    `- Review status — merged into successor: ${reviewStatusCounts.merged_into ?? 0}`,
    `- Review status — unclear: ${reviewStatusCounts.unclear ?? 0}`,
    `- Current verified-operating records: ${currentVerified.length}`,
    `- Mapped to existing pages: ${mappedExisting.length}`,
    `- Existing-page mappings passing publication lifecycle gate: ${mappedExisting.filter((record) => record.lifecycle === "published").length}`,
    `- New-page identities: ${newIdentities.length}`,
    `- Evidence-complete verified-operating records: ${evidenceCompleteVerifiedOperating.length}`,
    `- Route-ready new-page candidates: ${publicationReady.length}`,
    `- Manifest-approved published catalogue records: ${catalogue.publishedCatalogueRecords.length}`,
    `- Unapproved route-ready new-page candidates: ${publicationReady.length - catalogue.publishedCatalogueRecords.length}`,
    `- Verified records with unresolved essential gaps: ${unresolvedEssentialGaps.length}`,
    `- Unresolved status records: ${reviewStatusCounts.unclear ?? 0}`,
    `- Reviewed closures (including temporary): ${reviewedClosures}`,
    `- Existing published pages: ${catalogue.publishedPages.length}`,
    `- Full catalogue JSON bytes: ${catalogueFileSize}`,
    `- Public runtime JSON bytes: ${publicRuntimeFileSize}`,
    `- Intake rows with conservative directory evidence: ${evidenceCount}`,
    `- Evidence snapshot directory rows: ${evidenceSnapshot?.directoryRows ?? 0}`,
    `- Detail-derived official links: ${evidenceSnapshot?.detailDerivedOfficialLinks ?? 0}`,
    `- Directory rows with merged official coverage: ${evidenceSnapshot?.mergedOfficialCoverage ?? 0}`,
    `- Evidence-complete directory rows: ${evidenceSnapshot?.evidenceCompleteRows ?? 0}`,
    "",
    "Published pages, intake rows, and new-page publication candidates remain separate projections.",
    "Existing-page reuse is explicit and new-page candidates do not publish runtime routes.",
    "",
    "## Open exact-match readiness",
    "",
    `- Open rows with a unique exact directory match: ${openExactMatched.length}`,
    `- Coordinates present: ${readinessEssentialCounts.coordinates ?? 0}`,
    `- Defensible base/top elevation present: ${readinessEssentialCounts.defensibleElevation ?? 0}`,
    `- Japanese name present: ${readinessEssentialCounts.japaneseName ?? 0}`,
    `- Official URL present: ${readinessEssentialCounts.officialUrl ?? 0}`,
    `- Evidence-complete: ${evidenceCompleteOpen.length}`,
    `- Evidence-complete but still requiring operating-status and travel-cluster review: ${evidenceCompleteOpen.length}`,
    "",
    "### Missing essentials",
    "",
    "| Missing reason | Open exact-match rows |",
    "| --- | ---: |",
    ...Object.entries(missingReasonCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([reason, count]) => `| ${reason} | ${count} |`),
    "",
    "## Prefecture totals",
    "",
    "| Prefecture | Open intake | Published pages | Verified intake | Unresolved open | Closures/mergers |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...[...prefectures.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([prefecture, totals]) =>
          `| ${prefecture} | ${totals.open} | ${totals.published} | ${totals.verified} | ${totals.unresolved} | ${totals.closures} |`,
      ),
    "",
    "## Validation",
    "",
    errors.length === 0
      ? "- PASS: all catalogue invariants passed."
      : `- FAIL: ${errors.length} invariant(s) failed.`,
    "",
  ];
  return `${lines.join("\n")}\n`;
}

if (process.argv.includes("--write-report")) {
  await writeFile(`${packageRoot}reports/japan-catalogue-report.md`, reportMarkdown(), "utf8");
}

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`ERROR ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Japan catalogue valid: ${catalogue.intakeRecords.length} intake rows, ` +
      `${catalogue.publishedPages.length} existing published pages, ` +
      `${unresolvedOperating.length} unresolved operating candidates; marketingApproved=false.\n`,
  );
}