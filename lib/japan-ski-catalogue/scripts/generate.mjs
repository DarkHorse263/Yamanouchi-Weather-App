import { readdir, readFile, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const outputPath = `${packageRoot}generated/japan-catalogue.json`;
const publicRuntimeOutputPath = `${packageRoot}generated/japan-public-runtime.json`;
const workbookPath = `${workspaceRoot}attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx`;
const evidencePath = `${packageRoot}data/directory-evidence.json`;
const reviewsRoot = `${packageRoot}data/reviews`;
const travelClustersPath = `${packageRoot}data/travel-clusters.json`;
const supplementsPath = `${packageRoot}data/verified-evidence-supplement.json`;
const publicIdentitiesPath = `${packageRoot}data/public-identities.json`;
const publicationManifestPath = `${packageRoot}data/publication-manifest.json`;
const snapshotDate = "2026-08-24";
const generatedAt = `${snapshotDate}T00:00:00.000Z`;
const japanRegionIds = [
  "yamanouchi",
  "nozawa-onsen",
  "iiyama",
  "hakuba-valley",
  "myoko",
  "niseko",
  "furano",
  "sapporo",
  "tomamu-sahoro",
  "asahikawa",
  "rusutsu-kiroro",
  "yuzawa",
  "zao-onsen",
  "bandai",
  "daisen",
  "hakkoda-aomori-spring",
  "appi-shizukuishi",
  "minakami",
  "kusatsu-manza",
  "hachimantai",
];

function decodeXml(value) {
  return value.replace(/&#x([0-9a-f]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/gi, (_, hex, decimal, named) => {
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[named];
  });
}

function readZipEntry(archive, wantedName) {
  let endOffset = archive.length - 22;
  while (endOffset >= 0 && archive.readUInt32LE(endOffset) !== 0x06054b50) endOffset -= 1;
  if (endOffset < 0) throw new Error("Invalid XLSX: ZIP directory not found");
  const entryCount = archive.readUInt16LE(endOffset + 10);
  let offset = archive.readUInt32LE(endOffset + 16);
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid XLSX: bad ZIP entry");
    const method = archive.readUInt16LE(offset + 10);
    const compressedSize = archive.readUInt32LE(offset + 20);
    const fileNameLength = archive.readUInt16LE(offset + 28);
    const extraLength = archive.readUInt16LE(offset + 30);
    const commentLength = archive.readUInt16LE(offset + 32);
    const localOffset = archive.readUInt32LE(offset + 42);
    const name = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (name === wantedName) {
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw new Error("Invalid XLSX: bad local entry");
      const localNameLength = archive.readUInt16LE(localOffset + 26);
      const localExtraLength = archive.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = archive.subarray(dataStart, dataStart + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRawSync(compressed);
      throw new Error(`Unsupported XLSX ZIP compression method: ${method}`);
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`XLSX entry not found: ${wantedName}`);
}

async function readWorkbookRows() {
  const archive = await readFile(workbookPath);
  const sheet = readZipEntry(archive, "xl/worksheets/sheet1.xml").toString("utf8");
  const rows = [];
  for (const rowMatch of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = /\br="([A-Z]+)\d+"/.exec(cellMatch[1])?.[1];
      if (!reference) continue;
      const textParts = [...cellMatch[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => match[1]);
      const numericValue = /<v>([\s\S]*?)<\/v>/.exec(cellMatch[2])?.[1];
      cells[reference] = decodeXml(textParts.length > 0 ? textParts.join("") : (numericValue ?? ""));
    }
    if (!["Open", "Temp Closed", "Indoor", "Dry Slope"].includes(cells.K)) continue;
    rows.push({
      workbookNo: cells.B,
      name: cells.C,
      townVillage: cells.D ?? "",
      consumerArea: cells.E ?? "",
      municipality: cells.F ?? "",
      prefecture: cells.G ?? "",
      macroRegion: cells.H ?? "",
      skiAreaValley: cells.I ?? "",
      passAccess: cells.J ?? "",
      status: cells.K,
      rating: cells.L === "" || cells.L === undefined ? null : Number(cells.L),
      notes: cells.M ?? "",
    });
  }
  return rows;
}

async function readReviews() {
  const files = (await readdir(reviewsRoot)).filter((file) => file.endsWith(".json")).sort();
  const reviews = new Map();
  for (const file of files) {
    const batch = JSON.parse(await readFile(`${reviewsRoot}/${file}`, "utf8"));
    for (const review of batch.records ?? []) {
      if (reviews.has(review.recordId)) throw new Error(`Duplicate review coverage: ${review.recordId}`);
      reviews.set(review.recordId, { ...review, reviewBatch: file, reviewedAt: batch.reviewedAt });
    }
  }
  return { files, reviews };
}

function evaluateLiteral(node) {
  if (!node) return undefined;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    return evaluateLiteral(node.expression);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node)) {
    const value = evaluateLiteral(node.operand);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(evaluateLiteral).filter((value) => value !== undefined);
  }
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key =
        ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : undefined;
      const propertyValue = evaluateLiteral(property.initializer);
      if (key && propertyValue !== undefined) value[key] = propertyValue;
    }
    return value;
  }
  return undefined;
}

