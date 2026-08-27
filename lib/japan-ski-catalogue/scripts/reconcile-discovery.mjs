import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const snapshotDate = "2026-08-26";
const outputPath = `${packageRoot}generated/japan-discovery-reconciliation.json`;
const csvPath = `${packageRoot}reports/japan-discovery-ledger.csv`;
const publicCsvPath = `${workspaceRoot}artifacts/feelzlike/public/downloads/japan-ski-area-coverage-ledger.csv`;
const summaryPath = `${packageRoot}reports/japan-discovery-summary.md`;

const [catalogue, directorySnapshot, wikipediaSnapshot] = await Promise.all([
  readFile(`${packageRoot}generated/japan-catalogue.json`, "utf8").then(JSON.parse),
  readFile(`${packageRoot}data/directory-evidence.json`, "utf8").then(JSON.parse),
  readFile(`${packageRoot}data/wikipedia-discovery-snapshots.json`, "utf8").then(JSON.parse),
]);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\b(ski|snow|mountain|mt|resort|area|course|park|kogen|onsen|city|town|village)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function identityNormalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function discoveryIdentityName(value) {
  let name = String(value ?? "").trim();
  let previous;
  do {
    previous = name;
    name = name
      .replace(
        /\s*\((?=[^)]*(?:closed|shut down|indoor|dry slopes?|new owners))[^)]*\)\s*$/i,
        "",
      )
      .trim();
  } while (name !== previous);
  return name;
}

function discoveryQualifier(value) {
  const original = String(value ?? "").trim();
  const identity = discoveryIdentityName(original);
  return identity === original ? undefined : original.slice(identity.length).trim();
}

function latinIdentityNormalize(value) {
  const text = String(value ?? "");
  return /^[\x00-\x7F]*$/.test(text) ? identityNormalize(text) : "";
}

function csv(value) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function firstNonempty(...values) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0);
}

const publishedPages = [
  ...catalogue.publishedPages.map((page) => ({ ...page, coverageKind: "authored" })),
  ...catalogue.publishedCatalogueRecords.map((page) => ({
    ...page,
    pageRecordId: `catalogue:${page.recordId}`,
    operatingStatus: "operating",
    coverageKind: "catalogue",
  })),
];
const pageByRecordId = new Map(
  publishedPages
    .filter((page) => page.coverageKind === "catalogue")
    .map((page) => [page.recordId, page]),
);
const intakeById = new Map(catalogue.intakeRecords.map((record) => [record.recordId, record]));

const intakeNames = new Map();
const fuzzyIntakeNames = new Map();
for (const record of catalogue.intakeRecords) {
  for (const name of [
    record.raw?.name,
    record.resolved?.name,
    record.resolved?.nameJa,
    record.review?.officialNameEn,
    record.review?.officialNameJa,
    record.publicId,
    ...(record.aliases ?? []),
  ]) {
    const key = latinIdentityNormalize(name);
    if (!key) continue;
    intakeNames.set(key, [...(intakeNames.get(key) ?? []), record]);
    const fuzzyKey = normalize(name);
    if (fuzzyKey) {
      fuzzyIntakeNames.set(fuzzyKey, [...(fuzzyIntakeNames.get(fuzzyKey) ?? []), record]);
    }
  }
}
const pageNames = new Map();
const fuzzyPageNames = new Map();
for (const page of publishedPages) {
  for (const name of [page.name, page.nameJa, page.publicId, ...(page.aliases ?? [])]) {
    const key = latinIdentityNormalize(name);
    if (!key) continue;
    pageNames.set(key, [...(pageNames.get(key) ?? []), page]);
    const fuzzyKey = normalize(name);
    if (fuzzyKey) {
      fuzzyPageNames.set(fuzzyKey, [...(fuzzyPageNames.get(fuzzyKey) ?? []), page]);
    }
  }
}
const wikipediaPrefecturesByName = new Map();
for (const source of wikipediaSnapshot.sources.slice(0, 1)) {
  for (const entry of source.entries) {
    const key = normalize(entry.originalName);
    if (!key) continue;
    wikipediaPrefecturesByName.set(key, [
      ...new Set([...(wikipediaPrefecturesByName.get(key) ?? []), entry.prefecture]),
    ]);
  }
}
for (const record of catalogue.intakeRecords) {
  for (const name of [record.raw?.name, record.resolved?.name, record.review?.officialNameEn]) {
    const key = normalize(name);
    if (!key || !record.raw?.prefecture) continue;
    wikipediaPrefecturesByName.set(key, [
      ...new Set([...(wikipediaPrefecturesByName.get(key) ?? []), record.raw.prefecture]),
    ]);
  }
}
const directoryPrefectureOverrides = {
  bigairfukuoka: "Fukuoka",
  saitama: "Saitama",
  snovaashikagatochigi: "Tochigi",
  snovahiroshima: "Hiroshima",
  snovakashi: "Chiba",
  snovakobefreekukobesnowparkkobe: "Hyogo",
};

