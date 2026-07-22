/**
 * build-campaign-pack.ts - renders the feelzlike facebook campaign pack PDF.
 *
 * One page of plain-language Meta Ads Manager setup steps, then an ad-by-ad
 * sheet for the 12 creative tiles James supplied (attached_assets/1..12_*.png):
 * thumbnail, ready-to-paste primary text / headline / description, CTA button
 * and the tracked landing URL. UTM scheme:
 *   utm_source=facebook · utm_medium=paid · utm_campaign=winter26-launch ·
 *   utm_content=<tile slug>
 * (for unpaid page posts swap utm_medium=paid for utm_medium=social).
 *
 * Landing URLs are real prod routes verified against public/sitemap.xml -
 * trailing slashes required. Honesty rails: "free powder alerts" is true
 * through 31 dec 2026 (launch promo); no app-store claims (feelzlike is a
 * PWA - "add to home screen", never "download from the app store").
 *
 * Run: pnpm --filter @workspace/api-server exec tsx src/scripts/build-campaign-pack.ts
 * Output: exports/feelzlike-facebook-campaign-pack.pdf
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

const CAMPAIGN = "winter26-launch";

function trackedUrl(pagePath: string, slug: string): string {
  return `https://feelzlike.com${pagePath}?utm_source=facebook&utm_medium=paid&utm_campaign=${CAMPAIGN}&utm_content=${slug}`;
}

interface Ad {
  tile: string;        // attached_assets filename
  slug: string;        // utm_content
  label: string;       // headline text printed on the tile itself
  adset: string;
  primary: string;
  headline: string;
  description: string;
  cta: string;
  pagePath: string;
}

const ADS: Ad[] = [
  // ── ad set 1 · powder alerts (the list builder) ────────────────────────
  {
    tile: "3_1784703752742.png",
    slug: "powder-alerts",
    label: "does it feelzlike it's snowing?",
    adset: "1 · powder alerts",
    primary:
      "free powder alerts · tell us your mountains and how much snow counts, and we'll email you when a dump is coming. no spam, unsubscribe in one click.",
    headline: "free powder alerts",
    description: "know before you go",
    cta: "Sign up",
    pagePath: "/snowy-mountains/alerts/",
  },
  // ── ad set 2 · conditions (peak-season utility) ────────────────────────
  {
    tile: "4_1784703752742.png",
    slug: "feels-like-temp",
    label: "what's the feelzlike temperature?",
    adset: "2 · conditions",
    primary:
      "the thermometer says one thing · the wind says another. see what it actually feelzlike in every snow town and up the mountain, hour by hour.",
    headline: "real feels-like forecasts",
    description: "village and summit · hour by hour",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/weather/",
  },
  {
    tile: "5_1784703752742.png",
    slug: "wind-check",
    label: "it feelzlike it's windy?",
    adset: "2 · conditions",
    primary:
      "wind holds wreck ski days. check the gusts up top before you buy a lift pass · hour by hour, village and summit.",
    headline: "check the wind first",
    description: "know before you go",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/weather/",
  },
  {
    tile: "6_1784703752743.png",
    slug: "weekend-planner",
    label: "feelzlike it could be a good weekend?",
    adset: "2 · conditions",
    primary:
      "feelzlike it could be a good weekend? compare every aussie mountain side by side and pick your window.",
    headline: "plan your snow weekend",
    description: "7-day outlook · every mountain",
    cta: "Learn more",
    pagePath: "/plan/",
  },
  {
    tile: "7_1784703752743.png",
    slug: "chains-roads",
    label: "chains?",
    adset: "2 · conditions",
    primary:
      "chains or no chains? live nsw alpine road conditions straight from the source, before you leave the driveway.",
    headline: "roads before you roll",
    description: "live nsw alpine road conditions",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/roads/",
  },
  {
    tile: "8_1784703752743.png",
    slug: "bus-or-car",
    label: "bus or car?",
    adset: "2 · conditions",
    primary:
      "bus, shuttle or drive? every way up the mountain in one place, with drive times from your town.",
    headline: "sort your ride to the snow",
    description: "buses · shuttles · car hire",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/transport/",
  },
  // ── ad set 3 · snow towns (trip content) ───────────────────────────────
  {
    tile: "9_1784703752743.png",
    slug: "eat",
    label: "hungry?",
    adset: "3 · snow towns",
    primary:
      "bakeries, pubs and late-night feeds · where to eat in every snow town, sorted.",
    headline: "eat well up there",
    description: "know before you go",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/eat/",
  },
  {
    tile: "10_1784703752743.png",
    slug: "stay",
    label: "sleepy?",
    adset: "3 · snow towns",
    primary:
      "find the right base town · stay picks with real drive times to the lifts.",
    headline: "stay close to the snow",
    description: "every base town compared",
    cta: "Learn more",
    pagePath: "/snowy-mountains/stay/",
  },
  {
    tile: "11_1784703752743.png",
    slug: "explore",
    label: "explore?",
    adset: "3 · snow towns",
    primary:
      "rest-day sorted · walks, sights and things to do beyond the slopes in every snow town.",
    headline: "explore the snow towns",
    description: "know before you go",
    cta: "Learn more",
    pagePath: "/snowy-mountains/jindabyne/explore/",
  },
  // ── ad set 4 · brand (optional, cheapest reach) ────────────────────────
  {
    tile: "2_1784703752742.png",
    slug: "brand-question",
    label: "what's it feelzlike in the mountains?",
    adset: "4 · brand (optional)",
    primary:
      "weather, roads, transport, stay and eat for every snow town in australia, new zealand and japan · all in one place, free.",
    headline: "know before you go",
    description: "real conditions for mountain travel",
    cta: "Learn more",
    pagePath: "/",
  },
  {
    tile: "1_1784703752742.png",
    slug: "brand-sections",
    label: "logo + section words",
    adset: "4 · brand (optional)",
    primary:
      "real conditions for mountain travel · open it on your phone and add it to your home screen. works like an app, free.",
    headline: "feelzlike · know before you go",
    description: "weather · roads · transport · stay · eat",
    cta: "Learn more",
    pagePath: "/",
  },
  {
    tile: "12_1784703752743.png",
    slug: "brand-domain",
    label: "feelzlike.com",
    adset: "4 · brand (optional)",
    primary:
      "real conditions for mountain travel · australia, new zealand and japan.",
    headline: "feelzlike.com",
    description: "know before you go",
    cta: "Learn more",
    pagePath: "/",
  },
];

const CSS = /* css */ `
  @page { size: A4; margin: 16mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    color: #0b1f33; line-height: 1.55; font-size: 10pt; margin: 0;
  }
  header.brand {
    display: flex; align-items: flex-end; justify-content: space-between;
    border-bottom: 3px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 14px;
  }
  header.brand img { height: 36px; }
  header.brand .ident { text-align: right; color: #475569; font-size: 8.5pt; line-height: 1.4; }
  header.brand .ident strong { color: #0b1f33; display: block; font-size: 9pt; }
  h1 { font-size: 20pt; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.01em; }
  .deck { color: #475569; font-size: 11pt; margin: 0 0 18px 0; }
  h2 {
    font-size: 11.5pt; margin: 20px 0 8px 0; border-left: 3px solid #1d4ed8;
    padding-left: 10px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  ol.steps { margin: 0 0 12px 0; padding-left: 20px; }
  ol.steps li { margin-bottom: 7px; }
  ul { margin: 0 0 10px 0; padding-left: 18px; }
  li { margin-bottom: 4px; }
  .note {
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
    padding: 10px 12px; margin: 10px 0; font-size: 9.5pt;
  }
  .note strong { color: #1d4ed8; }
  .honesty {
    background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px;
    padding: 10px 12px; margin: 10px 0; font-size: 9.5pt;
  }
  .honesty strong { color: #ec008c; }
  .pagebreak { page-break-before: always; }
  .adcard {
    display: flex; gap: 12px; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 12px; margin-bottom: 12px; page-break-inside: avoid;
  }
  .adcard img.tile { width: 118px; height: 118px; border-radius: 8px; border: 1px solid #e2e8f0; flex: none; }
  .adcard .body { flex: 1; min-width: 0; }
  .adcard .meta { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .adcard .meta b { color: #1d4ed8; }
  .field { margin-bottom: 5px; }
  .field .k { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .field .v { font-size: 9.5pt; }
  .field .v.url { font-size: 8pt; color: #1d4ed8; word-break: break-all; }
  .cta-chip {
    display: inline-block; background: #1d4ed8; color: #fff; border-radius: 999px;
    font-size: 8.5pt; padding: 2px 10px; font-weight: 600;
  }
  footer.doc { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 8pt; }
`;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function buildHtml(): Promise<string> {
  const wordmark = await imgDataUri(WORDMARK);
  const tiles = new Map<string, string>();
  for (const ad of ADS) {
    // Prefer a pre-shrunk 300px jpg thumbnail (keeps the PDF emailable ·
    // full-res PNGs balloon it to ~20 MB). Build thumbs with:
    //   mkdir -p /tmp/campaign-thumbs && for f in <tiles>; do
    //     convert "$f" -resize 300x300 -quality 85 /tmp/campaign-thumbs/<name>.jpg
    // Falls back to the full-res original if no thumb exists.
    const thumb = path.join("/tmp/campaign-thumbs", ad.tile.replace(/\.png$/, ".jpg"));
    tiles.set(
      ad.tile,
      existsSync(thumb) ? await imgDataUri(thumb) : await imgDataUri(path.join(ASSETS, ad.tile)),
    );
  }

  const adCards = ADS.map((ad) => `
    <div class="adcard">
      <img class="tile" src="${tiles.get(ad.tile) ?? ""}" alt="" />
      <div class="body">
        <div class="meta">ad set <b>${esc(ad.adset)}</b> · tile: ${esc(ad.label)}</div>
        <div class="field"><div class="k">primary text (paste into "primary text")</div><div class="v">${esc(ad.primary)}</div></div>
        <div class="field"><div class="k">headline</div><div class="v">${esc(ad.headline)}</div></div>
        <div class="field"><div class="k">description</div><div class="v">${esc(ad.description)}</div></div>
        <div class="field"><div class="k">button</div><div class="v"><span class="cta-chip">${esc(ad.cta)}</span></div></div>
        <div class="field"><div class="k">website url (paste exactly, tracking included)</div><div class="v url">${esc(trackedUrl(ad.pagePath, ad.slug))}</div></div>
      </div>
    </div>`).join("\n");

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>${CSS}</style></head><body>

<header class="brand">
  ${wordmark ? `<img src="${wordmark}" alt="feelzlike" />` : "<div></div>"}
  <div class="ident"><strong>facebook campaign pack</strong>winter 2026 launch · prepared july 2026</div>
</header>

<h1>facebook campaign pack</h1>
<p class="deck">everything you need to run the "know before you go" campaign in meta ads manager · 12 ready-made ads, copy included, tracking built in.</p>

<h2>what this campaign does</h2>
<ul>
  <li><b>goal 1 · grow the email list:</b> the powder-alert ad drives free signups (ad set 1). every verified subscriber is yours to email.</li>
  <li><b>goal 2 · make feelzlike the daily habit:</b> the conditions ads (ad set 2) catch people mid-season when they check weather and roads anyway.</li>
  <li>australia and new zealand are in peak season right now · this is the moment to spend. a japan-planning follow-up campaign makes sense august to october, when aussies book their japan trips.</li>
</ul>

<h2>setup · step by step</h2>
<ol class="steps">
  <li>go to <b>business.facebook.com</b> → all tools → <b>ads manager</b> → create.</li>
  <li>objective: choose <b>traffic</b> (simplest and right for this goal).</li>
  <li>create <b>three ad sets</b> using the groupings in this pack: powder alerts · conditions · snow towns. (ad set 4, brand, is optional · run it later at low budget for reach.)</li>
  <li><b>audience</b> for each: location australia (nsw, vic, act to start) · age 21 to 60 · detailed targeting interests: skiing, snowboarding, ski resort. duplicate the ad set for new zealand when ready.</li>
  <li><b>placements:</b> leave on advantage+ placements. this includes instagram automatically · your facebook page is the ad identity, so you do not need an instagram account for ads.</li>
  <li><b>budget:</b> start at 10 to 15 dollars a day per ad set. run 7 days, then switch off the weakest ads and put the money behind the best two or three.</li>
  <li>for each ad: upload the matching square tile, then copy the primary text, headline, description, button and <b>the exact website url</b> from the sheet below. the url carries the tracking tags.</li>
</ol>

<div class="note"><strong>reading results:</strong> meta shows clicks. google analytics shows what people did after · reports → acquisition → traffic acquisition, look for source "facebook", campaign "winter26-launch". the number that matters most: verified powder-alert subscribers.</div>

<div class="honesty"><strong>honest copy rails:</strong> "free powder alerts" is true through 31 december 2026 (launch promo) · revisit ad copy before 2027. feelzlike is not in the app stores · never say "download the app", say "add to home screen · works like an app". don't promise live lift status in ads.</div>

<div class="pagebreak"></div>
<h2>the 12 ads · copy and links</h2>
${adCards}

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
    const outPath = path.join(OUT, "feelzlike-facebook-campaign-pack.pdf");
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
