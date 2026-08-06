/// <reference lib="dom" />
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer";

/**
 * feelzlike social launch ads · Lonely Planet style.
 *
 * "meet our new travel app" format: bold headline, a real phone screenshot of
 * the live site in a device frame, three benefit callouts with connector
 * lines, and a single pill CTA. One overall version plus japan / australia /
 * nz country versions, each rendered as a 1080x1920 story and a 1080x1080
 * square feed image into exports/social-ads/.
 *
 * Honesty rails (same as the fb campaign pack): only real app features, no
 * "live roads" claims outside nsw/nz, location-neutral AU copy, promo line
 * matches the real free-until-31-december window, everything lands on the
 * home page in Ads Manager (these are just the images).
 *
 * Run: pnpm --filter @workspace/api-server exec tsx ./src/scripts/build-social-ads.ts
 */

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const OUT = path.join(ROOT, "exports", "social-ads");
const ASSETS = path.join(ROOT, "attached_assets");
const SITE = "https://feelzlike.com";

const LOGO_DARK = path.join(ASSETS, "feelzlike_dark", "feelzlike_colour_150426_1777334678271_dark.png");
const FONT_REGULAR = path.join(ASSETS, "DINPro_1777358240556.ttf");
const FONT_BOLD = path.join(ASSETS, "DINPro-Bold_1777358240555.ttf");

function resolveChromiumPath(): string | undefined {
  if (process.env["PUPPETEER_EXECUTABLE_PATH"]) return process.env["PUPPETEER_EXECUTABLE_PATH"];
  try {
    const p = execSync("which chromium 2>/dev/null").toString().trim();
    if (p) return p;
  } catch { /* fall through */ }
  return undefined;
}

