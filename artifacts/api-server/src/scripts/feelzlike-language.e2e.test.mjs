import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import puppeteer from "puppeteer";

const BASE_URL = (process.env.FEELZLIKE_E2E_BASE_URL ?? "http://127.0.0.1:5173").replace(
  /\/$/,
  "",
);
const LANGUAGE_STORAGE_KEY = "feelzlike:lang";

async function waitForPressedLanguage(page, label) {
  await page.waitForFunction(
    (expected) =>
      [...document.querySelectorAll("button")].some(
        (button) =>
          button.textContent?.trim() === expected &&
          button.getAttribute("aria-pressed") === "true",
      ),
    {},
    label,
  );
}

async function storedLanguage(page) {
  return page.evaluate((key) => localStorage.getItem(key), LANGUAGE_STORAGE_KEY);
}

async function clickButtonWithText(page, label) {
  const clicked = await page.evaluate((expected) => {
    const button = [...document.querySelectorAll("button")].find(
      (candidate) => candidate.textContent?.trim() === expected,
    );
    button?.click();
    return Boolean(button);
  }, label);
  assert.ok(clicked, `Found the ${label} language button`);
}

test("Japanese preference survives region, about-page, and reload provider remounts", async (t) => {
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ??
    execFileSync("which", ["chromium"], { encoding: "utf8" }).trim();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  t.after(() => browser.close());

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/yamanouchi/`, { waitUntil: "networkidle0" });
  await page.evaluate((key) => localStorage.removeItem(key), LANGUAGE_STORAGE_KEY);
  await page.reload({ waitUntil: "networkidle0" });

  await page.waitForSelector("button");
  await clickButtonWithText(page, "日本語");
  await waitForPressedLanguage(page, "日本語");
  assert.equal(await storedLanguage(page), "ja");

  await page.goto(`${BASE_URL}/hakuba-valley/`, { waitUntil: "networkidle0" });
  await waitForPressedLanguage(page, "日本語");
  assert.equal(await storedLanguage(page), "ja");

  await page.goto(`${BASE_URL}/about`, { waitUntil: "networkidle0" });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="button-about-lang-ja"]')?.className.includes("bg-white"),
  );
  assert.match(await page.locator("body").map((body) => body.innerText).wait(), /使い方/);
  assert.equal(await storedLanguage(page), "ja");

  await page.reload({ waitUntil: "networkidle0" });
  assert.match(await page.locator("body").map((body) => body.innerText).wait(), /使い方/);
  assert.equal(await storedLanguage(page), "ja");

  await page.goto(`${BASE_URL}/snowy-mountains/`, { waitUntil: "networkidle0" });
  assert.equal(
    await page.evaluate(
      () =>
        [...document.querySelectorAll("button")].some(
          (button) => button.textContent?.trim() === "日本語",
        ),
    ),
    false,
    "English-only regions do not expose or apply the Japanese locale",
  );
  assert.match(await page.locator("body").map((body) => body.innerText).wait(), /Snowy Mountains/i);
  assert.equal(
    await storedLanguage(page),
    "ja",
    "Visiting an English-only region must not erase the app-wide preference",
  );
});