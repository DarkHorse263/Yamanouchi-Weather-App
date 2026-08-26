/**
 * build-phase2-pack.ts - renders the feelzlike facebook PHASE 2 pack PDF.
 *
 * Follows build-campaign-pack.ts (v2 rules still apply: every ad lands on the
 * HOME PAGE, ad sets by country, location-neutral honesty-railed copy, CTA
 * always "Learn more"). This pack adds:
 *   1. a plain-language readout of the phase-1 results (27 jul - 3 aug 2026)
 *   2. the phase-2 ad roster: keep the winners, cut the losers, add fresh tiles
 *   3. a 4-week facebook PAGE content calendar (2 posts/week, unpaid,
 *      utm_medium=social)
 *
 * utm scheme phase 2: utm_campaign=winter26-phase2 (paid) · page posts use
 * utm_medium=social&utm_campaign=page-content.
 *
 * Run: pnpm --filter @workspace/api-server exec tsx src/scripts/build-phase2-pack.ts
 * Output: exports/feelzlike-facebook-phase2-pack.pdf   (exports only, never public/downloads)
 */
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer";

function resolveChromiumPath(): string | undefined {
  if (process.env["PUPPETEER_EXECUTABLE_PATH"]) return process.env["PUPPETEER_EXECUTABLE_PATH"];
  try {
    const p = execSync("which chromium 2>/dev/null").toString().trim();
    if (p) return p;
  } catch { /* fall through */ }
  return undefined;
}

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const OUT = path.join(ROOT, "exports");
const ASSETS = path.join(ROOT, "attached_assets");
const WORDMARK = path.join(ASSETS, "feelzlike_WordMarque_colour_160426_1777334678269.png");

