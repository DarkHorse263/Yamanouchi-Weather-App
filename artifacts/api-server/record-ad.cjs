/* Screen-record feelzlike.com pages as frame sequences for the anthem ad. */
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const CHROMIUM = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
const FPS = 12;

const SEGS = [
  // name, url, seconds, scrollFrom, scrollTo (scrollTo "ALERT" = find alert form)
  ["home",   "https://feelzlike.com/",                                        9,  0,    1500],
  ["mtn",    "https://feelzlike.com/queenstown/mountain/coronet-peak",        11, 0,    1900],
  ["hakuba", "https://feelzlike.com/hakuba-valley",                            4,  0,    500],
  ["breck",  "https://feelzlike.com/summit-county/mountain/breckenridge-resort",4, 0,    400],
  ["qtown",  "https://feelzlike.com/queenstown",                               4,  0,    500],
  ["alerts", "https://feelzlike.com/queenstown/mountain/coronet-peak",         6,  "ALERT", "ALERT"],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("feelzlike.consent.v1", JSON.stringify({ necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString() }));
    localStorage.setItem("feelzlike:installDismissedAt", JSON.stringify(Date.now()));
  });
  const ease = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
  for (const [name, url, secs, y0raw, y1raw] of SEGS) {
    const dir = `/tmp/adrec/${name}`;
    fs.mkdirSync(dir, { recursive: true });
    console.log("segment", name, url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(r => setTimeout(r, 3500)); // let live data render
    let y0 = y0raw, y1 = y1raw;
    if (y0raw === "ALERT") {
      const y = await page.evaluate(() => {
        // hide promo wording the ad must not carry
        for (const el of document.querySelectorAll("span,div,p")) {
          const t = (el.textContent || "").toLowerCase();
          if (el.children.length === 0 && /until 31 dec|31 december/.test(t)) el.style.visibility = "hidden";
        }
        const h = [...document.querySelectorAll("h3")].find(el => /powder alerts/i.test(el.textContent || ""));
        if (!h) return null;
        return Math.max(0, h.getBoundingClientRect().top + window.scrollY - 120);
      });
      if (y == null) { console.log("alert form not found, skipping"); continue; }
      y0 = Math.max(0, y - 350); y1 = y;
      console.log("alert form at", y);
    }
    const n = Math.round(secs * FPS);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const y = Math.round(y0 + (y1 - y0) * ease(t));
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await new Promise(r => setTimeout(r, 25));
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, "0")}.png`) });
    }
    console.log("done", name, n, "frames");
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
