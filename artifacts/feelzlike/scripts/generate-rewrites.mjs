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

import { REGIONS, regionFeatures, townFeatures } from "./seo-regions.mjs";

const paths = [
  "/countries",
  "/au",
  "/jp",
  "/nz",
  "/ca",
  "/us",
  "/plan",
  "/premium",
  "/near-you",
  "/legal/privacy",
  "/legal/terms",
];

for (const r of REGIONS) {
  paths.push(`/${r.slug}`);
  for (const f of regionFeatures(r)) paths.push(`/${r.slug}/${f}`);
  for (const t of r.towns) {
    paths.push(`/${r.slug}/${t.id}`);
    for (const f of townFeatures(r)) paths.push(`/${r.slug}/${t.id}/${f}`);
  }
}

const lines = [];
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

process.stdout.write(lines.join("\n") + "\n");
console.error(`[rewrites] ${paths.length} prerendered routes + 1 catch-all`);
