const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const CHROMIUM = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
const FPS = 12;
const BASE = "http://localhost:80";

const SEGS = [
  // JP
  ["jp-alerts",  "ja", `${BASE}/alerts`, 6, "ALERT", "ALERT"],

  // JP-EN
  ["jpen-home",  "en", `${BASE}/`, 9, 0, 1500],
  ["jpen-mtn",   "en", `${BASE}/iiyama/mountain/madarao-kogen`, 11, 0, 1900],
  ["jpen-niseko","en", `${BASE}/niseko/mountain/grand-hirafu`, 4, 0, 560],
  ["jpen-happo", "en", `${BASE}/hakuba-valley/mountain/happo-one`, 4, 0, 560],
  ["jpen-town",  "en", `${BASE}/iiyama`, 4, 0, 500],
  ["jpen-alerts","en", `${BASE}/alerts`, 6, "ALERT", "ALERT"],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: "new",
    env: { ...process.env, FONTCONFIG_FILE: "/tmp/fonts.conf" },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  
  const ease = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;

  for (const [name, lang, url, secs, y0raw, y1raw] of SEGS) {
    const dir = `/tmp/adrec_faithful/${name}`;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    console.log("segment", name, url);

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    
    await page.evaluateOnNewDocument((l) => {
      localStorage.setItem("feelzlike.consent.v1", JSON.stringify({ necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString() }));
      localStorage.setItem("feelzlike:installDismissedAt", JSON.stringify(Date.now()));
      for (const rid of ["niseko", "hakuba-valley", "iiyama"]) {
        localStorage.setItem(`feelzlike:${rid}:lang`, l);
      }
      const hide = () => {
        for (const el of document.querySelectorAll("span,div,p,button")) {
          const t = (el.textContent || "").toLowerCase();
          if (el.children.length === 0 && /until 31 dec|31 december/.test(t)) el.style.visibility = "hidden";
        }
      };
      new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
    }, lang);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    // For home map, wait for leaflet
    if (name.includes("home")) {
      await page.evaluate(() => {
        const el = document.querySelector('.leaflet-container');
        if (el) el.scrollIntoView();
      });
      console.log("Waiting for map tiles...");
      await new Promise(r => setTimeout(r, 6000));
      await page.evaluate(() => window.scrollTo(0, 0));
    } else {
      await new Promise(r => setTimeout(r, 3500));
    }

    let y0 = y0raw, y1 = y1raw;
    if (y0raw === "ALERT") {
      const y = await page.evaluate(() => {
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
      await new Promise(r => setTimeout(r, 1000/FPS));
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, "0")}.png`) });
    }
    console.log("done", name, n, "frames");
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });