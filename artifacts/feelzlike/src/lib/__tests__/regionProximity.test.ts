/**
 * Region proximity · far-vs-near framing tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:regionProximity
 *
 * Pattern: tsx --test + node:assert (matches tripPlanner / mountainScore).
 * Guards the boundary that decides whether the "near you" region row reads as
 * the visitor's "nearest mountain region" or softens to a far "mountain region".
 * Without this, a refactor of NearYou.tsx could silently imply a 9,500 km
 * region is nearby.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FAR_REGION_KM,
  classifyRegionProximity,
  isFarRegion,
} from "../regionProximity";

test("just below the threshold is 'nearest', not 'far'", () => {
  assert.equal(classifyRegionProximity(FAR_REGION_KM - 1), "nearest");
  assert.equal(isFarRegion(FAR_REGION_KM - 1), false);
});

test("exactly at the threshold is 'far' (boundary is inclusive)", () => {
  assert.equal(classifyRegionProximity(FAR_REGION_KM), "far");
  assert.equal(isFarRegion(FAR_REGION_KM), true);
});

test("well beyond the threshold is 'far'", () => {
  assert.equal(classifyRegionProximity(9500), "far");
  assert.equal(isFarRegion(9500), true);
});

test("null distance (suggested / fallback) is neither near nor far", () => {
  assert.equal(classifyRegionProximity(null), "suggested");
  assert.equal(isFarRegion(null), false);
});

test("a nearby region (well under the threshold) is 'nearest'", () => {
  assert.equal(classifyRegionProximity(12), "nearest");
  assert.equal(isFarRegion(12), false);
});
