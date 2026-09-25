import assert from "node:assert/strict";
import test from "node:test";
import { baseBandElevation, midMountainElevation, resolveVillageElevation, snowForecastElevation } from "../elevation";

test("real village elevation wins over the derived lower band", () => {
  assert.equal(resolveVillageElevation(1365, 2037), 1365);
});

test("missing village elevation falls back to the derived lower band", () => {
  assert.equal(resolveVillageElevation(undefined, 2037), baseBandElevation(2037));
});

test("missing village and summit elevations stay absent", () => {
  assert.equal(resolveVillageElevation(undefined, undefined), undefined);
});

test("an authored midpoint overrides proportional derivation for the Austria pilot", () => {
  assert.equal(midMountainElevation(2450, 1950), 1950);
});

test("real base/summit pair yields on-mountain snow heights at major US resorts", () => {
  assert.equal(snowForecastElevation(1907, 3068, 1907), 2488);
  assert.equal(snowForecastElevation(1924, 3185, 1924), 2555);
});

test("a base or pin alone never gets silently treated as a summit and lowered", () => {
  assert.equal(snowForecastElevation(1950, undefined, 1950), 1950);
  assert.equal(snowForecastElevation(undefined, undefined, 301), 301);
  assert.equal(snowForecastElevation(undefined, undefined, undefined), undefined);
});

test("explicit midpoint respects the real base, and a mismatched summit cannot lower it", () => {
  assert.equal(snowForecastElevation(1304, 2811, 1304, 1950), 1950);
  assert.equal(snowForecastElevation(1304, 2811, 1304, 1000), 2058);
  assert.ok(snowForecastElevation(1500, 1200)! >= 1500);
});