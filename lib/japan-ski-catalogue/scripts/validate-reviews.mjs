import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { japanCatalogue as catalogue } from "../index.js";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const reviewsRoot = `${packageRoot}data/reviews`;
const errors = [];
const allowedStatuses = new Set([
  "verified_operating",
  "temporarily_closed",
  "closed",
  "merged_into",
  "unclear",
]);
const allowedConfidence = new Set(["high", "medium", "low"]);

function check(condition, message) {
  if (!condition) errors.push(message);
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isHttpUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const openIntake = new Map(
  catalogue.intakeRecords
    .filter((record) => record.operatingStatus === "operating")
    .map((record) => [record.recordId, record]),
);
const reviewFiles = (await readdir(reviewsRoot))
  .filter((fileName) => fileName.endsWith(".json"))
  .sort();
const reviewed = new Map();
const statusCounts = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));

for (const fileName of reviewFiles) {
  const filePath = `${reviewsRoot}/${fileName}`;
  let batch;
  try {
    batch = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${fileName}: invalid JSON (${error.message})`);
    continue;
  }

  check(batch.schemaVersion === 1, `${fileName}: unsupported schemaVersion`);
  check(isIsoDate(batch.reviewedAt), `${fileName}: reviewedAt must be YYYY-MM-DD`);
  check(Array.isArray(batch.prefectures) && batch.prefectures.length > 0, `${fileName}: missing prefectures`);
  check(Array.isArray(batch.records), `${fileName}: records must be an array`);
  if (!Array.isArray(batch.records)) continue;

  for (const review of batch.records) {
    const prefix = `${fileName}:${review.recordId ?? "<missing-recordId>"}`;
    const intake = openIntake.get(review.recordId);
    check(Boolean(intake), `${prefix}: does not identify an open intake row`);
    if (!intake) continue;

    check(!reviewed.has(review.recordId), `${prefix}: duplicate review also present in ${reviewed.get(review.recordId)}`);
    reviewed.set(review.recordId, fileName);
    check(batch.prefectures.includes(intake.raw.prefecture), `${prefix}: prefecture is outside this batch`);
    check(review.rawName === intake.raw.name, `${prefix}: rawName does not match the intake workbook`);
    check(review.prefecture === intake.raw.prefecture, `${prefix}: prefecture does not match the intake workbook`);
    check(allowedStatuses.has(review.reviewStatus), `${prefix}: invalid reviewStatus`);
    if (allowedStatuses.has(review.reviewStatus)) statusCounts[review.reviewStatus] += 1;
    check(isIsoDate(review.evidenceAsOf), `${prefix}: evidenceAsOf must be YYYY-MM-DD`);
    check(typeof review.notes === "string", `${prefix}: notes must be a string`);

    if (review.officialUrl !== undefined && review.officialUrl !== null && review.officialUrl !== "") {
      check(isHttpUrl(review.officialUrl), `${prefix}: officialUrl is invalid`);
    }
    if (
      review.statusEvidenceUrl !== undefined &&
      review.statusEvidenceUrl !== null &&
      review.statusEvidenceUrl !== ""
    ) {
      check(isHttpUrl(review.statusEvidenceUrl), `${prefix}: statusEvidenceUrl is invalid`);
    }

    if (review.reviewStatus === "verified_operating") {
      check(isHttpUrl(review.officialUrl), `${prefix}: verified operating row requires officialUrl`);
      check(isHttpUrl(review.statusEvidenceUrl), `${prefix}: verified operating row requires statusEvidenceUrl`);
      check(
        typeof review.statusEvidenceQuote === "string" && review.statusEvidenceQuote.trim().length >= 8,
        `${prefix}: verified operating row requires a factual statusEvidenceQuote`,
      );
      check(
        typeof review.officialNameJa === "string" && review.officialNameJa.trim().length > 0,
        `${prefix}: verified operating row requires officialNameJa`,
      );
    }

    if (review.reviewStatus === "merged_into") {
      const hasCatalogueTarget =
        typeof review.mergedIntoRecordId === "string" && openIntake.has(review.mergedIntoRecordId);
      const hasNamedSuccessor =
        typeof review.mergedIntoOfficialName === "string" &&
        review.mergedIntoOfficialName.trim().length > 0 &&
        isHttpUrl(review.officialUrl) &&
        isHttpUrl(review.statusEvidenceUrl);
      check(
        hasCatalogueTarget || hasNamedSuccessor,
        `${prefix}: merged row requires a valid intake target or named official successor`,
      );
      if (hasCatalogueTarget) {
        check(review.mergedIntoRecordId !== review.recordId, `${prefix}: row cannot merge into itself`);
      }
    }

    check(
      typeof review.travelClusterLabel === "string" && review.travelClusterLabel.trim().length > 0,
      `${prefix}: missing travelClusterLabel`,
    );
    check(
      typeof review.baseTownLabel === "string" && review.baseTownLabel.trim().length > 0,
      `${prefix}: missing baseTownLabel`,
    );
    check(allowedConfidence.has(review.clusterConfidence), `${prefix}: invalid clusterConfidence`);
  }
}

for (const recordId of openIntake.keys()) {
  check(reviewed.has(recordId), `Missing review for open intake row: ${recordId}`);
}
check(
  reviewed.size === openIntake.size,
  `Expected ${openIntake.size} unique open-row reviews; found ${reviewed.size}`,
);

if (errors.length > 0) {
  for (const error of errors) process.stderr.write(`ERROR ${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Japan reviews valid: ${reviewed.size} open rows across ${reviewFiles.length} batches; ` +
      [...allowedStatuses].map((status) => `${status}=${statusCounts[status]}`).join(", ") +
      ".\n",
  );
}