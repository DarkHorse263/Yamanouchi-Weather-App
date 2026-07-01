#!/usr/bin/env node
/**
 * Build-time prerender: generates static HTML snapshots for every indexable
 * public route (the same set emitted by generate-sitemap.mjs).
 *
 * Run AFTER `vite build` — reads dist/public/index.html as the shell
 * template, injects per-route head meta and body content, then writes one
 * dist/public/<path>/index.html per route.
 *
 * express.static (index:true) automatically serves these files so
 * non-JS crawlers (GPTBot, ClaudeBot, social bots) receive real page content
 * rather than an empty <div id="root"></div> shell.
 *
 * React's createRoot() replaces #root contents on mount — no hydration
 * conflict. The snapshot is wrapped in #seo-prerender, which index.html hides
 * via inline CSS, so its unstyled markup never flashes in the top-left before
 * the styled app paints. Crawlers still read it from the raw HTML, and no-JS
 * visitors get it back through the <noscript> rule in index.html.
 *
 * ── Single source of truth ─────────────────────────────────────────────────
 * The REGIONS constant and REGION_FEATURES / TOWN_FEATURES arrays below
 * are the canonical registry for:
 *   • which URLs get prerendered (here)
 *   • which URLs go in the sitemap (generate-sitemap.mjs mirrors this)
 *   • which paths the server considers valid (app.ts KNOWN_REGIONS mirrors this)
 * Keep all three in sync when adding regions, towns, or route sections.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist", "public");
const SITE = (process.env.PUBLIC_ORIGIN || "https://feelzlike.com").replace(/\/$/, "");

// ── Region / town / mountain registry ────────────────────────────────────

const REGIONS = [
  {
    slug: "snowy-mountains",
    name: "Snowy Mountains",
    subtitle: "NSW · Australia",
    country: "AU",
    mountains: [
      { name: "Perisher",          blurb: "NSW · the big one (4 resorts)" },
      { name: "Thredbo",           blurb: "NSW · the high one" },
      { name: "Selwyn",            blurb: "NSW · family beginner mountain" },
      { name: "Charlotte's Pass",  blurb: "NSW · ski-in village · day trip via oversnow from Perisher" },
    ],
    towns: [
      { id: "jindabyne",  name: "Jindabyne",  blurb: "Lakeside base town · 30 min to Thredbo & Perisher" },
      { id: "berridale",  name: "Berridale",  blurb: "Quiet village stop on the Snowy Mountains Highway" },
      { id: "cooma",      name: "Cooma",      blurb: "Regional hub · 1 hr to the snowfields" },
    ],
  },
  {
    slug: "yamanouchi",
    name: "Yamanouchi",
    subtitle: "Nagano · Japan",
    country: "JP",
    mountains: [
      { name: "Shiga Kogen",   blurb: "Japan's largest interconnected ski area · 20 resorts linked" },
      { name: "Ryuoo",         blurb: "Nagano · family resort · accessible from Yudanaka" },
      { name: "XJAM Takaifuji",blurb: "Kita-Shiga · beginner-friendly" },
    ],
    towns: [
      { id: "yudanaka",    name: "Yudanaka",    blurb: "Onsen station town · gateway to Shiga Kogen" },
      { id: "shibu-onsen", name: "Shibu Onsen", blurb: "Traditional ryokan district · 600 m from Yudanaka station" },
      { id: "yomase",      name: "Yomase",      blurb: "Quiet farming village · base for Kita-Shiga resorts" },
    ],
  },
  {
    slug: "victorias-high-country",
    name: "Victoria's High Country",
    subtitle: "VIC · Australia",
    country: "AU",
    mountains: [
      { name: "Mt Buller",       blurb: "VIC · the big one · 3 hrs from Melbourne" },
      { name: "Falls Creek",     blurb: "VIC · largest skiable area · ski-in village" },
      { name: "Mt Hotham",       blurb: "VIC · the high & steep one · Hotham Airport access" },
      { name: "Mt Stirling",     blurb: "VIC · cross-country & backcountry sister to Buller" },
      { name: "Lake Mountain",   blurb: "VIC · nordic & snow play · closest snow to Melbourne" },
      { name: "Mt Donna Buang",  blurb: "VIC · free snow play summit · 1.5 hrs from Melbourne" },
    ],
    towns: [
      { id: "mansfield",    name: "Mansfield",    blurb: "Cattle country gateway · 50 min to Buller & Stirling" },
      { id: "bright",       name: "Bright",       blurb: "Great Alpine Road hub · gateway to Falls Creek & Hotham" },
      { id: "mount-beauty", name: "Mount Beauty", blurb: "Closest sealed-road town to Falls Creek · 30 min up" },
      { id: "harrietville", name: "Harrietville", blurb: "Last village before Hotham · chains fit on the way up" },
      { id: "dinner-plain", name: "Dinner Plain", blurb: "Alpine village · 10 min from Mt Hotham · ski-in feel" },
      { id: "marysville",   name: "Marysville",   blurb: "Yarra Ranges gateway · 20 min to Lake Mountain" },
      { id: "warburton",    name: "Warburton",    blurb: "Yarra Valley town · closest base to Mt Donna Buang" },
      { id: "omeo",         name: "Omeo",         blurb: "Southern Great Alpine Road · gateway to Hotham from Gippsland" },
    ],
  },
];

// Valid region sub-sections (mirrors generate-sitemap.mjs REGION_FEATURES).
const REGION_FEATURES = ["mountains", "alerts", "stay", "eat", "explore"];

// Valid town sub-sections (mirrors generate-sitemap.mjs TOWN_FEATURES).
// /cams is intentionally omitted — it gets a server-side 301 to /roads.
const TOWN_FEATURES = ["weather", "stay", "eat", "roads", "transport", "explore"];

const BY_COUNTRY = (code) => REGIONS.filter((r) => r.country === code);

// ── HTML utilities ────────────────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectHead(template, title, description, canonical) {
  const t = esc(title);
  const d = esc(description);
  const ogImage = `${SITE}/opengraph.jpg`;
  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/i, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/i, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/i, `$1${d}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/i, `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/i, `$1${d}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/i, `$1${esc(ogImage)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/i, `$1${esc(ogImage)}$2`)
    .replace(/<\/head>/, `  <link rel="canonical" href="${esc(canonical)}" />\n</head>`);
}

/** Inject body content into #root so it is present in the initial HTTP
 *  response before React mounts. Wrapped in #seo-prerender (hidden via inline
 *  CSS in index.html) so the unstyled snapshot never flashes before the app
 *  paints. createRoot() replaces the whole #root subtree on mount. */
