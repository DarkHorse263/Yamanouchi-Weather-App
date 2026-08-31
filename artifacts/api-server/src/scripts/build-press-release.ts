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

  <h1>feelzlike, the daily decision app for travellers staying near snow, now spans ten regions across australia, japan and new zealand.</h1>

  <p class="deck">
    The town-first weather, road and mountain-comparison app for off-mountain visitors
    has grown from three launch regions to ten across three countries, and now ships
    live powder, wind and road alerts, a multi-day trip planner and a premium tier.
  </p>

  <p class="lede">
    <strong>feelzlike</strong>, the progressive web app purpose-built for travellers
    based in resort towns rather than on the mountain, now serves <strong>ten live
    regions</strong> across Australia, Japan and New Zealand. The app is available now
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

  <h2>Where feelzlike is now</h2>
  <ul>
    <li><strong>Ten regions across three countries.</strong> Australia: the Snowy Mountains, Victoria's High Country and Tasmania. Japan: Yamanouchi, Nozawa Onsen and Iiyama in Nagano. New Zealand: Queenstown, Wanaka, Mt Hutt and Ruapehu.</li>
    <li><strong>The towns visitors actually stay in.</strong> From Jindabyne, Bright and Cooma to Yudanaka, Nozawa Onsen, Queenstown, Wanaka, Methven and Ohakune <em class="middot">·</em> more than twenty base towns and the resorts they serve.</li>
    <li><strong>The mountains people drive to.</strong> Thredbo, Perisher, Selwyn and Charlotte Pass; Mt Buller, Falls Creek and Mt Hotham; the eighteen interconnected fields of Shiga Kogen, plus Nozawa Onsen and Madarao; Coronet Peak, The Remarkables, Cardrona, Treble Cone, Mt Hutt, Whakapapa and Turoa.</li>
    <li><strong>Live data, not stale screenshots.</strong> Continuous integration with official sources including the Bureau of Meteorology, NSW LiveTraffic, VicEmergency and the Japan Meteorological Agency, plus Open-Meteo and region-aware weather radar.</li>
    <li><strong>Curated stays and eats.</strong> Hundreds of hand-checked venues across the base towns, with country-aware filters covering ryokan onsen and tattoo policies in Japan and drying-rooms and ski-storage in Australia and New Zealand.</li>
    <li><strong>A daily personalised call.</strong> An optional thirty-second profile tailors the mountain ranking to the visitor's skill level, discipline, priorities and risk tolerance.</li>
  </ul>

  <h2>What is new since launch</h2>
  <ul>
    <li><strong>Powder, wind and road alerts.</strong> Visitors can follow a town and be told when fresh snow, wind holds or road closures are likely <em class="middot">·</em> across all ten regions.</li>
    <li><strong>A multi-day trip planner.</strong> Stack the next seven days across every mountain a town serves and read the week at a glance.</li>
    <li><strong>Favourite towns.</strong> Save up to three towns so the app opens straight into the one you are staying in.</li>
    <li><strong>A fortnightly newsletter.</strong> An opt-in digest of conditions and the season's signal, with double opt-in confirmation.</li>
    <li><strong>A premium tier.</strong> The alerting and planning tools, free for every visitor through the launch period.</li>
  </ul>

  <h2>Why town-first matters</h2>
  <p>
    Every existing snow app starts with the mountain. feelzlike starts with the town
    <em class="middot">·</em> because that is where the off-mountain visitor wakes up.
    The audience the app serves is the family in a Jindabyne lodge with a non-skiing
    partner, the couple in a Yudanaka ryokan with three resorts within forty minutes,
    the Queenstown apartment weighing Coronet Peak against The Remarkables, the Bright
    pub patron weighing Hotham against Falls Creek over breakfast. On-mountain lodging
    in these regions is two to four times the price of in-town accommodation and supply
    has not recovered to demand since the pandemic <em class="middot">·</em> the
    off-mountain stay is now the norm, and feelzlike is built for it.
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
    <h3>Premium plans open in December 2026</h3>
    <div class="pricing-grid">
      <div class="pricing-tile intro">
        <div class="label">Standard feature</div>
        <div class="price">Powder alerts</div>
        <div class="meta">Email alerts with your own snowfall threshold</div>
      </div>
      <div class="pricing-tile">
        <div class="label">Monthly</div>
        <div class="price">$5.99<span style="font-size:10pt;color:#64748b;font-weight:500;"> /month</span></div>
        <div class="meta">From December 2026 <em class="middot">·</em> cancel anytime</div>
      </div>
      <div class="pricing-tile">
        <div class="label">Annual</div>
        <div class="price">$60<span style="font-size:10pt;color:#64748b;font-weight:500;"> /year</span></div>
        <div class="meta">Equivalent to $5 per month <em class="middot">·</em> save around 16 percent</div>
      </div>
    </div>
  </div>

  <p>
    Powder email alerts are a permanent standard feature with no account required.
    Premium wind, road and planning tools move to monthly and annual plans in
    <strong>December 2026</strong>, while core town weather, snow radar and
    side-by-side mountain comparison stay available to everyone.
  </p>

  <h2>Availability</h2>
  <p>
    feelzlike is a progressive web app. It works in every modern mobile browser and
    installs to the home screen with one tap on iOS and Android. There is nothing to
    download from the App Store or Google Play. The app is in English throughout, and
    bilingual in English and Japanese across the Japan regions of Yamanouchi, Nozawa
    Onsen and Iiyama.
  </p>

  <div class="endmark">ENDS</div>

  <div class="boilerplate">
    <h3>About feelzlike</h3>
    <p style="margin:0;">
      feelzlike is the daily decision app for people staying in resort towns near snow.
      Built on a town-first information architecture, the platform pairs live weather,
      road status and snow data with curated stays, eats and explore content for every
      base town it covers. feelzlike serves ten live regions across Australia, Japan and
      New Zealand and is structured to expand to Hokkaido, Hakuba, the European Alps and
      North America on the same town-first shape.
    </p>
  </div>

  <div class="contact">
    <h3>Media contact</h3>
    <div class="row"><span class="k">Web</span><span class="v">feelzlike.com</span></div>
    <div class="row"><span class="k">Email</span><span class="v">press@feelzlike.com</span></div>
    <div class="row"><span class="k">Regions</span><span class="v">Australia <em class="middot">·</em> Japan <em class="middot">·</em> New Zealand</span></div>
  </div>
`;

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
      Jindabyne <em class="middot">·</em> Yudanaka <em class="middot">·</em> Queenstown<br>
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
    title: "feelzlike · press release",
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