async function readFrontendRegions() {
  const regions = [];
  for (const regionId of japanRegionIds) {
    const sourcePath = `artifacts/feelzlike/src/regions/${regionId}.ts`;
    const source = await readFile(`${workspaceRoot}${sourcePath}`, "utf8");
    const sourceFile = ts.createSourceFile(sourcePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    let region;
    sourceFile.forEachChild((node) => {
      if (!ts.isVariableStatement(node)) return;
      for (const declaration of node.declarationList.declarations) {
        const candidate = evaluateLiteral(declaration.initializer);
        if (candidate?.id === regionId) region = candidate;
      }
    });
    if (!region) throw new Error(`Could not extract RegionConfig from ${sourcePath}`);
    regions.push({ sourcePath, region });
  }
  return regions;
}

function normalizedName(value) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function compareWorkbookRecordIds(left, right) {
  const parse = (recordId) => {
    const match = /^workbook:(\d+)(.*)$/.exec(recordId);
    return match ? [Number(match[1]), match[2]] : [Number.POSITIVE_INFINITY, recordId];
  };
  const [leftNumber, leftSuffix] = parse(left);
  const [rightNumber, rightSuffix] = parse(right);
  return leftNumber - rightNumber || leftSuffix.localeCompare(rightSuffix);
}

function groupedByName(items, nameSelector) {
  const groups = new Map();
  for (const item of items) {
    const key = normalizedName(nameSelector(item));
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => item !== undefined && item !== null && item !== "" && (!Array.isArray(item) || item.length > 0),
    ),
  );
}

function readinessFor(directory, basis = directory ? "unique_exact_normalized_name" : "unresolved") {
  const essentials = {
    coordinates: Number.isFinite(directory?.lat) && Number.isFinite(directory?.lng),
    defensibleElevation:
      Number.isFinite(directory?.elevation?.baseM) &&
      Number.isFinite(directory?.elevation?.topM) &&
      directory.elevation.baseM >= 0 &&
      directory.elevation.topM > directory.elevation.baseM,
    japaneseName: Boolean(directory?.nameJa),
    officialUrl: Boolean(directory?.officialUrls?.length),
  };
  const missingReasons = Object.entries(essentials)
    .filter(([, ready]) => !ready)
    .map(([essential]) => `missing_${essential.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`);
  return {
    basis,
    essentials,
    evidenceComplete: directory !== undefined && Object.values(essentials).every(Boolean),
    missingReasons,
    requiredReviews: ["operating_status", "travel_cluster"],
  };
}

function supplementEvidence(recordId, field, citation) {
  return {
    evidenceId: `supplement:${recordId}:${field}`,
    sourceType: "verified_evidence_supplement",
    sourceRef: "data/verified-evidence-supplement.json",
    sourceUrl: citation.sourceUrl,
    evidenceAsOf: citation.evidenceAsOf,
    citationSourceType: citation.sourceType,
    note: citation.note,
    fields: [field],
  };
}

function resolvedEvidence(directory, supplement, review) {
  const resolved = {
    name: review?.officialNameEn ?? directory?.name,
    nameJa: directory?.nameJa ?? review?.officialNameJa,
    officialUrl: directory?.officialUrls?.[0] ?? review?.officialUrl,
    coordinates:
      Number.isFinite(directory?.lat) && Number.isFinite(directory?.lng)
        ? { lat: directory.lat, lng: directory.lng }
        : undefined,
    elevation: directory?.elevation,
  };
  const evidence = [];
  if (!resolved.nameJa && supplement?.fields?.japaneseName) {
    resolved.nameJa = supplement.fields.japaneseName.value;
    evidence.push(supplementEvidence(supplement.recordId, "japaneseName", supplement.fields.japaneseName));
  }
  if (!resolved.officialUrl && supplement?.fields?.officialUrl) {
    resolved.officialUrl = supplement.fields.officialUrl.value;
    evidence.push(supplementEvidence(supplement.recordId, "officialUrl", supplement.fields.officialUrl));
  }
  if (
    !(
      Number.isFinite(resolved.elevation?.baseM) &&
      Number.isFinite(resolved.elevation?.topM) &&
      resolved.elevation.topM > resolved.elevation.baseM
    ) &&
    supplement?.fields?.defensibleElevation
  ) {
    resolved.elevation = { ...resolved.elevation, ...supplement.fields.defensibleElevation.value };
    evidence.push(
      supplementEvidence(supplement.recordId, "defensibleElevation", supplement.fields.defensibleElevation),
    );
  }
  if (
    !(
      Number.isFinite(resolved.coordinates?.lat) &&
      Number.isFinite(resolved.coordinates?.lng)
    ) &&
    supplement?.fields?.coordinates
  ) {
    resolved.coordinates = { ...resolved.coordinates, ...supplement.fields.coordinates.value };
    evidence.push(supplementEvidence(supplement.recordId, "coordinates", supplement.fields.coordinates));
  }
  return { resolved, evidence };
}

