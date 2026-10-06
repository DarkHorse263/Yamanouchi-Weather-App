import puppeteer from "puppeteer";
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";

const out = new URL("../../../../exports/", import.meta.url).pathname;
await mkdir(out, { recursive: true });
const pages = [
  `<div class="kicker">feelzlike · campaign setup guide</div>
   <h1>Japan ski campaigns<br>Meta setup checklist</h1>
   <p class="intro">Promote Japan trip planning to audiences in Australia, the USA, Canada and Japan.</p>
   <div class="warning"><strong>Prepare now. Do not launch yet.</strong><p>Keep campaigns in draft until commercial weather-data permissions, required endpoint changes and attribution are confirmed. Meta approving an ad does not clear weather-data rights.</p></div>
   <h2>Why the launch is on hold</h2>
   <p>The code review found calls to Open-Meteo’s public forecast endpoint. Its free API terms restrict use to non-commercial purposes and explicitly classify commercial products or promotional activities as commercial use.</p>
   <p>A free app or a Japan-only campaign does not remove this restriction. A subscription may require switching to the licensed endpoint. Other providers and fallback sources also need checking.</p>
   <h2>What this guide sets up</h2>
   <ul><li>One Traffic campaign with four country ad sets.</li><li>Two ads per country, with language appropriate to the audience.</li><li>Homepage landing links and campaign tracking tags.</li><li>A controlled seven-day test, only after clearance.</li></ul>
   <h2>Have these ready</h2>
   <ul class="checks"><li>Access to the feelzlike Facebook Page and ad account.</li><li>Instagram identity connected, if you want to use it.</li><li>Permission to use every image, screenshot and logo in the ads.</li><li>A budget you are comfortable spending.</li></ul>
   <p class="note">Prepared 6 October 2026. Meta labels can vary by account. This is practical setup guidance, not legal clearance or confirmation that all provider rights have been checked.</p>`,
  `<div class="kicker">01 · account and measurement</div><h1>Get the foundations ready</h1>
   <h2>1. Open Ads Manager</h2>
   <p>Go to <a href="https://adsmanager.facebook.com/">adsmanager.facebook.com</a>. Use Ads Manager, not “Boost post”, so you can control country budgets and reporting.</p>
   <ol><li>Select the correct feelzlike ad account.</li><li>Confirm the Facebook Page and Instagram identity.</li><li>Check the payment method, currency and time zone.</li><li>Do not change account settings simply to match an example in this guide.</li></ol>
   <h2>2. Check the existing Pixel</h2>
   <p>Open <strong>Events Manager</strong> and select the existing feelzlike Pixel/dataset. The app already contains consent-gated Meta tracking. Do not install a second Pixel.</p>
   <ol><li>Open <strong>Test events</strong>.</li><li>Visit feelzlike in a fresh browser session without an ad blocker.</li><li>Accept advertising cookies.</li><li>Confirm a <strong>PageView</strong> arrives.</li></ol>
   <div class="box"><strong>No event before advertising consent is expected.</strong><p>Do not bypass consent to improve measurement. This is a pre-launch check, not a claim that live tracking was verified for this guide.</p></div>
   <h2>Keep the initial audience setup simple</h2>
   <p>Do not add uploaded customer lists or website retargeting audiences for this test. Those require a separate privacy and consent review.</p>
   <ul class="checks"><li>Correct account, Page and Instagram identity selected.</li><li>Currency and time zone checked.</li><li>Consented PageView verified before launch.</li></ul>`,
  `<div class="kicker">02 · campaign and audiences</div><h1>Create the campaign draft</h1>
   <h2>3. Campaign settings</h2>
   <p>Select <strong>Create → Traffic</strong>.</p>
   <table><tr><th>Setting</th><th>Value</th></tr><tr><td>Name</td><td>japan winter · traffic · launch test</td></tr><tr><td>Buying type</td><td>Auction, if shown</td></tr><tr><td>Objective</td><td>Traffic</td></tr><tr><td>Budget allocation</td><td>Ad-set budgets, not a shared campaign budget</td></tr><tr><td>Special ad category</td><td>None for ordinary travel/weather promotion</td></tr></table>
   <p>Use Traffic because a Meta signup conversion event has not been verified. Do not optimise for purchases or registrations yet.</p>
   <h2>4. Create four ad sets</h2>
   <table><tr><th>Ad-set name</th><th>Location</th><th>Creative</th></tr><tr><td>australia · japan trips</td><td>Australia</td><td>English</td></tr><tr><td>usa · japan trips</td><td>United States</td><td>English</td></tr><tr><td>canada · japan trips</td><td>Canada</td><td>English</td></tr><tr><td>japan · domestic ski trips</td><td>Japan</td><td>Japanese*</td></tr></table>
   <ol><li>Set the destination/conversion location to <strong>Website</strong>.</li><li>Choose <strong>Maximise landing page views</strong>, if available.</li><li>Set each country under location controls. Location is where the audience is, not where they want to ski.</li><li>Start with adults 18+, all genders.</li><li>If audience suggestions are available, use skiing or snowboarding interests that Meta actually offers.</li></ol>
   <p class="note">Keep the country as a firm location control. Advantage+ may expand interest suggestions. *For Japan, use Japanese creative only with a suitable Japanese-language landing experience. Otherwise explicitly target an English-speaking visitor audience and rename that ad set accordingly.</p>`,
  `<div class="kicker">03 · budget and creative</div><h1>Control spend and build ads</h1>
   <h2>5. Choose your test budget</h2>
   <div class="box"><strong>Example only: AUD 280 total media budget</strong><p>AUD 70 lifetime per country × four countries, over seven days. Applicable taxes and fees may be additional.</p></div>
   <p>Use your account’s actual currency. Do not enter “70” assuming Australian dollars if the account uses another currency. If this total is too high, test fewer countries first.</p>
   <p>Use a lifetime budget and an end date to control the test. Keep everything in <strong>draft</strong> until clearance. A future start date is not a substitute for leaving it unpublished.</p>
   <h2>6. Placements and formats</h2>
   <ul><li>Start with <strong>Advantage+ placements</strong> and inspect every preview.</li><li>Use <strong>4:5 portrait</strong> images for feeds.</li><li>Use <strong>9:16 vertical</strong> images or video for Stories and Reels.</li><li>The Facebook cover is a Page-header asset, not your only ad creative. Its wide layout is difficult to read in mobile ad placements.</li></ul>
   <h2>7. Two English-language ad options</h2>
   <div class="copy"><strong>Ad 1 · trip planning</strong><p>planning a japan ski trip? explore mountain forecasts and resort-town information with feelzlike.</p><p><b>Headline:</b> japan ski trip planning<br><b>Button:</b> Learn more</p></div>
   <div class="copy"><strong>Ad 2 · mountain comparison</strong><p>staying in a japanese ski town? compare nearby mountain forecasts before choosing where to head.</p><p><b>Headline:</b> which mountain today?<br><b>Button:</b> Learn more</p></div>
   <p class="note">Use only after licensing clearance. Prepare separate, reviewed Japanese copy for a domestic Japan audience. Avoid “all Japan resorts”, “guaranteed powder”, “official forecasts” or “live road conditions” unless independently supported.</p>`,
  `<div class="kicker">04 · links and launch gate</div><h1>Check the destination</h1>
   <h2>8. Website URL</h2>
   <p>Use the homepage, consistent with the existing campaign approach:</p>
   <div class="code">https://feelzlike.com/</div>
   <p>In Meta’s <strong>URL parameters</strong> field, paste the following as one line, without a leading question mark:</p>
   <div class="code small">utm_source={{site_source_name}}&amp;utm_medium=paid_social&amp;utm_campaign=japan_winter_launch&amp;utm_content={{ad.id}}&amp;utm_term={{adset.id}}</div>
   <p>Preview the destination on a phone. Make sure visitors can easily find Japan from the multi-country homepage and that the ad’s promise matches the experience.</p>
   <h2>9. Save as draft</h2>
   <div class="warning"><strong>Do not click Publish until every launch check is complete.</strong></div>
   <ul class="checks"><li>Commercial rights confirmed for every weather provider used by the advertised experience, including fallbacks.</li><li>Required licensed endpoints, attribution and other terms implemented.</li><li>Ad screenshots and other creative cleared for advertising use.</li><li>Mobile homepage and Japan navigation checked.</li><li>Consented Pixel PageView verified.</li><li>Language of the ad matches a usable landing experience.</li><li>All country locations, budgets, currencies and end dates checked.</li><li>All placement previews checked for cropping and readable text.</li><li>Owner is satisfied with the final spending limit and ready to launch.</li></ul>
   <h2>Launch notes</h2><p>Clearance confirmed by: ______________________________</p><p>Approved total media budget: _________________________</p><p>Start date: _________________ End date: _________________</p>`,
  `<div class="kicker">05 · launch and review</div><h1>Measure the test</h1>
   <h2>10. Publish only after clearance</h2>
   <ol><li>Review the final campaign, each ad set and every ad.</li><li>Check the start date has not passed while the campaign was in draft.</li><li>When ready, publish in Ads Manager and monitor review/delivery status.</li><li>After delivery begins, check spending and links promptly for obvious mistakes.</li></ol>
   <h2>Add these reporting columns</h2>
   <table><tr><th>Metric</th><th>What to use it for</th></tr><tr><td>Amount spent</td><td>Confirm spending stays within your planned test.</td></tr><tr><td>Landing page views</td><td>Measure recorded page loads, not just clicks.</td></tr><tr><td>Cost per landing page view</td><td>Compare traffic cost between countries.</td></tr><tr><td>Outbound click-through rate</td><td>Compare how well creative encourages site visits.</td></tr><tr><td>Reach and frequency</td><td>Watch audience size and repeat exposure.</td></tr></table>
   <p>Compare countries separately. Do not choose a winner solely on cheap clicks. A landing-page visit is not a signup, and consent choices can limit reported website activity.</p>
   <h2>After the seven-day test</h2>
   <ul class="checks"><li>Record spend and landing-page results for each country.</li><li>Check whether visitors actually explore Japan content using available consented analytics.</li><li>Review the two creative options separately.</li><li>Decide whether to pause, revise or run another explicitly budgeted test.</li></ul>
   <h2>References</h2>
   <p><a href="https://open-meteo.com/en/terms">Open-Meteo · Terms of Use</a><br><a href="https://www.facebook.com/business/help/1658289035439772">Meta · Create a campaign in Ads Manager</a><br><a href="https://www.facebook.com/business/m/small-business/am-advertiser-success-center/ad-creation/objective">Meta · Campaign objectives</a></p>
   <p class="note">Weather permissions remain a launch dependency. This guide does not certify provider clearance, account-specific Meta settings, conversion tracking, or legal compliance.</p>`
];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#172334;font-size:11pt;line-height:1.48}
.page{height:297mm;padding:17mm 18mm 19mm;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}
.kicker{color:#0055ff;text-transform:uppercase;font-size:9pt;font-weight:bold;letter-spacing:1.2px;border-bottom:3px solid #0055ff;padding-bottom:10px}
h1{font-size:27pt;line-height:1.12;margin:20px 0;color:#073078}h2{font-size:14pt;margin:20px 0 8px}p{margin:8px 0}li{margin:6px 0}
ul,ol{padding-left:22px}.intro{font-size:14pt}.warning{border-left:5px solid #ec008c;background:#f5f6f8;padding:13px 16px;margin:17px 0}.warning strong{color:#990052}
.box,.copy{background:#f3f6fb;border:1px solid #c6d4e8;padding:12px 15px;margin:12px 0}
.note{font-size:9pt;color:#44546a}.checks{list-style:none;padding:0}.checks li{padding-left:23px;position:relative}.checks li:before{content:"";position:absolute;left:0;top:5px;width:11px;height:11px;border:1px solid #465e79}
table{border-collapse:collapse;width:100%;font-size:10pt}td,th{text-align:left;padding:8px;border-bottom:1px solid #ccd7e5}th{background:#0055ff;color:white}
.code{font-family:monospace;background:#edf2fa;padding:13px;overflow-wrap:anywhere}.small{font-size:10pt}a{color:#004bc4}.footer{position:absolute;bottom:10mm;left:18mm;right:18mm;border-top:1px solid #ccd7e5;padding-top:6px;display:flex;justify-content:space-between;font-size:8pt;color:#52647c}
</style></head><body>${pages.map((p,i)=>`<section class="page">${p}<footer class="footer"><span>feelzlike · Meta campaign guide · keep in draft until cleared</span><span>${i+1} / ${pages.length}</span></footer></section>`).join("")}</body></html>`;
const browser = await puppeteer.launch({executablePath:execFileSync("which",["chromium"],{encoding:"utf8"}).trim(),args:["--no-sandbox","--disable-dev-shm-usage"]});
try {
  const page = await browser.newPage();
  await page.setContent(html,{waitUntil:"load"});
  const overflow = await page.$$eval(".page", els => els.map((el,i)=>({page:i+1,overflow:el.scrollHeight>el.clientHeight})));
  if(overflow.some(x=>x.overflow)) throw new Error(JSON.stringify(overflow));
  await page.pdf({path:`${out}feelzlike-japan-meta-setup-guide.pdf`,format:"A4",printBackground:true,preferCSSPageSize:true});
  await page.setViewport({width:794,height:1123,deviceScaleFactor:1});
  await page.screenshot({path:`${out}feelzlike-japan-meta-guide-preview.png`});
  console.log("Created six-page PDF; no page-container overflow.");
} finally { await browser.close(); }