function wikipediaPrefecture(name) {
  const identityName = discoveryIdentityName(name);
  const matches = wikipediaPrefecturesByName.get(normalize(identityName)) ?? [];
  return matches.length === 1 ? matches[0] : directoryPrefectureOverrides[normalize(identityName)];
}

const majorRelationships = [
  {
    test: /yuzawa.*kogen.*gala.*ishiuchi/i,
    pages: [
      "page:yuzawa:yuzawa-kogen",
      "page:yuzawa:gala-yuzawa",
      "page:yuzawa:ishiuchi-maruyama",
    ],
  },
  { test: /gala.*yuzawa(?!.*ishiuchi)/i, pages: ["page:yuzawa:gala-yuzawa"] },
  { test: /yuzawa.*kogen(?!.*gala)/i, pages: ["page:yuzawa:yuzawa-kogen"] },
  { test: /iwatake/i, pages: ["page:hakuba-valley:hakuba-iwatake"] },
  { test: /tsugaike/i, pages: ["page:hakuba-valley:tsugaike-kogen"] },
  { test: /suginohara/i, pages: ["page:myoko:myoko-suginohara"] },
  {
    test: /niseko united|annupuri.*grand hirafu|grand hirafu.*niseko village/i,
    pages: [
      "page:niseko:grand-hirafu",
      "page:niseko:hanazono",
      "page:niseko:niseko-village",
      "page:niseko:annupuri",
    ],
  },
  {
    test: /yomase.*takaifuji|takaifuji.*yomase/i,
    pages: ["page:yamanouchi:yomase-onsen", "page:yamanouchi:xjam-takaifuji"],
  },
  {
    test: /takamagahara/i,
    pages: ["page:yamanouchi:shiga-takamagahara", "catalogue:workbook:189"],
  },
  { test: /kijimadaira/i, pages: ["page:iiyama:kijimadaira"] },
  { test: /^akakura onsen ski area/i, pages: ["page:myoko:akakura-onsen"] },
  {
    test: /^kamui ski links$/i,
    pages: ["page:asahikawa:kamui", "page:furano:kamui-ski-links"],
  },
  {
    test: /^(?:hoshino resorts|alpha resort) tomamu$/i,
    pages: ["page:tomamu-sahoro:tomamu-resort", "page:furano:tomamu"],
  },
  {
    test: /^hakkoda(?: ski area)?$/i,
    pages: ["page:hakkoda-aomori-spring:hakkoda", "catalogue:workbook:119"],
  },
  {
    test: /^myoko akakura$/i,
    prefecture: "Niigata",
    pages: ["page:myoko:akakura-onsen"],
  },
  {
    test: /^yuzawa kogen ski area$/i,
    prefecture: "Niigata",
    pages: ["page:yuzawa:yuzawa-kogen"],
  },
  {
    test: /^yuzawa park ski area$/i,
    prefecture: "Niigata",
    pages: ["catalogue:workbook:194"],
  },
  {
    test: /^furano ski reosrt$/i,
    prefecture: "Hokkaido",
    pages: ["page:furano:furano-ski-resort"],
  },
  {
    test: /^iwate kogen snowpark$/i,
    prefecture: "Iwate",
    pages: ["catalogue:workbook:35"],
  },
  {
    test: /^hyonosen kokusai ski area$/i,
    prefecture: "Hyogo",
    pages: ["catalogue:workbook:156"],
  },
];
const publishedByPageId = new Map(publishedPages.map((page) => [page.pageRecordId, page]));

