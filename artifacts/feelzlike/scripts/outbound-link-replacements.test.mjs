import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const files = [
  "src/data/transport/stowe-smugglers-notch.ts",
  "src/data/transport/st-anton.ts",
  "src/data/transport/daisen.ts",
  "src/regions/st-anton.ts",
  "src/regions/daisen.ts",
  "../api-server/src/routes/roads.ts",
];
const manifest = JSON.parse(read("../api-server/src/data/external-links.json"));

test("five retired outbound links are absent from live sources and generated manifest", () => {
  const retired = [
    "https://ridegmt.com/route-108-mountain-road-shuttle/",
    "https://www.skiarlberg.at/en/st-anton/getting-here",
    "https://www.skiarlberg.at/en/st-anton/live-info/snow-report",
    "https://www.stantonamarlberg.com/en/arrival",
    "https://www.nihonkotsu.co.jp/",
  ];
  // Match quoted URL literals, not shared prefixes of valid replacement paths.
  const source = files.map(read).join("\n");
  for (const url of retired) {
    assert.ok(!source.includes(`"${url}"`), `${url} remains in a live source`);
    assert.ok(!manifest.links.some((link) => link.url === url), `${url} remains in the manifest`);
  }
});

test("replacement pages keep the correct operators and their public surfaces in sync", () => {
  const stowe = read(files[0]);
  const antonTransport = read(files[1]);
  const daisenTransport = read(files[2]);
  const antonRegion = read(files[3]);
  const daisenRegion = read(files[4]);
  const roads = read(files[5]);
  const winterShuttle = "https://gostowe.com/plan-your-visit/winter-shuttle";
  const antonArrival = "https://www.stantonamarlberg.com/en/the-region-st-anton-am-arlberg/travel";
  const antonSkiArrival = "https://www.skiarlberg.at/en/st-anton/getting-here-parking";
  const antonWeather = "https://www.stantonamarlberg.com/en/weather-report";
  const yonago = "https://nihonkotsu.jp/bus_local/yonago/index.html";
  assert.match(stowe, /operator: "Rural Community Transportation \(RCT\)"/);
  assert.doesNotMatch(stowe, /Green Mountain Transit/);
  assert.equal(stowe.split(winterShuttle).length - 1, 2);
  assert.ok(antonTransport.includes(antonArrival) && antonTransport.includes(antonSkiArrival));
  assert.ok(antonRegion.includes(antonArrival) && roads.includes(antonArrival));
  assert.equal(antonRegion.split(antonWeather).length - 1, 2);
  assert.match(daisenTransport, /operator: "Nihon Kotsu \(日本交通\)"/);
  assert.ok(daisenTransport.includes(yonago) && daisenRegion.includes(yonago));
  for (const url of [winterShuttle, antonArrival, antonSkiArrival, antonWeather, yonago]) {
    assert.ok(manifest.links.some((link) => link.url === url), `${url} missing from manifest`);
  }
});