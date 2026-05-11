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
  @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
  * { box-sizing: border-box; }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    color: #0b1f33;
    line-height: 1.55;
    font-size: 11pt;
    margin: 0;
  }
  header.brand {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 24px;
  }
  header.brand img { height: 38px; }
  header.brand .doc-tag {
    font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase;
    color: #1d4ed8; font-weight: 600;
  }
  h1 {
    font-size: 24pt; font-weight: 700; color: #0b1f33;
    margin: 0 0 4px 0; letter-spacing: -0.01em;
  }
  .subtitle { color: #475569; font-size: 11.5pt; margin-bottom: 28px; }
  h2 {
    font-size: 14pt; color: #0b1f33; margin: 26px 0 8px 0;
    border-left: 3px solid #1d4ed8; padding-left: 10px;
  }
  h3 { font-size: 11.5pt; color: #1d4ed8; margin: 16px 0 4px 0; font-weight: 600; }
  p { margin: 0 0 10px 0; }
  ul { margin: 0 0 12px 0; padding-left: 20px; }
  li { margin-bottom: 4px; }
  .pillrow { display: flex; gap: 8px; flex-wrap: wrap; margin: 6px 0 18px 0; }
  .pill {
    background: #eff6ff; color: #1d4ed8;
    border: 1px solid #bfdbfe; border-radius: 999px;
    padding: 4px 12px; font-size: 9.5pt; font-weight: 500;
  }
  .pill.green { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
  .panel {
    background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #1d4ed8;
    border-radius: 6px; padding: 14px 16px; margin: 14px 0 18px 0;
  }
  .panel.quote { font-style: italic; color: #334155; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .card {
    border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;
    background: #ffffff;
  }
  .card h4 {
    margin: 0 0 6px 0; font-size: 10.5pt; color: #0b1f33;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .card p { font-size: 10pt; margin: 0; color: #475569; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 16px 0; font-size: 10pt; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  th { color: #475569; font-weight: 600; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.08em; background: #f8fafc; }
  footer {
    margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    color: #94a3b8; font-size: 8.5pt; display: flex; justify-content: space-between;
  }
  strong { color: #0b1f33; }
  em.middot { font-style: normal; color: #1d4ed8; padding: 0 4px; }
`;

function shell(opts: { tag: string; title: string; subtitle: string; body: string; wordmark: string }) {
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${CSS}</style></head>
<body>
  <header class="brand">
    ${opts.wordmark ? `<img src="${opts.wordmark}" alt="feelzlike">` : `<div style="font-weight:700;font-size:18pt;color:#1d4ed8;">feelzlike</div>`}
    <div class="doc-tag">${opts.tag}</div>
  </header>
  <h1>${opts.title}</h1>
  <div class="subtitle">${opts.subtitle}</div>
  ${opts.body}
  <footer>
    <span>feelzlike <em class="middot">·</em> weather for resort towns</span>
    <span>v1.0 <em class="middot">·</em> May 2026</span>
  </footer>
</body></html>`;
}

const userBody = /* html */ `
  <div class="panel quote">
    You woke up in town. You've got the day, the family, and a car in the driveway.
    feelzlike tells you which mountain to point it at <em class="middot">·</em> in 30 seconds, before coffee.
  </div>

  <h2>Who it's for</h2>
  <p>People staying in a <strong>resort town</strong> <em class="middot">·</em> not on the mountain. The locals'
  rental, the lodge in Jindabyne, the ryokan in Yudanaka, the pub in Bright. You're <strong>off mountain
  by choice</strong> <em class="middot">·</em> the town is your basecamp <em class="middot">·</em>
  the resort is a day trip you choose each morning.</p>

  <p>The existing weather apps assume you've already booked a mountain. We don't. We assume you have
  a town and three or four resorts within driving distance, and the only question that matters is:
  <strong>where today?</strong></p>

  <h2>How a feelzlike morning works</h2>
  <ol>
    <li><strong>Open the app.</strong> It opens on your favourite town <em class="middot">·</em> Jindabyne, Bright or Yudanaka.</li>
    <li><strong>Glance the photo strip.</strong> Live LED-style numbers over a town shot tell you what it feelzlike <em>right now</em>, not four hours ago.</li>
    <li><strong>Check the road panel.</strong> Open <em class="middot">·</em> caution <em class="middot">·</em> chains required <em class="middot">·</em> closed.
      One line per access road, live from the official sources, with a road cam where one exists.</li>
    <li><strong>Compare the mountains the town serves.</strong> 24h snow, base depth, wind, lift status, snow cam.
      Side by side. We don't crown a winner <em class="middot">·</em> you decide.</li>
    <li><strong>Drive.</strong></li>
  </ol>

  <h2>What you get on every town</h2>
  <div class="grid2">
    <div class="card"><h4>Live conditions</h4><p>Temperature, wind, gusts, freezing level. Refreshed continuously.</p></div>
    <div class="card"><h4>Road status</h4><p>Open, caution, chains required, closed <em class="middot">·</em> per road, with cams.</p></div>
    <div class="card"><h4>Mountain comparison</h4><p>Every resort the town serves, side by side. Snow, lifts, cams.</p></div>
    <div class="card"><h4>7 to 14 day forecast</h4><p>So you can plan the week, not just tomorrow.</p></div>
    <div class="card"><h4>Snow cams</h4><p>Live feeds where the resort runs them <em class="middot">·</em> a clean link where it doesn't.</p></div>
    <div class="card"><h4>Stays, eats, explore</h4><p>Booking partners, a Google Places search locked to the area, the local tourism site.</p></div>
  </div>

  <h2>Three towns, today</h2>
  <table>
    <tr><th>Town</th><th>Country</th><th>Mountains the town serves</th></tr>
    <tr><td><strong>Jindabyne</strong></td><td>NSW, Australia</td><td>Perisher <em class="middot">·</em> Thredbo <em class="middot">·</em> Charlotte Pass <em class="middot">·</em> Selwyn</td></tr>
    <tr><td><strong>Bright</strong></td><td>VIC, Australia</td><td>Hotham <em class="middot">·</em> Falls Creek <em class="middot">·</em> Mt Buller</td></tr>
    <tr><td><strong>Yudanaka</strong></td><td>Nagano, Japan</td><td>Shiga Kogen (18 resorts grouped) <em class="middot">·</em> Nozawa Onsen <em class="middot">·</em> Madarao</td></tr>
  </table>

  <h2>Winter and green season</h2>
  <p>The data set adapts. In winter you see snow, chains, lifts and powder. In green season the same town
  shell shows trail status, fire danger, river levels and the rides and walks the town is known for.
  The town stays the centre of the picture all year.</p>

  <h2>What feelzlike will not do</h2>
  <ul>
    <li>It will not tell you which mountain is best. That call is yours.</li>
    <li>It will not pretend it knows the snow at 3am if the station hasn't reported.</li>
    <li>It will not show data older than the user expects without saying so on the tile.</li>
    <li>It will not bury you in jargon <em class="middot">·</em> the language is local to the region.</li>
  </ul>

  <h2>Coming soon</h2>
  <ul>
    <li><strong>Save a town as your favourite</strong> so the app opens straight into it next time.</li>
    <li><strong>Push alerts</strong> when a road switches to chains required, or 20cm lands overnight.</li>
    <li><strong>Premium tier</strong> for modelled snowfall heatmaps and a 14-day powder window.</li>
    <li><strong>More towns</strong> across NZ, Hokkaido, Hakuba and the European Alps <em class="middot">·</em> same town-first shape.</li>
  </ul>
`;

const investorBody = /* html */ `
  <div class="pillrow">
    <span class="pill">PWA <em class="middot">·</em> mobile-first</span>
    <span class="pill">3 live regions</span>
    <span class="pill">Town-first IA</span>
    <span class="pill green">Off-mountain market</span>
    <span class="pill">Sponsorable by RTAs</span>
  </div>

  <h2>One sentence</h2>
  <div class="panel">
    <strong>feelzlike</strong> is the daily decision app for people staying in resort towns near snow
    <em class="middot">·</em> we tell them which mountain to drive to today, with live conditions, live roads
    and a fair side-by-side of every resort the town serves.
  </div>

  <h2>The market we go after (and the one we don't)</h2>
  <p>Every existing snow app starts with the mountain. Epic, Ikon, OnTheSnow, Snow-Forecast, Liftopia
  <em class="middot">·</em> they assume you've already chosen Vail, or Hakuba, or Thredbo, and they sell you
  the lift ticket. Useful, but they own the on-mountain audience.</p>
  <p>We are the <strong>off-mountain audience</strong>. The traveller staying in town because:</p>
  <ul>
    <li>on-mountain lodging is two to four times the price,</li>
    <li>they have a non-skiing partner or kids,</li>
    <li>they want après in a real town with restaurants and onsen, not a ski-in cafeteria,</li>
    <li>they want the option to switch resorts mid-week based on what the snow actually did.</li>
  </ul>
  <p>That audience is large, under-served, and demonstrably willing to pay for accommodation in town
  rather than on hill. They're the natural customer of the local tourism economy <em class="middot">·</em>
  the same economy we plug straight into.</p>

  <h2>The product, in three layers</h2>
  <div class="grid2">
    <div class="card"><h4>1. Today, in town</h4><p>Live numbers over a hero town shot. Wind, temp, freezing level. Updated continuously.</p></div>
    <div class="card"><h4>2. Roads from town</h4><p>Per-road status with chain advice and cams. Pulled live from BOM, VicEmergency, JMA, NSW and VIC road authorities.</p></div>
    <div class="card"><h4>3. Mountains from town</h4><p>Every resort the town serves, normalised onto one comparison grid. Agnostic. The user chooses.</p></div>
  </div>

  <h2>What we have today (live)</h2>
  <table>
    <tr><th>Region</th><th>Base town</th><th>Resorts surfaced</th><th>Live integrations</th></tr>
    <tr><td>Snowy Mountains</td><td>Jindabyne</td><td>Perisher, Thredbo, Charlotte, Selwyn</td><td>BOM, NSW LiveTraffic, road cams</td></tr>
    <tr><td>Victoria's High Country</td><td>Bright</td><td>Hotham, Falls Creek, Mt Buller</td><td>BOM, VicEmergency, VicTraffic</td></tr>
    <tr><td>Yamanouchi</td><td>Yudanaka</td><td>Shiga Kogen (18 grouped) + Nozawa, Madarao</td><td>JMA, RainViewer, OpenWeatherMap</td></tr>
  </table>

  <h2>Why the shape repeats</h2>
  <p>The town-first information architecture is encoded in the platform. A new region is a config file plus
  a town photo plus a list of mountains the town serves. Adding the next ten towns <em class="middot">·</em>
  Queenstown, Wanaka, Niseko, Hakuba, Chamonix, Zermatt, Whistler, Banff, Aspen, Park City <em class="middot">·</em>
  is days of data work, not months of engineering. The codebase, the API server, the design system,
  the alerting, the road parsers <em class="middot">·</em> all already shared.</p>

  <h2>Revenue model</h2>
  <div class="grid2">
    <div class="card"><h4>1. Local Tourism Association sponsorship</h4><p>Each town is a discrete sellable surface. RTAs pay to own the basecamp their visitors open every morning.</p></div>
    <div class="card"><h4>2. Affiliate commission</h4><p>Stays via Booking, Expedia, Airbnb. Eats via Google. Lift tickets via resort partners. We become their top-of-funnel.</p></div>
    <div class="card"><h4>3. Premium subscription</h4><p>Modelled snowfall heatmaps, 14-day powder window, push alerts, ad-free. The Snow-Forecast playbook, town-shaped.</p></div>
    <div class="card"><h4>4. Native advertising</h4><p>Hire-shop, transfer, instructor and gear ads inside each town's stays/eats/explore tabs.</p></div>
  </div>

  <h2>Why now</h2>
  <ul>
    <li>The off-mountain stay is the post-pandemic norm <em class="middot">·</em> on-mountain lodging supply has not recovered to demand.</li>
    <li>National weather APIs (BOM, JMA, VicEmergency) finally expose enough granularity to do this without enterprise contracts.</li>
    <li>RTAs are actively looking for digital basecamps that send qualified visitors to their accommodation members.</li>
    <li>No incumbent owns the off-mountain visitor <em class="middot">·</em> the on-mountain incumbents have no incentive to.</li>
  </ul>

  <h2>Defensibility</h2>
  <ul>
    <li><strong>Town brand.</strong> "feelzlike Jindabyne" is a sponsorable surface no resort can replicate.</li>
    <li><strong>Data plumbing.</strong> Per-region road parsers and resort normalisers compound over time.</li>
    <li><strong>RTA contracts.</strong> Each signed RTA is a multi-year exclusive on the town basecamp surface.</li>
    <li><strong>Design discipline.</strong> The town-first IA is a hard rule in the codebase <em class="middot">·</em> later entrants would have to retrofit.</li>
  </ul>

  <h2>Ask</h2>
  <p>Funding to (a) sign the first three RTA sponsorships in NSW, VIC and Nagano, (b) extend the same
  shell across NZ and Hokkaido for the 2026 southern winter, and (c) build the premium subscription tier
  for launch ahead of the 2026 northern winter.</p>
`;

async function renderPdf(html: string, outPath: string) {
  const browser = await puppeteer.launch({
    headless: true,
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

  const userHtml = shell({
    tag: "User overview",
    title: "feelzlike, for people staying in town.",
    subtitle:
      "What feelzlike is, who it's for, and how a morning in a resort town actually works with it.",
    body: userBody,
    wordmark,
  });

  const investorHtml = shell({
    tag: "Investor overview",
    title: "The basecamp app for the off-mountain visitor.",
    subtitle:
      "Why the resort-town traveller is the under-served snow audience, and how feelzlike owns it.",
    body: investorBody,
    wordmark,
  });

  const userPath = path.join(OUT, "feelzlike-user-overview.pdf");
  const investorPath = path.join(OUT, "feelzlike-investor-overview.pdf");

  await renderPdf(userHtml, userPath);
  await renderPdf(investorHtml, investorPath);

  console.log("wrote:", userPath);
  console.log("wrote:", investorPath);
}

await main();
