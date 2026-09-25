import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("Whitefish visitor-facing copy contains no research notes", () => {
  const whitefish = read("src/regions/whitefish.ts");
  const sources = read("src/pages/region/RegionSources.tsx");
  const seo = read("scripts/seo-regions.mjs");
  const blurb = whitefish.match(/blurb: "([^"\n]*(?:\\"[^"\n]*)*)",/)?.[1];
  const sourceDetail = sources.match(/label: "Whitefish Mountain Resort", detail: "([^"\n]*(?:\\"[^"\n]*)*)"/)?.[1];
  const seoWhitefish = seo.match(/name: "Whitefish Mountain Resort", blurb: "([^"\n]*(?:\\"[^"\n]*)*)"/)?.[1];
  for (const [label, copy] of [["region blurb", blurb], ["source detail", sourceDetail], ["SEO blurb", seoWhitefish]]) {
    assert.ok(copy, `Missing Whitefish ${label}`);
    assert.doesNotMatch(copy, /treat as unverified|per research|⚠️/i, `Internal note leaked in Whitefish ${label}`);
  }
});

test("pricing, account and unknown paths have explicit client UI", () => {
  const routes = read("src/App.tsx");
  const account = read("src/pages/Account.tsx");
  const notFound = read("src/pages/not-found.tsx");
  const region = read("src/layouts/RegionLayout.tsx");
  assert.match(routes, /path="\/pricing"[^>]*><Redirect to="\/premium" replace/);
  assert.match(routes, /path="\/pricing\/"[^>]*><Redirect to="\/premium" replace/);
  assert.match(account, /<PageMeta title="your account"[^>]*noIndex/);
  assert.match(account, /href="\/sign-in"[^>]*>[\s\S]*?sign in/);
  assert.match(notFound, /<PageMeta[^>]*noIndex/);
  assert.match(region, /if \(!region\) return <NotFound \/>/);
});

test("Austria has a human-readable powder-alert country label", () => {
  const picker = read("src/components/RegionCountryPicker.tsx");
  assert.match(picker, /AT: \{ en: "austria", ja: "オーストリア" \}/);
});