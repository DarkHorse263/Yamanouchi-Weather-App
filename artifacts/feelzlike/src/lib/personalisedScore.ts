import type { Season } from "@workspace/feelzlike-shell";
import {
  scoreMountain,
  type MountainScore,
  type WeatherSnapshot,
} from "./mountainScore";
import type { MountainTags, UserProfile } from "@/types/profile";

/**
 * Per-modifier breakdown captured during personalised scoring so the UI
 * can render "Why this ranks #1 for you" tooltips. Each entry is one
 * applied weight delta with a short human-readable reason.
 */
export interface ScoreModifier {
  /** Stable id, useful for testing the right rules fired. */
  id: string;
  /** Score delta applied to the total (signed). */
  delta: number;
  /** Why this fired, in plain English. */
  reason: string;
  /** Optional Japanese translation. */
  reasonJa?: string;
}

export interface PersonalisedMountainScore extends MountainScore {
  /** The base score before personalisation modifiers were applied. */
  baseTotal: number;
  /** Ordered list of modifiers applied (largest absolute delta first). */
  modifiers: ScoreModifier[];
}

/**
 * Compute a personalised "Today's Call" score for a single mountain.
 *
 * Calls `scoreMountain()` for the base 0-100 composite, then applies
 * additive modifiers based on the user's profile + the mountain's terrain
 * tags. The returned `total` is clamped to [0, 100]. The `modifiers` array
 * is ordered by largest absolute delta first so the UI can show the top
 * 1–2 reasons compactly.
 *
 * Modifier rules (from Sprint 4.1 playbook spec):
 *  - skill_level === 'beginner' → +20 if `beginner_friendly`, -30 if `expert_only`
 *  - skill_level === 'expert'   → +20 if `expert_only`, -10 if `beginner_friendly`
 *  - priorities includes 'powder' → snow sub-score doubled (capped +40)
 *  - priorities includes 'park'   → +10 if `terrain_park`
 *  - priorities includes 'backcountry' → +12 if `backcountry_access`
 *  - priorities includes 'family' → +15 if `kids_lessons`, -8 if !kids_lessons
 *  - risk_tolerance === 'low' → -25 if windSpeed > 35; -15 if cloudCover > 80
 *  - risk_tolerance === 'high' → +5 (softens the natural wind/cloud penalties)
 *
 * NOTE: 'groomers', 'value', 'crowds' priorities are intentionally no-ops
 * in v1 — they require data we don't have yet (recent_groom timestamps,
 * lift-ticket prices, day-of-week + storm-day proxy crowd estimates).
 * They're kept in the type so onboarding can capture intent and the UI
 * can show "your priority is queued for v2" hints.
 */
