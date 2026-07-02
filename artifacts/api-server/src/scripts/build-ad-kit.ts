import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import puppeteer from "puppeteer";
import QRCode from "qrcode";

/**
 * feelzlike advertising kit generator.
 *
 * Clean, minimal, brand-led layout: logo + copy + QR / URL on a refined brand
 * background. No photography, no illustration - just the essentials.
 *
 * Two themes (pick with AD_THEME=dark|light, default dark):
 *   dark  -> deep navy background, reversed (white) wordmark.
 *   light -> soft ice-white background, colour wordmark.
 *
 * Print items  -> A4/A3/A2 posters, round + square stickers, outdoor boards.
 *                 Rendered as PDFs with bleed and crop marks for a printer.
 * Screen items -> supermarket / mall TV + digital-signage PNGs at exact pixels.
 *
 * AD_EXPLORE=1 renders just the two screens for BOTH themes into _explore/ so
 * the moods can be compared before committing to the full kit.
 *
 * Honesty-first copy: only claims features the app actually ships
 * (live conditions, roads, the mountain comparison, and public transport).
 */

const URL = "https://feelzlike.com";
const URL_LABEL = "feelzlike.com";

function resolveChromiumPath(): string | undefined {
  if (process.env["PUPPETEER_EXECUTABLE_PATH"]) return process.env["PUPPETEER_EXECUTABLE_PATH"];
  try {
    const p = execSync("which chromium 2>/dev/null").toString().trim();
    if (p) return p;
  } catch { /* fall through */ }
  return undefined;
}

const ROOT = path.resolve(import.meta.dirname, "../../../..");
const OUT = path.join(ROOT, "exports", "ad-kit");
const ASSETS = path.join(ROOT, "attached_assets");

const WORDMARK_DARK = path.join(
  ASSETS,
  "feelzlike_dark",
  "feelzlike_WordMarque_colour_160426_1777334678269_dark.png",
);
const WORDMARK_LIGHT = path.join(
  ASSETS,
  "feelzlike_transparent",
  "feelzlike_WordMarque_colour_160426_1777272466909_transparent.png",
);
const FONT_REGULAR = path.join(ASSETS, "DINPro_1777358240556.ttf");
const FONT_BOLD = path.join(ASSETS, "DINPro-Bold_1777358240555.ttf");

