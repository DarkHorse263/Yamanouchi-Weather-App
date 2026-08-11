/* Re-record the two Japanese mountain-page segments after translation merge. */
const puppeteer = require("puppeteer");
const fs = require("fs");

const CHROMIUM = "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";
const FPS = 12;
const BASE = "http://localhost:80";

const SEGS = [
  // name, regionId (for ja lang key), url, frames, scrollFrom, scrollTo
  ["jp-pageA",      "niseko",        `${BASE}/niseko/mountain/grand-hirafu`,    48, 0, 560],
  ["jp-happo-short","hakuba-valley", `${BASE}/hakuba-valley/mountain/happo-one`,48, 0, 560],
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM,
    headless: "new",
    env: { ...process.env, FONTCONFIG_FILE: "/tmp/fonts.conf" },
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars", "--force-device-scale-factor=2"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("feelzlike.consent.v1", JSON.stringify({ necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString() }));
    localStorage.setItem("feelzlike:installDismissedAt", JSON.stringify(Date.now()));
    for (const rid of ["niseko", "hakuba-valley", "iiyama"]) {
      localStorage.setItem(`feelzlike:${rid}:lang`, "ja");
    }
    // hide promo chips permanently (React re-renders undo one-shot hides)
    const hide = () => {
      for (const el of document.querySelectorAll("span,div,p,button")) {
        const t = (el.textContent || "").toLowerCase();
        if (el.children.length === 0 && /until 31 dec|31 december/.test(t)) el.style.visibility = "hidden";
      }
    };
    new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
  });
  const ease = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
  for (const [name, _rid, url, frames, y0, y1] of SEGS) {
    const dir = `/tmp/adrec3/${name}`;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    console.log("segment", name, url);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));
    for (let i = 0; i < frames; i++) {
      const t = i / (frames - 1);
      const y = Math.round(y0 + (y1 - y0) * ease(t));
      await page.evaluate(yy => window.scrollTo(0, yy), y);
      await new Promise(r => setTimeout(r, 1000 / FPS));
      await page.screenshot({ path: `${dir}/f${String(i).padStart(4, "0")}.png` });
    }
    console.log("done", name, frames, "frames");
  }
  await browser.close();
})();
