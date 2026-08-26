import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const catalogue = JSON.parse(
  await readFile(`${packageRoot}generated/japan-catalogue.json`, "utf8"),
);
const outputPath = `${workspaceRoot}exports/japan-pending-evidence-233.csv`;
const checkOnly = process.argv.includes("--check");

const columns = [
  "exclusion_group",
  "record_id",
  "workbook_no",
  "name",
  "name_ja",
  "prefecture",
  "municipality",
  "travel_region",
  "base_town",
  "review_status",
  "missing_essentials",
  "official_url",
  "status_evidence_url",
  "evidence_as_of",
  "review_notes",
];

const csvCell = (value) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

const records = catalogue.intakeRecords
  .filter(
    (record) =>
      record.review?.reviewStatus === "unclear" ||
      (record.review?.reviewStatus === "verified_operating" &&
        !record.readiness.evidenceComplete),
  )
  .sort(
    (left, right) =>
      left.raw.prefecture.localeCompare(right.raw.prefecture) ||
      Number(left.raw.workbookNo) - Number(right.raw.workbookNo) ||
      left.recordId.localeCompare(right.recordId),
  )
  .map((record) => ({
    exclusion_group:
      record.review.reviewStatus === "unclear"
        ? "unclear_status_pending_authoritative_evidence"
        : "verified_operating_missing_essentials",
    record_id: record.recordId,
    workbook_no: record.raw.workbookNo,
    name: record.review.officialNameEn || record.resolved.name || record.raw.name,
    name_ja: record.resolved.nameJa || record.review.officialNameJa,
    prefecture: record.raw.prefecture,
    municipality: record.raw.municipality,
    travel_region: record.travelRegionId,
    base_town: record.baseTownId,
    review_status: record.review.reviewStatus,
    missing_essentials: record.readiness.missingReasons.join("; "),
    official_url: record.resolved.officialUrl || record.review.officialUrl,
    status_evidence_url: record.review.statusEvidenceUrl,
    evidence_as_of: record.review.evidenceAsOf,
    review_notes: record.review.notes,
  }));

if (records.length !== 232) {
  throw new Error(`Expected 232 pending-evidence records; found ${records.length}`);
}
const unclearCount = records.filter(
  (record) => record.exclusion_group === "unclear_status_pending_authoritative_evidence",
).length;
const essentialGapCount = records.filter(
  (record) => record.exclusion_group === "verified_operating_missing_essentials",
).length;
if (unclearCount !== 208 || essentialGapCount !== 24) {
  throw new Error(
    `Expected 208 unclear and 24 essential-gap records; found ${unclearCount} and ${essentialGapCount}`,
  );
}

const csv = [
  columns.map(csvCell).join(","),
  ...records.map((record) => columns.map((column) => csvCell(record[column])).join(",")),
].join("\n");

await mkdir(`${workspaceRoot}exports`, { recursive: true });
const expected = `${csv}\n`;
if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => null);
  if (current !== expected) {
    throw new Error(
      "Pending-evidence CSV is missing or stale; run pnpm --filter @workspace/japan-ski-catalogue export:pending-evidence",
    );
  }
  process.stdout.write(
    `Pending-evidence CSV is current: ${records.length} records (${unclearCount} unclear, ${essentialGapCount} essential-gap).\n`,
  );
} else {
  await writeFile(outputPath, expected);
  process.stdout.write(
    `Wrote ${records.length} pending-evidence records (${unclearCount} unclear, ${essentialGapCount} essential-gap) to ${outputPath}\n`,
  );
}