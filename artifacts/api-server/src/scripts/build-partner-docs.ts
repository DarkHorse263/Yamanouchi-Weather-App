/**
 * Builds the owner's private listing-deal documents into exports/:
 *
 *   - feelzlike-listing-deals-overview.pdf  (how to respond to the inquiries)
 *   - feelzlike-rate-card.pdf               (send to interested operators)
 *   - feelzlike-listing-agreement-template.pdf (one-page fill-in agreement)
 *
 * These are PRIVATE business documents for the owner. They are NOT copied
 * into the app's public/downloads folder and must never be linked in-app.
 *
 * Run: pnpm --filter @workspace/api-server exec tsx src/scripts/build-partner-docs.ts
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
  ul, ol { margin: 0 0 12px 0; padding-left: 20px; }
  li { margin-bottom: 4px; }
  .panel {
    background: #f8fafc; border: 1px solid #e2e8f0; border-left: 3px solid #1d4ed8;
    border-radius: 6px; padding: 14px 16px; margin: 14px 0 18px 0;
  }
  .panel.pink { border-left-color: #ec008c; }
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
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { color: #475569; font-weight: 600; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.08em; background: #f8fafc; }
  td.price { white-space: nowrap; font-weight: 700; color: #0b1f33; }
  footer {
    margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0;
    color: #94a3b8; font-size: 8.5pt; display: flex; justify-content: space-between;
  }
  strong { color: #0b1f33; }
  em.middot { font-style: normal; color: #1d4ed8; padding: 0 4px; }
  .blank {
    display: inline-block; min-width: 180px; border-bottom: 1px solid #94a3b8;
    height: 1em; vertical-align: baseline;
  }
  .blank.short { min-width: 90px; }
  .blank.long { min-width: 300px; }
  .clause { margin-bottom: 10px; }
  .clause .num { font-weight: 700; color: #1d4ed8; margin-right: 6px; }
  .sig { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 22px; }
  .sig .box { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 9.5pt; color: #475569; }
  .fine { font-size: 8.5pt; color: #94a3b8; margin-top: 14px; }
  .agreement p, .agreement .clause { font-size: 10pt; line-height: 1.5; }
  .agreement h2 { margin: 18px 0 6px 0; font-size: 12pt; }
`;

function shell(opts: { tag: string; title: string; subtitle: string; body: string; wordmark: string; bodyClass?: string }) {
  return /* html */ `<!doctype html>
<html><head><meta charset="utf-8"><title>${opts.title}</title>
<style>${CSS}</style></head>
<body class="${opts.bodyClass ?? ""}">
  <header class="brand">
    ${opts.wordmark ? `<img src="${opts.wordmark}" alt="feelzlike">` : `<div style="font-weight:700;font-size:18pt;color:#1d4ed8;">feelzlike</div>`}
    <div class="doc-tag">${opts.tag}</div>
  </header>
  <h1>${opts.title}</h1>
  <div class="subtitle">${opts.subtitle}</div>
  ${opts.body}
  <footer>
    <span>feelzlike <em class="middot">·</em> weather for resort towns</span>
    <span>v1.0 <em class="middot">·</em> July 2026</span>
  </footer>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* 1 · Owner overview: how to respond to the four inquiries            */
/* ------------------------------------------------------------------ */

const overviewBody = /* html */ `
  <div class="panel quote">
    Four operators have asked about listing deals. This document is your playbook:
    what to sell, what to charge, what to say, and the lines we never cross.
    Keep it private <em class="middot">·</em> the rate card and agreement template are the two documents you send out.
  </div>

  <h2>Who asked, and where they stand today</h2>
  <table>
    <tr><th>Company</th><th>What they do</th><th>On feelzlike today</th></tr>
    <tr><td><strong>Cooma Coaches</strong> (Snowy Mountains Bus Service)</td><td>Daily Canberra to Jindabyne coach + resort shuttles</td><td>Listed free, already the editorial hero on Snowy Mountains transport pages</td></tr>
    <tr><td><strong>Snoexpress</strong></td><td>Sydney to Snowy Mountains ski coach, winter</td><td>Listed free in the Snowy Mountains operator list</td></tr>
    <tr><td><strong>Snowbus Australia</strong></td><td>Melbourne to Buller / Hotham / Falls Creek ski coach</td><td>Listed free, already a secondary hero on Victoria's High Country transport pages</td></tr>
    <tr><td><strong>Snowball Japan Properties</strong></td><td>Chalets and property at Madarao / Tangram</td><td>Not listed yet <em class="middot">·</em> Madarao accommodation pages get built when a deal signs</td></tr>
  </table>

  <h2>What you are selling</h2>
  <p>One product: the <strong>featured partner</strong> placement. The operator's card sits at the top of the
  transport page for every town they serve, carries a clearly disclosed "featured partner" label, and links
  straight to their booking page. The app support for this is already built <em class="middot">·</em>
  turning a deal on is a one-line change once an agreement is signed.</p>

  <div class="panel pink">
    <strong>The lines we never cross.</strong> The label always says featured partner <em class="middot">·</em>
    competitors are never removed or demoted because someone paid <em class="middot">·</em> free listings stay
    free <em class="middot">·</em> weather, snow and road data are never influenced by who pays. Say this out
    loud in every negotiation. It is why a listing here is worth having.
  </div>

  <h2>The model: flat fee per season, not commission</h2>
  <p>Charge a <strong>flat fee per region, per season</strong>, paid upfront. No commission, no click
  targets, no tracking obligations. It is simple to invoice, simple to explain, and it does not put you
  in the business of guaranteeing outcomes you cannot control.</p>
  <ul>
    <li><strong>Founding partner rates.</strong> The rate card prices are deliberately modest because the audience is still growing. Lock the same rate for their first renewal so early partners are rewarded.</li>
    <li><strong>Exclusivity is the upsell.</strong> "Only featured coach operator in the region" can only be sold once per region <em class="middot">·</em> price it as an add-on and do not give it away.</li>
    <li><strong>Mid-season starts are pro-rata by month.</strong> The 2026 Australian season is roughly half done, so a deal signed now for the remainder should cost roughly half the season rate.</li>
  </ul>

  <h2>Company-by-company suggestions</h2>
  <ul>
    <li><strong>Cooma Coaches</strong> <em class="middot">·</em> they already hold the hero slot editorially, because they earned it. The pitch: formalise it, add the partner label, and take exclusivity off the table for anyone else. Easiest yes.</li>
    <li><strong>Snoexpress</strong> <em class="middot">·</em> a standard featured slot in Snowy Mountains. If Cooma Coaches takes exclusivity, be straight with Snoexpress: their free listing stays, and offer the Victoria's High Country region or a next-season option instead.</li>
    <li><strong>Snowbus Australia</strong> <em class="middot">·</em> featured partner in Victoria's High Country, where they already appear on five town pages. Clean fit.</li>
    <li><strong>Snowball Japan Properties</strong> <em class="middot">·</em> the placement is a featured stay on Madarao / Tangram pages that do not exist yet. Quote the rate card price for the 2026-27 Japan season and be honest that the pages go live when the deal signs <em class="middot">·</em> they are effectively funding their own shopfront. Do not build it on spec.</li>
  </ul>

  <h2>How to run the conversation</h2>
  <ol>
    <li>Reply warmly, attach the <strong>rate card</strong>, and say prices hold until the end of the month.</li>
    <li>When they agree, fill in the <strong>one-page agreement</strong>, both sign, invoice upfront.</li>
    <li>Send a copy of the signed page back to them and flip their placement on <em class="middot">·</em> it goes live the same week.</li>
    <li>Diary the end date. Renewal is a fresh conversation, never automatic.</li>
  </ol>

  <h2>A reply you can adapt</h2>
  <div class="panel quote">
    Thanks for reaching out <em class="middot">·</em> we do offer a featured partner placement and I've attached
    the current rate card. It is a flat seasonal fee, clearly labelled as a partnership in the app, and your
    existing free listing stays either way. If a placement makes sense for you, the agreement is a single page
    and we can have you live within the week.
  </div>

  <p class="fine">Private owner document. The prices on the rate card are yours to change before you send it <em class="middot">·</em> nothing is committed until you sign an agreement.</p>