export function scoreMountainPersonalised(
  w: WeatherSnapshot | null,
  season: Season,
  tags: MountainTags,
  profile: UserProfile,
): PersonalisedMountainScore {
  const base = scoreMountain(w, season);
  const baseTotal = base.total;

  // No weather data → no personalisation. Return a wrapped base record so
  // callers can rely on the same shape regardless of data availability.
  if (!w) {
    return { ...base, baseTotal, modifiers: [] };
  }

  const modifiers: ScoreModifier[] = [];

  // ---------- skill_level ----------
  if (profile.skill_level === "beginner") {
    if (tags.beginner_friendly) {
      modifiers.push({
        id: "beginner_match",
        delta: +20,
        reason: "Beginner-friendly terrain",
        reasonJa: "初心者向けゲレンデ",
      });
    }
    if (tags.expert_only) {
      modifiers.push({
        id: "beginner_too_hard",
        delta: -30,
        reason: "Mostly expert terrain — could be intimidating",
        reasonJa: "上級者向けが中心",
      });
    }
  } else if (profile.skill_level === "expert") {
    if (tags.expert_only) {
      modifiers.push({
        id: "expert_match",
        delta: +20,
        reason: "Steep expert terrain",
        reasonJa: "上級者向けの斜面",
      });
    }
    if (tags.beginner_friendly && !tags.expert_only) {
      modifiers.push({
        id: "expert_too_easy",
        delta: -10,
        reason: "Mostly beginner terrain",
        reasonJa: "初心者向けが中心",
      });
    }
  }

  // ---------- priorities ----------
  // Powder: double the snow sub-score (capped at +40 above the base snow).
  if (profile.priorities.includes("powder") && season === "winter") {
    const snowBoost = Math.min(40, base.sub.snow);
    if (snowBoost > 0) {
      modifiers.push({
        id: "powder_priority",
        delta: +snowBoost,
        reason: "Powder-priority snow boost",
        reasonJa: "パウダー優先の積雪ボーナス",
      });
    }
  }

  if (profile.priorities.includes("park") && tags.terrain_park) {
    modifiers.push({
      id: "park_match",
      delta: +10,
      reason: "Has a terrain park",
      reasonJa: "ターレーンパークあり",
    });
  }

  if (profile.priorities.includes("backcountry") && tags.backcountry_access) {
    modifiers.push({
      id: "backcountry_match",
      delta: +12,
      reason: "Lift-served side-country access",
      reasonJa: "サイドカントリーへのアクセスあり",
    });
  }

  if (profile.priorities.includes("family")) {
    if (tags.kids_lessons) {
      modifiers.push({
        id: "family_match",
        delta: +15,
        reason: "Kids' lessons & family terrain",
        reasonJa: "キッズスクール・ファミリー向け",
      });
    } else {
      modifiers.push({
        id: "family_no_kids",
        delta: -8,
        reason: "No dedicated kids' programs",
        reasonJa: "キッズプログラムなし",
      });
    }
  }

  // ---------- risk_tolerance ----------
  // Low risk: harshly penalise high wind + low visibility (cloud cover proxy).
  if (profile.risk_tolerance === "low") {
    if (w.windSpeed > 35) {
      modifiers.push({
        id: "risk_low_wind",
        delta: -25,
        reason: `Wind ${Math.round(w.windSpeed)}km/h above your comfort threshold`,
        reasonJa: `風速${Math.round(w.windSpeed)}km/hが閾値超過`,
      });
    }
    // We use cloudCover > 80 as a visibility proxy (Open-Meteo doesn't
    // surface visibility in metres in the snapshot). Stronger threshold than
    // the base scoreMountain's gradient.
    if ((w.cloudCover ?? 0) > 80) {
      modifiers.push({
        id: "risk_low_vis",
        delta: -15,
        reason: "Heavy cloud cover — flat-light risk",
        reasonJa: "厚い雲量 — フラットライトの恐れ",
      });
    }
  } else if (profile.risk_tolerance === "high") {
    // High risk: small flat boost — these users don't want soft conditions
    // suppressed by default thresholds.
    modifiers.push({
      id: "risk_high_send_it",
      delta: +5,
      reason: "Send-it mode — wind/cloud penalties softened",
      reasonJa: "攻めモード — 風と雲のペナルティ緩和",
    });
  }

  // ---------- aggregate ----------
  // Sort by absolute delta desc so UI can pick the top 1-2 reasons.
  modifiers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const adjustedTotal = clamp01_100(
    baseTotal + modifiers.reduce((sum, m) => sum + m.delta, 0),
  );

  return {
    ...base,
    total: adjustedTotal,
    baseTotal,
    modifiers,
  };
}

function clamp01_100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Build a one-line "Why this ranks #1 for you" string from a personalised
 * score's modifier breakdown. Picks the top positive modifiers (up to 2)
 * and joins them with " + ". Returns null if no modifiers fired.
 */
export function buildWhyCopy(
  s: PersonalisedMountainScore,
  lang: "en" | "ja" = "en",
): string | null {
  const positives = s.modifiers.filter((m) => m.delta > 0);
  if (positives.length === 0) return null;
  const picks = positives.slice(0, 2);
  return picks
    .map((m) => (lang === "ja" && m.reasonJa ? m.reasonJa : m.reason))
    .join(" + ");
}
