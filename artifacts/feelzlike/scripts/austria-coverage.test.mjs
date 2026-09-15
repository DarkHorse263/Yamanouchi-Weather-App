import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REGIONS, regionMountains } from "./seo-regions.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("Austria pilot has only Lech, Zürs and one combined mountain in SEO routes", () => {
  const region = REGIONS.find((candidate) => candidate.slug === "lech-zuers");
  assert.ok(region, "Lech Zürs missing from SEO registry");
  assert.equal(region.country, "AT");
  assert.deepEqual(region.towns.map((town) => town.id), ["lech", "zuers"]);
  assert.deepEqual(regionMountains(region).map((mountain) => mountain.id), ["lech-zuers-resort"]);
});

test("Austria declares the same base, midpoint and upper elevations for every forecast consumer", () => {
  const region = read("src/regions/lech-zuers.ts");
  assert.match(region, /elevationM: 2450,/);
  assert.match(region, /baseElevationM: 1450,/);
  assert.match(region, /upperM: 2450,\s+midM: 1950,\s+lowerM: 1450,/s);
  assert.match(region, /sourceLabel: "official base and upper elevations · representative midpoint"/);
});

test("Austria weather locations are Europe/Vienna and do not inherit Australia", () => {
  const weather = read("../api-server/src/routes/weather.ts");
  for (const id of ["lech-zuers-resort", "lech", "zuers"]) {
    assert.match(
      weather,
      new RegExp(`id: "${id}"[^\\n]+timezone: "Europe/Vienna", region: "AT"`),
      `${id} needs an explicit Austria weather configuration`,
    );
  }
  assert.match(weather, /location\.region === "AT".+?\? "OTHER"/s);
});

test("Austria's seven-day API horizon cannot unlock the 14-day mountain panel", () => {
  const weather = read("../api-server/src/routes/weather.ts");
  const mountainDetail = read("src/pages/region/MountainDetail.tsx");
  assert.match(weather, /region === "AT" \|\| region === "JP" \? 7 : 14/);
  assert.match(mountainDetail, /REGION_COUNTRY\[region\.id\] !== "AT" && daily\.length > 7/);
  assert.match(mountainDetail, /\{supportsExtended14DayOutlook && \(/);
});

test("Austria sitemap and rewrites include every pilot route before catch-all", () => {
  const sitemap = read("public/sitemap.xml");
  const artifact = read(".replit-artifact/artifact.toml");
  const countrySnapshot = read("dist/public/at/index.html");
  const catchAll = artifact.lastIndexOf('from = "/*"');
  assert.match(countrySnapshot, /Austria · Lech Zürs resort town weather/);
  assert.match(countrySnapshot, /representative forecast midpoint/);
  for (const route of [
    "/at/",
    "/lech-zuers/",
    "/lech-zuers/mountain/lech-zuers-resort/",
    "/lech-zuers/lech/",
    "/lech-zuers/zuers/",
  ]) {
    assert.ok(sitemap.includes(`https://feelzlike.com${route}`), `${route} missing from sitemap`);
    const rewriteAt = artifact.indexOf(`from = "${route}"`);
    assert.ok(rewriteAt >= 0, `${route} rewrite missing`);
    assert.ok(rewriteAt < catchAll, `${route} rewrite must precede SPA catch-all`);
  }
});