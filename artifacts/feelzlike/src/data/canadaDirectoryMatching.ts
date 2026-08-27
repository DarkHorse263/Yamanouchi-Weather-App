import { publishedCatalogueRecords } from "@workspace/canada-ski-catalogue/public-runtime";
import type { PublishedCanadaSkiRecord } from "@workspace/canada-ski-catalogue";
import { CANADA_DIRECTORY, type CanadaDirectoryEntry } from "./canadaDirectory";

export function normalizedCanadaDirectoryName(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\b(mount|mt)\b/g, "mount").replace(/[^a-z0-9]+/g, " ").trim();
}
function normalizedHost(value: string | null): string {
  if (!value) return "";
  try { return new URL(value).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}
function comparableName(value: string): string {
  return normalizedCanadaDirectoryName(value)
    .replace(/\b(ski|snowboard|hill|resort|regional|park|at|and|the)\b/g, "")
    .replace(/\s+/g, " ").trim();
}

const PROVINCE_CODE_BY_NAME: Record<string, CanadaDirectoryEntry["province"]> = {
  "British Columbia": "BC", Alberta: "AB", Saskatchewan: "SK", Manitoba: "MB",
  Ontario: "ON", Quebec: "QC", "New Brunswick": "NB", "Nova Scotia": "NS",
  "Prince Edward Island": "PE", "Newfoundland and Labrador": "NL",
};

function directoryMatchScore(entry: CanadaDirectoryEntry, record: PublishedCanadaSkiRecord): number {
  if (entry.province !== PROVINCE_CODE_BY_NAME[record.province]) return 0;
  const entryName = comparableName(entry.name);
  const recordNames = [record.name, ...record.aliases].map(comparableName);
  if (recordNames.includes(entryName)) return 3;
  if (normalizedHost(entry.website) && normalizedHost(entry.website) === normalizedHost(record.officialUrl)) return 2;
  return recordNames.some((candidate) => candidate.includes(entryName) || entryName.includes(candidate)) ? 1 : 0;
}

export function directoryEntryMatchesRecord(entry: CanadaDirectoryEntry, record: PublishedCanadaSkiRecord): boolean {
  return directoryMatchScore(entry, record) > 0;
}

// One unambiguous directory row per published record. Exact names outrank a
// shared official host, which in turn outranks a normalized partial name.
const matchedEntries = publishedCatalogueRecords.map((record) => {
  const matches = CANADA_DIRECTORY
    .map((entry) => ({ entry, score: directoryMatchScore(entry, record) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  if (!matches[0]) throw new Error(`Canada catalogue record has no directory match: ${record.recordId}`);
  if (matches[1]?.score === matches[0].score) {
    throw new Error(`Canada catalogue record has ambiguous directory matches: ${record.recordId}`);
  }
  return matches[0].entry;
});
if (new Set(matchedEntries.map((entry) => entry.infoUrl)).size !== matchedEntries.length) {
  throw new Error("Canada directory matching assigned one listing to multiple published records");
}
export const canadaDirectoryMatchingSummary = {
  matchedRecords: publishedCatalogueRecords,
  matchedEntries,
  outboundEntries: CANADA_DIRECTORY.filter((entry) => !matchedEntries.includes(entry)),
};