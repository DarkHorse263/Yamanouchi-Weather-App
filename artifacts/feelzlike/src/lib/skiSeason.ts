// ─────────────────────────────────────────────────────────────────────────────
// skiSeason.ts - deterministic "could lifts plausibly be running?" season gate.
//
// This is the FRONTEND mirror of the road-chain season windows the api-server
// uses in routes/roads.ts (isAuSnowSeason / isJpSnowSeason / isNzSnowSeason).
// Keeping the windows identical means the lift panel and the road-chain panel
// agree on when a resort is in season.
//
// It answers ONLY "is this the time of year lifts could be turning?" - it is
// NOT a live lift-status feed and says nothing about today's snow or wind.
// Actual operation also depends on snow depth + resort decisions, which the
// caller layers on top (see LiftWindHoldPanel).
//
// Pure module by design: no `@/regions` import (that pulls in PNG assets and
// breaks `tsx --test`). The country union is structurally identical to
// `CountryCode` from `@/regions`, so callers can pass `REGION_COUNTRY[id]`
// straight in.
// ─────────────────────────────────────────────────────────────────────────────

export type SkiCountry = "AU" | "JP" | "NZ";

/**
 * Whether the country's ski-lift season is open on `now`.
 *
 *   AU · 10 Jun – 10 Oct   (Queen's Birthday long weekend to early October)
 *   NZ · 10 Jun – 10 Oct   (southern-hemisphere winter; same window, kept
 *                            separate so copy never implies an AU authority)
 *   JP · Dec – Apr         (month === 11 || month <= 3)
 *
 * @param country - resort country code (matches `CountryCode` from `@/regions`)
 * @param now - optional override for "current time" (tests pass a fixed Date).
 */
export function isLiftSeasonOpen(country: SkiCountry, now: Date = new Date()): boolean {
  const m = now.getMonth(); // 0-indexed
  const d = now.getDate();
  switch (country) {
    case "AU":
    case "NZ":
      // 10 Jun – 10 Oct inclusive
      if (m === 5) return d >= 10; // June
      if (m === 6 || m === 7 || m === 8) return true; // Jul / Aug / Sep
      if (m === 9) return d <= 10; // October
      return false;
    case "JP":
      return m === 11 || m <= 3; // Dec – Apr
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lift operation status - the honesty gate that decides whether the wind-hold
// panel may speak as if lifts are running, or must reframe its wind read as a
// conditional "for when the resort is open" outlook.
// ─────────────────────────────────────────────────────────────────────────────

/** In-season snow depth (cm) at/under which lifts plausibly cannot run. */
export const NO_SNOW_CM = 2;

export type LiftOperationStatus = "operating" | "off_season" | "no_lifts_open" | "no_snow";

export interface LiftOperationInput {
  /** Whether the country's lift season is open (see `isLiftSeasonOpen`). */
  seasonOpen: boolean;
  /** Latest snow depth in cm if known. null/undefined = unknown (NOT zero). */
  snowDepthCm?: number | null;
  /** Real lift count currently open, when an authoritative feed exists (AU). */
  actualLiftsOpen?: number | null;
  /** Real total lift count, when an authoritative feed exists (AU). */
  actualTotalLifts?: number | null;
}

/**
 * Decide whether lifts can plausibly be running, in strict priority order:
 *
 *   1. off_season   - season closed beats everything; lifts definitively idle.
 *   2. live feed     - an authoritative lift feed (AU) wins over model snow:
 *                        0 of N open  -> no_lifts_open
 *                        any open      -> operating  (trusted over a ~0 model snow read)
 *   3. no_snow       - no live feed AND a KNOWN near-zero snow depth.
 *   4. operating     - otherwise.
 *
 * snowDepthCm null/undefined means "unknown" and never forces a closure, so an
 * in-season resort with no snow report still shows the normal wind forecast.
 */
export function computeLiftOperationStatus({
  seasonOpen,
  snowDepthCm,
  actualLiftsOpen,
  actualTotalLifts,
}: LiftOperationInput): LiftOperationStatus {
  if (!seasonOpen) return "off_season";
  if (actualTotalLifts != null && actualTotalLifts > 0 && actualLiftsOpen != null) {
    return actualLiftsOpen === 0 ? "no_lifts_open" : "operating";
  }
  if (snowDepthCm != null && snowDepthCm < NO_SNOW_CM) return "no_snow";
  return "operating";
}
