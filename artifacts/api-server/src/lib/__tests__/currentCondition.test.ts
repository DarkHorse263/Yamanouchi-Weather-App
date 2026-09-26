import { test } from "node:test";
import assert from "node:assert/strict";
import { precipitationAwareCode } from "../currentCondition.js";

test("positive provider current rain corrects a dry code, but daily chance never enters", () => {
  assert.equal(precipitationAwareCode(3, 0.2, 0), 61);
  assert.equal(precipitationAwareCode(3, 0, 0), 3);
  assert.equal(precipitationAwareCode(3, null, null), 3);
  assert.equal(precipitationAwareCode(null, 1, 0), null);
});

test("snow takes priority and existing active weather is not overwritten", () => {
  assert.equal(precipitationAwareCode(3, 1, 0.2), 71);
  assert.equal(precipitationAwareCode(80, 1, 0), 80);
  assert.equal(precipitationAwareCode(71, 0.3, 1), 71);
});