async function imgDataUri(absPath: string): Promise<string> {
  if (!existsSync(absPath)) return "";
  const buf = await readFile(absPath);
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const CAMPAIGN = "winter26-phase2";
function adUrl(slug: string): string {
  return `https://feelzlike.com/?utm_source=facebook&utm_medium=paid&utm_campaign=${CAMPAIGN}&utm_content=${slug}`;
}
function postUrl(slug: string): string {
  return `https://feelzlike.com/?utm_source=facebook&utm_medium=social&utm_campaign=page-content&utm_content=${slug}`;
}

interface Ad {
  tile: string;
  slug: string;
  label: string;
  status: string; // "kept · phase-1 winner" | "new this phase"
  primary: string;
  headline: string;
  description: string;
}

// Phase-2 roster · 5 ads per country ad set. Copy rules unchanged: location-
// neutral, no app-store wording, powder-alerts-free true through 31 dec 2026,
// no live-roads claim outside nsw/nz, CTA always Learn more.
const ADS: Ad[] = [
  {
    tile: "3_1784703752742.png",
    slug: "powder-alerts",
    label: "does it feelzlike it's snowing?",
    status: "kept · phase-1 winner",
    primary:
      "free powder alerts · pick your mountains and how much snow counts, and we'll email you when a dump is coming. no spam, unsubscribe in one click.",
    headline: "free powder alerts",
    description: "know before you go",
  },
  {
    tile: "2_1784703752742.png",
    slug: "brand-question",
    label: "what's it feelzlike in the mountains?",
    status: "kept · cheap clicks in phase 1",
    primary:
      "weather, roads, transport, stay and eat for the snow towns we currently cover across australia, new zealand and japan · all in one place, free.",
    headline: "know before you go",
    description: "real conditions for mountain travel",
  },
  {
    tile: "6_1784703752743.png",
    slug: "weekend-planner",
    label: "feelzlike it could be a good weekend?",
    status: "new this phase",
    primary:
      "feelzlike it could be a good weekend? check the week ahead for your mountains and pick your window.",
    headline: "plan your snow weekend",
    description: "7-day outlook · every mountain",
  },
  {
    tile: "8_1784703752743.png",
    slug: "bus-or-car",
    label: "bus or car?",
    status: "new this phase",
    primary:
      "bus, shuttle or drive? every way up the mountain in one place, with drive times from your town.",
    headline: "sort your ride to the snow",
    description: "buses · shuttles · car hire",
  },
  {
    tile: "10_1784703752743.png",
    slug: "stay",
    label: "sleepy?",
    status: "new this phase",
    primary:
      "find the right base town · stay picks with real drive times to the lifts.",
    headline: "stay close to the snow",
    description: "every base town compared",
  },
];

interface Post {
  week: string;
  day: string;
  slug: string;
  tile?: string; // attached tile, or undefined = owner photo/screenshot prompt
  imageNote: string;
  text: string;
}

// 4 weeks x 2 posts · unpaid page content. Voice: lowercase, middot ·, no
// dashes, no emojis. Every link carries social utm tags. Honesty rails as ads.
const POSTS: Post[] = [
  {
    week: "week 1", day: "tuesday", slug: "post-powder-alerts",
    tile: "3_1784703752742.png",
    imageNote: "use the powder alerts tile (3)",
    text: "the storm doesn't email you · but we do. set your own snow threshold and we'll tell you when a dump is heading for your mountain. free · feelzlike.com",
  },
  {
    week: "week 1", day: "saturday", slug: "post-weekend-check",
    imageNote: "screenshot this weekend's 5-day forecast for a mountain that's looking good (crop the app on your phone)",
    text: "saturday check · this is what the weekend feelzlike up the mountain. every resort, hour by hour, village to summit · feelzlike.com",
  },
  {
    week: "week 2", day: "tuesday", slug: "post-bus-or-car",
    tile: "8_1784703752743.png",
    imageNote: "use the bus or car tile (8)",
    text: "bus, shuttle or drive? every way up the mountain in one place, with drive times from your town · feelzlike.com",
  },
  {
    week: "week 2", day: "saturday", slug: "post-ask-conditions",
    imageNote: "a real photo from a snow trip (yours or one a follower shares with permission)",
    text: "where are you skiing this weekend? drop your mountain below · we'll reply with what it feelzlike up there right now.",
  },
  {
    week: "week 3", day: "tuesday", slug: "post-feels-like",
    tile: "4_1784703752742.png",
    imageNote: "use the feels-like temperature tile (4)",
    text: "the thermometer says one thing · the wind says another. see what it actually feelzlike in the snow towns we cover and up the mountain · feelzlike.com",
  },
  {
    week: "week 3", day: "saturday", slug: "post-town-tip",
    imageNote: "screenshot a stay or eat page for one snow town",
    text: "rest day sorted · where to stay, eat and what to do in the snow towns we cover, with real drive times to the lifts · feelzlike.com",
  },
  {
    week: "week 4", day: "tuesday", slug: "post-add-to-home",
    tile: "1_1784703752742.png",
    imageNote: "use the logo + sections tile (1)",
    text: "no app store needed · open feelzlike.com on your phone, add it to your home screen and it works like an app. weather · roads · transport · stay · eat",
  },
  {
    week: "week 4", day: "saturday", slug: "post-snow-recap",
    imageNote: "screenshot the biggest snowfall of the week from the app (any resort)",
    text: "the week that was · who got the goods. check what next week feelzlike before you commit · feelzlike.com",
  },
];

const CSS = /* css */ `
  @page { size: A4; margin: 16mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: #0b1f33; line-height: 1.55; font-size: 10pt; margin: 0; }
  header.brand { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 3px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 14px; }
  header.brand img { height: 36px; }
  header.brand .ident { text-align: right; color: #475569; font-size: 8.5pt; line-height: 1.4; }
  header.brand .ident strong { color: #0b1f33; display: block; font-size: 9pt; }
  h1 { font-size: 20pt; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.01em; }
  .deck { color: #475569; font-size: 11pt; margin: 0 0 18px 0; }
  h2 { font-size: 11.5pt; margin: 20px 0 8px 0; border-left: 3px solid #1d4ed8; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  ol.steps { margin: 0 0 12px 0; padding-left: 20px; }
  ol.steps li { margin-bottom: 7px; }
  ul { margin: 0 0 10px 0; padding-left: 18px; }
  li { margin-bottom: 4px; }
  table.results { border-collapse: collapse; width: 100%; margin: 8px 0 12px 0; font-size: 9pt; }
  table.results th, table.results td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
  table.results th { background: #eff6ff; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; color: #1d4ed8; }
  .win { color: #047857; font-weight: 600; }
  .lose { color: #b91c1c; font-weight: 600; }
  .note { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 9.5pt; }
  .note strong { color: #1d4ed8; }
  .honesty { background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 9.5pt; }
  .honesty strong { color: #ec008c; }
  .pagebreak { page-break-before: always; }
  .adcard { display: flex; gap: 12px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
  .adcard img.tile { width: 118px; height: 118px; border-radius: 8px; border: 1px solid #e2e8f0; flex: none; }
  .adcard .tileph { width: 118px; height: 118px; border-radius: 8px; border: 1px dashed #94a3b8; flex: none; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 8pt; text-align: center; padding: 8px; }
  .adcard .body { flex: 1; min-width: 0; }
  .adcard .meta { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .adcard .meta b { color: #1d4ed8; }
  .field { margin-bottom: 5px; }
  .field .k { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .field .v { font-size: 9.5pt; }
  .field .v.url { font-size: 8pt; color: #1d4ed8; word-break: break-all; }
  .cta-chip { display: inline-block; background: #1d4ed8; color: #fff; border-radius: 999px; font-size: 8.5pt; padding: 2px 10px; font-weight: 600; }
  footer.doc { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 8pt; }
`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function buildHtml(): Promise<string> {
  const wordmark = await imgDataUri(WORDMARK);
  const tiles = new Map<string, string>();
  const allTiles = new Set<string>([...ADS.map((a) => a.tile), ...POSTS.flatMap((p) => (p.tile ? [p.tile] : []))]);
  for (const tile of allTiles) {
    const thumb = path.join("/tmp/campaign-thumbs", tile.replace(/\.png$/, ".jpg"));
    tiles.set(tile, existsSync(thumb) ? await imgDataUri(thumb) : await imgDataUri(path.join(ASSETS, tile)));
  }

  const adCards = ADS.map((ad) => `
    <div class="adcard">
      <img class="tile" src="${tiles.get(ad.tile) ?? ""}" alt="" />
      <div class="body">
        <div class="meta"><b>${esc(ad.status)}</b> · tile: ${esc(ad.label)}</div>
        <div class="field"><div class="k">primary text</div><div class="v">${esc(ad.primary)}</div></div>
        <div class="field"><div class="k">headline</div><div class="v">${esc(ad.headline)}</div></div>
        <div class="field"><div class="k">description</div><div class="v">${esc(ad.description)}</div></div>
        <div class="field"><div class="k">button</div><div class="v"><span class="cta-chip">Learn more</span></div></div>
        <div class="field"><div class="k">website url (paste exactly, tracking included)</div><div class="v url">${esc(adUrl(ad.slug))}</div></div>
      </div>
    </div>`).join("\n");

  const postCards = POSTS.map((p) => `
    <div class="adcard">
      ${p.tile
        ? `<img class="tile" src="${tiles.get(p.tile) ?? ""}" alt="" />`
        : `<div class="tileph">${esc(p.imageNote)}</div>`}
      <div class="body">
        <div class="meta"><b>${esc(p.week)} · ${esc(p.day)}</b>${p.tile ? ` · ${esc(p.imageNote)}` : ""}</div>
        <div class="field"><div class="k">post text (paste as-is)</div><div class="v">${esc(p.text)}</div></div>
        <div class="field"><div class="k">link to paste under the text (tracking included)</div><div class="v url">${esc(postUrl(p.slug))}</div></div>
      </div>
    </div>`).join("\n");

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>

<header class="brand">
  ${wordmark ? `<img src="${wordmark}" alt="feelzlike" />` : "<div></div>"}
  <div class="ident"><strong>facebook phase 2 pack</strong>winter 2026 · prepared august 2026</div>
</header>

<h1>facebook phase 2 · back the winners</h1>
<p class="deck">what round one told us, the five ads to run next, and a month of ready-to-paste page posts.</p>

<h2>what round one told us · 27 jul to 3 aug</h2>
<table class="results">
  <tr><th>ad</th><th>clicks (au + nz)</th><th>cost per click</th><th>verdict</th></tr>
  <tr><td>powder alerts</td><td>288</td><td>$0.19 to $0.32</td><td class="win">winner · keep and back it</td></tr>
  <tr><td>brand</td><td>96</td><td>$0.17 to $0.41</td><td class="win">cheapest clicks · keep</td></tr>
  <tr><td>conditions · in the mountains</td><td>113</td><td>$0.20 to $0.32</td><td>solid but replaced by fresher tiles</td></tr>
  <tr><td>conditions · temperature</td><td>26</td><td>$0.21 to $0.27</td><td class="lose">weakest by far · cut</td></tr>
</table>
<ul>
  <li><b>totals:</b> 523 link clicks · $126.71 spent · about $0.24 a click · 46,277 impressions. a healthy first run.</li>
  <li><b>the lesson:</b> people respond to a reason to come back (powder alerts) and to the brand question itself. generic "check conditions" is weakest.</li>
</ul>

<h2>phase 2 setup · what to change in ads manager</h2>
<ol class="steps">
  <li><b>duplicate</b> the winter 2026 launch campaign (ads manager → tick the campaign → duplicate) and rename the copy <b>winter26-phase2</b>. keep the two country ad sets: australia · new zealand.</li>
  <li><b>budget:</b> last round was $10/day per country ($20/day total). step up to <b>$20/day per country ($40/day total)</b> · roughly $280 a week. if the cost per click holds near round one you should see roughly double the visitors.</li>
  <li>in each ad set, <b>delete both conditions ads</b> and keep powder alerts + brand. add the three new ads on the next page. update every kept ad's website url to the new phase-2 link shown below (so results report separately from round one).</li>
  <li>run <b>7 days</b>, then do exactly what you did this time: switch off the weakest, feed the best.</li>
  <li><b>japan ad set:</b> planned for next week per your call · say the word and i'll prepare the japan copy (aimed at australians and kiwis planning japan trips, which is also peak japan-booking season).</li>
</ol>

<div class="note"><strong>button choice:</strong> still <b>Learn more</b> on every ad · never "Sign Up" (it flips the ad into lead-ad territory and meta demands a lead form).</div>

<div class="honesty"><strong>honest copy rails (unchanged):</strong> "free powder alerts" is true through 31 december 2026 · never say "download the app", say "add to home screen · works like an app" · no live-roads or live-lifts promises in ads.</div>

<div class="pagebreak"></div>
<h2>the phase 2 ads · 5 per country</h2>
${adCards}

<div class="pagebreak"></div>
<h2>facebook page · 4 weeks of posts (2 a week)</h2>
<ul>
  <li>these are <b>free page posts</b>, not ads · they keep the page alive so people who click an ad and visit the page see a living brand, and meta rewards active pages with cheaper ads.</li>
  <li>rhythm: <b>tuesday</b> = a feature of the app · <b>saturday</b> = timely and conversational (the weekend is when your audience is on snow or wishing they were).</li>
  <li>where the image says "screenshot", take it fresh from the app that week so the numbers are real and current · never post a stale forecast.</li>
  <li>repeat the calendar after week 4 with fresh screenshots · the tuesday features rotate through the app naturally.</li>
</ul>
${postCards}

<footer class="doc">feelzlike · real conditions for mountain travel · feelzlike.com · internal campaign document, not for publication</footer>

</body></html>`;
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  const html = await buildHtml();
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const outPath = path.join(OUT, "feelzlike-facebook-phase2-pack.pdf");
    await page.pdf({ path: outPath, format: "A4", printBackground: true });
    console.log(`wrote ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