async function dataUri(absPath: string, mime: string): Promise<string> {
  if (!existsSync(absPath)) throw new Error(`missing asset: ${absPath}`);
  const buf = await readFile(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// ---- themes ----------------------------------------------------------------

type Theme = "dark" | "light";

interface ThemeStyle {
  bg: string;
  vars: string; // css custom properties for .page
}

const THEMES: Record<Theme, ThemeStyle> = {
  dark: {
    bg: "radial-gradient(92% 60% at 50% -12%, rgba(56,189,248,0.20), rgba(56,189,248,0) 60%), linear-gradient(180deg, #0a2542 0%, #061a33 55%, #04122a 100%)",
    vars: [
      "--ink:#ffffff",
      "--sub:rgba(255,255,255,0.86)",
      "--region:rgba(255,255,255,0.72)",
      "--dot:#7dd3fc",
      "--card-bg:#ffffff",
      "--card-border:rgba(255,255,255,0)",
      "--scan:#1d4ed8",
      "--url:#0b1f33",
      "--rule:rgba(125,211,252,0.55)",
    ].join(";"),
  },
  light: {
    bg: "radial-gradient(92% 60% at 50% -12%, rgba(56,189,248,0.18), rgba(255,255,255,0) 62%), linear-gradient(180deg, #ffffff 0%, #eef6ff 100%)",
    vars: [
      "--ink:#06182e",
      "--sub:#33506a",
      "--region:#5b7488",
      "--dot:#1a92d6",
      "--card-bg:#ffffff",
      "--card-border:rgba(6,24,46,0.12)",
      "--scan:#1d4ed8",
      "--url:#0b1f33",
      "--rule:rgba(26,146,214,0.45)",
    ].join(";"),
  },
};

// ---- copy ------------------------------------------------------------------

const HEADLINE = "which mountain today?";
const SUB_LONG =
  "the daily snow, road and transport check for the resort town you are staying in. compare every mountain your town serves · and how to get there by bus, shuttle or car.";
const SUB_SHORT = "snow · roads · transport, before you head out.";
const REGION = "10 resort regions · australia · japan · new zealand";
const SCAN = "scan for today's conditions";

function dotify(s: string): string {
  return s.split(" · ").join(' <span class="dot">·</span> ');
}

// ---- formats ---------------------------------------------------------------

type Family = "portrait" | "landscape" | "sticker" | "round";

interface Fmt {
  id: string;
  label: string;
  family: Family;
  output: "pdf" | "png";
  unit: "mm" | "px";
  trimW: number;
  trimH: number;
  bleed: number;
  mark: number;
  dir: string;
}

const FORMATS: Fmt[] = [
  // stickers (die-cut round + square) for retail counters and buses
  { id: "feelzlike-sticker-round-95mm", label: "Sticker · round Ø95mm", family: "round", output: "pdf", unit: "mm", trimW: 95, trimH: 95, bleed: 3, mark: 6, dir: "stickers" },
  { id: "feelzlike-sticker-square-95mm", label: "Sticker · square 95mm", family: "sticker", output: "pdf", unit: "mm", trimW: 95, trimH: 95, bleed: 3, mark: 6, dir: "stickers" },
  // posters for windows, counters and walls
  { id: "feelzlike-poster-a4", label: "Poster · A4", family: "portrait", output: "pdf", unit: "mm", trimW: 210, trimH: 297, bleed: 3, mark: 6, dir: "posters" },
  { id: "feelzlike-poster-a3", label: "Poster · A3", family: "portrait", output: "pdf", unit: "mm", trimW: 297, trimH: 420, bleed: 3, mark: 6, dir: "posters" },
  { id: "feelzlike-poster-a2", label: "Poster · A2", family: "portrait", output: "pdf", unit: "mm", trimW: 420, trimH: 594, bleed: 3, mark: 6, dir: "posters" },
  // outdoor / mall static boards
  { id: "feelzlike-board-6sheet-portrait-1200x1800mm", label: "Board · 6-sheet portrait", family: "portrait", output: "pdf", unit: "mm", trimW: 1200, trimH: 1800, bleed: 15, mark: 20, dir: "boards" },
  { id: "feelzlike-board-landscape-2400x1200mm", label: "Board · landscape 2:1", family: "landscape", output: "pdf", unit: "mm", trimW: 2400, trimH: 1200, bleed: 15, mark: 20, dir: "boards" },
  // in-store screens (digital signage) — exact pixels, no bleed
  { id: "feelzlike-screen-1920x1080", label: "Screen · landscape 1920×1080", family: "landscape", output: "png", unit: "px", trimW: 1920, trimH: 1080, bleed: 0, mark: 0, dir: "screens" },
  { id: "feelzlike-screen-1080x1920", label: "Screen · portrait 1080×1920", family: "portrait", output: "png", unit: "px", trimW: 1080, trimH: 1920, bleed: 0, mark: 0, dir: "screens" },
];

function css(fontCss: string): string {
  return /* css */ `
${fontCss}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #04122a; }
.page {
  position: relative; overflow: hidden;
  font-family: 'DIN Pro', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.bleed { position: absolute; overflow: hidden; }
.trim { position: absolute; }
.content { width: 100%; height: 100%; display: flex; color: var(--ink); }
.wordmark { display: block; height: auto; }
h1 { font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 0.95; }
.sub { color: var(--sub); font-weight: 400; line-height: 1.34; }
.dot { color: var(--dot); font-weight: 700; }
.region { color: var(--region); font-weight: 500; letter-spacing: 0.04em; }
.rule { height: 0.14em; width: calc(var(--u)*10); background: var(--rule); border: none; }
.qrcard { background: var(--card-bg); border: 1px solid var(--card-border); display: flex; align-items: center; box-shadow: 0 calc(var(--u)*0.5) calc(var(--u)*2.2) rgba(3,12,28,0.20); }
.qr { display: block; image-rendering: pixelated; }
.scan { color: var(--scan); text-transform: uppercase; font-weight: 700; letter-spacing: 0.12em; line-height: 1.2; }
.url { color: var(--url); font-weight: 700; letter-spacing: -0.01em; }
.urlline { color: var(--ink); font-weight: 700; letter-spacing: -0.01em; }
.dieline { position: absolute; inset: 0; border-radius: 50%; border: 0.3mm dashed rgba(0,0,0,0.45); pointer-events: none; z-index: 5; }
.mark { position: absolute; background: #000; }

/* PORTRAIT ---------------------------------------------------------------- */
.content.portrait { flex-direction: column; justify-content: space-between; padding: calc(var(--u)*9); }
.portrait .wordmark { width: 46%; }
.portrait .hero { display: flex; flex-direction: column; gap: calc(var(--u)*3.4); }
.portrait h1 { font-size: calc(var(--u)*9.8); max-width: 96%; }
.portrait .sub { font-size: calc(var(--u)*3.05); max-width: 84%; }
.portrait .foot { display: flex; flex-direction: column; gap: calc(var(--u)*3.4); }
.portrait .qrcard { gap: calc(var(--u)*3); padding: calc(var(--u)*3); border-radius: calc(var(--u)*2.4); align-self: flex-start; }
.portrait .qr { width: calc(var(--u)*22); height: calc(var(--u)*22); }
.portrait .scan { font-size: calc(var(--u)*2.05); }
.portrait .url { font-size: calc(var(--u)*4.2); margin-top: calc(var(--u)*0.6); }
.portrait .region { font-size: calc(var(--u)*2.5); }

/* LANDSCAPE (scale unit is height-based) ---------------------------------- */
.content.landscape { flex-direction: row; align-items: center; justify-content: space-between; padding: calc(var(--u)*9) calc(var(--u)*8); gap: calc(var(--u)*6); }
.landscape .left { width: 58%; display: flex; flex-direction: column; justify-content: center; gap: calc(var(--u)*3.4); }
.landscape .wordmark { height: calc(var(--u)*12); width: auto; }
.landscape h1 { font-size: calc(var(--u)*8.6); }
.landscape .sub { font-size: calc(var(--u)*2.9); max-width: 96%; }
.landscape .region { font-size: calc(var(--u)*2.5); }
.landscape .right { width: 38%; display: flex; justify-content: flex-end; align-items: center; }
.landscape .qrcard { flex-direction: column; gap: calc(var(--u)*2); padding: calc(var(--u)*3); border-radius: calc(var(--u)*2.6); text-align: center; }
.landscape .qr { width: calc(var(--u)*34); height: calc(var(--u)*34); }
.landscape .scan { font-size: calc(var(--u)*1.7); }
.landscape .url { font-size: calc(var(--u)*3.4); }

/* STICKER (square + round) ------------------------------------------------ */
.content.sticker, .content.round { flex-direction: column; align-items: center; justify-content: space-between; text-align: center; }
.content.sticker { padding: calc(var(--u)*10); }
.content.round { padding: calc(var(--u)*16); }
.sticker .wordmark, .round .wordmark { width: 60%; }
.round .wordmark { width: 54%; }
.sticker h1, .round h1 { font-size: calc(var(--u)*8.4); line-height: 0.94; }
.round h1 { font-size: calc(var(--u)*7.6); }
.sticker .qrcard, .round .qrcard { padding: calc(var(--u)*2.4); border-radius: calc(var(--u)*2.4); }
.sticker .qr { width: calc(var(--u)*36); height: calc(var(--u)*36); }
.round .qr { width: calc(var(--u)*32); height: calc(var(--u)*32); }
.sticker .urlline, .round .urlline { font-size: calc(var(--u)*5); }
.round .urlline { font-size: calc(var(--u)*4.4); }
`;
}

function content(fmt: Fmt, wordmark: string, qr: string): string {
  const wm = `<img class="wordmark" src="${wordmark}" alt="feelzlike">`;
  const qrImg = `<img class="qr" src="${qr}" alt="QR code to feelzlike.com">`;

  if (fmt.family === "portrait") {
    return /* html */ `
    <div class="content portrait">
      ${wm}
      <div class="hero">
        <hr class="rule">
        <h1>${HEADLINE}</h1>
        <p class="sub">${dotify(SUB_LONG)}</p>
      </div>
      <div class="foot">
        <div class="qrcard">
          ${qrImg}
          <div><div class="scan">${SCAN}</div><div class="url">${URL_LABEL}</div></div>
        </div>
        <div class="region">${dotify(REGION)}</div>
      </div>
    </div>`;
  }

  if (fmt.family === "landscape") {
    return /* html */ `
    <div class="content landscape">
      <div class="left">
        ${wm}
        <hr class="rule">
        <h1>${HEADLINE}</h1>
        <p class="sub">${dotify(SUB_LONG)}</p>
        <div class="region">${dotify(REGION)}</div>
      </div>
      <div class="right">
        <div class="qrcard">
          ${qrImg}
          <div><div class="scan">${SCAN}</div><div class="url">${URL_LABEL}</div></div>
        </div>
      </div>
    </div>`;
  }

  // sticker + round
  const cls = fmt.family === "round" ? "round" : "sticker";
  return /* html */ `
    <div class="content ${cls}">
      ${wm}
      <h1>${HEADLINE}</h1>
      <p class="sub" style="font-size:calc(var(--u)*3.2);max-width:90%">${dotify(SUB_SHORT)}</p>
      <div class="qrcard">${qrImg}</div>
      <div class="urlline">${URL_LABEL}</div>
    </div>`;
}

function cropMarks(pageW: number, pageH: number, mark: number, bleed: number): string {
  if (mark <= 0) return "";
  const t = 0.25; // mark thickness mm
  const tl = mark + bleed; // trim-left / trim-top
  const tr = pageW - mark - bleed; // trim-right
  const tb = pageH - mark - bleed; // trim-bottom
  const line = (x: number, y: number, w: number, h: number) =>
    `<div class="mark" style="left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm"></div>`;
  return [
    line(tl - t / 2, 0, t, mark), line(0, tl - t / 2, mark, t), // top-left
    line(tr - t / 2, 0, t, mark), line(pageW - mark, tl - t / 2, mark, t), // top-right
    line(tl - t / 2, pageH - mark, t, mark), line(0, tb - t / 2, mark, t), // bottom-left
    line(tr - t / 2, pageH - mark, t, mark), line(pageW - mark, tb - t / 2, mark, t), // bottom-right
  ].join("\n");
}

function buildHtml(
  fmt: Fmt,
  theme: Theme,
  assets: { fontCss: string; wordmark: string; qr: string },
): string {
  const u = fmt.unit;
  const pageW = fmt.trimW + 2 * fmt.bleed + 2 * fmt.mark;
  const pageH = fmt.trimH + 2 * fmt.bleed + 2 * fmt.mark;
  const bleedOff = fmt.mark;
  const trimOff = fmt.mark + fmt.bleed;
  const bleedW = fmt.trimW + 2 * fmt.bleed;
  const bleedH = fmt.trimH + 2 * fmt.bleed;
  const uu = (fmt.family === "landscape" ? fmt.trimH : fmt.trimW) / 100; // landscape is height-bound
  const style = THEMES[theme];

  const dieline = fmt.family === "round" ? `<div class="dieline"></div>` : "";

  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8">
<style>
${css(assets.fontCss)}
@page { size: ${pageW}${u} ${pageH}${u}; margin: 0; }
html, body { width: ${pageW}${u}; height: ${pageH}${u}; }
.page { width: ${pageW}${u}; height: ${pageH}${u}; --u: ${uu}${u}; ${style.vars}; }
.bleed { left: ${bleedOff}${u}; top: ${bleedOff}${u}; width: ${bleedW}${u}; height: ${bleedH}${u}; background: ${style.bg}; }
.trim { left: ${trimOff}${u}; top: ${trimOff}${u}; width: ${fmt.trimW}${u}; height: ${fmt.trimH}${u}; }
</style></head>
<body>
  <div class="page">
    <div class="bleed"></div>
    <div class="trim">${dieline}${content(fmt, assets.wordmark, assets.qr)}</div>
    ${cropMarks(pageW, pageH, fmt.mark, fmt.bleed)}
  </div>
</body></html>`;
}

function previewFmt(fmt: Fmt): Fmt {
  const maxPx = 1500;
  const pxPerMm = Math.min(6, maxPx / Math.max(fmt.trimW, fmt.trimH));
  return {
    ...fmt,
    id: `${fmt.id}-preview`,
    output: "png",
    unit: "px",
    bleed: 0,
    mark: 0,
    trimW: Math.round(fmt.trimW * pxPerMm),
    trimH: Math.round(fmt.trimH * pxPerMm),
    dir: path.join(fmt.dir, "_preview"),
  };
}

async function render(
  browser: import("puppeteer").Browser,
  fmt: Fmt,
  theme: Theme,
  assets: { fontCss: string; wordmark: string; qr: string },
): Promise<void> {
  const outDir = path.join(OUT, fmt.dir);
  await mkdir(outDir, { recursive: true });
  const html = buildHtml(fmt, theme, assets);
  const page = await browser.newPage();
  try {
    if (fmt.output === "png") {
      await page.setViewport({ width: fmt.trimW, height: fmt.trimH, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: "networkidle0" });
      const out = path.join(outDir, `${fmt.id}.png`);
      await page.screenshot({ path: out as `${string}.png`, type: "png" });
      console.log("wrote:", fmt.label, "->", path.relative(ROOT, out));
    } else {
      await page.setContent(html, { waitUntil: "networkidle0" });
      const out = path.join(outDir, `${fmt.id}.pdf`);
      const pageW = fmt.trimW + 2 * fmt.bleed + 2 * fmt.mark;
      const pageH = fmt.trimH + 2 * fmt.bleed + 2 * fmt.mark;
      await page.pdf({
        path: out,
        width: `${pageW}${fmt.unit}`,
        height: `${pageH}${fmt.unit}`,
        printBackground: true,
        pageRanges: "1",
      });
      console.log("wrote:", fmt.label, "->", path.relative(ROOT, out));
    }
  } finally {
    await page.close();
  }
}

async function loadAssets(theme: Theme) {
  const [fontRegular, fontBold, wordmark] = await Promise.all([
    dataUri(FONT_REGULAR, "font/ttf"),
    dataUri(FONT_BOLD, "font/ttf"),
    dataUri(theme === "dark" ? WORDMARK_DARK : WORDMARK_LIGHT, "image/png"),
  ]);
  const fontCss = `
@font-face { font-family: 'DIN Pro'; font-weight: 400; font-style: normal; src: url(${fontRegular}) format('truetype'); }
@font-face { font-family: 'DIN Pro'; font-weight: 700; font-style: normal; src: url(${fontBold}) format('truetype'); }`;

  const qr = await QRCode.toDataURL(URL, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 1200,
    color: { dark: "#0b1f33", light: "#ffffff" },
  });
  return { fontCss, wordmark, qr };
}

async function main() {
  const explore = process.env["AD_EXPLORE"] === "1";
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromiumPath(),
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    if (explore) {
      // render the two screens for both themes into _explore/ for comparison
      const screens = FORMATS.filter((f) => f.dir === "screens");
      for (const theme of ["dark", "light"] as Theme[]) {
        const assets = await loadAssets(theme);
        for (const f of screens) {
          const orient = f.family === "landscape" ? "landscape" : "portrait";
          await render(
            browser,
            { ...f, id: `feelzlike-explore-${theme}-${orient}`, dir: "_explore" },
            theme,
            assets,
          );
        }
      }
      return;
    }

    const theme = (process.env["AD_THEME"] === "light" ? "light" : "dark") as Theme;
    const assets = await loadAssets(theme);
    const jobs: Fmt[] = [];
    for (const f of FORMATS) {
      jobs.push(f);
      if (f.output === "pdf") jobs.push(previewFmt(f));
    }
    for (const f of jobs) await render(browser, f, theme, assets);
  } finally {
    await browser.close();
  }
}

await main();
