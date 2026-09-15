import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REGIONS, regionMountains } from "./seo-regions.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("Austria authored regions include Lech Zürs and St Anton with scoped mountains", () => {
  const region = REGIONS.find((candidate) => candidate.slug === "lech-zuers");
  assert.ok(region, "Lech Zürs missing from SEO registry");
  assert.equal(region.country, "AT");
  assert.deepEqual(region.towns.map((town) => town.id), ["lech", "zuers"]);
  assert.deepEqual(regionMountains(region).map((mountain) => mountain.id), ["lech-zuers-resort"]);
  const stAnton = REGIONS.find((candidate) => candidate.slug === "st-anton");
  assert.ok(stAnton, "St Anton missing from SEO registry");
  assert.equal(stAnton.country, "AT");
  assert.deepEqual(stAnton.towns.map((town) => town.id), ["st-anton"]);
  assert.deepEqual(regionMountains(stAnton).map((mountain) => mountain.id), ["st-anton-resort"]);
});

test("Austria declares the same base, midpoint and upper elevations for every forecast consumer", () => {
  const region = read("src/regions/lech-zuers.ts");
  assert.match(region, /elevationM: 2450,/);
  assert.match(region, /baseElevationM: 1450,/);
  assert.match(region, /upperM: 2450,\s+midM: 1950,\s+lowerM: 1450,/s);
  assert.match(region, /sourceLabel: "official base and upper elevations · representative midpoint"/);
  const stAnton = read("src/regions/st-anton.ts");
  assert.match(stAnton, /elevationM: 2811,/);
  assert.match(stAnton, /baseElevationM: 1304,/);
  assert.match(stAnton, /upperM: 2811,\s+midM: 2058,\s+lowerM: 1304,/s);
  assert.match(stAnton, /sourceLabel: "official St Anton base and Valluga elevations · representative midpoint"/);
  const weather = read("../api-server/src/routes/weather.ts");
  assert.match(weather, /id: "st-anton-resort"[^\n]+elevation: 2058[^\n]+timezone: "Europe\/Vienna", region: "AT"/);
  assert.match(weather, /id: "st-anton"[^\n]+elevation: 1304[^\n]+timezone: "Europe\/Vienna", region: "AT"/);
});

test("Austria weather locations are Europe/Vienna and do not inherit Australia", () => {
  const weather = read("../api-server/src/routes/weather.ts");
  for (const id of ["lech-zuers-resort", "lech", "zuers", "st-anton-resort", "st-anton"]) {
    assert.match(
      weather,
      new RegExp(`id: "${id}"[^\\n]+timezone: "Europe/Vienna", region: "AT"`),
      `${id} needs an explicit Austria weather configuration`,
    );
  }
  assert.match(weather, /location\.region === "AT".+?\? "OTHER"/s);
});

test("St Anton live resort data remains official-link only", () => {
  const region = read("src/regions/st-anton.ts");
  const transport = read("src/data/transport/st-anton.ts");
  assert.match(region, /liftStatusUrl: "https:\/\/www\.skiarlberg\.at\//);
  assert.match(region, /snowReportUrl: "https:\/\/www\.skiarlberg\.at\//);
  assert.match(region, /dataAvailable: false,/);
  assert.match(region, /https:\/\/lawine\.tirol\.gv\.at\//);
  assert.match(transport, /Official St Anton arrival links/);
  assert.match(transport, /regions: \["st-anton"\]/);
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
  const mountainSnapshot = read("dist/public/st-anton/mountains/index.html");
  const roadsSnapshot = read("dist/public/st-anton/st-anton/roads/index.html");
  const catchAll = artifact.lastIndexOf('from = "/*"');
  assert.match(countrySnapshot, /<title>Austria · resort town weather · feelzlike<\/title>/);
  assert.match(
    countrySnapshot,
    /<meta name="description" content="Weather and conditions for Lech Zürs and St Anton am Arlberg in Austria\./,
  );
  assert.match(countrySnapshot, /<meta property="og:title" content="Austria · resort town weather · feelzlike"/);
  assert.doesNotMatch(countrySnapshot, /<title>Austria · Lech Zürs resort town weather/);
  assert.match(countrySnapshot, /Austria · resort town weather/);
  assert.match(countrySnapshot, /representative forecast midpoint/);
  assert.match(mountainSnapshot, /<title>St Anton am Arlberg · mountains · feelzlike<\/title>/);
  assert.match(mountainSnapshot, /Current mountain weather and official resort links/);
  assert.doesNotMatch(mountainSnapshot, /Live snow conditions, lift status/);
  assert.match(roadsSnapshot, /<title>St Anton am Arlberg · arrival &amp; road guidance/);
  assert.match(roadsSnapshot, /Official arrival and road guidance/);
  assert.doesNotMatch(roadsSnapshot, /Live road conditions and traffic cameras/);
  for (const route of [
    "/at/",
    "/lech-zuers/",
    "/lech-zuers/mountain/lech-zuers-resort/",
    "/lech-zuers/lech/",
    "/lech-zuers/zuers/",
    "/st-anton/",
    "/st-anton/mountains/",
    "/st-anton/alerts/",
    "/st-anton/st-anton/",
    "/st-anton/mountain/st-anton-resort/",
  ]) {
    assert.ok(sitemap.includes(`https://feelzlike.com${route}`), `${route} missing from sitemap`);
    const rewriteAt = artifact.indexOf(`from = "${route}"`);
    assert.ok(rewriteAt >= 0, `${route} rewrite missing`);
    assert.ok(rewriteAt < catchAll, `${route} rewrite must precede SPA catch-all`);
  }
});