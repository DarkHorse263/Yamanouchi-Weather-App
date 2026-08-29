import assert from "node:assert/strict";
import test from "node:test";
import { baseBandElevation, resolveVillageElevation } from "../elevation";

test("real village elevation wins over the derived lower band", () => {
  assert.equal(resolveVillageElevation(1365, 2037), 1365);
});

test("missing village elevation falls back to the derived lower band", () => {
  assert.equal(resolveVillageElevation(undefined, 2037), baseBandElevation(2037));
});

test("missing village and summit elevations stay absent", () => {
  assert.equal(resolveVillageElevation(undefined, undefined), undefined);
});