// One absolute Sydney window for both browser and server, regardless of host timezone.
// Date-only environment overrides retain their existing local-day semantics.
export const DEFAULT_PROMO_STARTS_AT = "2026-06-01T00:00:00.000+10:00";
export const DEFAULT_PROMO_ENDS_AT = "2026-12-31T23:59:59.999+11:00";

// ─────────────────────────────────────────────────────────────────────────────
// Australian 2026 season closure policy
//
// This is deliberately a dated, year-scoped policy rather than a permanent
// country-season rule. It records the user's confirmed operational state as of
// 16 September 2026 in Sydney, while keeping Perisher on its live feed.
// Callers pass a mountain/resort id (not a gateway town id).
// ─────────────────────────────────────────────────────────────────────────────

export const AU_SEASON_CLOSURE_POLICY = Object.freeze({
  seasonYear: 2026,
  effectiveDateSydney: "2026-09-16",
  countryCode: "AU",
  exceptionLocationIds: Object.freeze(["perisher"] as const),
});

export interface AuSeasonClosureInput {
  countryCode: string | null | undefined;
  locationId: string;
  now?: Date;
  /**
   * Optional explicit season-year assertion for callers that are evaluating a
   * saved/archived season. The live policy still only applies while Sydney's
   * calendar year is the policy year.
   */
  seasonYear?: number;
}

function sydneyCalendarDate(now: Date): { year: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(values.year);
  const month = values.month ?? "01";
  const day = values.day ?? "01";
  return { year, date: `${values.year}-${month}-${day}` };
}

/**
 * Whether a current AU mountain/resort is covered by the confirmed 2026
 * closure. Non-AU locations, Perisher, dates before the effective date and
 * later calendar years all return false.
 */
export function isAuSeasonClosureActive({
  countryCode,
  locationId,
  now = new Date(),
  seasonYear,
}: AuSeasonClosureInput): boolean {
  if (countryCode !== AU_SEASON_CLOSURE_POLICY.countryCode) return false;
  if (AU_SEASON_CLOSURE_POLICY.exceptionLocationIds.includes(locationId as "perisher")) {
    return false;
  }

  const local = sydneyCalendarDate(now);
  if (local.year !== AU_SEASON_CLOSURE_POLICY.seasonYear) return false;
  if (seasonYear != null && seasonYear !== AU_SEASON_CLOSURE_POLICY.seasonYear) return false;
  return local.date >= AU_SEASON_CLOSURE_POLICY.effectiveDateSydney;
}
