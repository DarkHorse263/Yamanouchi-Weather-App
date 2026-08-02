// ─────────────────────────────────────────────────────────────────────────────
// skiSeason.ts - deterministic "could lifts plausibly be running?" season gate.
//
// This is the FRONTEND mirror of the road-chain season windows the api-server
// uses in routes/roads.ts (isAuSnowSeason / isJpSnowSeason / isNzSnowSeason /
// isCaSnowSeason).
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

export type SkiCountry = "AU" | "JP" | "NZ" | "CA";

/**
 * Whether the country's ski-lift season is open on `now`.
 *
 *   AU · 10 Jun – 10 Oct   (Queen's Birthday long weekend to early October)
 *   NZ · 10 Jun – 10 Oct   (southern-hemisphere winter; same window, kept
 *                            separate so copy never implies an AU authority)
 *   JP · Dec – Apr         (month === 11 || month <= 3)
 *   CA · 15 Nov – 15 May   (Coast Mountains / Canadian Rockies; Sunshine and
 *                            Whistler push into late May. Québec runs shorter,
 *                            roughly late Nov to mid-Apr, so it sits inside
 *                            the same window)
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
    case "CA":
      // 15 Nov – 15 May inclusive
      if (m === 10) return d >= 15; // November
      if (m === 11 || m <= 3) return true; // Dec – Apr
      if (m === 4) return d <= 15; // May
      return false;
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
  /**
   * Provenance of `snowDepthCm`. Weather-model depth ("model", the default)
   * can NEVER force the `no_snow` negative - models are blind to snowmaking,
   * so a ~0 model read mid-season regularly coexists with lifts running on
   * machine-made base (the July 2026 "no skiable base while lifts spin" bug).
   * "course" = an official off-resort snow-course measurement (e.g. Snowy
   * Hydro's weekly Spencers Creek reading): measured, so it may inform the
   * display, but natural-snow-only + off-site + up to a week old, so like
   * "model" it may never assert no_snow. Only the resort's own figure
   * ("reported") may assert that lifts plausibly cannot run. Defaulting to
   * "model" means a forgetful caller fails SAFE (no false closure).
   */
  snowDepthSource?: "model" | "reported" | "course";
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
 *   3. no_snow       - no live feed AND a KNOWN near-zero snow depth that is
 *                      REPORTED (authoritative). Model depth never triggers
 *                      this - see `snowDepthSource` on LiftOperationInput.
 *   4. operating     - otherwise.
 *
 * snowDepthCm null/undefined means "unknown" and never forces a closure, so an
 * in-season resort with no snow report still shows the normal wind forecast.
 */
export function computeLiftOperationStatus({
  seasonOpen,
  snowDepthCm,
  snowDepthSource = "model",
  actualLiftsOpen,
  actualTotalLifts,
}: LiftOperationInput): LiftOperationStatus {
  if (!seasonOpen) return "off_season";
  if (actualTotalLifts != null && actualTotalLifts > 0 && actualLiftsOpen != null) {
    return actualLiftsOpen === 0 ? "no_lifts_open" : "operating";
  }
  if (snowDepthSource === "reported" && snowDepthCm != null && snowDepthCm < NO_SNOW_CM) {
    return "no_snow";
  }
  return "operating";
}

// ─────────────────────────────────────────────────────────────────────────────
// "Skiable now" read - the present-tense "is there anything to ski RIGHT NOW"
// signal, kept deliberately SEPARATE from the forward-looking Powder Window
// (which detects *incoming* snow). A powder window can show fresh snow while
// the base is absent and the mountain is unskiable; pairing the two honestly
// stops a fresh-snow signal from implying skiability.
//
// Derived FROM computeLiftOperationStatus (it is called here, never
// re-implemented) so this read can NEVER contradict the lift-hold panel for
// the same inputs.
// ─────────────────────────────────────────────────────────────────────────────

export type SkiableNowRead =
  | { kind: "off_season" }
  | { kind: "no_base" }
  | { kind: "lifts_closed" }
  | { kind: "lifts_open"; liftsOpen: number; totalLifts: number }
  | {
      kind: "unverified";
      baseCm: number | null;
      /**
       * Where baseCm came from: "reported" = the resort's own official feed
       * (trustworthy enough to caption "resort reported"), "course" = an
       * official off-resort snow-course measurement (captioned by course
       * name), "model" = weather model estimate. Mirrors snowDepthSource on
       * LiftOperationInput.
       */
      baseSource: "model" | "reported" | "course";
    };

/**
 * Turn raw season/base/lift inputs into an honest "skiable now" read.
 *
 * Honesty rules baked in:
 *   - The ONLY authoritative positive ("lifts_open") comes from a verified live
 *     lift feed reporting lifts actually open. Model base depth NEVER asserts
 *     skiability, and (being blind to snowmaking) never asserts UNskiability
 *     either - only a "reported" depth may force the negative ("no_base") via
 *     the NO_SNOW_CM floor in computeLiftOperationStatus.
 *   - Unknown base (snowDepthCm null/undefined) implies NEITHER skiable nor
 *     unskiable -> "unverified" with baseCm null ("base not reported").
 *   - Priority mirrors computeLiftOperationStatus exactly, so this can never
 *     contradict the wind-hold panel driven by the same gate.
 */
export function deriveSkiableNowRead(
  input: LiftOperationInput & { liveStatusKnown?: boolean },
): SkiableNowRead {
  const { snowDepthCm, actualLiftsOpen, actualTotalLifts, liveStatusKnown = true } = input;
  const status = computeLiftOperationStatus(input);
  switch (status) {
    case "off_season":
      return { kind: "off_season" };
    case "no_snow":
      return { kind: "no_base" };
    case "no_lifts_open":
      return { kind: "lifts_closed" };
    case "operating":
      if (
        liveStatusKnown &&
        actualTotalLifts != null &&
        actualTotalLifts > 0 &&
        actualLiftsOpen != null &&
        actualLiftsOpen > 0
      ) {
        return { kind: "lifts_open", liftsOpen: actualLiftsOpen, totalLifts: actualTotalLifts };
      }
      return {
        kind: "unverified",
        baseCm: snowDepthCm ?? null,
        baseSource: input.snowDepthSource ?? "model",
      };
  }
}
