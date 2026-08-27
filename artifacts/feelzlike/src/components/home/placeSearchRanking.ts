export interface SearchableCuratedEntry {
  kind: "town" | "mountain" | "region";
  name: string;
  extraKeys: string[];
  jaKeys: string[];
}

const COMMON_RESORT_SUFFIXES = new Set(["resort"]);

export function normalizePlaceSearchText(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "");
}

function meaningfulTokens(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !COMMON_RESORT_SUFFIXES.has(token));
}

/**
 * Keeps the established single-term ranking, then accepts detailed English
 * queries when every meaningful token is present across the entry name and
 * its location keys. This makes punctuation and "resort" harmless without
 * allowing an unmatched state or province to broaden the result set.
 */
export function scoreCuratedEntry(
  entry: SearchableCuratedEntry,
  query: string,
): number | null {
  const raw = query.trim();
  const normalizedQuery = normalizePlaceSearchText(raw);
  const normalizedName = normalizePlaceSearchText(entry.name);

  if (normalizedQuery && normalizedName.startsWith(normalizedQuery)) return 0;
  if (normalizedQuery && normalizedName.includes(normalizedQuery)) return 1;
  if (
    normalizedQuery &&
    entry.extraKeys.some((key) => key.includes(normalizedQuery))
  ) {
    return 2;
  }
  if (raw && entry.jaKeys.some((key) => key.includes(raw))) return 0;

  const tokens = meaningfulTokens(raw);
  if (tokens.length < 2) return null;
  const searchable = [entry.name, ...entry.extraKeys]
    .flatMap(meaningfulTokens);
  const nameTokens = meaningfulTokens(entry.name);
  if (
    nameTokens.some((token) => tokens.includes(token)) &&
    tokens.every((token) => searchable.some((key) => key.includes(token)))
  ) {
    return 0;
  }
  return null;
}