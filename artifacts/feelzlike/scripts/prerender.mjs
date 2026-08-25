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
 * The REGIONS registry lives in ./seo-regions.mjs and is the canonical
 * registry for:
 *   • which URLs get prerendered (here)
 *   • which URLs go in the sitemap (generate-sitemap.mjs imports the same file)
 *   • which paths the server considers valid (app.ts KNOWN_REGIONS mirrors this)
 * Keep seo-regions.mjs in sync with src/regions/ and app.ts when adding
 * regions, towns, or route sections.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REGIONS,
  regionFeatures,
  townFeatures,
  regionMountains,
  regionJapanese,
  publishedCatalogueMountainRoutes,
} from "./seo-regions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist", "public");
const SITE = (process.env.PUBLIC_ORIGIN || "https://feelzlike.com").replace(/\/$/, "");

// The production edge serves prerendered directory pages with a trailing slash
// (a non-slash path 301-redirects to the slash form). The injected canonical
// must point at that 200 URL, otherwise the snapshot's own canonical points at a
// redirect and Google files the page under "Page with redirect". Root stays "/".
const withTrailingSlash = (p) => (p === "/" ? "/" : p.endsWith("/") ? p : `${p}/`);

// ── Region / town / mountain registry ────────────────────────────────────
// REGIONS + per-region feature helpers come from ./seo-regions.mjs (shared
// with generate-sitemap.mjs). Region-level /eat and /explore redirect home
// for every region, so they are never prerendered; /alerts only renders for
// regions with an alerts page; town /roads only for regions with roads
// content. /cams is intentionally omitted — server-side 301 to /roads.

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
    // Idempotency: drop any canonical already present (e.g. re-running
    // prerender over an already-prerendered dist) so pages never carry two
    // conflicting canonical tags.
    .replace(/[ \t]*<link rel="canonical"[^>]*>\n?/g, "")
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

function townSectionLinks(region, townId) {
  return townFeatures(region)
    .map((s) => {
      const label = s === "roads" ? "roads & cams" : s;
      return `<a href="/${region.slug}/${townId}/${s}">${esc(label)}</a>`;
    })
    .join(" · ");
}

// ── Route definitions ─────────────────────────────────────────────────────

const routes = [];

function add(path, title, description, body) {
  routes.push({ path, title, description, body });
}

// ── Japanese SEO copy (Japan routes only) ────────────────────────────────
// Japan pages carry a Japanese-first bilingual meta description plus a
// lang="ja" paragraph in the snapshot body, so Google Japan shows Japanese
// snippets while English-language queries can still surface English copy.
// Non-JP routes never pass a ja description, so their output is unchanged.

/** Japanese-first bilingual description; falls back to EN when no ja copy. */
const biDesc = (ja, en) => (ja ? `${ja} | ${en}` : en);

/** Snapshot body with an extra Japanese paragraph when ja copy exists. */
function withJaBody(body, ja) {
  if (!ja) return body;
  return body.replace(/<\/main>\s*$/, `  <p lang="ja">${esc(ja)}</p>\n    </main>`);
}

/** "English Name（日本語名）" for JP titles; plain EN when no distinct ja name.
 *  Long official ja names (e.g. "ニセコマウンテンリゾート グラン・ヒラフ") are
 *  shortened to their final space-separated segment to keep titles within
 *  reasonable SERP length ("グラン・ヒラフ"). */
function withJaName(en, jaName) {
  if (!jaName || jaName === en) return en;
  let ja = jaName;
  if (ja.length > 10 && /[\s\u3000]/.test(ja)) {
    ja = ja.split(/[\s\u3000]+/).filter(Boolean).pop();
  }
  return `${en}（${ja}）`;
}

function addJa(path, title, enDescription, jaDescription, body) {
  add(path, title, biDesc(jaDescription, enDescription), withJaBody(body, jaDescription));
}

// ── Top-level static pages ────────────────────────────────────────────────

