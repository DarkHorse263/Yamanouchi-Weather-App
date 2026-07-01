/**
 * Trip planner · pure window scoring ("find the best window to go").
 *
 * This module has ZERO imports on purpose. The catalog + persistence helpers
 * in `tripPlanner.ts` pull in the region registry, which imports PNG wordmarks
 * that node/tsx can't load · keeping the scorer self-contained means it stays
 * unit-testable under `tsx --test`.
 *
 * The planner takes the saved mountains a rider is choosing between plus each
 * mountain's ensemble forecast, then finds the best contiguous 2 or 3 day
 * window to go · across all of them. It scores each day, rolls days up into
 * windows, and ranks every candidate window so the single best jumps out with
 * honest alternatives behind it.
 *
 * Honesty posture: a mountain whose forecast failed or came back empty is
 * surfaced as a `gap`, never silently dropped or faked into a low score.
 */

// ─── Contracts ────────────────────────────────────────────────────────────

/** The confidence a single ensemble day carries. `single` = one model only. */
export type DayConfidence = "high" | "medium" | "low" | "single";

/**
 * The slice of the backend `EnsembleDay` the planner actually scores. Kept as
 * a structural subset so `TownEnsembleDay` / the `/forecast/:id` response map
 * straight onto it without this module importing either.
 */
export interface PlannerForecastDay {
  date: string; // YYYY-MM-DD
  tempMaxMean: number; // °C, mid-mountain
  tempMinMean: number; // °C
  precipMean: number; // mm
  snowMean: number; // cm, fresh
  snowSpread: number; // cm, model disagreement
  sourcesCount: number; // models contributing
  confidence: "high" | "medium" | "low";
}

/** A saved mountain the rider is comparing. Metadata only · no coordinates. */
export interface PlannerMountain {
  key: string; // stable composite key (regionId:mountainId)
  name: string;
  regionId: string;
  regionLabel?: string;
}

/** Per-mountain forecast state handed to the ranker (fail-soft). */
export type PlannerForecastEntry =
  | { status: "ok"; days: PlannerForecastDay[] }
  | { status: "error" }
  | { status: "loading" };

/** A scored single day inside a window. */
export interface ScoredDay {
  date: string;
  score: number; // 0-100, confidence-adjusted
  snowCm: number;
  tempMaxC: number;
  precipMm: number;
  confidence: DayConfidence;
}

/** A ranked candidate window at one mountain. */
export interface WindowCandidate {
  mountainKey: string;
  mountainName: string;
  regionId: string;
  regionLabel?: string;
  startDate: string;
  endDate: string;
  lengthDays: number; // 2 or 3
  score: number; // 0-100
  days: ScoredDay[];
  totalSnowCm: number;
  peakSnowCm: number;
  confidenceLabel: "high" | "medium" | "low" | "single" | "mixed";
  confidenceRank: number; // higher = models agree more, for tie-breaks
}

/** Why a saved mountain couldn't contribute a window. */
export interface PlannerGap {
  mountainKey: string;
  mountainName: string;
  reason: "error" | "no-data" | "loading";
}

export interface TripWindowRanking {
  best: WindowCandidate | null;
  alternatives: WindowCandidate[];
  gaps: PlannerGap[];
}

// ─── Tuning constants ───────────────────────────────────────────────────────

/** Look only at the near-term forecast · beyond ~7 days the ensemble is noise. */
const MAX_FORECAST_DAYS = 7;
/** Fresh snow (cm/day) that earns full snow marks. 20cm is a big AU day. */
const SNOW_FULL_CM = 20;
/** Window lengths the planner offers · a short trip and a long weekend. */
const WINDOW_LENGTHS = [2, 3] as const;

/** Component ceilings · they sum to 100 before the confidence multiplier. */
const SNOW_WEIGHT = 55;
const TEMP_WEIGHT = 25;
const PRECIP_WEIGHT = 10;
const CONF_WEIGHT = 10;

/**
 * Confidence multiplier applied to the whole day score. Confidence is counted
 * twice on purpose · once as a component and once here · so a low-agreement
 * day is pushed well down the ranking rather than tying a rock-solid one.
 */
const CONF_MULTIPLIER: Record<DayConfidence, number> = {
  high: 1.0,
  medium: 0.85,
  low: 0.65,
  single: 0.75,
};

