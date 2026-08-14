/**
 * buildMountainSummary honesty matrix · pure module, no @/regions import
 * (tsx --test isolation rule). Run: pnpm --filter @workspace/feelzlike
 * run test:mountainSummary
 */
import test from "node:test";
import assert from "node:assert/strict";
import { buildMountainSummary, type SummaryFormat } from "../mountainSummary";

const fmt: SummaryFormat = {
  snow: (cm, dp = 0) => cm.toFixed(dp),
  snowUnit: "cm",
  wind: (kmh) => Math.round(kmh),
  windUnit: "km/h",
  elev: (m) => Math.round(m),
  elevUnit: "m",
};

// hourly rows starting "now" · buildDayNarrative filters past hours by key,
// so use a far-future timestamp that always sorts after local now
const futureHour = (i: number) => `2099-01-01T${String(i).padStart(2, "0")}:00`;
const hours = (n: number, over: Partial<{ snowfall: number; precipitation: number; windSpeed: number; weatherCode: number }> = {}) =>
  Array.from({ length: n }, (_, i) => ({ time: futureHour(i), weatherCode: 0, ...over }));

const base = {
  hourly: hours(18),
  current: { temperature: -2, weatherCode: 71, windSpeed: 20 },
  utcOffsetSeconds: 0,
  isMountain: true,
  fmt,
};

test("null when no data at all", () => {
  assert.equal(
    buildMountainSummary({ hourly: [], current: {}, utcOffsetSeconds: 0, fmt }),
    null,
  );
});

test("snow outlook labelled with resolved mid-mountain elevation", () => {
  const s = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    snowfallOutlookElevationM: 1700,
    snowfallOutlookLevel: "mid-mountain",
  });
  assert.ok(s);
  assert.match(s.en, /models suggest ~8\.0 cm around 1700 m in the next 24h/);
  assert.match(s.en, /a proper refresh/);
});

test("village-resolved outlook NEVER carries an elevation label (fail-soft honesty)", () => {
  const s = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    snowfallOutlookElevationM: 1700,
    snowfallOutlookLevel: "village",
  });
  assert.ok(s);
  assert.ok(!s.en.includes("around 1700"));
});

test("wind clause only when notable, always conditional language", () => {
  const calm = buildMountainSummary({ ...base, current: { ...base.current, windSpeed: 30 } });
  assert.ok(calm && !calm.en.includes("km/h ·"));
  const windy = buildMountainSummary({ ...base, current: { ...base.current, windSpeed: 75 } });
  assert.ok(windy);
  assert.match(windy.en, /wind near 75 km\/h · chairs may hold/);
  assert.ok(!/lifts (are|closed|open)\b/.test(windy.en));
});

test("reported base beats model, range renders both readings", () => {
  const s = buildMountainSummary({
    ...base,
    reportedBaseCm: 38,
    reportedBaseMinCm: 16,
    reportedBaseSource: "reported",
    trustedModelBaseCm: 99,
  });
  assert.ok(s);
  assert.match(s.en, /base 16-38 cm · resort reported/);
  assert.ok(!s.en.includes("model estimate"));
});

test("course reading captioned as official snow course", () => {
  const s = buildMountainSummary({
    ...base,
    reportedBaseCm: 95,
    reportedBaseSource: "course",
  });
  assert.ok(s);
  assert.match(s.en, /base 95 cm · official snow course/);
});

test("no report + untrusted model = base clause omitted entirely", () => {
  const s = buildMountainSummary({ ...base });
  assert.ok(s);
  assert.ok(!s.en.includes("base"));
});

test("trusted model base speaks with a hedge", () => {
  const s = buildMountainSummary({ ...base, trustedModelBaseCm: 42 });
  assert.ok(s);
  assert.match(s.en, /base ~42 cm · model estimate/);
});

test("rain-snow split clause when freezing level sits between village and mid", () => {
  // FL 1900 → snow line 1600 · village 1300 reads rain, mid 1750 reads snow
  const s = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    freezingLevelM: 1900,
    villageElevationM: 1300,
    midElevationM: 1750,
  });
  assert.ok(s);
  assert.match(s.en, /rain low down, snow above ~1600 m/);
  assert.ok(s.ja.includes("標高1600mより上は雪、下は雨"));
});

test("no split clause when all-snow, all-rain, or no snow incoming", () => {
  const allSnow = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    freezingLevelM: 1200, // snow line 900 · below the village
    villageElevationM: 1300,
    midElevationM: 1750,
  });
  assert.ok(allSnow && !allSnow.en.includes("rain low down"));
  const allRain = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    freezingLevelM: 2400, // snow line 2100 · above mid
    villageElevationM: 1300,
    midElevationM: 1750,
  });
  assert.ok(allRain && !allRain.en.includes("rain low down"));
  const dry = buildMountainSummary({
    ...base,
    snowNext24Cm: 0,
    freezingLevelM: 1900,
    villageElevationM: 1300,
    midElevationM: 1750,
  });
  assert.ok(dry && !dry.en.includes("rain low down"));
});

test("split clause fails soft when freezing level or elevations missing", () => {
  const noFl = buildMountainSummary({ ...base, snowNext24Cm: 8, villageElevationM: 1300, midElevationM: 1750 });
  assert.ok(noFl && !noFl.en.includes("rain low down"));
  const noElev = buildMountainSummary({ ...base, snowNext24Cm: 8, freezingLevelM: 1900 });
  assert.ok(noElev && !noElev.en.includes("rain low down"));
  const inverted = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    freezingLevelM: 1900,
    villageElevationM: 1750,
    midElevationM: 1300,
  });
  assert.ok(inverted && !inverted.en.includes("rain low down"));
});

test("ja strings populated alongside en", () => {
  const s = buildMountainSummary({ ...base, snowNext24Cm: 8, reportedBaseCm: 95, reportedBaseSource: "reported" });
  assert.ok(s);
  assert.ok(s.ja.includes("積雪95cm・リゾート報告"));
  assert.ok(s.ja.length > 0);
});

test("brand voice: no em/en dashes, middot joins", () => {
  const s = buildMountainSummary({
    ...base,
    snowNext24Cm: 8,
    current: { ...base.current, windSpeed: 75 },
    reportedBaseCm: 95,
    reportedBaseSource: "reported",
  });
  assert.ok(s);
  assert.ok(!s.en.includes("—") && !s.en.includes("–"));
  assert.ok(s.en.includes(" · "));
  assert.equal(s.en, s.en.toLowerCase());
});