function validateFoundationSources({ reviewSource, travelClusters, supplements, publicIdentities }) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const verifiedIds = new Set(
    [...reviewSource.reviews.entries()]
      .filter(([, review]) => review.reviewStatus === "verified_operating")
      .map(([recordId]) => recordId),
  );
  check(travelClusters.schemaVersion === 1, "travel-clusters: unsupported schemaVersion");
  check(publicIdentities.schemaVersion === 1, "public-identities: unsupported schemaVersion");
  check(supplements.schemaVersion === 1, "verified-evidence-supplement: unsupported schemaVersion");

  const regionIds = new Set();
  const townsByRegion = new Map();
  for (const region of travelClusters.regions ?? []) {
    check(!regionIds.has(region.travelRegionId), `Duplicate travelRegionId: ${region.travelRegionId}`);
    regionIds.add(region.travelRegionId);
    const towns = new Set();
    for (const town of region.baseTowns ?? []) {
      check(!towns.has(town.baseTownId), `Duplicate baseTownId in ${region.travelRegionId}: ${town.baseTownId}`);
      towns.add(town.baseTownId);
    }
    townsByRegion.set(region.travelRegionId, towns);
  }
  check(regionIds.size === 36, `Expected 36 travel regions; found ${regionIds.size}`);
  check(
    [...townsByRegion.values()].reduce((total, towns) => total + towns.size, 0) === travelClusters.counts?.baseTowns,
    "travel-clusters base-town count drift",
  );
  const assignments = new Map();
  for (const assignment of travelClusters.assignments ?? []) {
    check(!assignments.has(assignment.recordId), `Duplicate travel assignment: ${assignment.recordId}`);
    assignments.set(assignment.recordId, assignment);
    check(regionIds.has(assignment.travelRegionId), `Unknown travelRegionId: ${assignment.recordId}`);
    check(
      townsByRegion.get(assignment.travelRegionId)?.has(assignment.baseTownId),
      `Unknown baseTownId: ${assignment.recordId}`,
    );
  }
  check(
    assignments.size === verifiedIds.size &&
      [...verifiedIds].every((recordId) => assignments.has(recordId)) &&
      [...assignments].every(([recordId]) => verifiedIds.has(recordId)),
    "Travel assignments must exactly cover the current verified-operating review set",
  );
  check(travelClusters.counts?.records === assignments.size, "travel-clusters record count drift");
  check(travelClusters.counts?.regions === regionIds.size, "travel-clusters region count drift");
  for (const region of travelClusters.regions ?? []) {
    const expected = [...assignments.values()]
      .filter((assignment) => assignment.travelRegionId === region.travelRegionId)
      .map((assignment) => assignment.recordId)
      .sort();
    check(
      JSON.stringify([...(region.recordIds ?? [])].sort()) === JSON.stringify(expected),
      `travel-clusters region references drifted: ${region.travelRegionId}`,
    );
  }

  const identities = new Map();
  const publicNames = new Map();
  let existingCount = 0;
  let newCount = 0;
  for (const identity of publicIdentities.identities ?? []) {
    check(!identities.has(identity.recordId), `Duplicate public identity: ${identity.recordId}`);
    identities.set(identity.recordId, identity);
    check(["existing_page", "new_page"].includes(identity.routeMode), `Invalid routeMode: ${identity.recordId}`);
    if (identity.routeMode === "existing_page") {
      existingCount += 1;
      check(typeof identity.existingPageId === "string", `Missing existingPageId: ${identity.recordId}`);
    } else {
      newCount += 1;
      check(identity.existingPageId === undefined, `new_page has existingPageId: ${identity.recordId}`);
    }
    for (const publicName of [identity.publicId, ...(identity.aliases ?? [])]) {
      check(typeof publicName === "string" && publicName.length > 0, `Invalid public ID/alias: ${identity.recordId}`);
      check(!publicNames.has(publicName), `Duplicate public ID/alias: ${publicName}`);
      publicNames.set(publicName, identity.recordId);
    }
  }
  check(
    identities.size === verifiedIds.size &&
      [...verifiedIds].every((recordId) => identities.has(recordId)) &&
      [...identities].every(([recordId]) => verifiedIds.has(recordId)),
    "Public identities must exactly cover the current verified-operating review set",
  );
  check(existingCount + newCount === verifiedIds.size, "Public identity route-mode count drift");

  const supplementById = new Map();
  for (const supplement of supplements.records ?? []) {
    check(reviewSource.reviews.has(supplement.recordId), `Unknown supplement recordId: ${supplement.recordId}`);
    if (!verifiedIds.has(supplement.recordId)) continue;
    check(!supplementById.has(supplement.recordId), `Duplicate evidence supplement: ${supplement.recordId}`);
    supplementById.set(supplement.recordId, supplement);
    for (const [field, citation] of Object.entries(supplement.fields ?? {})) {
      check(
        ["japaneseName", "officialUrl", "defensibleElevation", "coordinates"].includes(field),
        `Unsupported supplement field: ${supplement.recordId}:${field}`,
      );
      check(
        (field === "defensibleElevation" &&
          ((Number.isFinite(citation?.value?.baseM) && citation.value.baseM >= 0) ||
            Number.isFinite(citation?.value?.topM))) ||
          (field === "coordinates" &&
            Number.isFinite(citation?.value?.lat) &&
            Number.isFinite(citation?.value?.lng)) ||
          (!["defensibleElevation", "coordinates"].includes(field) &&
            typeof citation?.value === "string" &&
            citation.value.length > 0),
        `Invalid supplement value: ${supplement.recordId}:${field}`,
      );
      check(isHttpUrl(citation?.sourceUrl), `Missing supplement citation URL: ${supplement.recordId}:${field}`);
      check(
        /^\d{4}-\d{2}-\d{2}$/.test(citation?.evidenceAsOf ?? ""),
        `Missing supplement citation date: ${supplement.recordId}:${field}`,
      );
      check(
        typeof citation?.sourceType === "string" &&
          citation.sourceType.length > 0 &&
          typeof citation?.note === "string" &&
          citation.note.length > 0,
        `Incomplete supplement citation: ${supplement.recordId}:${field}`,
      );
      if (field === "officialUrl") {
        check(isHttpUrl(citation.value), `Invalid supplemented official URL: ${supplement.recordId}`);
      }
    }
  }
  if (errors.length) throw new Error(`Foundation source validation failed:\n${errors.join("\n")}`);
  return { assignments, identities, supplementById };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAuthoritativeReview(review) {
  return (
    isHttpUrl(review?.statusEvidenceUrl) &&
    typeof review?.statusEvidenceQuote === "string" &&
    review.statusEvidenceQuote.trim().length >= 8 &&
    /^\d{4}-\d{2}-\d{2}$/.test(review?.evidenceAsOf ?? "")
  );
}

