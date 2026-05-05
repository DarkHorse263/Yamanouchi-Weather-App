#!/usr/bin/env node
/**
 * Generates artifacts/feelzlike/public/sitemap.xml from a static list of
 * routes derived from the region/town/feature matrix.
 *
 * Why a separate script (not vite-plugin-sitemap)?
 *  - Routes are dynamic-but-finite (2 regions × 3 towns × ~7 features).
 *    A 30-line script is simpler than configuring a plugin to introspect
 *    wouter routes.
 *  - Run via `pnpm sitemap` or it's wired into the build script in
 *    package.json. Idempotent — safe to re-run.
 *
 * Update SITE_URL and PUBLISHED_AT for production deploys.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = process.env.PUBLIC_ORIGIN || "https://feelzlike.com";
const NOW = new Date().toISOString().slice(0, 10);

const REGIONS = [
  { slug: "snowy-mountains", towns: ["jindabyne", "berridale", "cooma"] },
  { slug: "yamanouchi", towns: ["yudanaka", "shibu_onsen", "yomase"] },
];

const REGION_FEATURES = ["", "today", "mountains", "alerts", "stay", "eat", "explore"];
const TOWN_FEATURES = ["", "weather", "stay", "eat", "cams", "roads", "transport", "places"];

const urls = new Set();
urls.add("/");

for (const r of REGIONS) {
  for (const f of REGION_FEATURES) {
    urls.add(f ? `/${r.slug}/${f}` : `/${r.slug}`);
  }
  for (const t of r.towns) {
    for (const f of TOWN_FEATURES) {
      urls.add(f ? `/${r.slug}/${t}/${f}` : `/${r.slug}/${t}`);
    }
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls]
  .sort()
  .map(
    (u) =>
      `  <url><loc>${SITE_URL}${u}</loc><lastmod>${NOW}</lastmod><changefreq>${
        u === "/" ? "daily" : "weekly"
      }</changefreq><priority>${u === "/" ? "1.0" : "0.7"}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = join(__dirname, "..", "public", "sitemap.xml");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, xml, "utf8");
console.log(`[sitemap] wrote ${urls.size} URLs → ${outPath}`);
