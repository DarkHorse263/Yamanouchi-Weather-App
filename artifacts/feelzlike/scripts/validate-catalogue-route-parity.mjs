#!/usr/bin/env node
/**
 * Ensures the published Japan catalogue route projection is present exactly
 * once in every build input.  This is intentionally a script test: it checks
 * the real generator inputs, not a second hand-maintained list.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  REGIONS,
  regionFeatures,
  townFeatures,
  regionMountains,
  publishedCatalogueMountainRoutes,
} from "./seo-regions.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const node = process.execPath;
const expected = publishedCatalogueMountainRoutes.map(({ path }) => path);
const staticPaths = [
  "/", "/countries", "/au", "/jp", "/nz", "/ca", "/ca/all-ski-areas", "/us",
  "/compare", "/premium", "/near-you", "/legal/privacy", "/legal/terms",
];

function expectedBuildPaths() {
  const paths = [...staticPaths];
  for (const region of REGIONS) {
    paths.push(`/${region.slug}`);
    for (const feature of regionFeatures(region)) paths.push(`/${region.slug}/${feature}`);
    for (const mountain of regionMountains(region)) {
      paths.push(`/${region.slug}/mountain/${mountain.id}`);
    }
    for (const town of region.towns) {
      paths.push(`/${region.slug}/${town.id}`);
      for (const feature of townFeatures(region)) {
        paths.push(`/${region.slug}/${town.id}/${feature}`);
      }
    }
  }
  for (const { path } of publishedCatalogueMountainRoutes) {
    if (!paths.includes(path)) paths.push(path);
  }
  return paths;
}

function fail(message) {
  console.error(`[catalogue-route-parity] ${message}`);
  process.exitCode = 1;
}

function assertUnique(label, paths) {
  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
  if (duplicates.length) fail(`${label} has duplicate routes: ${[...new Set(duplicates)].join(", ")}`);
}

function assertParity(label, paths) {
  assertUnique(label, paths);
  const actual = new Set(paths);
  const missing = expected.filter((path) => !actual.has(path));
  if (missing.length) fail(`${label} is missing: ${missing.join(", ")}`);
}

function assertExactManifest(label, paths, expectedPaths) {
  assertUnique(label, paths);
  const actual = new Set(paths);
  const expectedSet = new Set(expectedPaths);
  const missing = expectedPaths.filter((path) => !actual.has(path));
  const extra = paths.filter((path) => !expectedSet.has(path));
  if (missing.length || extra.length) {
    fail(
      `${label} differs from the shared route registry; missing: ${missing.join(", ") || "none"}; extra: ${extra.join(", ") || "none"}`,
    );
  }
}

function manifest(script) {
  const output = execFileSync(node, [join(here, script)], {
    env: { ...process.env, ROUTE_MANIFEST_JSON: "1" },
    encoding: "utf8",
  });
  return JSON.parse(output);
}

assertUnique("catalogue projection", expected);
const expectedBuild = expectedBuildPaths();
assertExactManifest("sitemap inputs", manifest("generate-sitemap.mjs"), expectedBuild);
assertExactManifest("prerender inputs", manifest("prerender.mjs"), expectedBuild);

const rewriteOutput = execFileSync(node, [join(here, "generate-rewrites.mjs")], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const rewritePaths = [...rewriteOutput.matchAll(/^from = "([^"]+)"$/gm)]
  .map(([, path]) => path)
  .filter((path) => path !== "/*")
  .map((path) => path.slice(0, -1));
assertExactManifest("rewrite output", rewritePaths, expectedBuild.filter((path) => path !== "/"));

if (!process.exitCode) {
  console.log(`[catalogue-route-parity] ${expected.length} published mountain routes match sitemap, prerender, and rewrites`);
}