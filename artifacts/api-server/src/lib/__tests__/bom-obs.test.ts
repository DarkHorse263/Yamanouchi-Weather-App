import { test } from "node:test";
import assert from "node:assert/strict";
import { reconcileBomCondition, type BomObsRow } from "../bom-obs.js";

// Helper: build a newest-first row pair (latest + a baseline ~1h earlier).
function rows(latest: Partial<BomObsRow>, older?: Partial<BomObsRow>): BomObsRow[] {
  const base: BomObsRow = {
    air_temp: null,
    rel_hum: null,
    rain_trace: null,
    weather: null,
    local_date_time_full: null,
  };
  const out: BomObsRow[] = [
    { ...base, local_date_time_full: "20260622170000", ...latest },
  ];
  if (older) out.push({ ...base, local_date_time_full: "20260622160000", ...older });
  return out;
}

test("snow caught: rising gauge below freezing -> snow code", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 0,
    rows: rows({ air_temp: -1, rel_hum: 100, rain_trace: "1.8" }, { rain_trace: "1.4" }),
  });
  assert.ok(r, "expected an override");
  assert.equal(r!.reconciledFrom, "bom-precip");
  assert.equal(r!.weatherCode, 71); // 0.4mm/h, sub-zero -> slight snow
  assert.equal(r!.precipitationMm, 0.4);
});

test("rain caught: rising gauge above freezing -> rain code", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 1,
    rows: rows({ air_temp: 5, rel_hum: 90, rain_trace: "2.0" }, { rain_trace: "0.5" }),
  });
  assert.ok(r);
  assert.equal(r!.reconciledFrom, "bom-precip");
  assert.equal(r!.weatherCode, 61); // 1.5mm/h, above freezing -> slight rain
});

test("present-weather text drives a precip override even with a flat gauge", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 2,
    rows: rows({ air_temp: -1, rel_hum: 90, rain_trace: "1.8", weather: "Snow" }, { rain_trace: "1.8" }),
  });
  assert.ok(r);
  assert.equal(r!.reconciledFrom, "bom-precip");
  assert.equal(r!.weatherCode, 71);
});

test("in-cloud: clear model but saturated station -> overcast", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 0,
    rows: rows({ air_temp: -1, rel_hum: 100, rain_trace: "1.8" }, { rain_trace: "1.8" }),
  });
  assert.ok(r);
  assert.equal(r!.reconciledFrom, "bom-incloud");
  assert.equal(r!.weatherCode, 3);
  assert.equal(r!.precipitationMm, null);
});

test("in-cloud works when the gauge field is unavailable", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 1,
    rows: rows({ air_temp: -1, rel_hum: 99, rain_trace: "-" }, { rain_trace: "-" }),
  });
  assert.ok(r);
  assert.equal(r!.reconciledFrom, "bom-incloud");
  assert.equal(r!.weatherCode, 3);
});

test("no-op: genuinely clear and dry", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 0,
    rows: rows({ air_temp: 5, rel_hum: 55, rain_trace: "0.0" }, { rain_trace: "0.0" }),
  });
  assert.equal(r, null);
});

test("no-op: model already reports wet (never turn wet -> dry)", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 61,
    rows: rows({ air_temp: -1, rel_hum: 100, rain_trace: "2.4" }, { rain_trace: "1.0" }),
  });
  assert.equal(r, null);
});

test("gauge rate is normalised by the true window, not used raw as mm/h", () => {
  // 1.8mm accumulated over a 120min baseline gap = 0.9mm/h (light), not 1.8mm/h
  // (moderate). Below freezing -> slight snow (71), not moderate snow (73).
  const r = reconcileBomCondition({
    modelWeatherCode: 0,
    rows: [
      {
        air_temp: -1,
        rel_hum: 90,
        rain_trace: "1.8",
        weather: null,
        local_date_time_full: "20260622180000",
      },
      {
        air_temp: -1,
        rel_hum: 90,
        rain_trace: "0.0",
        weather: null,
        local_date_time_full: "20260622160000",
      },
    ],
  });
  assert.ok(r);
  assert.equal(r!.reconciledFrom, "bom-precip");
  assert.equal(r!.weatherCode, 71);
  assert.equal(r!.precipitationMm, 1.8);
});

test("9am reset guard: negative gauge delta does not fabricate snow", () => {
  const r = reconcileBomCondition({
    modelWeatherCode: 0,
    // gauge reset to 0.2 after 9am while baseline was yesterday's 3.0; RH below the
    // in-cloud threshold so the only thing that could fire is a (false) precip code.
    rows: rows(
      { air_temp: -1, rel_hum: 80, rain_trace: "0.2", local_date_time_full: "20260622093000" },
      { rain_trace: "3.0", local_date_time_full: "20260622083000" },
    ),
  });
  assert.equal(r, null);
});
