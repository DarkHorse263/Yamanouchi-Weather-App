/**
 * Sprint 4.1 - personalised scoring tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:score
 *
 * Pattern: tsx + node:assert (matches openNow / reservationLinks / affiliate
 * test patterns established in Sprints 2-3). Tests the personalisation
 * modifier rules from `personalisedScore.ts` against the playbook spec.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scoreMountainPersonalised,
  buildWhyCopy,
} from "../personalisedScore";
import type { WeatherSnapshot } from "../mountainScore";
import {
  PROFILE_DEFAULTS,
  type MountainTags,
  type UserProfile,
} from "../../types/profile";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function profileOverride(p: Partial<UserProfile>): UserProfile {
  return { ...PROFILE_DEFAULTS, ...p, v: 1 };
}

const POWDER_DAY_WEATHER: WeatherSnapshot = {
  temperature: -5,
  feelsLike: -10,
  windSpeed: 15,
  snowDepth: 1.2,
  weatherCode: 75, // heavy snow
  cloudCover: 90,
};

const BLUEBIRD_WEATHER: WeatherSnapshot = {
  temperature: -3,
  feelsLike: -8,
  windSpeed: 10,
  snowDepth: 0.8,
  weatherCode: 0, // clear
  cloudCover: 5,
};

const MARGINAL_WIND_WEATHER: WeatherSnapshot = {
  temperature: -1,
  feelsLike: -8,
  windSpeed: 50, // above the 35km/h low-risk threshold
  snowDepth: 0.5,
  weatherCode: 71,
  cloudCover: 60,
};

// ---------------------------------------------------------------------------
// Behaviour: personalisation never crashes on null weather
// ---------------------------------------------------------------------------

test("Returns a wrapped base record when weather is null (no crash)", () => {
  const r = scoreMountainPersonalised(
    null,
    "winter",
    {},
    profileOverride({ skill_level: "expert" }),
  );
  assert.equal(r.total, 0);
  assert.equal(r.baseTotal, 0);
  assert.equal(r.modifiers.length, 0);
  assert.equal(r.headline, "No data");
});

// ---------------------------------------------------------------------------
// Skill-level rules
// ---------------------------------------------------------------------------

test("Beginner + beginner_friendly → +20 boost", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { beginner_friendly: true },
    profileOverride({ skill_level: "beginner", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "beginner_match");
  assert.ok(fired, "beginner_match modifier should fire");
  assert.equal(fired.delta, +20);
  assert.equal(r.total, Math.min(100, r.baseTotal + 20));
});

test("Beginner + expert_only → -30 penalty", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { expert_only: true },
    profileOverride({ skill_level: "beginner", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "beginner_too_hard");
  assert.ok(fired);
  assert.equal(fired.delta, -30);
  assert.equal(r.total, Math.max(0, r.baseTotal - 30));
});

test("Expert + expert_only → +20 boost", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { expert_only: true },
    profileOverride({ skill_level: "expert", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "expert_match");
  assert.ok(fired);
  assert.equal(fired.delta, +20);
});

test("Expert + beginner_friendly (no expert) → -10 penalty", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { beginner_friendly: true },
    profileOverride({ skill_level: "expert", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "expert_too_easy");
  assert.ok(fired);
  assert.equal(fired.delta, -10);
});

test("Expert + both flags → expert_match wins, expert_too_easy suppressed", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { beginner_friendly: true, expert_only: true },
    profileOverride({ skill_level: "expert", priorities: [] }),
  );
  assert.ok(r.modifiers.some((m) => m.id === "expert_match"));
  assert.ok(
    !r.modifiers.some((m) => m.id === "expert_too_easy"),
    "expert_too_easy should NOT fire when expert_only is also set",
  );
});

// ---------------------------------------------------------------------------
// Priority rules - powder
// ---------------------------------------------------------------------------

test("Powder priority on a snowing day → snow sub-score boost", () => {
  const r = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    {},
    profileOverride({ priorities: ["powder"] }),
  );
  const fired = r.modifiers.find((m) => m.id === "powder_priority");
  assert.ok(fired, "powder_priority should fire on a snowing day");
  assert.ok(fired.delta > 0, "powder boost must be positive");
  assert.ok(r.total >= r.baseTotal, "personalised total ≥ base for powder hunter on a snow day");
});

test("Powder priority is a no-op in green season", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "green",
    {},
    profileOverride({ priorities: ["powder"] }),
  );
  assert.ok(
    !r.modifiers.some((m) => m.id === "powder_priority"),
    "powder_priority should not fire in green season",
  );
});

// ---------------------------------------------------------------------------
// Priority rules - park / backcountry / family
// ---------------------------------------------------------------------------

test("Park priority + terrain_park → +10 boost", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { terrain_park: true },
    profileOverride({ priorities: ["park"] }),
  );
  const fired = r.modifiers.find((m) => m.id === "park_match");
  assert.ok(fired);
  assert.equal(fired.delta, +10);
});

test("Park priority on mountain WITHOUT terrain_park → no fire", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    {},
    profileOverride({ priorities: ["park"] }),
  );
  assert.ok(!r.modifiers.some((m) => m.id === "park_match"));
});

test("Backcountry priority + backcountry_access → +12 boost", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { backcountry_access: true },
    profileOverride({ priorities: ["backcountry"] }),
  );
  const fired = r.modifiers.find((m) => m.id === "backcountry_match");
  assert.ok(fired);
  assert.equal(fired.delta, +12);
});

test("Family priority on kids_lessons mountain → +15", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    { kids_lessons: true },
    profileOverride({ priorities: ["family"] }),
  );
  const fired = r.modifiers.find((m) => m.id === "family_match");
  assert.ok(fired);
  assert.equal(fired.delta, +15);
});

test("Family priority on mountain WITHOUT kids_lessons → -8 penalty", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    {},
    profileOverride({ priorities: ["family"] }),
  );
  const fired = r.modifiers.find((m) => m.id === "family_no_kids");
  assert.ok(fired);
  assert.equal(fired.delta, -8);
});

// ---------------------------------------------------------------------------
// Risk-tolerance rules
// ---------------------------------------------------------------------------

test("Low risk + windy day → -25 penalty", () => {
  const r = scoreMountainPersonalised(
    MARGINAL_WIND_WEATHER,
    "winter",
    {},
    profileOverride({ risk_tolerance: "low", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "risk_low_wind");
  assert.ok(fired, "risk_low_wind should fire when wind > 35km/h");
  assert.equal(fired.delta, -25);
});

test("Low risk + heavy cloud → -15 visibility penalty", () => {
  const r = scoreMountainPersonalised(
    POWDER_DAY_WEATHER, // cloudCover 90 > 80
    "winter",
    {},
    profileOverride({ risk_tolerance: "low", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "risk_low_vis");
  assert.ok(fired);
  assert.equal(fired.delta, -15);
});

test("Medium risk → no risk modifiers fire", () => {
  const r = scoreMountainPersonalised(
    MARGINAL_WIND_WEATHER,
    "winter",
    {},
    profileOverride({ risk_tolerance: "medium", priorities: [] }),
  );
  assert.ok(!r.modifiers.some((m) => m.id.startsWith("risk_")));
});

test("High risk → +5 send-it boost (single, always)", () => {
  const r = scoreMountainPersonalised(
    BLUEBIRD_WEATHER,
    "winter",
    {},
    profileOverride({ risk_tolerance: "high", priorities: [] }),
  );
  const fired = r.modifiers.find((m) => m.id === "risk_high_send_it");
  assert.ok(fired);
  assert.equal(fired.delta, +5);
});

// ---------------------------------------------------------------------------
// Aggregation + clamping
// ---------------------------------------------------------------------------

test("Total is clamped to [0, 100] when modifiers stack negative", () => {
  const r = scoreMountainPersonalised(
    MARGINAL_WIND_WEATHER, // marginal base + low-risk wind penalty + family no-kids + beginner penalty
    "winter",
    { expert_only: true },
    profileOverride({
      skill_level: "beginner",
      risk_tolerance: "low",
      priorities: ["family"],
    }),
  );
  assert.ok(r.total >= 0, "total must be clamped at 0");
  assert.ok(r.total <= 100, "total must be clamped at 100");
});

test("Modifiers ordered by absolute delta descending", () => {
  const r = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    { beginner_friendly: true, terrain_park: true },
    profileOverride({
      skill_level: "beginner",
      priorities: ["powder", "park"],
    }),
  );
  assert.ok(r.modifiers.length >= 2);
  for (let i = 1; i < r.modifiers.length; i++) {
    assert.ok(
      Math.abs(r.modifiers[i - 1].delta) >= Math.abs(r.modifiers[i].delta),
      "modifiers should be sorted by |delta| desc",
    );
  }
});

test("baseTotal is preserved unchanged regardless of modifiers", () => {
  const baseW = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    {},
    profileOverride({ priorities: [] }),
  );
  const personalisedW = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    { beginner_friendly: true },
    profileOverride({ skill_level: "beginner", priorities: ["powder"] }),
  );
  assert.equal(personalisedW.baseTotal, baseW.baseTotal);
  // Sanity: personalised should be different from base when modifiers fired
  assert.notEqual(personalisedW.total, personalisedW.baseTotal);
});

// ---------------------------------------------------------------------------
// buildWhyCopy
// ---------------------------------------------------------------------------

test("buildWhyCopy: returns null when no positive modifiers", () => {
  const r = scoreMountainPersonalised(
    MARGINAL_WIND_WEATHER,
    "winter",
    { expert_only: true },
    profileOverride({ skill_level: "beginner", risk_tolerance: "low", priorities: [] }),
  );
  assert.equal(buildWhyCopy(r), null);
});

test("buildWhyCopy: joins top 2 positive modifiers with ' + '", () => {
  const r = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    { beginner_friendly: true, terrain_park: true, backcountry_access: true },
    profileOverride({
      skill_level: "beginner",
      priorities: ["powder", "park", "backcountry"],
    }),
  );
  const copy = buildWhyCopy(r);
  assert.ok(copy);
  assert.ok(copy.includes(" + "), "should join with ' + '");
  // Should mention at most 2 reasons (the playbook's compact UI promise)
  assert.equal(copy.split(" + ").length, 2);
});

test("buildWhyCopy: returns Japanese reasons when lang='ja'", () => {
  const r = scoreMountainPersonalised(
    POWDER_DAY_WEATHER,
    "winter",
    { beginner_friendly: true },
    profileOverride({ skill_level: "beginner", priorities: ["powder"] }),
  );
  const copyJa = buildWhyCopy(r, "ja");
  assert.ok(copyJa);
  // Should contain at least one Japanese character
  assert.match(copyJa, /[\u3040-\u30ff\u4e00-\u9fff]/);
});

// ---------------------------------------------------------------------------
// Realistic end-to-end: powder hunter ranks differently from family on the
// same set of mountains
// ---------------------------------------------------------------------------

test("E2E: powder hunter vs family ranker - same mountains, different #1", () => {
  // Mountain A: deep snow but expert-only no kids
  const expertResort: MountainTags = { expert_only: true, backcountry_access: true };
  // Mountain B: less snow but full family setup
  const familyResort: MountainTags = { beginner_friendly: true, kids_lessons: true };

  const powderHunter = profileOverride({
    skill_level: "expert",
    priorities: ["powder", "backcountry"],
    risk_tolerance: "high",
  });
  const familyParent = profileOverride({
    skill_level: "intermediate",
    priorities: ["family"],
    risk_tolerance: "low",
  });

  const expertScoreForPowder = scoreMountainPersonalised(POWDER_DAY_WEATHER, "winter", expertResort, powderHunter);
  const familyScoreForPowder = scoreMountainPersonalised(BLUEBIRD_WEATHER, "winter", familyResort, powderHunter);
  const expertScoreForFamily = scoreMountainPersonalised(POWDER_DAY_WEATHER, "winter", expertResort, familyParent);
  const familyScoreForFamily = scoreMountainPersonalised(BLUEBIRD_WEATHER, "winter", familyResort, familyParent);

  assert.ok(
    expertScoreForPowder.total > familyScoreForPowder.total,
    "Powder hunter should rank expert powder mountain HIGHER than family bluebird mountain",
  );
  assert.ok(
    familyScoreForFamily.total > expertScoreForFamily.total,
    "Family parent should rank family mountain HIGHER than expert powder mountain",
  );
});