function latinFold(value) {
  return String(value ?? "").normalize("NFKD").replace(/\p{Diacritic}/gu, "");
}

function manualPages(name, prefecture) {
  const foldedName = latinFold(name);
  const relationship = majorRelationships.find(
    ({ test, prefecture: relationshipPrefecture }) =>
      (!relationshipPrefecture || relationshipPrefecture === prefecture) &&
      test.test(foldedName),
  );
  return relationship?.pages.map((id) => publishedByPageId.get(id)).filter(Boolean) ?? [];
}

function matchRecord(name, prefecture) {
  const identityName = discoveryIdentityName(name);
  const exactMatches = [
    ...new Map(
      (intakeNames.get(latinIdentityNormalize(identityName)) ?? []).map((record) => [
        record.recordId,
        record,
      ]),
    ).values(),
  ].filter((record) => !prefecture || record.raw?.prefecture === prefecture);
  if (exactMatches.length === 1) return exactMatches[0];
  if (!prefecture || exactMatches.length > 1) return undefined;
  const fuzzyMatches = [
    ...new Map(
      (fuzzyIntakeNames.get(normalize(identityName)) ?? []).map((record) => [
        record.recordId,
        record,
      ]),
    ).values(),
  ].filter((record) => record.raw?.prefecture === prefecture);
  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : undefined;
}

function matchPages(name, record, prefecture) {
  const identityName = discoveryIdentityName(name);
  const manual = manualPages(identityName, prefecture);
  if (manual.length) return manual;
  if (record?.routeMode === "existing_page") {
    const page = publishedByPageId.get(record.existingPageId);
    if (page) return [page];
  }
  const cataloguePage = record ? pageByRecordId.get(record.recordId) : undefined;
  if (cataloguePage) return [cataloguePage];
  const matches = [
    ...new Map(
      (pageNames.get(latinIdentityNormalize(identityName)) ?? []).map((page) => [
        page.pageRecordId,
        page,
      ]),
    ).values(),
  ].filter((page) => !prefecture || !page.prefecture || page.prefecture === prefecture);
  if (matches.length === 1) return matches;
  if (!prefecture || matches.length > 1) return [];
  const fuzzyMatches = [
    ...new Map(
      (fuzzyPageNames.get(normalize(identityName)) ?? []).map((page) => [
        page.pageRecordId,
        page,
      ]),
    ).values(),
  ].filter((page) => !page.prefecture || page.prefecture === prefecture);
  return fuzzyMatches.length === 1 ? fuzzyMatches : [];
}

function uniqueFuzzyPublishedPage(name, prefecture) {
  const identityName = discoveryIdentityName(name);
  const candidates = [
    ...new Map(
      (fuzzyPageNames.get(normalize(identityName)) ?? []).map((page) => [
        page.pageRecordId,
        page,
      ]),
    ).values(),
  ].filter((page) => !page.prefecture || page.prefecture === prefecture);
  return candidates.length === 1 ? candidates[0] : undefined;
}