/** The confidence component (0-CONF_WEIGHT). */
const CONF_COMPONENT: Record<DayConfidence, number> = {
  high: CONF_WEIGHT,
  medium: 6,
  low: 3,
  single: 5,
};

/** Numeric rank for sorting · higher agreement wins ties. */
const CONF_RANK: Record<DayConfidence, number> = {
  high: 4,
  medium: 3,
  single: 2,
  low: 1,
};

// ─── Per-day scoring ────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** A day with one or zero models is "single", otherwise its stated confidence. */
export function effectiveConfidence(day: PlannerForecastDay): DayConfidence {
  return day.sourcesCount <= 1 ? "single" : day.confidence;
}

/** Snow component · linear up to SNOW_FULL_CM, the dominant factor. */
function snowComponent(snowCm: number): number {
  const snow = Number.isFinite(snowCm) ? Math.max(0, snowCm) : 0;
  return clamp((snow / SNOW_FULL_CM) * SNOW_WEIGHT, 0, SNOW_WEIGHT);
}

/**
 * Temperature component · full marks in the -6°C…+1°C window where snow keeps
 * well and it's comfortable to ride. Warm days (slush, melt) fall off fast;
 * bitter-cold days fall off gently with a floor · the snow's still good.
 */
function tempComponent(tempMaxC: number): number {
  if (!Number.isFinite(tempMaxC)) return 0;
  if (tempMaxC >= -6 && tempMaxC <= 1) return TEMP_WEIGHT;
  if (tempMaxC > 1) {
    // 1°C → full, 8°C → 0.
    return clamp(TEMP_WEIGHT * (1 - (tempMaxC - 1) / 7), 0, TEMP_WEIGHT);
  }
  // Cold side: -6°C → full, decays ~1.4/°C, floored at 8.
  return clamp(TEMP_WEIGHT + (tempMaxC + 6) * 1.4, 8, TEMP_WEIGHT);
}

/**
 * Precipitation component · rewards snow falling and dry/clear days, penalises
 * likely rain (warm + wet). Fresh snow is already scored heavily elsewhere;
 * this stops a warm rainy day from riding a decent temp score.
 */
function precipComponent(day: PlannerForecastDay): number {
  const precip = Number.isFinite(day.precipMean) ? Math.max(0, day.precipMean) : 0;
  const snow = Number.isFinite(day.snowMean) ? Math.max(0, day.snowMean) : 0;
  if (day.tempMaxMean > 3 && precip >= 3) return 0; // rain likely
  if (snow >= 1) return PRECIP_WEIGHT; // snowing
  if (precip < 1) return 8; // dry / clear
  return 5; // light mixed
}

/** Full 0-100 confidence-adjusted score for a single day. */
export function scoreDay(day: PlannerForecastDay): ScoredDay {
  const conf = effectiveConfidence(day);
  const raw =
    snowComponent(day.snowMean) +
    tempComponent(day.tempMaxMean) +
    precipComponent(day) +
    CONF_COMPONENT[conf];
  const score = clamp(Math.round(raw * CONF_MULTIPLIER[conf]), 0, 100);
  return {
    date: day.date,
    score,
    snowCm: Number.isFinite(day.snowMean) ? Math.max(0, day.snowMean) : 0,
    tempMaxC: day.tempMaxMean,
    precipMm: Number.isFinite(day.precipMean) ? Math.max(0, day.precipMean) : 0,
    confidence: conf,
  };
}

// ─── Window scoring ─────────────────────────────────────────────────────────