function injectBody(html, bodyContent) {
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><div id="seo-prerender">${bodyContent}</div></div>`,
  );
}

function regionTownList(region) {
  return region.towns
    .map((t) => `<li><a href="/${region.slug}/${t.id}">${esc(t.name)}</a> — ${esc(t.blurb)}</li>`)
    .join("\n          ");
}

function townSectionLinks(regionSlug, townId) {
  return TOWN_FEATURES
    .map((s) => {
      const label = s === "roads" ? "roads & cams" : s;
      return `<a href="/${regionSlug}/${townId}/${s}">${esc(label)}</a>`;
    })
    .join(" · ");
}

// ── Route definitions ─────────────────────────────────────────────────────

const routes = [];

function add(path, title, description, body) {
  routes.push({ path, title, description, body });
}

// ── Top-level static pages ────────────────────────────────────────────────

add(
  "/",
  "feelzlike · weather for resort towns",
  "Live weather, road conditions, and lift status for resort towns across Australia, Japan, and New Zealand. Towns first, mountains second.",
  `<main>
    <h1>feelzlike · weather for resort towns</h1>
    <p>Live weather, road conditions, and lift status for resort towns across Australia, Japan, and New Zealand. Towns first, mountains second.</p>
    <nav aria-label="Browse by country">
      <a href="/au">Australia</a> ·
      <a href="/jp">Japan</a> ·
      <a href="/nz">New Zealand</a> ·
      <a href="/near-you">Near you</a>
    </nav>
    <section>
      <h2>Resort regions</h2>
      <ul>
        ${REGIONS.map((r) => `<li><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>`,
);

add(
  "/countries",
  "browse resort regions by country · feelzlike",
  "Choose a country to explore resort town weather and conditions — Australia, Japan, and New Zealand.",
  `<main>
    <h1>browse resort regions by country</h1>
    <ul>
      <li><a href="/au">Australia</a> · Snowy Mountains (NSW) · Victoria's High Country (VIC)</li>
      <li><a href="/jp">Japan</a> · Yamanouchi (Nagano)</li>
      <li><a href="/nz">New Zealand</a></li>
    </ul>
  </main>`,
);

add(
  "/au",
  "Australia · resort town weather · feelzlike",
  "Live weather and conditions for resort towns across Australia — Snowy Mountains (NSW) and Victoria's High Country (VIC).",
  `<main>
    <h1>Australia · resort town weather</h1>
    ${BY_COUNTRY("AU").map((r) => `
    <section>
      <h2><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</h2>
      <ul>
        ${regionTownList(r)}
      </ul>
    </section>`).join("\n")}
  </main>`,
);

add(
  "/jp",
  "Japan · resort town weather · feelzlike",
  "Live weather and conditions for resort towns in Japan — Yamanouchi, Nagano, gateway to Shiga Kogen.",
  `<main>
    <h1>Japan · resort town weather</h1>
    ${BY_COUNTRY("JP").map((r) => `
    <section>
      <h2><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</h2>
      <ul>
        ${regionTownList(r)}
      </ul>
    </section>`).join("\n")}
  </main>`,
);

add(
  "/nz",
  "New Zealand · resort town weather · feelzlike",
  "Live weather and conditions for resort towns across New Zealand.",
  `<main>
    <h1>New Zealand · resort town weather</h1>
    <p>New Zealand resort regions are coming soon. Check back next season.</p>
  </main>`,
);

add(
  "/near-you",
  "weather near you · local resort conditions · feelzlike",
  "See live weather and a radar for your current location, plus nearby resort regions.",
  `<main>
    <h1>weather near you</h1>
    <p>Live weather for your current location, plus nearby resort regions across Australia, Japan, and New Zealand.</p>
    <p>Enable location access to see conditions where you are.</p>
  </main>`,
);

add(
  "/plan",
  "trip planner · find the best conditions · feelzlike",
  "Plan a multi-day resort town trip by comparing forecasts across regions and towns.",
  `<main>
    <h1>trip planner</h1>
    <p>Compare multi-day forecasts across resort towns to find the best conditions for your trip.</p>
    <section>
      <h2>Regions to compare</h2>
      <ul>
        ${REGIONS.map((r) => `<li><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>`,
);

add(
  "/legal/privacy",
  "privacy policy · feelzlike",
  "How feelzlike collects, uses, and protects your personal information.",
  `<main>
    <h1>privacy policy</h1>
    <p>This page describes how feelzlike collects, uses, and protects your personal information.</p>
  </main>`,
);

add(
  "/legal/terms",
  "terms of service · feelzlike",
  "Terms and conditions for using the feelzlike weather app.",
  `<main>
    <h1>terms of service</h1>
    <p>By using feelzlike you agree to these terms and conditions.</p>
  </main>`,
);

// ── Region pages + all region sub-section pages ───────────────────────────

for (const region of REGIONS) {
  // Region home
  add(
    `/${region.slug}`,
    `${region.name} · resort town weather & conditions · feelzlike`,
    `Live weather, mountain conditions, road status, and visitor info for ${region.name} resort towns.`,
    `<main>
      <h1>${esc(region.name)} · ${esc(region.subtitle)}</h1>
      <p>Live weather, conditions, and visitor information for ${esc(region.name)} resort towns.</p>
      <h2>Base towns</h2>
      <ul>
        ${regionTownList(region)}
      </ul>
      <h2>Mountains</h2>
      <ul>
        ${region.mountains.map((m) => `<li>${esc(m.name)} — ${esc(m.blurb)}</li>`).join("\n        ")}
      </ul>
    </main>`,
  );

  // Region sub-section pages
  for (const feature of REGION_FEATURES) {
    const featureLabel = feature.charAt(0).toUpperCase() + feature.slice(1);

    const descriptions = {
      mountains: `Mountains and ski resorts in the ${region.name} — live snow conditions, lift status, and terrain info.`,
      alerts:    `Current weather alerts and conditions for the ${region.name}.`,
      stay:      `Where to stay in the ${region.name} — accommodation options in all base towns.`,
      eat:       `Where to eat in the ${region.name} — cafes, restaurants, and dining in resort towns.`,
      explore:   `Things to do in the ${region.name} beyond the mountain — activities, trails, and local experiences.`,
    };

    const bodies = {
      mountains: `<main>
      <h1>${esc(region.name)} · mountains</h1>
      <p>Live snow conditions, lift status, and weather for mountains and ski resorts in the ${esc(region.name)}.</p>
      <ul>
        ${region.mountains.map((m) => `<li><strong>${esc(m.name)}</strong> — ${esc(m.blurb)}</li>`).join("\n        ")}
      </ul>
      <h2>Base towns</h2>
      <ul>
        ${regionTownList(region)}
      </ul>
    </main>`,

      alerts: `<main>
      <h1>${esc(region.name)} · alerts &amp; conditions</h1>
      <p>Current weather alerts, road closures, and conditions for the ${esc(region.name)}.</p>
      <h2>Base towns</h2>
      <ul>
        ${regionTownList(region)}
      </ul>
    </main>`,

      stay: `<main>
      <h1>${esc(region.name)} · where to stay</h1>
      <p>Accommodation options across ${esc(region.name)} resort towns — hotels, lodges, apartments, and more.</p>
      <h2>Towns</h2>
      <ul>
        ${region.towns.map((t) => `<li><a href="/${region.slug}/${t.id}/stay">${esc(t.name)}</a> — ${esc(t.blurb)}</li>`).join("\n        ")}
      </ul>
    </main>`,

      eat: `<main>
      <h1>${esc(region.name)} · where to eat</h1>
      <p>Cafes, restaurants, and dining across ${esc(region.name)} resort towns.</p>
      <h2>Towns</h2>
      <ul>
        ${region.towns.map((t) => `<li><a href="/${region.slug}/${t.id}/eat">${esc(t.name)}</a> — ${esc(t.blurb)}</li>`).join("\n        ")}
      </ul>
    </main>`,

      explore: `<main>
      <h1>${esc(region.name)} · explore</h1>
      <p>Things to do in the ${esc(region.name)} beyond the mountain — trails, activities, and local experiences.</p>
      <h2>Towns</h2>
      <ul>
        ${region.towns.map((t) => `<li><a href="/${region.slug}/${t.id}/explore">${esc(t.name)}</a> — ${esc(t.blurb)}</li>`).join("\n        ")}
      </ul>
    </main>`,
    };

    add(
      `/${region.slug}/${feature}`,
      `${region.name} · ${featureLabel.toLowerCase()} · feelzlike`,
      descriptions[feature] || `${featureLabel} for the ${region.name}.`,
      bodies[feature] || `<main><h1>${esc(region.name)} · ${esc(featureLabel.toLowerCase())}</h1></main>`,
    );
  }

  // ── Town home pages + all town sub-section pages ──────────────────────

  for (const town of region.towns) {
    // Town home
    add(
      `/${region.slug}/${town.id}`,
      `${town.name} · ${region.name} conditions · feelzlike`,
      `Live weather, road conditions, and visitor info for ${town.name} in the ${region.name}.`,
      `<main>
      <h1>${esc(town.name)} · ${esc(region.name)}</h1>
      <p>${esc(town.blurb)}</p>
      <nav aria-label="Town sections">
        ${townSectionLinks(region.slug, town.id)}
      </nav>
    </main>`,
    );

    // Town sub-section pages
    const townFeatureMeta = {
      weather:   { label: "weather forecast",  desc: `${town.name} weather forecast and radar — ${region.name}.` },
      stay:      { label: "where to stay",     desc: `Accommodation in ${town.name}, ${region.name} — hotels, lodges, and short stays.` },
      eat:       { label: "where to eat",      desc: `Cafes and restaurants in ${town.name}, ${region.name}.` },
      roads:     { label: "roads & cams",      desc: `Live road conditions and traffic cameras near ${town.name}, ${region.name}.` },
      transport: { label: "getting there",     desc: `Transport options to and from ${town.name}, ${region.name}.` },
      explore:   { label: "explore",           desc: `Things to do in ${town.name}, ${region.name} — trails, activities, and local experiences.` },
    };

    for (const feature of TOWN_FEATURES) {
      const meta = townFeatureMeta[feature];
      add(
        `/${region.slug}/${town.id}/${feature}`,
        `${town.name} · ${meta.label} · ${region.name} · feelzlike`,
        meta.desc,
        `<main>
      <h1>${esc(town.name)} · ${esc(meta.label)}</h1>
      <p>${esc(meta.desc)}</p>
      <p>Part of <a href="/${region.slug}/${town.id}">${esc(town.name)}</a> in the <a href="/${region.slug}">${esc(region.name)}</a>.</p>
      <nav aria-label="Town sections">
        ${townSectionLinks(region.slug, town.id)}
      </nav>
    </main>`,
      );
    }
  }
}

// ── Write prerendered files ───────────────────────────────────────────────

let template;
try {
  template = readFileSync(join(DIST, "index.html"), "utf8");
} catch (err) {
  console.error("[prerender] Could not read dist/public/index.html:", err.message);
  console.error("[prerender] Run `pnpm build` (client only) first, then re-run prerender.");
  process.exit(1);
}

let count = 0;
for (const route of routes) {
  const canonical = `${SITE}${route.path}`;
  let html = injectHead(template, route.title, route.description, canonical);
  html = injectBody(html, route.body);

  const parts = route.path.split("/").filter(Boolean);
  const outPath =
    parts.length === 0
      ? join(DIST, "index.html")
      : join(DIST, ...parts, "index.html");

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html, "utf8");
  count++;
}

console.log(`[prerender] wrote ${count} route snapshots → ${DIST}`);