function nearestPrefecture(directory) {
  if (!Number.isFinite(directory.lat) || !Number.isFinite(directory.lng)) return undefined;
  let nearest;
  for (const record of catalogue.intakeRecords) {
    const point = record.resolved?.coordinates;
    if (!Number.isFinite(point?.lat) || !Number.isFinite(point?.lng) || !record.raw?.prefecture) continue;
    const distance = (point.lat - directory.lat) ** 2 + (point.lng - directory.lng) ** 2;
    if (!nearest || distance < nearest.distance) nearest = { distance, prefecture: record.raw.prefecture };
  }
  return nearest?.prefecture;
}

function operatingEvidence(record) {
  if (!record?.review) return { status: "unresolved" };
  return {
    status: record.review.reviewStatus,
    evidenceUrl: record.review.statusEvidenceUrl,
    evidenceAsOf: record.review.evidenceAsOf,
    sourceType: "operator_or_public_authority_review",
  };
}

function dispositionFor(record, pages) {
  if (pages.length > 1) return "covered_by_multiple_pages";
  if (pages.length === 1) return record ? "published_directly" : "covered_by_alias";
  if (record?.review?.reviewStatus === "merged_into") return "merged_or_renamed";
  if (["closed", "temporarily_closed"].includes(record?.review?.reviewStatus)) return "closed";
  if (["indoor", "dry_slope"].includes(record?.operatingStatus)) return "out_of_scope";
  if (record?.review?.reviewStatus === "verified_operating") return "genuinely_missing";
  return "unresolved";
}

const sourceEntries = [];
for (const record of catalogue.intakeRecords) {
  sourceEntries.push({
    sourceEntryId: `workbook:${record.source.rowIdentity}`,
    sourceId: "japan-ski-resorts-558",
    sourceName: "Japan Ski Resorts 558 workbook",
    sourceUrl: "attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx",
    retrievalDate: "2026-07-13",
    originalName: record.source.rawName,
    normalizedIdentity: identityNormalize(record.source.rawName),
    prefecture: record.raw.prefecture,
    recordId: record.recordId,
  });
}
for (const directory of directorySnapshot.directory) {
  const record = matchRecord(directory.name);
  sourceEntries.push({
    sourceEntryId: `skiresort:${directory.slug}`,
    sourceId: "skiresort-japan-directory",
    sourceName: "Skiresort.com Japan directory",
    sourceUrl: directory.directoryUrl,
    retrievalDate: directorySnapshot.createdAt,
    originalName: directory.name,
    normalizedIdentity: identityNormalize(discoveryIdentityName(directory.name)),
    discoveryQualifier: discoveryQualifier(directory.name),
    prefecture:
      record?.raw?.prefecture ??
      wikipediaPrefecture(directory.name) ??
      nearestPrefecture(directory) ??
      "Prefecture unresolved",
    ...(record ? { recordId: record.recordId } : {}),
  });
}
for (const source of wikipediaSnapshot.sources) {
  for (const [index, entry] of source.entries.entries()) {
    const record = matchRecord(entry.originalName, entry.prefecture);
    sourceEntries.push({
      sourceEntryId: `${source.sourceId}:${index + 1}`,
      sourceId: source.sourceId,
      sourceName: source.sourceName,
      sourceUrl: entry.itemUrl || source.sourceUrl,
      retrievalDate: source.retrievalDate,
      originalName: entry.originalName,
      normalizedIdentity: identityNormalize(discoveryIdentityName(entry.originalName)),
      discoveryQualifier: discoveryQualifier(entry.originalName),
      prefecture: entry.prefecture,
      ...(record ? { recordId: record.recordId } : {}),
    });
  }
}

