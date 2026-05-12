import { mkdir, writeFile, readFile } from "node:fs/promises";
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

const WORDMARK = path.join(
  ROOT,
  "attached_assets",
  "feelzlike_WordMarque_colour_160426_1777334678269.png",
);

async function imgDataUri(absPath: string): Promise<string> {
  if (!existsSync(absPath)) return "";
  const buf = await readFile(absPath);
  const ext = path.extname(absPath).slice(1).toLowerCase();
  const mime = ext === "svg" ? "image/svg+xml" : `image/${ext}`;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const CSS = /* css */ `
  @page { size: A4; margin: 20mm 20mm 22mm 20mm; }
  * { box-sizing: border-box; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    color: #0b1f33;
    line-height: 1.6;
    font-size: 10.5pt;
    margin: 0;
  }
  header.brand {
    display: flex; align-items: flex-end; justify-content: space-between;
    border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 6px;
  }
  header.brand img { height: 40px; }
  header.brand .ident {
    text-align: right; color: #475569; font-size: 8.5pt;
    line-height: 1.45;
  }
  header.brand .ident strong { color: #0b1f33; display: block; font-size: 9pt; }
  .release-bar {
    display: flex; justify-content: space-between; align-items: center;
    margin: 12px 0 22px 0; font-size: 8.5pt;
    letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700;
    color: #1d4ed8;
  }
  .release-bar .right { color: #475569; letter-spacing: 0.08em; font-weight: 600; }
  .dateline {
    font-size: 10pt; color: #334155; margin-bottom: 14px;
  }
  .dateline strong { color: #0b1f33; text-transform: uppercase; letter-spacing: 0.06em; }
  h1 {
    font-size: 22pt; font-weight: 700; color: #0b1f33;
    margin: 0 0 6px 0; letter-spacing: -0.01em; line-height: 1.2;
  }
  .deck {
    color: #475569; font-size: 12pt; font-weight: 400;
    margin: 0 0 22px 0; line-height: 1.45;
  }
  h2 {
    font-size: 12pt; color: #0b1f33; margin: 22px 0 8px 0;
    border-left: 3px solid #1d4ed8; padding-left: 10px;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  p { margin: 0 0 10px 0; }
  p.lede { font-size: 11.5pt; color: #0b1f33; margin-bottom: 14px; }
  p.lede strong { color: #1d4ed8; }
  ul { margin: 0 0 12px 0; padding-left: 20px; }
  li { margin-bottom: 5px; }
  blockquote {
    margin: 14px 0; padding: 14px 18px;
    background: #f8fafc; border-left: 3px solid #1d4ed8; border-radius: 4px;
    font-style: italic; color: #334155; font-size: 11pt;
  }
  blockquote .attrib {
    display: block; margin-top: 8px; font-style: normal; font-size: 9.5pt;
    color: #64748b;
  }
  blockquote .attrib strong { color: #0b1f33; }
  .pricing {
    margin: 14px 0 18px 0; padding: 16px 18px;
    background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
    border: 1px solid #bfdbfe; border-radius: 6px;
  }
  .pricing h3 {
    margin: 0 0 10px 0; font-size: 10.5pt; color: #1d4ed8;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .pricing-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .pricing-tile {
    border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;
    background: #ffffff;
  }
  .pricing-tile .label {
    font-size: 8.5pt; color: #475569; text-transform: uppercase;
    letter-spacing: 0.08em; font-weight: 600; margin-bottom: 4px;
  }
  .pricing-tile .price {
    font-size: 16pt; font-weight: 700; color: #0b1f33; line-height: 1.1;
  }
  .pricing-tile .meta { font-size: 9pt; color: #64748b; margin-top: 4px; }
  .pricing-tile.intro { border-color: #16a34a; background: #f0fdf4; }
  .pricing-tile.intro .price { color: #15803d; }
  .endmark {
    text-align: center; margin: 26px 0 18px 0;
    font-size: 11pt; font-weight: 700; color: #1d4ed8;
    letter-spacing: 0.4em;
  }
  .boilerplate {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 6px; padding: 14px 16px; margin-top: 14px;
    font-size: 9.5pt; color: #334155;
  }
  .boilerplate h3 {
    margin: 0 0 6px 0; font-size: 9.5pt; color: #0b1f33;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .contact {
    margin-top: 14px; padding: 14px 16px;
    border: 1px solid #e2e8f0; border-radius: 6px;
    font-size: 9.5pt;
  }
  .contact h3 {
    margin: 0 0 8px 0; font-size: 9.5pt; color: #0b1f33;
    text-transform: uppercase; letter-spacing: 0.08em;
  }
  .contact .row { display: flex; gap: 8px; margin-bottom: 3px; }
  .contact .row .k { color: #64748b; min-width: 60px; }
  .contact .row .v { color: #0b1f33; font-weight: 500; }
  footer {
    margin-top: 26px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    color: #94a3b8; font-size: 8pt;
    display: flex; justify-content: space-between;
  }
  strong { color: #0b1f33; }
  em.middot { font-style: normal; color: #1d4ed8; padding: 0 4px; font-weight: 700; }
`;

const today = new Date();
const RELEASE_DATE = today.toLocaleDateString("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const RELEASE_LOCATION = "JINDABYNE, NSW, AUSTRALIA";

const body = /* html */ `
  <div class="release-bar">
    <span>For Immediate Release</span>
    <span class="right">Page 1 of 1</span>
  </div>

  <p class="dateline">
    <strong>${RELEASE_LOCATION} <em class="middot">·</em> ${RELEASE_DATE}</strong>
  </p>

  <h1>feelzlike launches as the daily decision app for travellers staying in resort towns near snow.</h1>

  <p class="deck">
    A town-first weather, road and mountain-comparison app for off-mountain visitors
    in the Snowy Mountains, Victoria's High Country and Yamanouchi launches today,
    free for the first two months.
  </p>

  <p class="lede">
    <strong>feelzlike</strong>, a new progressive web app purpose-built for travellers
    based in resort towns rather than on the mountain, launched publicly today across
    three live regions <em class="middot">·</em> the Snowy Mountains in New South Wales,
    Victoria's High Country, and Yamanouchi in Nagano, Japan. The app is available now
    at <strong>feelzlike.com</strong> and installs directly to mobile home screens with
    no app-store download required.
  </p>

  <p>
    feelzlike is built around a single morning question that every off-mountain visitor
    asks themselves: <strong>which mountain do I drive to today?</strong> The app answers
    that question by combining live weather, official road status, snow conditions and
    a fair side-by-side comparison of every resort the visitor's town serves
    <em class="middot">·</em> all anchored to the town the visitor is actually staying in.
  </p>

  <h2>What the launch covers</h2>
  <ul>
    <li><strong>Three live regions, six base towns.</strong> Jindabyne, Berridale and Cooma in the Snowy Mountains; Bright in Victoria's High Country; Yudanaka, Shibu Onsen and Yomase in Yamanouchi.</li>
    <li><strong>Thirteen resorts surfaced.</strong> Including Thredbo, Perisher, Charlotte Pass, Selwyn, Mt Hotham, Falls Creek, Mt Buller, and the eighteen interconnected fields of Shiga Kogen.</li>
    <li><strong>Live data, not stale screenshots.</strong> Continuous integration with the Bureau of Meteorology, NSW LiveTraffic, VicEmergency, the Japan Meteorological Agency and Open-Meteo.</li>
    <li><strong>Curated stays and eats.</strong> Two hundred and twenty-eight venues across the six base towns, hand-checked, with country-aware filters covering ryokan onsen and tattoo policies in Japan and drying-rooms and ski-storage in Australia.</li>
    <li><strong>A daily personalised call.</strong> An optional thirty-second profile tailors the mountain ranking to the visitor's skill level, discipline, priorities and risk tolerance.</li>
  </ul>

  <h2>Why town-first matters</h2>
  <p>
    Every existing snow app starts with the mountain. feelzlike starts with the town
    <em class="middot">·</em> because that is where the off-mountain visitor wakes up.
    The audience the app serves is the family in a Jindabyne lodge with a non-skiing
    partner, the couple in a Yudanaka ryokan with three resorts within forty minutes,
    the Bright pub patron weighing Hotham against Falls Creek over breakfast.
    On-mountain lodging in these regions is two to four times the price of in-town
    accommodation and supply has not recovered to demand since the pandemic
    <em class="middot">·</em> the off-mountain stay is now the norm, and feelzlike is
    built for it.
  </p>

  <blockquote>
    feelzlike does not tell you which mountain is best. That call is yours. What it does
    is put every number you need, from every official source, on one screen
    <em class="middot">·</em> in the language of the town you woke up in
    <em class="middot">·</em> in under thirty seconds.
    <span class="attrib"><strong>The feelzlike product team</strong></span>
  </blockquote>

  <h2>Pricing</h2>
  <div class="pricing">
    <h3>Launch offer <em class="middot">·</em> all features free for two months</h3>
    <div class="pricing-grid">
      <div class="pricing-tile intro">
        <div class="label">Launch period</div>
        <div class="price">Free</div>
        <div class="meta">First two months <em class="middot">·</em> all features unlocked</div>
      </div>
      <div class="pricing-tile">
        <div class="label">Monthly</div>
        <div class="price">$10<span style="font-size:10pt;color:#64748b;font-weight:500;"> /month</span></div>
        <div class="meta">Cancel anytime</div>
      </div>
      <div class="pricing-tile">
        <div class="label">Annual</div>
        <div class="price">$60<span style="font-size:10pt;color:#64748b;font-weight:500;"> /year</span></div>
        <div class="meta">Equivalent to $5 per month <em class="middot">·</em> save 50 percent</div>
      </div>
    </div>
  </div>

  <p>
    From <strong>${getPaywallDate(today)}</strong> the full feature set moves behind a
    subscription. Every visitor who registers in the first two months is grandfathered
    into the launch experience for the duration of the free period regardless of when
    the paywall takes effect.
  </p>

  <h2>Availability</h2>
  <p>
    feelzlike is a progressive web app. It works in every modern mobile browser and
    installs to the home screen with one tap on iOS and Android. There is nothing to
    download from the App Store or Google Play. The app is bilingual in English and
    Japanese throughout the Yamanouchi region and English-only in the Australian
    regions at launch.
  </p>

  <div class="endmark">— ENDS —</div>

  <div class="boilerplate">
    <h3>About feelzlike</h3>
    <p style="margin:0;">
      feelzlike is the daily decision app for people staying in resort towns near snow.
      Built on a town-first information architecture, the platform pairs live weather,
      road status and snow data with curated stays, eats and explore content for every
      base town it covers. feelzlike currently serves three live regions across Australia
      and Japan and is structured to expand to ten further towns in New Zealand, Hokkaido,
      Hakuba, the European Alps and North America on the same town-first shape.
    </p>
  </div>

  <div class="contact">
    <h3>Media contact</h3>
    <div class="row"><span class="k">Web</span><span class="v">feelzlike.com</span></div>
    <div class="row"><span class="k">Email</span><span class="v">press@feelzlike.com</span></div>
    <div class="row"><span class="k">Regions</span><span class="v">Snowy Mountains <em class="middot">·</em> Victoria's High Country <em class="middot">·</em> Yamanouchi</span></div>
  </div>
`;

function getPaywallDate(launch: Date): string {
  const d = new Date(launch);
  d.setMonth(d.getMonth() + 2);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}

function shell(opts: { title: string; body: string; wordmark: string }) {
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${CSS}</style></head>
<body>
  <header class="brand">
    ${opts.wordmark
      ? `<img src="${opts.wordmark}" alt="feelzlike">`
      : `<div style="font-weight:700;font-size:20pt;color:#1d4ed8;">feelzlike</div>`}
    <div class="ident">
      <strong>feelzlike</strong>
      weather for resort towns<br>
      Jindabyne <em class="middot">·</em> Bright <em class="middot">·</em> Yudanaka<br>
      feelzlike.com
    </div>
  </header>
  ${opts.body}
  <footer>
    <span>feelzlike <em class="middot">·</em> press release</span>
    <span>${RELEASE_DATE}</span>
  </footer>
</body></html>`;
}

async function renderPdf(html: string, outPath: string) {
  const browser = await puppeteer.launch({
    executablePath: resolveChromiumPath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const wordmark = await imgDataUri(WORDMARK);

  const html = shell({
    title: "feelzlike · launch press release",
    body,
    wordmark,
  });

  const outPath = path.join(OUT, "feelzlike-press-release.pdf");
  const htmlPath = path.join(OUT, "feelzlike-press-release.html");

  await renderPdf(html, outPath);
  await writeFile(htmlPath, html, "utf-8");

  console.log("wrote:", outPath);
  console.log("wrote:", htmlPath);
}

await main();