/** Mean of numbers · 0 for an empty list (guarded by callers). */
function mean(ns: number[]): number {
  if (ns.length === 0) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

/**
 * Powder bonus (0-8) rewarding a window that contains a genuine standout day,
 * so a trip built around a real dump ranks above an evenly-mediocre one with
 * the same mean. Based on the single biggest day, full at ~24cm.
 */
function powderBonus(peakSnowCm: number): number {
  return clamp(peakSnowCm / 3, 0, 8);
}

function windowConfidence(days: ScoredDay[]): {
  label: WindowCandidate["confidenceLabel"];
  rank: number;
} {
  const confs = days.map((d) => d.confidence);
  const rank = mean(confs.map((c) => CONF_RANK[c]));
  const unique = new Set(confs);
  const label = unique.size === 1 ? [...unique][0]! : "mixed";
  return { label, rank };
}

function buildCandidate(
  mountain: PlannerMountain,
  slice: ScoredDay[],
): WindowCandidate {
  const totalSnowCm = slice.reduce((a, d) => a + d.snowCm, 0);
  const peakSnowCm = slice.reduce((a, d) => Math.max(a, d.snowCm), 0);
  const base = mean(slice.map((d) => d.score));
  const score = clamp(Math.round(base + powderBonus(peakSnowCm)), 0, 100);
  const { label, rank } = windowConfidence(slice);
  return {
    mountainKey: mountain.key,
    mountainName: mountain.name,
    regionId: mountain.regionId,
    regionLabel: mountain.regionLabel,
    startDate: slice[0]!.date,
    endDate: slice[slice.length - 1]!.date,
    lengthDays: slice.length,
    score,
    days: slice,
    totalSnowCm: Math.round(totalSnowCm),
    peakSnowCm: Math.round(peakSnowCm),
    confidenceLabel: label,
    confidenceRank: rank,
  };
}

/** All contiguous 2 & 3 day windows within the near-term forecast. */
export function windowsForMountain(
  mountain: PlannerMountain,
  days: PlannerForecastDay[],
): WindowCandidate[] {
  const scored = days.slice(0, MAX_FORECAST_DAYS).map(scoreDay);
  const out: WindowCandidate[] = [];
  for (const len of WINDOW_LENGTHS) {
    for (let i = 0; i + len <= scored.length; i++) {
      out.push(buildCandidate(mountain, scored.slice(i, i + len)));
    }
  }
  return out;
}

/**
 * Ranking order: score, then model agreement, then total snow, then the
 * earlier start (a sooner trip beats a later one, all else equal).
 */
export function compareCandidates(a: WindowCandidate, b: WindowCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  if (b.confidenceRank !== a.confidenceRank) return b.confidenceRank - a.confidenceRank;
  if (b.totalSnowCm !== a.totalSnowCm) return b.totalSnowCm - a.totalSnowCm;
  return a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0;
}

/** Whether two windows at the same mountain overlap in dates (ISO string safe). */
function overlaps(a: WindowCandidate, b: WindowCandidate): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

/**
 * Drop a candidate when a higher-ranked one at the SAME mountain already covers
 * overlapping dates · showing "Sat-Sun" and "Fri-Sun" at the same hill as two
 * separate suggestions is noise. Windows at different mountains are kept.
 */
function dedupe(sorted: WindowCandidate[]): WindowCandidate[] {
  const kept: WindowCandidate[] = [];
  for (const cand of sorted) {
    const clash = kept.some(
      (k) => k.mountainKey === cand.mountainKey && overlaps(k, cand),
    );
    if (!clash) kept.push(cand);
  }
  return kept;
}

/**
 * Rank the best 2-3 day windows across every saved mountain.
 *
 * @param saved     mountains the rider is comparing
 * @param forecasts per-mountain forecast state, keyed by `mountain.key`
 */
export function rankTripWindows(
  saved: PlannerMountain[],
  forecasts: Record<string, PlannerForecastEntry | undefined>,
): TripWindowRanking {
  const gaps: PlannerGap[] = [];
  const candidates: WindowCandidate[] = [];

  for (const mountain of saved) {
    const entry = forecasts[mountain.key];
    if (!entry || entry.status === "loading") {
      gaps.push({ mountainKey: mountain.key, mountainName: mountain.name, reason: "loading" });
      continue;
    }
    if (entry.status === "error") {
      gaps.push({ mountainKey: mountain.key, mountainName: mountain.name, reason: "error" });
      continue;
    }
    const windows = windowsForMountain(mountain, entry.days);
    if (windows.length === 0) {
      gaps.push({ mountainKey: mountain.key, mountainName: mountain.name, reason: "no-data" });
      continue;
    }
    candidates.push(...windows);
  }

  candidates.sort(compareCandidates);
  const ranked = dedupe(candidates);
  const [best, ...alternatives] = ranked;
  return { best: best ?? null, alternatives, gaps };
}

/** Plain-language band for a 0-100 score · shared by the UI. */
export function scoreBand(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 75) return "excellent";
  if (score >= 55) return "good";
  if (score >= 35) return "fair";
  return "poor";
}
