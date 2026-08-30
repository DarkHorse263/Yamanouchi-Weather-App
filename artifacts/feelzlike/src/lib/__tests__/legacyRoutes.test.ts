import assert from "node:assert/strict";
import { test } from "node:test";
import {
  legacyRouteDestination,
  legacyRoutes,
} from "../legacyRoutes";

test("every declared legacy route preserves suffixes, query strings, and hashes", () => {
  for (const route of legacyRoutes) {
    for (const suffix of route.suffixes) {
      assert.equal(
        legacyRouteDestination(
          `${route.from}${suffix}?units=imperial#lifts`,
          route,
        ),
        `${route.to}${suffix}?units=imperial#lifts`,
      );
    }
  }
});

test("legacy route destinations preserve a query or hash independently", () => {
  const [route] = legacyRoutes;

  assert.equal(
    legacyRouteDestination(`${route.from}?units=metric`, route),
    `${route.to}?units=metric`,
  );
  assert.equal(
    legacyRouteDestination(`${route.from}#weather`, route),
    `${route.to}#weather`,
  );
});