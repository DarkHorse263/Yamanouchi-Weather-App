/**
 * Snowmaking · wet-bulb + viability + curated-capability tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:snowmaking
 *
 * Pattern: tsx --test + node:assert (matches mountainScore / powderFactor).
 * The module is import-free on purpose, so these run without pulling the
 * region catalog (which crashes under tsx via PNG asset imports).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wetBulbC,
  snowmakingViability,
  bestSnowmakingWindow,
  getSnowmakingCapability,
  SNOWMAKING_CAPABILITY,
  type SnowmakingHour,
} from "../snowmaking";

test("wetBulbC returns null when an input is missing", () => {
  assert.equal(wetBulbC(null, 50), null);
  assert.equal(wetBulbC(-5, null), null);
  assert.equal(wetBulbC(undefined, undefined), null);
  assert.equal(wetBulbC(Number.NaN, 50), null);
  assert.equal(wetBulbC(Number.POSITIVE_INFINITY, 50), null);
  assert.equal(wetBulbC(-3, Number.NEGATIVE_INFINITY), null);
});

test("wetBulbC never exceeds the dry-bulb air temperature", () => {
  for (const t of [-15, -5, -2, 0, 2, 8, 15]) {
    for (const rh of [20, 50, 80, 99]) {
      const wb = wetBulbC(t, rh);
      assert.ok(wb != null && wb <= t, `wb ${wb} should be <= ${t} at ${rh}%`);
    }
  }
});

test("wetBulbC matches known Stull reference values (±0.3)", () => {
  // -2C / 50% ~ -5.2C; 2C / 40% ~ -2.3C; 5C / 30% ~ -0.5C
  assert.ok(Math.abs((wetBulbC(-2, 50) as number) - -5.2) <= 0.3);
  assert.ok(Math.abs((wetBulbC(2, 40) as number) - -2.3) <= 0.3);
  assert.ok(Math.abs((wetBulbC(5, 30) as number) - -0.5) <= 0.3);
});

test("wetBulbC clamps relative humidity to a sane range", () => {
  // Out-of-range RH must not throw or return NaN.
  assert.ok(typeof wetBulbC(-3, 0) === "number");
  assert.ok(typeof wetBulbC(-3, 140) === "number");
});

test("snowmakingViability buckets on the -5 / -2 thresholds", () => {
  assert.equal(snowmakingViability(null), null);
  assert.equal(snowmakingViability(-9), "good");
  assert.equal(snowmakingViability(-5), "good");
  assert.equal(snowmakingViability(-4.9), "marginal");
  assert.equal(snowmakingViability(-2), "marginal");
  assert.equal(snowmakingViability(-1.9), "too_warm");
  assert.equal(snowmakingViability(3), "too_warm");
});

test("bestSnowmakingWindow returns null on empty / undefined input", () => {
  assert.equal(bestSnowmakingWindow(undefined), null);
  assert.equal(bestSnowmakingWindow(null), null);
  assert.equal(bestSnowmakingWindow([]), null);
});

test("bestSnowmakingWindow picks the coldest hour and counts viable hours", () => {
  const hours: SnowmakingHour[] = [
    { time: "2026-06-23T18:00", temperature: 1, humidity: 60 },   // ~ -2.x, around the line
    { time: "2026-06-23T22:00", temperature: -6, humidity: 70 },  // clearly good
    { time: "2026-06-24T02:00", temperature: -9, humidity: 80 },  // coldest -> best
    { time: "2026-06-24T10:00", temperature: 8, humidity: 40 },   // too warm
  ];
  const win = bestSnowmakingWindow(hours, 24);
  assert.ok(win);
  assert.equal(win!.atISO, "2026-06-24T02:00");
  assert.equal(win!.viability, "good");
  assert.ok(win!.wetBulbC <= -5);
  assert.ok(win!.viableHours >= 2 && win!.viableHours <= 4);
  assert.equal(win!.scannedHours, 4);
});

test("bestSnowmakingWindow skips hours missing temp or humidity", () => {
  const hours: SnowmakingHour[] = [
    { time: "a", temperature: null, humidity: 80 },
    { time: "b", temperature: -7, humidity: null },
    { time: "c", temperature: -4, humidity: 75 },
  ];
  const win = bestSnowmakingWindow(hours, 24);
  assert.ok(win);
  assert.equal(win!.scannedHours, 1);
  assert.equal(win!.atISO, "c");
});

test("bestSnowmakingWindow honours the withinHours limit", () => {
  const hours: SnowmakingHour[] = [
    { time: "near", temperature: -3, humidity: 70 },
    { time: "later", temperature: -12, humidity: 85 },
  ];
  const win = bestSnowmakingWindow(hours, 1);
  assert.ok(win);
  assert.equal(win!.atISO, "near");
  assert.equal(win!.scannedHours, 1);
});

test("getSnowmakingCapability returns curated data for AU resorts", () => {
  assert.equal(getSnowmakingCapability(null), null);
  assert.equal(getSnowmakingCapability("jindabyne"), null);

  const thredbo = getSnowmakingCapability("thredbo");
  assert.ok(thredbo);
  assert.equal(thredbo!.type, "all-weather");
  assert.equal(thredbo!.areas.length, 1);
  assert.equal(thredbo!.areas[0].name, "friday flat");

  const perisher = getSnowmakingCapability("perisher");
  assert.ok(perisher);
  assert.equal(perisher!.type, "conventional");
  assert.equal(perisher!.areas.length, 0);
});

test("getSnowmakingCapability covers AU + NZ resorts and hides the rest", () => {
  // all-weather snow factories must list at least one unit
  for (const id of ["thredbo", "mt-buller", "coronet-peak"]) {
    const cap = getSnowmakingCapability(id);
    assert.ok(cap, `${id} should have curated data`);
    assert.equal(cap!.type, "all-weather");
    assert.ok(cap!.areas.length > 0, `${id} all-weather should list a unit`);
  }
  // conventional snowmaking resorts (AU + NZ)
  for (const id of [
    "perisher",
    "selwyn",
    "charlottes-pass",
    "falls-creek",
    "mt-hotham",
    "lake-mountain",
    "ben-lomond",
    "the-remarkables",
    "cardrona",
    "treble-cone",
    "mt-hutt",
    "whakapapa",
    "turoa",
  ]) {
    const cap = getSnowmakingCapability(id);
    assert.ok(cap, `${id} should have curated data`);
    assert.equal(cap!.type, "conventional");
  }
  // resorts with no snowmaking, and excluded japan, stay hidden (null)
  for (const id of ["mt-stirling", "mt-donna-buang", "nozawa-onsen", "ryuoo"]) {
    assert.equal(getSnowmakingCapability(id), null, `${id} should have no panel`);
  }
});

test("curated snowmaking copy stays in brand voice", () => {
  for (const [id, cap] of Object.entries(SNOWMAKING_CAPABILITY)) {
    const strings = [cap.headline, cap.summary, cap.source];
    for (const a of cap.areas) strings.push(a.name, a.system);
    for (const s of strings) {
      assert.equal(s, s.toLowerCase(), `${id}: copy must be lowercase -> ${s}`);
      assert.ok(!/[\u2014\u2013]/.test(s), `${id}: no em/en dashes -> ${s}`);
    }
  }
});