function normalizedReview(review) {
  return compactObject({
    reviewBatch: review.reviewBatch,
    reviewedAt: review.reviewedAt,
    reviewStatus: review.reviewStatus,
    officialNameEn: review.officialNameEn,
    officialNameJa: review.officialNameJa,
    officialUrl: review.officialUrl,
    statusEvidenceUrl: review.statusEvidenceUrl,
    statusEvidenceQuote: review.statusEvidenceQuote,
    evidenceAsOf: review.evidenceAsOf,
    notes: review.notes,
    travelClusterLabelSuggestion: review.travelClusterLabel,
    baseTownLabelSuggestion: review.baseTownLabel,
    clusterConfidence: review.clusterConfidence,
    successor: compactObject({
      recordId: review.mergedIntoRecordId,
      officialName: review.mergedIntoOfficialName,
    }),
  });
}

function directoryEvidence(directory) {
  return compactObject({
    evidenceId: `directory:${directory.slug}`,
    sourceType: "ski_directory",
    sourceRef: directory.slug,
    directoryUrl: directory.directoryUrl,
    officialUrls: directory.officialUrls,
    coordinates:
      Number.isFinite(directory.lat) && Number.isFinite(directory.lng)
        ? { lat: directory.lat, lng: directory.lng }
        : undefined,
    elevation: compactObject(directory.elevation ?? {}),
    names: compactObject({ en: directory.name, ja: directory.nameJa }),
    externalIds: compactObject(directory.externalIds ?? {}),
  });
}

