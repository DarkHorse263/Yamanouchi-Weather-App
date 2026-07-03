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

const SITE_URL = process.env.PUBLIC_ORIGIN || "https://feelzlike.com";
const NOW = new Date().toISOString().slice(0, 10);

// ── Region / town registry ────────────────────────────────────────────────
// Keep in sync with src/regions/ and the KNOWN_REGIONS block in api-server/src/app.ts.

const REGIONS = [
  {
    slug: "snowy-mountains",
    name: "Snowy Mountains",
    towns: ["jindabyne", "berridale", "cooma"],
  },
  {
    slug: "yamanouchi",
    name: "Yamanouchi",
    // Note: shibu-onsen uses a hyphen (the correct town ID), not an underscore.
    towns: ["yudanaka", "shibu-onsen", "yomase"],
  },
  {
    slug: "victorias-high-country",
    name: "Victoria's High Country",
    towns: ["mansfield", "bright", "mount-beauty", "harrietville", "dinner-plain", "marysville", "warburton", "omeo"],
  },
];

// Valid region sub-sections that are indexable pages (not redirects/retired).
const REGION_FEATURES = ["mountains", "alerts", "stay", "eat", "explore"];

// Valid town sub-sections that are indexable pages (not redirects/retired).
// Omits: cams (redirects to /roads), places (retired).
const TOWN_FEATURES = ["weather", "stay", "eat", "roads", "transport", "explore"];

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
  url("/plan",            "weekly",  "0.8"),
  url("/near-you",        "weekly",  "0.6"),
  url("/legal/privacy",   "monthly", "0.4"),
  url("/legal/terms",     "monthly", "0.4"),
];

// ── Dynamic region + town URLs ────────────────────────────────────────────

const dynamicUrls = [];

for (const r of REGIONS) {
  // Region home page
  dynamicUrls.push(url(`/${r.slug}`, "daily", "0.8"));

  // Region sub-sections
  for (const f of REGION_FEATURES) {
    dynamicUrls.push(url(`/${r.slug}/${f}`, "weekly", "0.7"));
  }

  // Town pages
  for (const t of r.towns) {
    // Town home
    dynamicUrls.push(url(`/${r.slug}/${t}`, "daily", "0.7"));
    // Town sub-sections
    for (const f of TOWN_FEATURES) {
      dynamicUrls.push(url(`/${r.slug}/${t}/${f}`, "weekly", "0.6"));
    }
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = join(__dirname, "..", "public", "sitemap.xml");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, "utf8");
console.log(`[sitemap] wrote ${allUrls.length} URLs → ${outPath}`);
