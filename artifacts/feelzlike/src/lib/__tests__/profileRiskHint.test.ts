import assert from "node:assert/strict";
import test from "node:test";
import { riskHint } from "../../types/profile";

test("cautious risk thresholds use metric display units", () => {
  assert.equal(
    riskHint("low", "metric"),
    "Harshly penalise wind > 35km/h and visibility < 200m",
  );
});

test("cautious risk thresholds use rounded imperial equivalents", () => {
  assert.equal(
    riskHint("low", "imperial"),
    "Harshly penalise wind > 22mph and visibility < 656ft",
  );
});

test("risk hints without measurements remain unchanged", () => {
  assert.equal(riskHint("medium", "imperial"), "Default thresholds");
  assert.equal(riskHint("high", "imperial"), "Soften wind/visibility penalties");
});