import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { REGIONS, regionMountains } from "./seo-regions.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("verified Australian authored regions and mountain routes stay in SEO parity", () => {
  const expected = {
    "victorias-high-country": "mt-baw-baw",
    tasmania: "mount-mawson",
    "australian-capital-territory": "corin-forest",
  };
  for (const [slug, mountainId] of Object.entries(expected)) {
    const region = REGIONS.find((candidate) => candidate.slug === slug);
    assert.ok(region, `${slug} missing from SEO registry`);
    assert.ok(
      regionMountains(region).some((mountain) => mountain.id === mountainId),
      `${slug}/mountain/${mountainId} missing from generated routes`,
    );
  }
});

test("verified Australian weather ids are elevation-backed, not town placeholders", () => {
  const weather = read("../api-server/src/routes/weather.ts");
  for (const [id, elevation] of [
    ["mt-baw-baw", 1567],
    ["corin-forest", 1200],
    ["mount-mawson", 1250],
  ]) {
    assert.match(
      weather,
      new RegExp(`id: "${id}"[^\\n]+elevation: ${elevation}`),
      `${id} weather location/elevation missing`,
    );
  }
});

test("generated sitemap publishes all three verified mountain pages", () => {
  const sitemap = read("public/sitemap.xml");
  for (const route of [
    "/victorias-high-country/mountain/mt-baw-baw/",
    "/tasmania/mountain/mount-mawson/",
    "/australian-capital-territory/mountain/corin-forest/",
  ]) {
    assert.ok(sitemap.includes(route), `${route} missing from sitemap`);
  }
});

test("closed Mount Buffalo stays out of published routes and weather", () => {
  const publishedSources = [
    "src/regions/victorias-high-country.ts",
    "scripts/seo-regions.mjs",
    "../api-server/src/routes/weather.ts",
  ].map((path) => readFileSync(join(root, path), "utf8"));
  for (const source of publishedSources) {
    assert.doesNotMatch(source, /id:\s*["']mount-buffalo["']/);
  }
  const sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
  assert.doesNotMatch(sitemap, /\/mountain\/mount-buffalo\//);
});

test("every new mountain rewrite precedes the SPA catch-all", () => {
  const artifact = readFileSync(
    join(root, ".replit-artifact/artifact.toml"),
    "utf8",
  );
  const catchAll = artifact.lastIndexOf('from = "/*"');
  assert.ok(catchAll > 0, "SPA catch-all is present");
  for (const route of [
    "/victorias-high-country/mountain/mt-baw-baw/",
    "/tasmania/mountain/mount-mawson/",
    "/australian-capital-territory/mountain/corin-forest/",
  ]) {
    const routeIndex = artifact.indexOf(`from = "${route}"`);
    assert.ok(routeIndex >= 0, `${route} rewrite is present`);
    assert.ok(routeIndex < catchAll, `${route} rewrite precedes catch-all`);
  }
});

test("authored Australian mountain pages label their alert as regional", () => {
  const mountainDetail = readFileSync(
    join(root, "src/pages/region/MountainDetail.tsx"),
    "utf8",
  );
  assert.match(
    mountainDetail,
    /powder hits the forecast for the \$\{region\.name\} region/,
  );
  assert.match(
    mountainDetail,
    /defaultMountain=\{mountainAlertsAvailable \? locationId : undefined\}/,
  );
  assert.match(mountainDetail, /key=\{`\$\{region\.id\}\/\$\{locationId\}`\}/);
});