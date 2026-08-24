import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { japanCatalogue as catalogue } from "../index.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const errors = [];

function check(condition, message) {
  if (!condition) errors.push(message);
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
  check(record.lifecycle === "draft", `Intake lifecycle must remain draft: ${record.recordId}`);
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
      record.readiness.basis === "unresolved",
      `Unresolved match has incorrect readiness basis: ${record.recordId}`,
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
  (record) => record.operatingStatus === "operating" && record.lifecycle === "draft",
);
const openExactMatched = catalogue.intakeRecords.filter(
  (record) =>
    record.operatingStatus === "operating" && record.directoryRelationship.state === "candidate_match",
);
const evidenceCompleteOpen = openExactMatched.filter((record) => record.readiness.evidenceComplete);
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
  };
  if (record.operatingStatus === "operating") totals.open += 1;
  if (record.lifecycle === "verified") totals.verified += 1;
  if (record.operatingStatus === "operating" && record.lifecycle === "draft") totals.unresolved += 1;
  prefectures.set(record.raw.prefecture, totals);
}
for (const page of catalogue.publishedPages) {
  const totals = prefectures.get(page.prefecture) ?? {
    open: 0,
    published: 0,
    verified: 0,
    unresolved: 0,
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
    `- Existing published pages: ${catalogue.publishedPages.length}`,
    `- Intake rows with conservative directory evidence: ${evidenceCount}`,
    `- Evidence snapshot directory rows: ${evidenceSnapshot?.directoryRows ?? 0}`,
    `- Detail-derived official links: ${evidenceSnapshot?.detailDerivedOfficialLinks ?? 0}`,
    `- Directory rows with merged official coverage: ${evidenceSnapshot?.mergedOfficialCoverage ?? 0}`,
    `- Evidence-complete directory rows: ${evidenceSnapshot?.evidenceCompleteRows ?? 0}`,
    "",
    "Published pages and intake rows remain separate projections. A candidate relationship never",
    "changes an intake row's lifecycle and is not a silent deduplication.",
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
    "| Prefecture | Open intake | Published pages | Verified intake | Unresolved open |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...[...prefectures.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(
        ([prefecture, totals]) =>
          `| ${prefecture} | ${totals.open} | ${totals.published} | ${totals.verified} | ${totals.unresolved} |`,
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