/**
 * Precipitation summary · brand-voice formatting + snow-over-rain priority.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:precip
 *
 * Pattern: tsx --test + node:assert (matches regionProximity / tripPlanner).
 * Guards the one-line "snow · X cm last hour" / "rain · X mm last hour" string
 * shown on the home location card and the /near-you page. Locks in (a) snow
 * takes priority when it's actually snowing, (b) nothing renders when nothing is
 * falling, and (c) the brand voice (lowercase, middot separator, no em/en dash).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { precipSummary, dailyRainMm } from "../precip";

const MIDDOT = "\u00b7";

test("null input returns null (no line rendered)", () => {
  assert.equal(precipSummary(null), null);
});

test("both amounts null returns null", () => {
  assert.equal(precipSummary({ precipMm: null, snowfallCm: null }), null);
});

test("both amounts zero returns null", () => {
  assert.equal(precipSummary({ precipMm: 0, snowfallCm: 0 }), null);
});

test("rain only formats as 'rain · X mm last hour' with blue tone", () => {
  const s = precipSummary({ precipMm: 3.2, snowfallCm: 0 });
  assert.deepEqual(s, { label: `rain ${MIDDOT} 3.2 mm last hour`, tone: "text-blue-600" });
});

test("snow only formats as 'snow · X cm last hour' with snow-accent tone", () => {
  const s = precipSummary({ precipMm: null, snowfallCm: 5 });
  assert.deepEqual(s, { label: `snow ${MIDDOT} 5 cm last hour`, tone: "text-snow-accent" });
});

test("snow takes priority over rain when both are present", () => {
  const s = precipSummary({ precipMm: 1.5, snowfallCm: 2.4 });
  assert.equal(s?.label, `snow ${MIDDOT} 2.4 cm last hour`);
  assert.equal(s?.tone, "text-snow-accent");
});

test("rain shows when snow is zero but rain is positive", () => {
  const s = precipSummary({ precipMm: 0.4, snowfallCm: 0 });
  assert.equal(s?.label, `rain ${MIDDOT} 0.4 mm last hour`);
});

test("brand voice · lowercase, middot separator, no em/en dash", () => {
  const rain = precipSummary({ precipMm: 2, snowfallCm: null })!;
  const snow = precipSummary({ precipMm: null, snowfallCm: 3 })!;
  for (const label of [rain.label, snow.label]) {
    assert.equal(label, label.toLowerCase(), "label must be all lowercase");
    assert.ok(label.includes(MIDDOT), "label must use the middot separator");
    assert.ok(!label.includes("\u2014"), "label must not contain an em dash");
    assert.ok(!label.includes("\u2013"), "label must not contain an en dash");
  }
});

// dailyRainMm · daily rain must never double-count snow. Open-Meteo's
// precipitation_sum includes the water equivalent of snowfall, so the helper
// prefers the server's true rainSum and only falls back to deriving
// precip − snowCm/0.7 for stale cached responses that predate the field.

test("dailyRainMm prefers the server rainSum when present", () => {
  assert.equal(dailyRainMm({ rainSum: 8.3, precipitationSum: 27.1, snowfallSum: 15.89 }), 8.3);
});

test("dailyRainMm rainSum of 0 is respected (not treated as missing)", () => {
  assert.equal(dailyRainMm({ rainSum: 0, precipitationSum: 27.1, snowfallSum: 15.89 }), 0);
});

test("dailyRainMm derives rain from precip minus snow water equivalent when rainSum is missing", () => {
  // 31mm precip with 17cm snow ≈ 24.3mm of snow water → ~6.7mm real rain
  assert.equal(dailyRainMm({ precipitationSum: 31, snowfallSum: 17 }), 6.7);
});

test("dailyRainMm fallback clamps to 0 when snow water equivalent exceeds precip", () => {
  assert.equal(dailyRainMm({ rainSum: null, precipitationSum: 5, snowfallSum: 10 }), 0);
});

test("dailyRainMm returns null when precipitationSum is null and rainSum missing", () => {
  assert.equal(dailyRainMm({ rainSum: null, precipitationSum: null, snowfallSum: 3 }), null);
});

test("dailyRainMm returns null for a missing day", () => {
  assert.equal(dailyRainMm(null), null);
  assert.equal(dailyRainMm(undefined), null);
});

test("dailyRainMm all-rain day passes precip through unchanged when rainSum missing", () => {
  assert.equal(dailyRainMm({ precipitationSum: 12.4, snowfallSum: 0 }), 12.4);
});
