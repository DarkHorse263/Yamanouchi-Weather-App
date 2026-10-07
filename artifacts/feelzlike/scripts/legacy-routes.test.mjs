import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import legacyRoutes from "../src/lib/legacyRoutes.json" with { type: "json" };
import { pageRoutes } from "./build-page-routes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, "..", "src", "App.tsx"), "utf8");
const artifactSource = readFileSync(
  join(here, "..", ".replit-artifact", "artifact.toml"),
  "utf8",
);

function expectedDestination(location, route) {
  const queryOrHashIndex = location.search(/[?#]/);
  const pathname = queryOrHashIndex === -1 ? location : location.slice(0, queryOrHashIndex);
  const queryAndHash = queryOrHashIndex === -1 ? "" : location.slice(queryOrHashIndex);
  return `${route.to}${pathname.slice(route.from.length)}${queryAndHash}`;
}

test("the client router derives every legacy redirect from the shared declarations", () => {
  assert.match(appSource, /legacyRoutes\.map\(/);
  assert.match(
    appSource,
    /legacyRouteDestination\(\s*`\$\{location\}\$\{window\.location\.search\}\$\{window\.location\.hash\}`,\s*route,\s*\)/,
  );

  for (const route of legacyRoutes) {
    for (const suffix of route.suffixes) {
      const location = `${route.from}${suffix}?units=imperial#lifts`;
      assert.equal(
        expectedDestination(location, route),
        `${route.to}${suffix}?units=imperial#lifts`,
      );
    }
  }
});

test("production uses the page server and preserves exact legacy destinations", () => {
  assert.match(artifactSource, /artifacts\/feelzlike\/scripts\/serve-pages\.mjs/);
  assert.doesNotMatch(artifactSource, /serve = "static"|from = "\/\*"/);
  for (const route of legacyRoutes) {
    for (const suffix of route.suffixes) {
      const target = `${route.to}${suffix}`;
      assert.equal(pageRoutes.redirects[`${route.from}${suffix}`], `${target}/`);
      assert.ok(pageRoutes.routes.includes(target), `missing legacy destination ${target}`);
    }
  }
});