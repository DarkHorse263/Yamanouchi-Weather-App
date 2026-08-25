#!/usr/bin/env node
/**
 * Generates artifacts/feelzlike/public/sitemap.xml from the actual public
 * route map defined in App.tsx and the region/town registry.
 *
 * Why a separate script (not vite-plugin-sitemap)?
 *  - Routes are dynamic-but-finite. A script is simpler than configuring
 *    a plugin to introspect wouter routes.
 *  - Run via `pnpm sitemap` or wired into the build script in package.json.
 *    Idempotent — safe to re-run.
 *
 * Retired routes NOT included (would create soft-404s):
 *  - /:region/today   (replaced by region home)
 *  - /:region/:town/places (removed from the nav)
 *  - /:region/:town/cams   (folded into /roads; /cams client-redirects)
 *
 * Update SITE_URL and PUBLISHED_AT for production deploys.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGIONS,
  regionFeatures,
  townFeatures,
  regionMountains,
  publishedCatalogueMountainRoutes,
} from "./seo-regions.mjs";

const SITE_URL = process.env.PUBLIC_ORIGIN || "https://feelzlike.com";
const NOW = new Date().toISOString().slice(0, 10);

// ── Region / town registry ────────────────────────────────────────────────
// REGIONS comes from ./seo-regions.mjs (shared with prerender.mjs).
// Keep that file in sync with src/regions/ and the KNOWN_REGIONS block in
// api-server/src/app.ts.
//
// Per-region feature sets (regionFeatures / townFeatures) mirror the real
// route gating: region-level /eat + /explore redirect home everywhere and
// are never emitted; /alerts only renders for regions with an alerts page;
// town-level /roads only renders for regions with roads content. Emitting
// redirecting URLs gets them filed under "Page with redirect" in GSC.
// Omitted on purpose: cams (redirects to /roads), places (retired).

// ── Top-level static pages ────────────────────────────────────────────────

/** @param {string} path @param {string} changefreq @param {string} priority */
function url(path, changefreq, priority) {
  return { path, changefreq, priority };
}

/**
 * The production edge serves prerendered pages as directories, so every path
 * except root 301-redirects to its trailing-slash form. Emit the trailing-slash
 * URL (the real 200 canonical) so sitemap entries are never flagged as
 * "Page with redirect" and go unindexed.
 * @param {string} path
 */
function canonicalLoc(path) {
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

const staticUrls = [
  url("/",                "daily",   "1.0"),
  url("/countries",       "daily",   "0.9"),
  url("/au",              "daily",   "0.9"),
  url("/jp",              "daily",   "0.9"),
  url("/nz",              "daily",   "0.9"),
  url("/ca",              "daily",   "0.9"),
  url("/ca/all-ski-areas","weekly",  "0.6"),
  url("/us",              "daily",   "0.9"),
  url("/compare",         "weekly",  "0.8"),
  url("/premium",         "weekly",  "0.6"),
  url("/near-you",        "weekly",  "0.6"),
  url("/legal/privacy",   "monthly", "0.4"),
  url("/legal/terms",     "monthly", "0.4"),
];

// ── Dynamic region + town URLs ────────────────────────────────────────────

const dynamicUrls = [];

for (const r of REGIONS) {
  // Region home page
  dynamicUrls.push(url(`/${r.slug}`, "daily", "0.8"));

  // Region sub-sections (per-region: alerts only where an alerts page exists)
  for (const f of regionFeatures(r)) {
    dynamicUrls.push(url(`/${r.slug}/${f}`, "weekly", "0.7"));
  }

  // Mountain / resort detail pages (/:region/mountain/:id) — enumerated from
  // the app's real region registry so new mountains are picked up
  // automatically (see regionMountains in seo-regions.mjs).
  for (const m of regionMountains(r)) {
    dynamicUrls.push(url(`/${r.slug}/mountain/${m.id}`, "daily", "0.7"));
  }

  // Town pages
  for (const t of r.towns) {
    // Town home
    dynamicUrls.push(url(`/${r.slug}/${t.id}`, "daily", "0.7"));
    // Town sub-sections (per-region: roads only where roads content exists)
    for (const f of townFeatures(r)) {
      dynamicUrls.push(url(`/${r.slug}/${t.id}/${f}`, "weekly", "0.6"));
    }
  }
}

// Catalogue-only Japanese regions do not have a supported region/base-town
// landing page yet, but their published mountain detail URLs are valid.
// Deduplicate because supported regions are emitted in the loop above.
const emittedPaths = new Set(dynamicUrls.map(({ path }) => path));
for (const { path } of publishedCatalogueMountainRoutes) {
  if (!emittedPaths.has(path)) {
    dynamicUrls.push(url(path, "daily", "0.7"));
    emittedPaths.add(path);
  }
}

// ── Assemble and write ────────────────────────────────────────────────────

const allUrls = [...staticUrls, ...dynamicUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ({ path, changefreq, priority }) =>
      `  <url><loc>${SITE_URL}${canonicalLoc(path)}</loc><lastmod>${NOW}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

if (process.env.ROUTE_MANIFEST_JSON === "1") {
  process.stdout.write(`${JSON.stringify(allUrls.map(({ path }) => path))}\n`);
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = join(__dirname, "..", "public", "sitemap.xml");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, "utf8");
console.log(`[sitemap] wrote ${allUrls.length} URLs → ${outPath}`);
