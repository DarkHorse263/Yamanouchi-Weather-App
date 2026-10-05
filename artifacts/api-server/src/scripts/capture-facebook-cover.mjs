import puppeteer from "puppeteer";
import { execFileSync } from "node:child_process";
import { mkdir } from "node:fs/promises";

const out = new URL("../../../../exports/facebook-cover/", import.meta.url);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: execFileSync("which", ["chromium"], { encoding: "utf8" }).trim(),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  for (const [name, width, height] of [["desktop", 1440, 806], ["mobile", 390, 755]]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: name === "mobile", hasTouch: name === "mobile" });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("feelzlike:installDismissedAt", JSON.stringify(Date.now()));
      localStorage.setItem("feelzlike.consent.v1", JSON.stringify({
        necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString(),
      }));
    });
    await page.goto("http://127.0.0.1:80/", { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForNetworkIdle({ idleTime: 1500, timeout: 45000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: new URL(`${name}.png`, out).pathname });
    console.log(`${name} homepage captured`);
    await page.close();
  }
} finally {
  await browser.close();
}