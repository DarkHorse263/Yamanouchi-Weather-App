import { test } from "node:test";
import assert from "node:assert/strict";
import { accountUnitsExplicit } from "../accountUnitsPreference.js";

test("legacy implicit metric is not a chosen preference", () => {
  assert.equal(accountUnitsExplicit("metric", null), false);
  assert.equal(accountUnitsExplicit("metric", { unrelated: true }), false);
});

test("legacy imperial and new explicitly saved metric both survive region changes", () => {
  assert.equal(accountUnitsExplicit("imperial", null), true);
  assert.equal(accountUnitsExplicit("metric", { unitsPreferenceExplicit: true, unrelated: "kept" }), true);
  assert.equal(accountUnitsExplicit("metric", { unitsPreferenceExplicit: "true" }), false);
});