async function buildCatalogue() {
  const [
    workbook,
    frontendRegions,
    evidenceSnapshot,
    reviewSource,
    travelClusters,
    supplements,
    publicIdentities,
    publicationManifest,
  ] =
    await Promise.all([
    readWorkbookRows(),
    readFrontendRegions(),
    readFile(evidencePath, "utf8").then(JSON.parse),
    readReviews(),
    readFile(travelClustersPath, "utf8").then(JSON.parse),
    readFile(supplementsPath, "utf8").then(JSON.parse),
    readFile(publicIdentitiesPath, "utf8").then(JSON.parse),
    readFile(publicationManifestPath, "utf8").then(JSON.parse),
  ]);
  const foundation = validateFoundationSources({ reviewSource, travelClusters, supplements, publicIdentities });
  const directoryByName = groupedByName(evidenceSnapshot.directory, (record) => record.name);
  const workbookByName = groupedByName(workbook, (record) => record.name);
  const statusMap = {
    Open: "operating",
    "Temp Closed": "temporarily_closed",
    Indoor: "indoor",
    "Dry Slope": "dry_slope",
  };
  const intakeRecords = workbook.map((row) => {
    const matches = directoryByName.get(normalizedName(row.name)) ?? [];
    const directory = matches.length === 1 ? matches[0] : undefined;
    const review = reviewSource.reviews.get(`workbook:${row.workbookNo}`);
    if (row.status === "Open" && !review) throw new Error(`Missing review coverage: workbook:${row.workbookNo}`);
    const recordId = `workbook:${row.workbookNo}`;
    const supplement = foundation.supplementById.get(recordId);
    const { resolved, evidence: supplementEvidenceItems } = resolvedEvidence(directory, supplement, review);
    const readiness = readinessFor(
      resolved
        ? {
            lat: resolved.coordinates?.lat,
            lng: resolved.coordinates?.lng,
            elevation: resolved.elevation,
            nameJa: resolved.nameJa,
            officialUrls: resolved.officialUrl ? [resolved.officialUrl] : [],
          }
        : undefined,
      directory ? "unique_exact_normalized_name" : supplement ? "supplement_only" : "unresolved",
    );
    const assignment = foundation.assignments.get(recordId);
    const identity = foundation.identities.get(recordId);
    const authoritativeReview = isAuthoritativeReview(review);
    const reviewedOperatingStatus =
      review?.reviewStatus === "verified_operating"
        ? "operating"
        : review?.reviewStatus === "temporarily_closed"
          ? "temporarily_closed"
          : review?.reviewStatus === "closed"
            ? "closed"
            : review?.reviewStatus === "merged_into"
              ? "merged_into"
              : undefined;
    const lifecycle =
      review?.reviewStatus === "verified_operating"
        ? authoritativeReview && readiness.evidenceComplete
          ? "verified"
          : "draft"
        : review && review.reviewStatus !== "unclear" && authoritativeReview
          ? "verified"
          : "draft";
    const publicationMissingReasons = [
      ...(review?.reviewStatus === "unclear" || !review ? ["unresolved_status"] : []),
      ...(!readiness.evidenceComplete ? ["missing_essentials", ...readiness.missingReasons] : []),
      ...(!assignment?.travelRegionId ? ["missing_travelRegionId"] : []),
      ...(!assignment?.baseTownId ? ["missing_baseTownId"] : []),
      ...(!identity?.publicId ? ["missing_publicId"] : []),
      ...(identity?.routeMode === "existing_page" ? ["route_already_published"] : []),
      ...(identity && identity.routeMode !== "new_page" ? ["not_new_page"] : []),
      ...(reviewedOperatingStatus !== "operating" ? ["not_operating"] : []),
      ...(lifecycle !== "verified" ? ["unverified_lifecycle"] : []),
    ];
    return {
      recordId,
      lifecycle,
      operatingStatus: statusMap[row.status],
      ...(reviewedOperatingStatus ? { reviewedOperatingStatus } : {}),
      ...(assignment
        ? { travelRegionId: assignment.travelRegionId, baseTownId: assignment.baseTownId }
        : {}),
      ...(identity
        ? {
            publicId: identity.publicId,
            aliases: identity.aliases,
            routeMode: identity.routeMode,
            ...(identity.existingPageId ? { existingPageId: identity.existingPageId } : {}),
          }
        : {}),
      source: {
        sourceId: "japan-ski-resorts-558",
        rowIdentity: String(row.workbookNo),
        rawName: row.name,
      },
      raw: row,
      ...(review ? { review: normalizedReview(review) } : {}),
      evidence: [
        {
          evidenceId: `intake:${row.workbookNo}`,
          sourceType: "national_intake_workbook",
          sourceRef: "Japan_Ski_Resorts_558_1783900482697.xlsx",
        },
        ...(directory ? [directoryEvidence(directory)] : []),
        ...supplementEvidenceItems,
      ],
      directoryRelationship: directory
        ? {
            state: "candidate_match",
            method: "unique_exact_normalized_name",
            directorySlug: directory.slug,
          }
        : {
            state: "unresolved",
            reason: matches.length > 1 ? "multiple_exact_directory_names" : "no_unique_exact_directory_name",
          },
      readiness,
      resolved,
      publicationReadiness: {
        publishable:
          lifecycle === "verified" &&
          reviewedOperatingStatus === "operating" &&
          readiness.evidenceComplete &&
          Boolean(assignment?.travelRegionId && assignment?.baseTownId && identity?.publicId) &&
          identity?.routeMode === "new_page",
        ...(identity?.routeMode === "existing_page" ? { routeAlreadyPublished: false } : {}),
        missingReasons: publicationMissingReasons,
      },
    };
  });
  const publishedPages = [];
  for (const { sourcePath, region } of frontendRegions) {
    const prefecture = region.subtitle.split(" · ")[0];
    for (const mountain of region.mountains ?? []) {
      const nearbyTowns = (region.baseTowns ?? []).filter((town) =>
        (town.nearbyMountainIds ?? []).includes(mountain.id),
      );
      const baseTownId = (nearbyTowns[0] ?? region.baseTowns?.[0])?.id;
      const matches = workbookByName.get(normalizedName(mountain.name)) ?? [];
      const intake = matches.length === 1 ? matches[0] : undefined;
      const evidence = [
        {
          evidenceId: `frontend:${region.id}:${mountain.id}`,
          sourceType: "existing_frontend_projection",
          sourceRef: sourcePath,
        },
      ];
      if (mountain.websiteUrl) {
        evidence.push({
          evidenceId: `official:${region.id}:${mountain.id}`,
          sourceType: "official_website",
          sourceRef: mountain.websiteUrl,
          officialUrls: [mountain.websiteUrl],
        });
      }
      publishedPages.push({
        pageRecordId: `page:${region.id}:${mountain.id}`,
        publicId: mountain.id,
        aliases: [],
        route: `/${region.id}/mountain/${mountain.id}`,
        lifecycle: "published",
        operatingStatus: "operating",
        name: mountain.name,
        ...(mountain.nameJa ? { nameJa: mountain.nameJa } : {}),
        prefecture,
        travelRegionId: region.id,
        baseTownId,
        coordinates: { lat: mountain.lat, lng: mountain.lng },
        elevationM: mountain.elevationM,
        ...(mountain.websiteUrl ? { officialUrl: mountain.websiteUrl } : {}),
        verificationDate: snapshotDate,
        verificationScope: "existing_public_projection_migration",
        evidence,
        intakeRelationship: intake
          ? {
              state: "candidate_match",
              method: "unique_exact_normalized_name",
              intakeRecordId: `workbook:${intake.workbookNo}`,
            }
          : {
              state: "unresolved",
              reason: matches.length > 1 ? "multiple_exact_intake_names" : "no_unique_exact_intake_name",
            },
      });
    }
  }
  const publishedById = new Map(publishedPages.map((page) => [page.pageRecordId, page]));
  const publishedNames = new Set(publishedPages.flatMap((page) => [page.publicId, ...page.aliases]));
  for (const record of intakeRecords) {
    if (record.routeMode === "new_page") {
      for (const publicName of [record.publicId, ...record.aliases]) {
        if (publishedNames.has(publicName)) {
          throw new Error(`New-page public ID/alias collides with a published page: ${publicName}`);
        }
      }
      continue;
    }
    if (record.routeMode !== "existing_page") continue;
    const page = publishedById.get(record.existingPageId);
    if (!page) throw new Error(`Unknown existingPageId: ${record.recordId}:${record.existingPageId}`);
    const expectedRoute = `/${page.travelRegionId}/mountain/${record.publicId}`;
    if (
      page.publicId !== record.publicId ||
      page.route !== expectedRoute ||
      JSON.stringify(page.aliases) !== JSON.stringify(record.aliases)
    ) {
      throw new Error(`Existing-page identity/route mismatch: ${record.recordId}`);
    }
    record.publicationReadiness.routeAlreadyPublished = true;
    if (
      record.reviewedOperatingStatus === "operating" &&
      record.readiness.evidenceComplete
    ) {
      record.lifecycle = "published";
    }
  }
  const publicationCandidates = intakeRecords
    .filter((record) => record.publicationReadiness.publishable)
    .map((record) => ({
      recordId: record.recordId,
      publicId: record.publicId,
      aliases: record.aliases,
      travelRegionId: record.travelRegionId,
      baseTownId: record.baseTownId,
      route: `/${record.travelRegionId}/mountain/${record.publicId}`,
      name: record.review?.officialNameEn ?? record.resolved.name ?? record.raw.name,
      nameJa: record.resolved.nameJa,
      coordinates: record.resolved.coordinates,
      elevation: record.resolved.elevation,
      officialUrl: record.resolved.officialUrl,
      evidence: record.evidence,
    }));
  if (
    publicationManifest.schemaVersion !== 1 ||
    publicationManifest.approvedAt !== "2026-08-26" ||
    publicationManifest.runtimeIntegrated !== true ||
    typeof publicationManifest.purpose !== "string" ||
    publicationManifest.purpose.length < 20 ||
    !Array.isArray(publicationManifest.recordIds)
  ) {
    throw new Error("Invalid publication manifest metadata");
  }
  const manifestIds = publicationManifest.recordIds;
  if (new Set(manifestIds).size !== manifestIds.length) {
    throw new Error("Publication manifest contains duplicate recordIds");
  }
  const batchStarts = publicationManifest.approvalBatchStarts;
  if (
    !Array.isArray(batchStarts) ||
    batchStarts[0] !== 0 ||
    batchStarts.some((start, index) => !Number.isInteger(start) || start < 0 || (index > 0 && start <= batchStarts[index - 1])) ||
    batchStarts.at(-1) >= manifestIds.length ||
    ![...batchStarts, manifestIds.length].every((start, index, all) => {
      if (index === all.length - 1) return true;
      const batch = manifestIds.slice(start, all[index + 1]);
      return JSON.stringify(batch) === JSON.stringify([...batch].sort(compareWorkbookRecordIds));
    })
  ) {
    throw new Error("Publication manifest entries must be deterministic workbook-ordered within each approval batch");
  }
  const candidateById = new Map(publicationCandidates.map((candidate) => [candidate.recordId, candidate]));
  const invalidManifestIds = manifestIds.filter((recordId) => !candidateById.has(recordId));
  if (invalidManifestIds.length > 0) {
    throw new Error(
      `Every publication manifest record must remain a route-ready new-page candidate; invalid: ${invalidManifestIds.join(", ")}`,
    );
  }
  const intakeById = new Map(intakeRecords.map((record) => [record.recordId, record]));
  const publishedCatalogueRecords = manifestIds.map((recordId) => {
    const candidate = candidateById.get(recordId);
    const intake = intakeById.get(recordId);
    if (
      !candidate ||
      !intake ||
      intake.routeMode !== "new_page" ||
      !intake.readiness.evidenceComplete ||
      intake.reviewedOperatingStatus !== "operating" ||
      !intake.publicationReadiness.publishable
    ) {
      throw new Error(`Manifest record is no longer route-ready: ${recordId}`);
    }
    intake.lifecycle = "published";
    return {
      recordId,
      publicId: candidate.publicId,
      aliases: candidate.aliases,
      name: candidate.name,
      nameJa: candidate.nameJa,
      coordinates: candidate.coordinates,
      forecastElevationM: candidate.elevation.topM,
      baseElevationM: candidate.elevation.baseM,
      topElevationM: candidate.elevation.topM,
      officialUrl: candidate.officialUrl,
      travelRegionId: candidate.travelRegionId,
      baseTownId: candidate.baseTownId,
      route: candidate.route,
      prefecture: intake.raw.prefecture,
      country: "Japan",
      countryCode: "JP",
      honesty: {
        operatingStatusVerified: true,
        evidenceComplete: true,
        manifestApproved: true,
        runtimeIntegrated: publicationManifest.runtimeIntegrated,
      },
    };
  });
  const evidenceCompleteVerified = intakeRecords.filter(
    (record) =>
      record.review?.reviewStatus === "verified_operating" &&
      record.readiness.evidenceComplete,
  );
  const verifiedEssentialGaps = intakeRecords.filter(
    (record) =>
      record.review?.reviewStatus === "verified_operating" &&
      !record.readiness.evidenceComplete,
  );
  const unclearReviewQueue = intakeRecords.filter(
    (record) => record.review?.reviewStatus === "unclear",
  );
  const allEligiblePublished = evidenceCompleteVerified.every(
    (record) => record.lifecycle === "published",
  );
  const allCandidatesIntegrated =
    publicationCandidates.length === publishedCatalogueRecords.length &&
    publishedCatalogueRecords.every(
      (record) => record.honesty.manifestApproved && record.honesty.runtimeIntegrated,
    );
  const noIneligiblePublishedIntake = intakeRecords
    .filter((record) => record.lifecycle === "published")
    .every(
      (record) =>
        record.review?.reviewStatus === "verified_operating" &&
        record.readiness.evidenceComplete,
    );
  const marketingApproved =
    allEligiblePublished && allCandidatesIntegrated && noIneligiblePublishedIntake;
  return {
    schemaVersion: 1,
    countryCode: "JP",
    generatedAt,
    sources: [
      {
        sourceId: "japan-ski-resorts-558",
        kind: "national_intake_workbook",
        recordCount: workbook.length,
        location: "attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx",
      },
      {
        sourceId: "existing-japan-region-projection",
        kind: "existing_public_frontend_pages",
        recordCount: publishedPages.length,
        location: "artifacts/feelzlike/src/regions/*.ts",
      },
      {
        sourceId: "ski-directory-wikidata-osm-merge",
        kind: "candidate_provenance",
        recordCount: evidenceSnapshot.directory.length,
        location: "lib/japan-ski-catalogue/data/directory-evidence.json",
        summary: evidenceSnapshot.summary,
      },
      {
        sourceId: "japan-open-intake-reviews",
        kind: "review_batches",
        recordCount: reviewSource.reviews.size,
        location: "lib/japan-ski-catalogue/data/reviews/*.json",
      },
      {
        sourceId: "japan-travel-clusters",
        kind: "verified_travel_assignments",
        recordCount: foundation.assignments.size,
        location: "lib/japan-ski-catalogue/data/travel-clusters.json",
      },
      {
        sourceId: "japan-public-identities",
        kind: "verified_public_identities",
        recordCount: foundation.identities.size,
        location: "lib/japan-ski-catalogue/data/public-identities.json",
      },
      {
        sourceId: "japan-verified-evidence-supplement",
        kind: "official_field_supplements",
        recordCount: foundation.supplementById.size,
        location: "lib/japan-ski-catalogue/data/verified-evidence-supplement.json",
      },
      {
        sourceId: "japan-publication-manifest",
        kind: "runtime_publication_approval",
        recordCount: manifestIds.length,
        location: "lib/japan-ski-catalogue/data/publication-manifest.json",
      },
    ],
    policy: {
      launchPolicyId: "verified_evidence_complete_only",
      launchPolicyDescription:
        "Public launch covers only verified-operating, evidence-complete records whose publication lifecycle is published; it does not claim coverage of every operating Japanese ski area.",
      allowedLifecycles: ["draft", "verified", "published"],
      publishableOperatingStatuses: ["operating"],
      marketingApproved,
      marketingGateReason:
        marketingApproved
          ? "Verified-only evidence-complete coverage is approved; unclear and essential-gap records remain excluded from public coverage."
          : "Verified-only coverage is blocked because at least one eligible record is unpublished or ineligible data entered the public projection.",
      cleanGate: {
        verifiedEvidenceCompleteRecords: evidenceCompleteVerified.length,
        lifecyclePublishedRecords: evidenceCompleteVerified.filter(
          (record) => record.lifecycle === "published",
        ).length,
        routeReadyNewCandidates: publicationCandidates.length,
        manifestIntegratedNewRecords: publishedCatalogueRecords.length,
        reviewQueueExcludedPendingEvidence:
          unclearReviewQueue.length + verifiedEssentialGaps.length,
        unclearOrNotVerifiableRecords: unclearReviewQueue.length,
        verifiedEssentialGapRecords: verifiedEssentialGaps.length,
      },
    },
    frontendRegionSources: frontendRegions.map(({ sourcePath, region }) => ({
      regionId: region.id,
      sourcePath,
    })),
    travelRegions: travelClusters.regions,
    intakeRecords,
    publishedPages,
    publicationCandidates,
    publishedCatalogueRecords,
  };
}

const catalogue = await buildCatalogue();
const publicRuntime = {
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
const generated = `${JSON.stringify(catalogue, null, 2)}\n`;
const publicRuntimeGenerated = `${JSON.stringify(publicRuntime, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const [current, currentPublicRuntime] = await Promise.all([
    readFile(outputPath, "utf8").catch(() => ""),
    readFile(publicRuntimeOutputPath, "utf8").catch(() => ""),
  ]);
  if (current !== generated || currentPublicRuntime !== publicRuntimeGenerated) {
    process.stderr.write("Japan catalogue drift detected. Run the catalogue generate script and commit the result.\n");
    process.exitCode = 1;
  } else {
    process.stdout.write("Japan catalogue generated data is up to date.\n");
  }
} else {
  await Promise.all([
    writeFile(outputPath, generated, "utf8"),
    writeFile(publicRuntimeOutputPath, publicRuntimeGenerated, "utf8"),
  ]);
  process.stdout.write("Generated canonical Japan ski-area catalogue.\n");
}