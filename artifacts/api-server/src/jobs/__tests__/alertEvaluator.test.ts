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

test("St Anton ensemble anchor uses its local Europe/Vienna day boundary", () => {
  assert.deepEqual(REGION_ANCHORS["st-anton"], {
    lat: 47.1297,
    lon: 10.2683,
    elevation: 2058,
    region: "OTHER",
    timezone: "Europe/Vienna",
    displayName: "St Anton am Arlberg",
  });
  assert.deepEqual(ensembleQueryForAnchor(REGION_ANCHORS["st-anton"]), {
    latitude: 47.1297,
    longitude: 10.2683,
    elevation: 2058,
    region: "OTHER",
    timezone: "Europe/Vienna",
    days: 4,
  });
});
