/**
 * User profile schema for personalising "Today's Call" rankings.
 *
 * Profile lives in localStorage (key = `PROFILE_STORAGE_KEY`) - no server
 * persistence in v1, no auth required. The first /today visit triggers a
 * 30-second 4-question onboarding sheet; users can edit anytime via the
 * sidebar Profile button.
 *
 * Defaults are intentionally "powder-leaning intermediate" so the algorithm
 * does something useful before onboarding completes (the Profile button
 * copy nudges users to set their own).
 */

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type Discipline = "ski" | "snowboard" | "both";

export type Priority =
  | "powder"
  | "groomers"
  | "park"
  | "backcountry"
  | "family"
  | "value"
  | "crowds";

export type RiskTolerance = "low" | "medium" | "high";

export interface UserProfile {
  skill_level: SkillLevel;
  discipline: Discipline;
  /** Up to ~3 selected priorities (UI enforces; type does not). */
  priorities: Priority[];
  risk_tolerance: RiskTolerance;
  /** When the user completed (or skipped) the onboarding sheet. */
  onboardedAt: string | null;
  /** Schema version - bump if shape changes; old records are dropped. */
  v: 1;
}

export const PROFILE_STORAGE_KEY = "feelzlike.profile.v1";

export const PROFILE_DEFAULTS: UserProfile = {
  skill_level: "intermediate",
  discipline: "ski",
  priorities: ["powder"],
  risk_tolerance: "medium",
  onboardedAt: null,
  v: 1,
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, { en: string; ja: string }> = {
  beginner:     { en: "Beginner",     ja: "初心者" },
  intermediate: { en: "Intermediate", ja: "中級" },
  advanced:     { en: "Advanced",     ja: "上級" },
  expert:       { en: "Expert",       ja: "エキスパート" },
};

export const DISCIPLINE_LABELS: Record<Discipline, { en: string; ja: string }> = {
  ski:       { en: "Ski",       ja: "スキー" },
  snowboard: { en: "Snowboard", ja: "スノーボード" },
  both:      { en: "Both",      ja: "両方" },
};

export const PRIORITY_LABELS: Record<Priority, { en: string; ja: string; hint: string }> = {
  powder:      { en: "Powder",      ja: "パウダー",         hint: "Boost mountains with active fresh snow" },
  groomers:    { en: "Groomers",    ja: "整備バーン",       hint: "Reward mountains with recent grooming" },
  park:        { en: "Park",        ja: "パーク",           hint: "Boost mountains with terrain parks" },
  backcountry: { en: "Backcountry", ja: "バックカントリー", hint: "Boost mountains with side-country access" },
  family:      { en: "Family",      ja: "ファミリー",       hint: "Reward kids' lessons + penalise long drives" },
  value:       { en: "Value",       ja: "コスパ",           hint: "Reserved for future pricing data" },
  crowds:      { en: "Avoid crowds", ja: "混雑回避",        hint: "Penalise weekends + storm-day proxy crowds" },
};

export const RISK_LABELS: Record<RiskTolerance, { en: string; ja: string; hint: string }> = {
  low:    { en: "Cautious",     ja: "慎重",     hint: "Harshly penalise wind > 35km/h and visibility < 200m" },
  medium: { en: "Balanced",     ja: "バランス", hint: "Default thresholds" },
  high:   { en: "Send it",      ja: "攻める",   hint: "Soften wind/visibility penalties" },
};

/** Tags that can be applied to a mountain to enable profile-aware bonuses
 * and penalties. All optional; absence is treated as "not applicable". */
export interface MountainTags {
  beginner_friendly?: boolean;
  expert_only?: boolean;
  kids_lessons?: boolean;
  terrain_park?: boolean;
  backcountry_access?: boolean;
  snow_play_only?: boolean;
  nordic_focus?: boolean;
}
