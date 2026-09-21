import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DayCell, formatPlannerDate } from "../DayCell";
import { toPlannerDay, type ForecastApiDay } from "../../../lib/tripForecastDay";
import { tempRounded, tempUnitLabel, snowValue, snowUnitLabel, type UnitsPref } from "../../../lib/unitsFormat";

const input: ForecastApiDay = {
  date: "2026-10-04",
  tempMaxMean: 4,
  tempMinMean: -5,
  feelsLikeMaxMean: 0,
  feelsLikeMinMean: -10,
  feelsLikeSources: ["GFS", "ICON"],
  precipMean: 1,
  snowMean: 3,
  snowSpread: 1,
  sourcesCount: 4,
  confidence: "high",
};
function units(pref: UnitsPref) {
  return {
    temp: (n: number | null | undefined) => tempRounded(n, pref),
    tempUnit: tempUnitLabel(pref),
    snowVal: (n: number | null | undefined) => snowValue(n, pref),
    snowUnit: snowUnitLabel(pref),
  };
}
function render(day = input, pref: UnitsPref = "metric") {
  return renderToStaticMarkup(<DayCell day={toPlannerDay(day)} u={units(pref)} />);
}

test("shows actual and feelzlike daily high/low with Celsius and accessible labels", () => {
  const html = render();
  assert.match(html, /aria-label="actual temperature high 4°C"/);
  assert.match(html, /aria-label="actual temperature low -5°C"/);
  assert.match(html, /aria-label="feelzlike high 0°C"/);
  assert.match(html, /aria-label="feelzlike low -10°C"/);
  assert.match(html, /hi 0°C/);
  assert.match(html, /lo -10°C/);
  assert.match(html, /feelzlike uses 2 of 4 forecast sources: GFS, ICON/);
});

test("converts all four values at display edge to Fahrenheit, including real zero Celsius", () => {
  const html = render(input, "imperial");
  for (const label of [
    "actual temperature high 39°F", "actual temperature low 23°F",
    "feelzlike high 32°F", "feelzlike low 14°F",
  ]) assert.ok(html.includes(`aria-label="${label}"`), label);
  assert.doesNotMatch(html, /°C/);
});

test("MET-only and old cached responses keep air temps but show feelzlike unavailable in either unit", () => {
  for (const pref of ["metric", "imperial"] as const) {
    for (const value of [null, undefined]) {
      const html = render({
        ...input, sourcesCount: 1, feelsLikeSources: [],
        feelsLikeMaxMean: value, feelsLikeMinMean: value,
      }, pref);
      assert.match(html, /aria-label="feelzlike unavailable"/);
      assert.match(html, /feelzlike uses 0 of 1 forecast sources/);
      assert.doesNotMatch(html, /aria-label="feelzlike (?:high|low)/);
      assert.match(html, /actual temperature high/);
      assert.doesNotMatch(html, /(?:null|undefined|NaN)°/);
    }
  }
});

test("adapter rejects partial, nonfinite, inverted, or unsupported apparent pairs", () => {
  for (const fields of [
    { feelsLikeMaxMean: null },
    { feelsLikeMinMean: undefined },
    { feelsLikeMaxMean: NaN },
    { feelsLikeMinMean: -Infinity },
    { feelsLikeMaxMean: -20 },
    { feelsLikeSources: [] },
    { sourcesCount: 1 },
  ]) {
    const day = toPlannerDay({ ...input, ...fields });
    assert.equal(day.feelsLikeMaxMean, null);
    assert.equal(day.feelsLikeMinMean, null);
    assert.deepEqual(day.feelsLikeSources, []);
    assert.equal(day.tempMaxMean, 4);
  }
});

test("adapter preserves partial-model coverage without padding missing sources", () => {
  const day = toPlannerDay({ ...input, feelsLikeSources: ["GFS"] });
  assert.equal(day.feelsLikeMaxMean, 0);
  assert.equal(day.feelsLikeMinMean, -10);
  assert.deepEqual(day.feelsLikeSources, ["GFS"]);
  assert.equal(day.sourcesCount, 4);
});

test("mountain-local date labels remain stable across browser timezones and DST changes", () => {
  const original = process.env.TZ;
  try {
    for (const tz of ["Pacific/Honolulu", "Australia/Sydney", "America/Vancouver", "Asia/Tokyo"]) {
      process.env.TZ = tz;
      for (const date of ["2026-04-05", "2026-10-04", "2026-03-08", "2026-11-01"]) {
        assert.equal(formatPlannerDate(date, { weekday: "long" }), "sunday");
        assert.equal(formatPlannerDate(date, { day: "numeric" }), String(Number(date.slice(-2))));
      }
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});