`;

/* ------------------------------------------------------------------ */
/* 2 · Rate card: the document you send to operators                   */
/* ------------------------------------------------------------------ */

const rateCardBody = /* html */ `
  <div class="panel quote">
    feelzlike is the weather app for people staying in resort towns across Australia, Japan and
    New Zealand. Every morning our visitors decide which mountain to drive to <em class="middot">·</em>
    a featured partner is the transport or accommodation name they see first.
  </div>

  <h2>What a featured partner gets</h2>
  <div class="grid2">
    <div class="card"><h4>Top placement</h4><p>Your card sits above every other operator on the transport page of each town you serve, all season.</p></div>
    <div class="card"><h4>Every town you serve</h4><p>One regional deal covers all of your towns <em class="middot">·</em> e.g. Mansfield, Bright, Mount Beauty, Harrietville and Dinner Plain in Victoria's High Country.</p></div>
    <div class="card"><h4>Direct booking links</h4><p>Phone, website and timetable links go straight to you. We take no commission on anything you sell.</p></div>
    <div class="card"><h4>Honest label</h4><p>The placement carries a clear "featured partner" label. Our readers trust the app because nothing is disguised <em class="middot">·</em> that trust is what you are buying into.</p></div>
  </div>

  <h2>Founding partner rates <em class="middot">·</em> 2026 and 2026-27 seasons</h2>
  <table>
    <tr><th>Placement</th><th>Covers</th><th>Rate (AUD, ex GST)</th></tr>
    <tr><td><strong>Featured transport partner</strong> <em class="middot">·</em> one region</td><td>Top transport placement on every town page you serve, one full season</td><td class="price">$400 / season</td></tr>
    <tr><td><strong>Category exclusivity</strong> add-on</td><td>Only featured coach operator in your region for the season</td><td class="price">+ $250 / season</td></tr>
    <tr><td><strong>Featured stay partner</strong> <em class="middot">·</em> Japan</td><td>Featured accommodation placement on the relevant town and resort pages, 2026-27 Japan season</td><td class="price">$500 / season</td></tr>
    <tr><td><strong>Second region</strong></td><td>Same placement in an additional region, same season</td><td class="price">50% off</td></tr>
  </table>

  <h2>Terms in plain language</h2>
  <ul>
    <li><strong>Seasons.</strong> Australia: June to early October. Japan: December to late March.</li>
    <li><strong>Joining mid-season?</strong> The fee is pro-rata by month for the months remaining.</li>
    <li><strong>Founding partner promise.</strong> Your rate is locked for your first renewal.</li>
    <li><strong>Payment.</strong> Upfront, on invoice, before the placement goes live.</li>
    <li><strong>What we do not sell.</strong> We never remove or demote other operators, and free listings stay free. We sell prominence, never the market.</li>
    <li><strong>No performance guarantee.</strong> We are an early-stage, growing audience. We do not guarantee clicks or bookings, and we will not pretend otherwise.</li>
  </ul>

  <div class="panel">
    <strong>Next step</strong> <em class="middot">·</em> reply to partners@feelzlike.com. The agreement is a single
    page, and placements go live within a week of signing.
  </div>