async function dataUri(absPath: string, mime: string): Promise<string> {
  if (!existsSync(absPath)) throw new Error(`missing asset: ${absPath}`);
  const buf = await readFile(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// ---- copy (honesty-first) ---------------------------------------------------

interface Callout { icon: string; text: string }
interface Version {
  id: string;
  /** small kicker above the headline */
  kicker: string;
  /** big headline (the boxed line) */
  headline: string;
  /** live page to screenshot inside the phone */
  screenshotPath: string;
  /** force this region's season pill to winter before the shot (JP pages sit in green season all summer) */
  forceWinterRegionId?: string;
  callouts: Callout[];
  cta: string;
}

// inline svg glyphs, all stroke = currentColor
const IC = {
  snow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6L4 18M12 6l-3-2M12 6l3-2M12 18l-3 2M12 18l3 2M6.5 7.9l-3.4 1M6.5 16.1l-3.4-1M17.5 7.9l3.4 1M17.5 16.1l3.4-1"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9s1.3-6.4 3.8-9z"/></svg>`,
  mountain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`,
  road: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 21 9 3M20 21 15 3M12 7v2M12 12v2.5M12 17.5V20"/></svg>`,
  train: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9.5 21l-1.5-4M14.5 21l1.5-4M8.5 7h7"/></svg>`,
  radar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6.5"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 21a9 9 0 1 1 9-9"/><path d="M12 12l4.5-4.5"/></svg>`,
};

const VERSIONS: Version[] = [
  {
    id: "overall",
    kicker: "meet",
    headline: "the snow app",
    screenshotPath: "/",
    callouts: [
      { icon: IC.snow, text: "live snow and feels-like temps on every mountain" },
      { icon: IC.mail, text: "powder alerts · emailed when a dump is coming" },
      { icon: IC.globe, text: "australia · japan · new zealand · canada" },
    ],
    cta: "free until 31 december · feelzlike.com",
  },
  {
    id: "japan",
    kicker: "planning japan?",
    headline: "20 ski regions",
    screenshotPath: "/hakuba-valley/hakuba/",
    forceWinterRegionId: "hakuba-valley",
    callouts: [
      { icon: IC.snow, text: "observed snow depths · not just forecasts" },
      { icon: IC.radar, text: "official jma radar built in" },
      { icon: IC.train, text: "trains · buses · stay and eat guides" },
    ],
    cta: "free until 31 december · feelzlike.com",
  },
  {
    id: "australia",
    kicker: "is it dumping",
    headline: "right now?",
    screenshotPath: "/snowy-mountains/jindabyne/",
    callouts: [
      { icon: IC.gauge, text: "live snow · feels-like temps at the lifts" },
      { icon: IC.mail, text: "powder alerts · emailed free" },
      { icon: IC.mountain, text: "compare every mountain your town serves" },
    ],
    cta: "free until 31 december · feelzlike.com",
  },
  {
    id: "nz",
    kicker: "nz snow",
    headline: "checked live",
    screenshotPath: "/queenstown/queenstown/",
    callouts: [
      { icon: IC.road, text: "live highway conditions to the hill" },
      { icon: IC.snow, text: "reported snow bases · not just models" },
      { icon: IC.mail, text: "powder alerts · emailed free" },
    ],
    cta: "free until 31 december · feelzlike.com",
  },
];

// ---- phone screenshots ------------------------------------------------------

async function capturePhoneShot(
  browser: import("puppeteer").Browser,
  urlPath: string,
  forceWinterRegionId?: string,
): Promise<string> {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    // pre-decide consent so the banner never renders in the shot
    await page.evaluateOnNewDocument((winterRegion) => {
      try {
        window.localStorage.setItem(
          "feelzlike.consent.v1",
          JSON.stringify({ necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString() }),
        );
        if (winterRegion) window.localStorage.setItem(`feelzlike:${winterRegion}:season`, "winter");
      } catch { /* ignore */ }
    }, forceWinterRegionId ?? "");
    await page.goto(`${SITE}${urlPath}`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500)); // let live data + images settle
    // hide any remaining fixed bottom overlays (install prompt etc.)
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>("body *").forEach((el) => {
        const s = getComputedStyle(el);
        if (s.position === "fixed" && el.getBoundingClientRect().top > window.innerHeight * 0.55) {
          el.style.display = "none";
        }
      });
      window.scrollTo(0, 0);
    });
    const buf = await page.screenshot({ type: "png" });
    return `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
  } finally {
    await page.close();
  }
}

// ---- layout -----------------------------------------------------------------

interface Fmt { id: string; w: number; h: number; kind: "story" | "square" }
const FORMATS: Fmt[] = [
  { id: "story-1080x1920", w: 1080, h: 1920, kind: "story" },
  { id: "square-1080x1080", w: 1080, h: 1080, kind: "square" },
];

function calloutHtml(c: Callout): string {
  return `
    <div class="co">
      <div class="co-line"></div>
      <div class="co-icon">${c.icon}</div>
      <div class="co-text">${c.text.split(" · ").join(' <span class="dot">·</span> ')}</div>
    </div>`;
}

function buildHtml(v: Version, fmt: Fmt, assets: { fontCss: string; logo: string; shot: string }): string {
  const story = fmt.kind === "story";
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><style>
${assets.fontCss}
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:${fmt.w}px; height:${fmt.h}px; }
.page {
  width:${fmt.w}px; height:${fmt.h}px; position:relative; overflow:hidden;
  font-family:'DIN Pro', system-ui, sans-serif; -webkit-font-smoothing:antialiased;
  color:#fff;
  background:
    radial-gradient(90% 55% at 50% -10%, rgba(125,211,252,0.28), rgba(125,211,252,0) 60%),
    linear-gradient(180deg, #0a2542 0%, #061a33 55%, #04122a 100%);
  display:flex; flex-direction:column; align-items:center;
  padding:${story ? "84px 72px 76px" : "52px 56px 48px"};
}
.logo { width:${story ? 190 : 140}px; display:block; }
.kicker { margin-top:${story ? 44 : 22}px; font-size:${story ? 58 : 44}px; font-weight:400; letter-spacing:-0.01em; color:rgba(255,255,255,0.92); }
.headline {
  margin-top:${story ? 18 : 10}px; display:inline-block;
  background:#EC008C; color:#fff; padding:${story ? "10px 34px 14px" : "6px 26px 10px"};
  font-size:${story ? 96 : 68}px; font-weight:700; letter-spacing:-0.02em; line-height:1;
  border-radius:10px; transform:rotate(-1.2deg);
}
.stage { flex:1; width:100%; display:flex; align-items:center; justify-content:center; gap:${story ? 48 : 40}px; margin-top:${story ? 40 : 26}px; min-height:0; }
.phone {
  height:${story ? 980 : 560}px; aspect-ratio:390/800; flex:none;
  border-radius:${story ? 64 : 40}px; border:${story ? 14 : 9}px solid #0b1220;
  background:#0b1220; overflow:hidden; position:relative;
  box-shadow:0 ${story ? 50 : 28}px ${story ? 110 : 60}px rgba(0,0,0,0.55);
}
.phone img { width:100%; height:100%; object-fit:cover; object-position:top; display:block; border-radius:${story ? 50 : 31}px; }
.cos { display:flex; flex-direction:column; gap:${story ? 84 : 52}px; min-width:0; }
.co { display:flex; align-items:center; gap:${story ? 22 : 16}px; }
.co-line { width:${story ? 56 : 36}px; height:3px; background:rgba(125,211,252,0.7); flex:none; }
.co-icon { width:${story ? 64 : 46}px; height:${story ? 64 : 46}px; flex:none; color:#7dd3fc; }
.co-icon svg { width:100%; height:100%; }
.co-text { font-size:${story ? 34 : 26}px; font-weight:700; line-height:1.25; text-transform:lowercase; max-width:${story ? "300px" : "260px"}; }
.dot { color:#7dd3fc; }
.cta {
  margin-top:${story ? 56 : 30}px; flex:none;
  background:#fff; color:#0b1f33; border-radius:999px;
  padding:${story ? "26px 54px" : "18px 40px"};
  font-size:${story ? 40 : 30}px; font-weight:700; letter-spacing:-0.01em;
  box-shadow:0 12px 40px rgba(0,0,0,0.35);
}
.cta .dot { color:#EC008C; }
</style></head>
<body><div class="page">
  <img class="logo" src="${assets.logo}" alt="feelzlike">
  <div class="kicker">${v.kicker}</div>
  <div class="headline">${v.headline}</div>
  <div class="stage">
    <div class="phone"><img src="${assets.shot}" alt=""></div>
    <div class="cos">${v.callouts.map(calloutHtml).join("")}</div>
  </div>
  <div class="cta">${v.cta.split(" · ").join(' <span class="dot">·</span> ')}</div>
</div></body></html>`;
}

// ---- main -------------------------------------------------------------------

async function main() {
  await mkdir(OUT, { recursive: true });
  const [fontRegular, fontBold, logo] = await Promise.all([
    dataUri(FONT_REGULAR, "font/ttf"),
    dataUri(FONT_BOLD, "font/ttf"),
    dataUri(LOGO_DARK, "image/png"),
  ]);
  const fontCss = `
@font-face { font-family:'DIN Pro'; font-weight:400; src:url(${fontRegular}) format('truetype'); }
@font-face { font-family:'DIN Pro'; font-weight:700; src:url(${fontBold}) format('truetype'); }`;

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const only = process.env["AD_VERSION"];
    const versions = only ? VERSIONS.filter((v) => v.id === only) : VERSIONS;
    for (const v of versions) {
      console.log(`capturing live screenshot for ${v.id} (${v.screenshotPath}) ...`);
      const shot = await capturePhoneShot(browser, v.screenshotPath, v.forceWinterRegionId);
      for (const fmt of FORMATS) {
        const page = await browser.newPage();
        try {
          await page.setViewport({ width: fmt.w, height: fmt.h, deviceScaleFactor: 1 });
          await page.setContent(buildHtml(v, fmt, { fontCss, logo, shot }), { waitUntil: "networkidle0" });
          const out = path.join(OUT, `feelzlike-ad-${v.id}-${fmt.id}.png`);
          await page.screenshot({ path: out as `${string}.png`, type: "png" });
          console.log("wrote:", path.relative(ROOT, out));
        } finally {
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
}

await main();