const areas = new Map();
const identityByNormalizedPrefecture = new Map();
for (const entry of sourceEntries) {
  const record = entry.recordId
    ? intakeById.get(entry.recordId)
    : matchRecord(entry.originalName, entry.prefecture);
  const pages = matchPages(entry.originalName, record, entry.prefecture);
  const proposedIdentityKey =
    pages.length
      ? pages.map((page) => page.pageRecordId).sort().join("+")
      : record?.recordId ?? `${entry.prefecture}:${entry.normalizedIdentity}`;
  if (!proposedIdentityKey || pages.some((page) => !page.pageRecordId || !page.route)) {
    throw new Error(`Invalid public coverage identity: ${entry.sourceEntryId}`);
  }
  const normalizedPrefectureKey = `${entry.prefecture}:${entry.normalizedIdentity}`;
  const identityKey = identityByNormalizedPrefecture.get(normalizedPrefectureKey) ?? proposedIdentityKey;
  identityByNormalizedPrefecture.set(normalizedPrefectureKey, identityKey);
  const existing = areas.get(identityKey) ?? {
    identityId: identityKey,
    canonicalName: firstNonempty(
      record?.resolved?.name,
      record?.raw?.name,
      pages[0]?.name,
      entry.originalName,
    ),
    normalizedIdentity: entry.normalizedIdentity,
    prefecture: record?.raw?.prefecture ?? entry.prefecture,
    sourceMembership: [],
    sourceEntryIds: [],
    operatingEvidence: operatingEvidence(record),
    publicCoverage: {
      routes: pages.map((page) => page.route),
      pageIds: pages.map((page) => page.pageRecordId),
    },
    disposition: dispositionFor(record, pages),
    exception:
      pages.length > 1
        ? pages.some((page) =>
            [
              "page:asahikawa:kamui",
              "page:furano:kamui-ski-links",
              "page:tomamu-sahoro:tomamu-resort",
              "page:furano:tomamu",
              "page:hakkoda-aomori-spring:hakkoda",
              "catalogue:workbook:119",
              "page:yamanouchi:shiga-takamagahara",
              "catalogue:workbook:189",
            ].includes(page.pageRecordId),
          )
          ? "Legacy duplicate public routes for the same resort are preserved because existing public URLs must remain unchanged."
          : "One discovery identity intentionally reconciles to multiple operating-area pages."
        : undefined,
  };
  if (!existing.sourceMembership.includes(entry.sourceId)) existing.sourceMembership.push(entry.sourceId);
  existing.sourceEntryIds.push(entry.sourceEntryId);
  areas.set(identityKey, existing);
}
const reconciliation = {
  schemaVersion: 1,
  generatedAt: `${snapshotDate}T00:00:00.000Z`,
  policy: {
    discoveryPresenceIsOperatingEvidence: false,
    completenessClaim:
      "Bounded to reviewed discovery coverage; unresolved identities are not claimed operating or complete.",
  },
  sources: [
    {
      sourceId: "japan-ski-resorts-558",
      sourceName: "Japan Ski Resorts 558 workbook",
      sourceUrl: "attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx",
      retrievalDate: "2026-07-13",
    },
    {
      sourceId: "skiresort-japan-directory",
      sourceName: "Skiresort.com Japan directory",
      sourceUrl: "https://www.skiresort.com/ski-resorts/japan/",
      retrievalDate: directorySnapshot.createdAt,
    },
    ...wikipediaSnapshot.sources.map(({ entries, delegatesTo, ...source }) => ({
      ...source,
      ...(delegatesTo
        ? {
            delegatesTo,
            derivedMembership: true,
            recordCount: entries.length,
            note: "The Japan section delegates to the Japan-specific list; these rows preserve that resolved membership rather than claiming an independent list.",
          }
        : { recordCount: entries.length }),
    })),
  ],
  sourceEntries,
  areas: [...areas.values()].sort(
    (left, right) => left.prefecture.localeCompare(right.prefecture) || left.canonicalName.localeCompare(right.canonicalName),
  ),
};

