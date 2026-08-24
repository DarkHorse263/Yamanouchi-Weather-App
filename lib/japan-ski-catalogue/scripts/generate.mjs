import { readFile, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const outputPath = `${packageRoot}generated/japan-catalogue.json`;
const workbookPath = `${workspaceRoot}attached_assets/Japan_Ski_Resorts_558_1783900482697.xlsx`;
const evidencePath = `${packageRoot}data/directory-evidence.json`;
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

function readinessFor(directory) {
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
  const missingReasons = directory
    ? Object.entries(essentials)
        .filter(([, ready]) => !ready)
        .map(([essential]) => `missing_${essential.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`)
    : ["unresolved_directory_match"];
  return {
    basis: directory ? "unique_exact_normalized_name" : "unresolved",
    essentials,
    evidenceComplete: directory !== undefined && Object.values(essentials).every(Boolean),
    missingReasons,
    requiredReviews: ["operating_status", "travel_cluster"],
  };
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
  const [workbook, frontendRegions, evidenceSnapshot] = await Promise.all([
    readWorkbookRows(),
    readFrontendRegions(),
    readFile(evidencePath, "utf8").then(JSON.parse),
  ]);
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
    return {
      recordId: `workbook:${row.workbookNo}`,
      lifecycle: "draft",
      operatingStatus: statusMap[row.status],
      source: {
        sourceId: "japan-ski-resorts-558",
        rowIdentity: String(row.workbookNo),
        rawName: row.name,
      },
      raw: row,
      evidence: [
        {
          evidenceId: `intake:${row.workbookNo}`,
          sourceType: "national_intake_workbook",
          sourceRef: "Japan_Ski_Resorts_558_1783900482697.xlsx",
        },
        ...(directory ? [directoryEvidence(directory)] : []),
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
      readiness: readinessFor(directory),
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
    ],
    policy: {
      allowedLifecycles: ["draft", "verified", "published"],
      publishableOperatingStatuses: ["operating"],
      marketingApproved: false,
      marketingGateReason:
        "National launch is blocked until every unresolved operating intake candidate is verified and has a weather page.",
      cleanGate: {
        unresolvedOperatingCandidates: intakeRecords.filter(
          (record) => record.operatingStatus === "operating" && record.lifecycle === "draft",
        ).length,
        evidenceCompleteCandidates: intakeRecords.filter(
          (record) =>
            record.operatingStatus === "operating" &&
            record.directoryRelationship.state === "candidate_match" &&
            record.readiness.evidenceComplete,
        ).length,
        requiredReviews: ["operating_status", "travel_cluster", "weather_page"],
      },
    },
    frontendRegionSources: frontendRegions.map(({ sourcePath, region }) => ({
      regionId: region.id,
      sourcePath,
    })),
    intakeRecords,
    publishedPages,
  };
}

const generated = `${JSON.stringify(await buildCatalogue(), null, 2)}\n`;
if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== generated) {
    process.stderr.write("Japan catalogue drift detected. Run the catalogue generate script and commit the result.\n");
    process.exitCode = 1;
  } else {
    process.stdout.write("Japan catalogue generated data is up to date.\n");
  }
} else {
  await writeFile(outputPath, generated, "utf8");
  process.stdout.write("Generated canonical Japan ski-area catalogue.\n");
}