import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import legacyRoutes from "../src/lib/legacyRoutes.json" with { type: "json" };

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, "..", "src", "App.tsx"), "utf8");
const artifactSource = readFileSync(
  join(here, "..", ".replit-artifact", "artifact.toml"),
  "utf8",
);
const generatedRewrites = execFileSync(
  process.execPath,
  [join(here, "generate-rewrites.mjs")],
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);

function parseRewrites(source) {
  return [...source.matchAll(
    /\[\[services\.production\.rewrites\]\]\s+from = "([^"]+)"\s+to = "([^"]+)"/g,
  )].map(([, from, to]) => ({ from, to }));
}

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

test("generated and checked-in edge rewrites cover legacy routes before the SPA catch-all", () => {
  for (const [label, source] of [
    ["generated rewrites", generatedRewrites],
    ["checked-in artifact", artifactSource],
  ]) {
    const rewrites = parseRewrites(source);
    const catchAllIndex = rewrites.findIndex(({ from }) => from === "/*");
    assert.notEqual(catchAllIndex, -1, `${label} is missing the SPA catch-all`);
    assert.equal(catchAllIndex, rewrites.length - 1, `${label} SPA catch-all must be last`);

    for (const route of legacyRoutes) {
      for (const suffix of route.suffixes) {
        const expected = {
          from: `${route.from}${suffix}/`,
          to: `${route.to}${suffix}/index.html`,
        };
        const index = rewrites.findIndex(
          (rewrite) => rewrite.from === expected.from && rewrite.to === expected.to,
        );
        assert.notEqual(index, -1, `${label} is missing ${expected.from} -> ${expected.to}`);
        assert.ok(index < catchAllIndex, `${expected.from} must appear before the SPA catch-all`);
        assert.ok(
          rewrites.some(({ from, to }) => from === `${route.to}${suffix}/` && to === expected.to),
          `${label} legacy target ${route.to}${suffix} is not prerendered`,
        );
      }
    }
  }
});