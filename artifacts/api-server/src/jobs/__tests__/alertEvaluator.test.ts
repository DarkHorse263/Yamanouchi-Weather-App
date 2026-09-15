import assert from "node:assert/strict";
import test from "node:test";
import { ensembleQueryForAnchor, REGION_ANCHORS } from "../alertEvaluator.js";

test("Lech Zürs ensemble anchor uses its local Europe/Vienna day boundary", () => {
  assert.deepEqual(REGION_ANCHORS["lech-zuers"], {
    lat: 47.19,
    lon: 10.153,
    elevation: 1950,
    region: "OTHER",
    timezone: "Europe/Vienna",
    displayName: "Lech Zürs",
  });
  assert.deepEqual(ensembleQueryForAnchor(REGION_ANCHORS["lech-zuers"]), {
    latitude: 47.19,
    longitude: 10.153,
    elevation: 1950,
    region: "OTHER",
    timezone: "Europe/Vienna",
    days: 4,
  });
});