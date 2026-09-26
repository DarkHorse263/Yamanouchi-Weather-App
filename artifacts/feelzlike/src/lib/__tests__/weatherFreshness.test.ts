import { test } from "node:test";
import assert from "node:assert/strict";
import { modelAgeMinutes, townCurrentAgeMinutes } from "../weatherFreshness";

test("Sydney naive local time uses provider UTC offset, not viewer timezone", () => {
  const now = Date.parse("2026-09-26T20:15:00Z");
  assert.equal(townCurrentAgeMinutes("2026-09-27T06:00", 36000, now), 15);
  assert.equal(modelAgeMinutes("2026-09-26T20:00:00Z", now), 15);
  assert.equal(townCurrentAgeMinutes("2026-09-26T14:00", 36000, now), 975);
});

test("missing or invalid source time cannot masquerade as a fresh observation", () => {
  assert.equal(townCurrentAgeMinutes(null, 36000), null);
  assert.equal(townCurrentAgeMinutes("broken", 36000), null);
  assert.equal(modelAgeMinutes("broken"), null);
});