const allowed = new Set([
  "published_directly",
  "covered_by_alias",
  "covered_by_multiple_pages",
  "merged_or_renamed",
  "closed",
  "out_of_scope",
  "genuinely_missing",
  "unresolved",
]);
const validationErrors = [];
for (const entry of reconciliation.sourceEntries) {
  if (!entry.sourceUrl || !entry.retrievalDate || !entry.sourceName || !entry.originalName || !entry.normalizedIdentity) {
    validationErrors.push(`Incomplete source provenance: ${entry.sourceEntryId}`);
  }
  if (!entry.prefecture || entry.prefecture === "Prefecture unresolved") {
    validationErrors.push(`Missing prefecture: ${entry.sourceEntryId}`);
  }
  if (
    /thumb\||<!--|-->|\{\{|\}\}|\[\[|\]\]|<[^>]+>|\bFile:|\b\d+px\b/i.test(entry.originalName)
  ) {
    validationErrors.push(`Malformed source identity: ${entry.sourceEntryId}`);
  }
}
for (const area of reconciliation.areas) {
  if (!allowed.has(area.disposition)) validationErrors.push(`Missing reviewed disposition: ${area.identityId}`);
  if (!area.canonicalName?.trim() || !area.normalizedIdentity?.trim()) {
    validationErrors.push(`Missing canonical identity: ${area.identityId}`);
  }
  if (
    area.operatingEvidence.status === "verified_operating" &&
    area.publicCoverage.routes.length === 0 &&
    area.disposition !== "genuinely_missing"
  ) {
    validationErrors.push(`Verified-operating unpublished area is not marked missing: ${area.identityId}`);
  }
  if (area.disposition === "unresolved") {
    for (const sourceEntryId of area.sourceEntryIds) {
      const sourceEntry = reconciliation.sourceEntries.find(
        (entry) => entry.sourceEntryId === sourceEntryId,
      );
      const candidate = sourceEntry
        ? uniqueFuzzyPublishedPage(sourceEntry.originalName, sourceEntry.prefecture)
        : undefined;
      if (candidate) {
        validationErrors.push(
          `Unresolved identity uniquely matches published coverage: ${sourceEntryId}:${candidate.pageRecordId}`,
        );
      }
    }
  }
}
for (const record of catalogue.intakeRecords) {
  const area = reconciliation.areas.find((candidate) =>
    candidate.sourceEntryIds.includes(`workbook:${record.source.rowIdentity}`),
  );
  if (!area) {
    validationErrors.push(`Workbook source entry is orphaned: ${record.recordId}`);
    continue;
  }
  if (area.prefecture !== record.raw.prefecture) {
    validationErrors.push(`Workbook record crossed prefectures: ${record.recordId}`);
  }
  const expectedRoute =
    record.routeMode === "existing_page"
      ? publishedByPageId.get(record.existingPageId)?.route
      : pageByRecordId.get(record.recordId)?.route;
  if (expectedRoute && !area.publicCoverage.routes.includes(expectedRoute)) {
    validationErrors.push(`Workbook record has incorrect public route: ${record.recordId}`);
  }
}
for (const fixtureId of ["workbook:28", "workbook:237"]) {
  const record = intakeById.get(fixtureId);
  const expectedRoute = pageByRecordId.get(fixtureId)?.route;
  const area = reconciliation.areas.find((candidate) =>
    candidate.sourceEntryIds.includes(`workbook:${record?.source.rowIdentity}`),
  );
  if (!record || !expectedRoute || !area?.publicCoverage.routes.includes(expectedRoute)) {
    validationErrors.push(`Generic published-page regression fixture failed: ${fixtureId}`);
  }
}
const asahiClosed = reconciliation.areas.find((area) =>
  area.sourceEntryIds.includes("workbook:310"),
);
const asahiOperating = reconciliation.areas.find((area) =>
  area.sourceEntryIds.includes("workbook:210"),
);
if (
  !asahiClosed ||
  asahiClosed.prefecture !== "Hokkaido" ||
  asahiClosed.disposition !== "merged_or_renamed" ||
  asahiClosed.publicCoverage.routes.length !== 0 ||
  !asahiOperating ||
  asahiOperating.prefecture !== "Yamagata" ||
  !asahiOperating.publicCoverage.routes.includes(
    "/yamagata-regional/mountain/asahi-shizenkan-snow-park",
  )
) {
  validationErrors.push("Distinct Asahi identities regression fixture failed");
}
for (const sourceEntryId of [
  "wikipedia-japan-specific:112",
  "wikipedia-japan-specific:156",
  "wikipedia-japan-specific:161",
  "wikipedia-japan-specific:162",
]) {
  const area = reconciliation.areas.find((candidate) =>
    candidate.sourceEntryIds.includes(sourceEntryId),
  );
  if (!area || area.disposition === "unresolved" || area.publicCoverage.routes.length === 0) {
    validationErrors.push(`Fuzzy published-identity regression fixture failed: ${sourceEntryId}`);
  }
}
for (const [sourceEntryId, workbookEntryId] of [
  ["skiresort:snova-kashi", "workbook:520"],
  ["skiresort:bigair-fukuoka", "workbook:548"],
  ["skiresort:makado-onsen", "workbook:205"],
  ["skiresort:rokuroshi-kogen", "workbook:402"],
  ["skiresort:chokai-okojoland", "workbook:377"],
]) {
  const sourceEntry = reconciliation.sourceEntries.find(
    (entry) => entry.sourceEntryId === sourceEntryId,
  );
  const area = reconciliation.areas.find((candidate) =>
    candidate.sourceEntryIds.includes(sourceEntryId),
  );
  if (
    !sourceEntry?.discoveryQualifier ||
    !area?.sourceEntryIds.includes(workbookEntryId)
  ) {
    validationErrors.push(`Directory qualifier reconciliation fixture failed: ${sourceEntryId}`);
  }
}
const assignedSourceEntryIds = reconciliation.areas.flatMap((area) => area.sourceEntryIds);
if (
  assignedSourceEntryIds.length !== reconciliation.sourceEntries.length ||
  new Set(assignedSourceEntryIds).size !== reconciliation.sourceEntries.length
) {
  validationErrors.push("Every source entry must belong to exactly one reconciled identity");
}
const coveredRoutes = new Set(
  reconciliation.areas.flatMap((area) => area.publicCoverage.routes),
);
for (const page of publishedPages) {
  if (!coveredRoutes.has(page.route)) {
    validationErrors.push(`Published page is orphaned from discovery coverage: ${page.pageRecordId}`);
  }
}
const areasByNormalizedPrefecture = new Map();
for (const area of reconciliation.areas) {
  const key = `${area.prefecture}:${area.normalizedIdentity}`;
  areasByNormalizedPrefecture.set(key, [...(areasByNormalizedPrefecture.get(key) ?? []), area]);
}
for (const [key, duplicates] of areasByNormalizedPrefecture) {
  if (duplicates.length > 1 && !duplicates.every((area) => area.exception)) {
    validationErrors.push(`Duplicate canonical identity without reviewed exception: ${key}`);
  }
  if (
    duplicates.some((area) => area.disposition === "unresolved") &&
    duplicates.some((area) =>
      ["published_directly", "covered_by_alias", "covered_by_multiple_pages", "closed", "merged_or_renamed"].includes(
        area.disposition,
      ),
    )
  ) {
    validationErrors.push(`Unresolved duplicate of a reviewed identity: ${key}`);
  }
}
for (const relationship of majorRelationships) {
  const sourceMatch = reconciliation.sourceEntries.find(
    (entry) =>
      (!relationship.prefecture || relationship.prefecture === entry.prefecture) &&
      relationship.test.test(latinFold(discoveryIdentityName(entry.originalName))),
  );
  if (
    !sourceMatch ||
    matchPages(
      sourceMatch.originalName,
      intakeById.get(sourceMatch.recordId),
      sourceMatch.prefecture,
    ).length !== relationship.pages.length
  ) {
    validationErrors.push(`Missing major-resort reconciliation fixture: ${relationship.test}`);
  }
}
if (validationErrors.length) throw new Error(`Discovery reconciliation failed:\n${validationErrors.join("\n")}`);

