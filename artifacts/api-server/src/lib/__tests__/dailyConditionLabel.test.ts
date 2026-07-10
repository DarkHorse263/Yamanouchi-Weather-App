/**
 * Daily condition label · totals-based, never the WMO moment-code.
 *
 * Run via: npx tsx --test src/lib/__tests__/dailyConditionLabel.test.ts
 *
 * Guards the July 2026 user report: a 2.7cm day labelled "Heavy Snow Fall"
 * while a steady 17cm day read plain "Snow" — because Open-Meteo's daily
 * weather_code is the most-severe MOMENT of the day, not the day's story.
 * Also locks in the mixed-day honesty rule: when liquid rain rivals or beats
 * the snow's water content, the label must say so instead of hiding the rain
 * behind an optimistic snow label.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyConditionLabel } from "../dailyConditionLabel.js";

test("no meaningful snow falls back to the code description", () => {
  assert.equal(dailyConditionLabel({ code: 2, snowfallCm: 0, rainMm: 0, fallback: "Partly cloudy" }), "Partly cloudy");
  assert.equal(dailyConditionLabel({ code: 71, snowfallCm: 0.28, rainMm: 0, fallback: "Slight snow fall" }), "Slight snow fall");
  assert.equal(dailyConditionLabel({ code: 3, snowfallCm: null, rainMm: null, fallback: "Overcast" }), "Overcast");
});

test("rain-dominant day with trivial snow must not headline as snow", () => {
  // Real case: code 71 day with 0.14cm snow but 5.9mm rain → it's a rain day
  assert.equal(dailyConditionLabel({ code: 71, snowfallCm: 0.14, rainMm: 5.9, fallback: "Slight snow fall" }), "Rain");
  // Non-snow code keeps its own fallback
  assert.equal(dailyConditionLabel({ code: 61, snowfallCm: 0.1, rainMm: 5.9, fallback: "Slight rain" }), "Slight rain");
  // Trivial rain doesn't trigger the demotion
  assert.equal(dailyConditionLabel({ code: 71, snowfallCm: 0.14, rainMm: 1.2, fallback: "Slight snow fall" }), "Slight snow fall");
});

test("steady 17cm day is Heavy snow even when the moment-code said thunderstorm", () => {
  // 12 Jul: snow 15.89cm, rain 8.3mm, code 95 → the day's story is heavy snow
  assert.equal(dailyConditionLabel({ snowfallCm: 15.89, rainMm: 8.3, fallback: "Thunderstorm" }), "Heavy snow");
});

test("2.7cm burst day is NOT heavy snow — and rain-led days say so", () => {
  // 13 Jul: snow 2.87cm (~4.1mm water), rain 9.1mm → mostly a rain day
  assert.equal(dailyConditionLabel({ snowfallCm: 2.87, rainMm: 9.1, fallback: "Heavy snow fall" }), "Rain · snow");
});

test("balanced mixed day reads Rain · snow when rain wins on water", () => {
  // 14 Jul: snow 3.01cm (~4.3mm water), rain 4.6mm
  assert.equal(dailyConditionLabel({ snowfallCm: 3.01, rainMm: 4.6, fallback: "Slight snow showers" }), "Rain · snow");
});

test("snow-led day with meaningful rain reads Snow · rain", () => {
  // 7cm snow (10mm water) + 5mm rain → snow leads but the rain matters
  assert.equal(dailyConditionLabel({ snowfallCm: 7, rainMm: 5, fallback: "Moderate snow fall" }), "Snow · rain");
});

test("trivial rain (<2mm) never dilutes the snow label", () => {
  assert.equal(dailyConditionLabel({ snowfallCm: 2.66, rainMm: 1.5, fallback: "Heavy snow fall" }), "Light snow");
  assert.equal(dailyConditionLabel({ snowfallCm: 16, rainMm: 1.9, fallback: "Snow" }), "Heavy snow");
});

test("label scales with the daily total: light < snow < heavy", () => {
  assert.equal(dailyConditionLabel({ snowfallCm: 0.6, rainMm: 0, fallback: "x" }), "Light snow");
  assert.equal(dailyConditionLabel({ snowfallCm: 4.5, rainMm: 0, fallback: "x" }), "Snow");
  assert.equal(dailyConditionLabel({ snowfallCm: 15, rainMm: 0, fallback: "x" }), "Heavy snow");
});

test("null rain (upstream lacks rain_sum) still labels by snow total", () => {
  assert.equal(dailyConditionLabel({ snowfallCm: 12, rainMm: null, fallback: "x" }), "Snow");
  assert.equal(dailyConditionLabel({ snowfallCm: 18, rainMm: undefined, fallback: "x" }), "Heavy snow");
});

test("heavy snow with rain that beats it on water is still honest about rain", () => {
  // 15cm snow (~21.4mm water) + 25mm rain → a genuinely foul day
  assert.equal(dailyConditionLabel({ snowfallCm: 15, rainMm: 25, fallback: "x" }), "Rain · snow");
});

test("brand voice · middot separator on mixed labels, no em/en dash", () => {
  const mixed = dailyConditionLabel({ snowfallCm: 3, rainMm: 9, fallback: "x" });
  assert.ok(mixed.includes("\u00b7"), "mixed label must use the middot separator");
  assert.ok(!mixed.includes("\u2014") && !mixed.includes("\u2013"), "no em/en dashes");
});