`;

/* ------------------------------------------------------------------ */
/* 3 · One-page agreement template                                     */
/* ------------------------------------------------------------------ */

const agreementBody = /* html */ `
  <p><strong>This agreement</strong> is between <strong>feelzlike</strong> ("the app"), operated by
  <span class="blank long"></span>, and
  <span class="blank long"></span> ("the partner"),
  ABN / company number <span class="blank"></span>.</p>

  <h2>1 · The placement</h2>
  <div class="clause"><span class="num">1.1</span>The app will display the partner as a <strong>featured partner</strong> in the
  <span class="blank"></span> region, on the pages of every listed town the partner serves.</div>
  <div class="clause"><span class="num">1.2</span>Category exclusivity (only featured operator of the partner's type in the region):
  <strong>yes / no</strong> (circle one).</div>
  <div class="clause"><span class="num">1.3</span>The placement carries a visible "featured partner" label at all times. Other operators
  remain listed free of charge and are not demoted or removed under this agreement.</div>

  <h2>2 · Term and fee</h2>
  <div class="clause"><span class="num">2.1</span>Term: from <span class="blank short"></span> to <span class="blank short"></span>.</div>
  <div class="clause"><span class="num">2.2</span>Fee: AUD <span class="blank short"></span> (ex GST), payable upfront on invoice.
  The placement goes live after payment is received.</div>
  <div class="clause"><span class="num">2.3</span>Renewal is by mutual agreement <em class="middot">·</em> this agreement does not renew automatically.</div>

  <h2>3 · Content and conduct</h2>
  <div class="clause"><span class="num">3.1</span>The partner confirms its service details (routes, timetables, contact information) supplied
  for the placement are accurate, and will advise the app of material changes. The app may correct factual
  information at any time.</div>
  <div class="clause"><span class="num">3.2</span>The placement is promotion of the partner's services only. It does not influence, and is not
  presented as influencing, the app's weather, snow or road information.</div>
  <div class="clause"><span class="num">3.3</span>No performance guarantee. The app makes no promise of traffic, clicks or bookings.</div>

  <h2>4 · Ending early</h2>
  <div class="clause"><span class="num">4.1</span>Either party may end this agreement with 14 days written notice. The partner receives a
  pro-rata refund for whole unused months.</div>
  <div class="clause"><span class="num">4.2</span>The app may end the placement immediately, with a pro-rata refund, if the partner ceases
  operating the listed service or the partner's conduct would mislead the app's readers.</div>

  <h2>5 · General</h2>
  <div class="clause"><span class="num">5.1</span>This is the whole agreement between the parties for the placement. It is governed by the laws
  of New South Wales, Australia.</div>

  <div class="sig">
    <div>
      <div class="box">Signed for feelzlike <em class="middot">·</em> name, signature, date</div>
    </div>
    <div>
      <div class="box">Signed for the partner <em class="middot">·</em> name, signature, date</div>
    </div>
  </div>

  <p class="fine">Template only <em class="middot">·</em> this document is a starting point prepared without legal advice.
  Have a lawyer review it before relying on it for signed deals.</p>
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

  const overviewHtml = shell({
    tag: "Owner playbook · private",
    title: "Listing deals · your playbook.",
    subtitle:
      "Four operators asked about paid listings. What to sell, what to charge, what to say, and the lines we never cross.",
    body: overviewBody,
    wordmark,
  });

  const rateCardHtml = shell({
    tag: "Rate card",
    title: "Featured partner placements.",
    subtitle:
      "Founding partner rates for the 2026 Australian and 2026-27 Japanese seasons.",
    body: rateCardBody,
    wordmark,
  });

  const agreementHtml = shell({
    tag: "Agreement template",
    title: "Featured partner agreement.",
    subtitle: "One page · flat seasonal fee · plain language.",
    body: agreementBody,
    wordmark,
    bodyClass: "agreement",
  });

  const overviewPath = path.join(OUT, "feelzlike-listing-deals-overview.pdf");
  const rateCardPath = path.join(OUT, "feelzlike-rate-card.pdf");
  const agreementPath = path.join(OUT, "feelzlike-listing-agreement-template.pdf");

  await renderPdf(overviewHtml, overviewPath);
  await renderPdf(rateCardHtml, rateCardPath);
  await renderPdf(agreementHtml, agreementPath);

  console.log("wrote:", overviewPath);
  console.log("wrote:", rateCardPath);
  console.log("wrote:", agreementPath);
}

await main();
