#!/usr/bin/env node
/**
 * Emits the [[services.production.rewrites]] block for
 * .replit-artifact/artifact.toml (stdout).
 *
 * Why this exists: the production edge serves the SPA statically with a
 * catch-all rewrite (/* -> /index.html). The edge applies that rewrite to
 * every path that is not an exact FILE match - including directory paths
 * like /snowy-mountains/jindabyne/ whose prerendered index.html exists.
 * Result: every clean URL served the homepage HTML (homepage canonical,
 * homepage title), so Google saw 300+ duplicates of the root page and
 * indexed almost nothing.
 *
 * Fix: one explicit rewrite per prerendered route (from the trailing-slash
 * URL to its real index.html file), listed BEFORE the catch-all. The edge
 * honours listed order, and every target is a real file written by
 * prerender.mjs. Everything unprerendered (e.g. /alerts/verify) still falls
 * through to the SPA catch-all.
 *
 * Route set MUST stay identical to generate-sitemap.mjs / prerender.mjs -
 * all three derive from ./seo-regions.mjs. After adding a region/town/route:
 *   node scripts/generate-rewrites.mjs
 * then update artifact.toml with the fresh block and re-publish.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGIONS,
  regionFeatures,
  townFeatures,
  regionMountains,
  publishedCatalogueMountainRoutes,
} from "./seo-regions.mjs";
import legacyRouteDeclarations from "../src/lib/legacyRoutes.json" with { type: "json" };

const paths = [
  "/countries",
  "/au",
  "/jp",
  "/nz",
  "/ca",
  "/ca/all-ski-areas",
  "/us",
  "/compare",
  "/alerts",
  "/premium",
  "/near-you",
  "/legal/privacy",
  "/legal/terms",
];

const legacyRewrites = legacyRouteDeclarations.flatMap(({ from, to, suffixes }) =>
  suffixes.map((suffix) => ({
    from: `${from}${suffix}`,
    to: `${to}${suffix}`,
  })),
);

for (const r of REGIONS) {
  paths.push(`/${r.slug}`);
  for (const f of regionFeatures(r)) paths.push(`/${r.slug}/${f}`);
  for (const m of regionMountains(r)) paths.push(`/${r.slug}/mountain/${m.id}`);
  for (const t of r.towns) {
    paths.push(`/${r.slug}/${t.id}`);
    for (const f of townFeatures(r)) paths.push(`/${r.slug}/${t.id}/${f}`);
  }
}

for (const { path } of publishedCatalogueMountainRoutes) {
  if (!paths.includes(path)) paths.push(path);
}

const lines = [];
for (const { from, to } of legacyRewrites) {
  lines.push("[[services.production.rewrites]]");
  lines.push(`from = "${from}/"`);
  lines.push(`to = "${to}/index.html"`);
  lines.push("");
}
for (const p of paths) {
  lines.push("[[services.production.rewrites]]");
  lines.push(`from = "${p}/"`);
  lines.push(`to = "${p}/index.html"`);
  lines.push("");
}
// SPA catch-all LAST - order matters, the edge evaluates rewrites in listed
// order and this would otherwise shadow every prerendered page again.
lines.push("[[services.production.rewrites]]");
lines.push(`from = "/*"`);
lines.push(`to = "/index.html"`);

const output = lines.join("\n") + "\n";
if (process.argv.includes("--write-artifact")) {
  const here = dirname(fileURLToPath(import.meta.url));
  const artifactPath = join(here, "..", ".replit-artifact", "artifact.toml");
  const artifact = readFileSync(artifactPath, "utf8");
  const marker = "[[services.production.rewrites]]";
  const start = artifact.indexOf(marker);
  if (start === -1) throw new Error(`[rewrites] no production rewrite block found in ${artifactPath}`);
  writeFileSync(artifactPath, `${artifact.slice(0, start)}${output}`);
  console.error(`[rewrites] wrote ${legacyRewrites.length} legacy routes + ${paths.length} prerendered routes + 1 catch-all to ${artifactPath}`);
} else {
  process.stdout.write(output);
  console.error(`[rewrites] ${legacyRewrites.length} legacy routes + ${paths.length} prerendered routes + 1 catch-all`);
}