add(
  "/",
  "feelzlike · weather for resort towns",
  "Live weather, road conditions, and lift status for resort towns across Australia, Japan, New Zealand, Canada, and the United States. Towns first, mountains second.",
  `<main>
    <h1>feelzlike · weather for resort towns</h1>
    <p>Live weather, road conditions, and lift status for resort towns across Australia, Japan, New Zealand, Canada, and the United States. Towns first, mountains second.</p>
    <nav aria-label="Browse by country">
      <a href="/au">Australia</a> ·
      <a href="/jp">Japan</a> ·
      <a href="/nz">New Zealand</a> ·
      <a href="/ca">Canada</a> ·
      <a href="/us">United States</a> ·
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

const countryLine = (code, label) =>
  `<li><a href="/${code.toLowerCase()}">${label}</a> · ${BY_COUNTRY(code)
    .map((r) => esc(r.name))
    .join(" · ")}</li>`;

add(
  "/countries",
  "browse resort regions by country · feelzlike",
  "Choose a country to explore resort town weather and conditions — Australia, Japan, New Zealand, Canada, and the United States.",
  `<main>
    <h1>browse resort regions by country</h1>
    <ul>
      ${countryLine("AU", "Australia")}
      ${countryLine("JP", "Japan")}
      ${countryLine("NZ", "New Zealand")}
      ${countryLine("CA", "Canada")}
      ${countryLine("US", "United States")}
    </ul>
  </main>`,
);

add(
  "/au",
  "Australia · resort town weather · feelzlike",
  "Live weather and conditions for resort towns across Australia — Snowy Mountains (NSW), Victoria's High Country (VIC), and Tasmania (TAS).",
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

addJa(
  "/jp",
  "Japan（日本） · resort town weather · feelzlike",
  "Live weather and conditions for resort towns in Japan — Yamanouchi, Nozawa Onsen, Iiyama, Hakuba Valley (Nagano), and Myoko (Niigata).",
  "日本のスキーリゾートの町のライブ天気・積雪・道路状況 · 志賀高原、野沢温泉、白馬、妙高、ニセコほか。",
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
  "Live weather and conditions for resort towns across New Zealand — Queenstown, Wanaka (Otago), Mt Hutt (Canterbury), and Ruapehu (Central Plateau).",
  `<main>
    <h1>New Zealand · resort town weather</h1>
    ${BY_COUNTRY("NZ").map((r) => `
    <section>
      <h2><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</h2>
      <ul>
        ${regionTownList(r)}
      </ul>
    </section>`).join("\n")}
  </main>`,
);

add(
  "/ca",
  "Canada \u00b7 resort town weather \u00b7 feelzlike",
  "Live weather and conditions for resort towns across Canada \u2014 Whistler and the Powder Highway (BC), Banff & Lake Louise, Canmore and Jasper (Alberta), and the Laurentians, Charlevoix and the Eastern Townships (Qu\u00e9bec).",
  `<main>
    <h1>Canada \u00b7 resort town weather</h1>
    ${BY_COUNTRY("CA").map((r) => `
    <section>
      <h2><a href="/${r.slug}">${esc(r.name)}</a> \u00b7 ${esc(r.subtitle)}</h2>
      <ul>
        ${regionTownList(r)}
      </ul>
    </section>`).join("\n")}
  </main>`,
);

add(
  "/ca/all-ski-areas",
  "Canada · all ski areas · feelzlike",
  "Directory of Canadian ski areas — every hill across BC, Alberta, Québec and beyond, with links to detail pages.",
  `<main>
    <h1>Canada · all ski areas</h1>
    <p>A directory of Canadian ski areas beyond the regions feelzlike covers in depth, with links out to detail pages for each hill.</p>
    <p>For live conditions, see the covered regions on the <a href="/ca">Canada page</a>.</p>
  </main>`,
);

add(
  "/us",
  "United States \u00b7 resort town weather \u00b7 feelzlike",
  "Live weather and conditions for resort towns across Colorado \u2014 Summit County, Vail Valley, Aspen Snowmass, Steamboat, Winter Park, Crested Butte, Telluride, Durango, and Boulder / Front Range.",
  `<main>
    <h1>United States \u00b7 resort town weather</h1>
    ${BY_COUNTRY("US").map((r) => `
    <section>
      <h2><a href="/${r.slug}">${esc(r.name)}</a> \u00b7 ${esc(r.subtitle)}</h2>
      <ul>
        ${regionTownList(r)}
      </ul>
    </section>`).join("\n")}
  </main>`,
);

add(
  "/near-you",
  "weather near you · local resort conditions · feelzlike",
  "See live weather and a radar for your current location, plus nearby resort regions.",
  `<main>
    <h1>weather near you</h1>
    <p>Live weather for your current location, plus nearby resort regions across Australia, Japan, New Zealand, Canada, and the United States.</p>
    <p>Enable location access to see conditions where you are.</p>
  </main>`,
);

add(
  "/compare",
  "compare mountains · snow side by side · feelzlike",
  "Compare the next week of fresh snow and temps across the mountains you're choosing between.",
  `<main>
    <h1>compare mountains</h1>
    <p>Compare the coming week of snow and temps across resort mountains, side by side.</p>
    <section>
      <h2>Regions to compare</h2>
      <ul>
        ${REGIONS.map((r) => `<li><a href="/${r.slug}">${esc(r.name)}</a> · ${esc(r.subtitle)}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>`,
);

add(
  "/premium",
  "feelzlike premium · snow alerts for your towns · feelzlike",
  "feelzlike premium — email snow and powder alerts for your favourite resort towns across Australia, Japan, New Zealand, and Canada.",
  `<main>
    <h1>feelzlike premium</h1>
    <p>Email snow and powder alerts for your favourite resort towns across Australia, Japan, New Zealand, and Canada.</p>
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
  // Japanese copy from the app's region registry (null for non-JP regions).
  const ja = regionJapanese(region);
  const regionNameJa = region.nameJa || region.name;

  // Region home
  addJa(
    `/${region.slug}`,
    `${withJaName(region.name, region.nameJa)} · resort town weather & conditions · feelzlike`,
    `Live weather, mountain conditions, road status, and visitor info for ${region.name} resort towns.`,
    ja ? `${regionNameJa}のスキー場と麓の町のライブ天気・積雪・道路状況・観光情報。` : null,
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

  // Region sub-section pages (per-region set — see seo-regions.mjs)
  for (const feature of regionFeatures(region)) {
    const featureLabel = feature.charAt(0).toUpperCase() + feature.slice(1);

    const descriptions = {
      mountains: `Mountains and ski resorts in the ${region.name} — live snow conditions, lift status, and terrain info.`,
      alerts:    `Current weather alerts and conditions for the ${region.name}.`,
      stay:      `Where to stay in the ${region.name} — accommodation options in all base towns.`,
    };

    const jaDescriptions = ja ? {
      mountains: `${regionNameJa}のスキー場一覧 · 積雪、リフト、天気をライブでチェック。`,
      alerts:    `${regionNameJa}の気象警報と現在のコンディション。`,
      stay:      `${regionNameJa}の宿泊情報 · 各拠点の町のホテル・旅館・ロッジ。`,
    } : {};

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

    };

    addJa(
      `/${region.slug}/${feature}`,
      `${withJaName(region.name, region.nameJa)} · ${featureLabel.toLowerCase()} · feelzlike`,
      descriptions[feature] || `${featureLabel} for the ${region.name}.`,
      jaDescriptions[feature] || null,
      bodies[feature] || `<main><h1>${esc(region.name)} · ${esc(featureLabel.toLowerCase())}</h1></main>`,
    );
  }

  // ── Mountain / resort detail pages ─────────────────────────────────────
  // Enumerated from the app's real region registry (regionMountains) so new
  // mountains get a prerendered snapshot automatically. Route set must stay
  // identical to generate-sitemap.mjs / generate-rewrites.mjs.
  for (const m of regionMountains(region)) {
    const jm = ja?.mountains[m.id] || {};
    const catalogueMountain = m.catalogueRecord;
    const mountainNameJa = jm.nameJa || m.nameJa;
    const jaMountainDesc = catalogueMountain
      ? `${mountainNameJa || m.name}（${regionNameJa}）の天気予報と現在の気象情報。`
      : ja
      ? `${jm.nameJa || m.name}（${regionNameJa}）の積雪・天気予報・リフト情報をライブでチェック。${jm.blurbJa ? `${jm.blurbJa}。` : ""}`
      : null;
    addJa(
      `/${region.slug}/mountain/${m.id}`,
      catalogueMountain
        ? `${withJaName(m.name, mountainNameJa)} · weather forecast · ${region.name} · feelzlike`
        : `${withJaName(m.name, mountainNameJa)} · snow conditions & forecast · ${region.name} · feelzlike`,
      catalogueMountain
        ? `Weather forecast and current conditions for ${m.name} in ${region.name}.`
        : `Live snow conditions, weather forecast, and lift info for ${m.name} in the ${region.name}.`,
      jaMountainDesc,
      catalogueMountain
        ? `<main>
      <h1>${esc(m.name)} · ${esc(region.name)}</h1>
      <p>Weather forecast and current conditions for ${esc(m.name)}.</p>
      <p>Part of the <a href="/${region.slug}">${esc(region.name)}</a>.</p>
    </main>`
        : `<main>
      <h1>${esc(m.name)} · ${esc(region.name)}</h1>
      <p>Live snow conditions, weather by elevation, and the extended forecast for ${esc(m.name)}.</p>
      <p>Part of the <a href="/${region.slug}">${esc(region.name)}</a>.</p>
    </main>`,
    );
  }

  // ── Town home pages + all town sub-section pages ──────────────────────

  for (const town of region.towns) {
    const jt = ja?.towns[town.id] || {};
    const townNameJa = jt.nameJa || town.name;

    // Town home
    addJa(
      `/${region.slug}/${town.id}`,
      `${withJaName(town.name, jt.nameJa)} · ${region.name} conditions · feelzlike`,
      `Live weather, road conditions, and visitor info for ${town.name} in the ${region.name}.`,
      ja
        ? `${townNameJa}（${regionNameJa}）のライブ天気・道路状況・観光情報。${jt.blurbJa ? `${jt.blurbJa}。` : ""}`
        : null,
      `<main>
      <h1>${esc(town.name)} · ${esc(region.name)}</h1>
      <p>${esc(town.blurb)}</p>
      <nav aria-label="Town sections">
        ${townSectionLinks(region, town.id)}
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

    const jaTownFeatureDesc = ja ? {
      weather:   `${townNameJa}（${regionNameJa}）の天気予報と雨雲レーダー。`,
      stay:      `${townNameJa}（${regionNameJa}）の宿泊 · ホテル・旅館・ロッジ。`,
      eat:       `${townNameJa}（${regionNameJa}）のカフェ・レストラン。`,
      roads:     `${townNameJa}（${regionNameJa}）周辺のライブ道路状況とライブカメラ。`,
      transport: `${townNameJa}（${regionNameJa}）へのアクセス・交通手段。`,
      explore:   `${townNameJa}（${regionNameJa}）の楽しみ方 · アクティビティと観光。`,
    } : {};

    for (const feature of townFeatures(region)) {
      const meta = townFeatureMeta[feature];
      addJa(
        `/${region.slug}/${town.id}/${feature}`,
        `${withJaName(town.name, jt.nameJa)} · ${meta.label} · ${region.name} · feelzlike`,
        meta.desc,
        jaTownFeatureDesc[feature] || null,
        `<main>
      <h1>${esc(town.name)} · ${esc(meta.label)}</h1>
      <p>${esc(meta.desc)}</p>
      <p>Part of <a href="/${region.slug}/${town.id}">${esc(town.name)}</a> in the <a href="/${region.slug}">${esc(region.name)}</a>.</p>
      <nav aria-label="Town sections">
        ${townSectionLinks(region, town.id)}
      </nav>
    </main>`,
      );
    }
  }
}

// Render every published catalogue mountain route, including records assigned
// to regions that do not yet have a supported region/base-town frontend page.
// These intentionally use only generic weather language: publication alone
// does not establish lift, webcam, road, or transport information.
const prerenderedPaths = new Set(routes.map(({ path }) => path));
for (const { path, record } of publishedCatalogueMountainRoutes) {
  if (prerenderedPaths.has(path)) continue;
  addJa(
    path,
    `${withJaName(record.name, record.nameJa)} · weather forecast · feelzlike`,
    `Weather forecast and current conditions for ${record.name} in Japan.`,
    `${record.nameJa || record.name}の天気予報と現在の気象情報。`,
    `<main>
      <h1>${esc(record.name)}${record.nameJa ? `（${esc(record.nameJa)}）` : ""}</h1>
      <p>Weather forecast and current conditions for ${esc(record.name)} in Japan.</p>
      <p lang="ja">${esc(`${record.nameJa || record.name}の天気予報と現在の気象情報。`)}</p>
    </main>`,
  );
  prerenderedPaths.add(path);
}

// ── Write prerendered files ───────────────────────────────────────────────

if (process.env.ROUTE_MANIFEST_JSON === "1") {
  process.stdout.write(`${JSON.stringify(routes.map(({ path }) => path))}\n`);
  process.exit(0);
}

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
  const canonical = `${SITE}${withTrailingSlash(route.path)}`;
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