const sourceById = new Map(reconciliation.sourceEntries.map((entry) => [entry.sourceEntryId, entry]));
const rows = reconciliation.areas.map((area) => {
  const entries = area.sourceEntryIds.map((id) => sourceById.get(id));
  return [
    area.prefecture,
    area.canonicalName,
    area.normalizedIdentity,
    area.disposition,
    area.sourceMembership,
    entries.map((entry) => entry.originalName),
    entries.map((entry) => entry.sourceUrl),
    entries.map((entry) => entry.retrievalDate),
    area.operatingEvidence.status,
    area.operatingEvidence.evidenceUrl,
    area.operatingEvidence.evidenceAsOf,
    area.publicCoverage.routes,
    area.exception,
  ];
});
const header = [
  "prefecture",
  "canonical_name",
  "normalized_identity",
  "coverage_disposition",
  "source_membership",
  "source_original_names",
  "source_urls",
  "retrieval_dates",
  "operating_evidence_status",
  "operating_evidence_url",
  "operating_evidence_as_of",
  "feelzlike_urls",
  "exceptions",
];
const csvText = `${[header, ...rows].map((row) => row.map(csv).join(",")).join("\n")}\n`;
const dispositionCounts = Object.fromEntries(
  [...allowed].map((disposition) => [
    disposition,
    reconciliation.areas.filter((area) => area.disposition === disposition).length,
  ]),
);
const prefectures = [...new Set(reconciliation.areas.map((area) => area.prefecture))].sort();
const summary = [
  "# Japan discovery reconciliation",
  "",
  `Generated: ${reconciliation.generatedAt}`,
  "",
  "Discovery membership is not operating-status evidence. Operator and public-authority reviews remain separate.",
  "Public completeness wording remains bounded while unresolved identities remain.",
  "",
  `- Source entries: ${reconciliation.sourceEntries.length}`,
  `- Deduplicated identities: ${reconciliation.areas.length}`,
  ...[...allowed].map((disposition) => `- ${disposition}: ${dispositionCounts[disposition]}`),
  "",
  "## Prefecture proof",
  "",
  "| Prefecture | Identities | Published/alias/multiple | Closed/merged/out of scope | Missing | Unresolved |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...prefectures.map((prefecture) => {
    const items = reconciliation.areas.filter((area) => area.prefecture === prefecture);
    const count = (states) => items.filter((area) => states.includes(area.disposition)).length;
    return `| ${prefecture} | ${items.length} | ${count(["published_directly", "covered_by_alias", "covered_by_multiple_pages"])} | ${count(["closed", "merged_or_renamed", "out_of_scope"])} | ${count(["genuinely_missing"])} | ${count(["unresolved"])} |`;
  }),
  "",
  `Downloadable ledger: \`/downloads/japan-ski-area-coverage-ledger.csv\``,
  "",
].join("\n");

const outputs = [
  [outputPath, `${JSON.stringify(reconciliation, null, 2)}\n`],
  [csvPath, csvText],
  [publicCsvPath, csvText],
  [summaryPath, summary],
];
if (process.argv.includes("--check")) {
  for (const [path, expected] of outputs) {
    const actual = await readFile(path, "utf8").catch(() => "");
    if (actual !== expected) {
      process.stderr.write(`Japan discovery reconciliation drift: ${path}\n`);
      process.exitCode = 1;
    }
  }
} else {
  await Promise.all(outputs.map(([path, contents]) => writeFile(path, contents, "utf8")));
  process.stdout.write(
    `Reconciled ${reconciliation.sourceEntries.length} source entries into ${reconciliation.areas.length} identities.\n`,
  );
}