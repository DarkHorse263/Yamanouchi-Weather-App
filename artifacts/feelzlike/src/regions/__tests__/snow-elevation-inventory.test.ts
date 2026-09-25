import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { createServer } from "vite";
import { publishedCatalogueRecords as western } from "@workspace/western-us-ski-catalogue/public-runtime";
import { publishedCatalogueRecords as canada } from "@workspace/canada-ski-catalogue/public-runtime";
import { publishedCatalogueRecords as japan } from "@workspace/japan-ski-catalogue/public-runtime";
import { publishedRecords as general } from "@workspace/ski-catalogue/public-runtime";
import { snowForecastElevation } from "../../lib/elevation";

test("officially corrected Alaska hill elevations are projected into snow forecasts", () => {
  const hilltop = western.find((record) => record.publicId === "hilltop-ski-area-and-bike-park");
  const eyak = western.find((record) => record.publicId === "mt-eyak-ski-area");
  assert.ok(hilltop);
  assert.ok(eyak);
  assert.deepEqual([hilltop.baseElevationM, hilltop.topElevationM, hilltop.forecastElevationM], [150, 240, 150]);
  assert.deepEqual([eyak.baseElevationM, eyak.topElevationM, eyak.forecastElevationM], [122, 366, 122]);
  assert.equal(snowForecastElevation(hilltop.baseElevationM, hilltop.topElevationM), 195);
  assert.equal(snowForecastElevation(eyak.baseElevationM, eyak.topElevationM), 244);
});

test("every catalogue base/top forecast uses midpoint and never falls below a known base", () => {
  let checked = 0;
  for (const record of [...western, ...canada, ...japan]) {
    const { baseElevationM: base, topElevationM: summit, forecastElevationM: pin } = record;
    const forecast = snowForecastElevation(base, summit, pin);
    assert.ok(forecast != null && forecast >= base, record.publicId);
    if (summit > base) assert.ok(Math.abs(forecast - Math.round((base + summit) / 2)) <= 1, record.publicId);
    checked++;
  }
  for (const record of general) {
    const forecast = snowForecastElevation(record.baseElevationM, undefined, record.forecastElevationM);
    if (record.baseElevationM != null) assert.ok(forecast != null && forecast >= record.baseElevationM, record.publicId);
    else assert.equal(forecast, record.forecastElevationM, record.publicId);
    checked++;
  }
  assert.ok(checked > 200, "test the full published catalogue, not a handful of examples");
});

test("all authored ski bounds use midpoints and match server-derived heights when server height is a summit", () => {
  const regionDir = path.resolve(import.meta.dirname, "..");
  const weatherSource = readFileSync(path.resolve(regionDir, "../../../api-server/src/routes/weather.ts"), "utf8");
  const summitById = new Map([...weatherSource.matchAll(/\{\s*id:\s*"([^"]+)"[^\n]*?\belevation:\s*(\d+)/g)]
    .map((match) => [match[1], Number(match[2])]));
  let checked = 0;
  for (const filename of readdirSync(regionDir).filter((name) => name.endsWith(".ts"))) {
    const source = ts.createSourceFile(filename, readFileSync(path.join(regionDir, filename), "utf8"), ts.ScriptTarget.Latest, true);
    function inspect(node: ts.Node) {
      if (ts.isObjectLiteralExpression(node)) {
        const props = new Map(node.properties
          .filter(ts.isPropertyAssignment)
          .filter((p) => ts.isIdentifier(p.name))
          .map((p) => [(p.name as ts.Identifier).text, p.initializer]));
        const id = props.get("id");
        const base = props.get("skiBaseElevationM");
        const summit = props.get("summitElevationM");
        if (id && ts.isStringLiteral(id) && base && summit && ts.isNumericLiteral(base) && ts.isNumericLiteral(summit)) {
          const baseM = Number(base.text);
          const summitM = Number(summit.text);
          const forecast = snowForecastElevation(baseM, summitM);
          assert.ok(forecast != null && forecast >= baseM, `${filename}/${id.text}: below base`);
          const serverSummitM = summitById.get(id.text);
          // The server's legacy forecast query height may be a base/map pin,
          // not a summit (e.g. Sandia Peak at 2,630 m).
          if (serverSummitM != null && Math.abs(serverSummitM - summitM) <= 150) {
            const serverMid = snowForecastElevation(baseM, serverSummitM);
            assert.ok(serverMid != null && Math.abs(forecast - serverMid) <= 150,
              `${filename}/${id.text}: client midpoint differs from server-derived midpoint`);
            checked++;
          }
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  assert.ok(checked >= 40, `Expected all authored US base/summit pairs, got ${checked}`);
});

test("published registry passes strict village provenance and flagship snow requests use ski-area midpoints", async () => {
  const root = path.resolve(import.meta.dirname, "../../..");
  process.env.PORT ||= "23968";
  process.env.BASE_PATH ||= "/";
  // Middleware SSR transforms the actual registry without opening an app port.
  const server = await createServer({
    root,
    configFile: path.join(root, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
  });
  try {
    const { REGIONS } = await server.ssrLoadModule("/src/regions/index.ts");
    const expected: Record<string, [number, number, number]> = {
      "snowy-mountains/thredbo": [1365, 2037, 1701],
      "snowy-mountains/perisher": [1720, 2054, 1887],
      "snowy-mountains/selwyn": [1492, 1614, 1553],
      "snowy-mountains/charlottes-pass": [1765, 1954, 1860],
      "whistler/whistler-mountain": [675, 2182, 1429],
      "whistler/blackcomb-mountain": [675, 2284, 1480],
      "victorias-high-country/mt-buller": [1375, 1805, 1590],
      "queenstown/coronet-peak": [1167, 1629, 1398],
      "queenstown/the-remarkables": [1610, 1943, 1777],
      "wanaka/cardrona": [1260, 1894, 1577],
      "okanagan/big-white": [1508, 2285, 1897],
      "banff-lake-louise/mt-norquay": [1680, 2450, 2065],
      "vail-valley/beaver-creek": [2255, 3488, 2872],
      "albuquerque-sandia/sandia-peak": [2630, 3140, 2885],
    };
    for (const [key, [base, summit, requestM]] of Object.entries(expected)) {
      const [regionId, mountainId] = key.split("/");
      const mountain = REGIONS.find((region: { id: string }) => region.id === regionId)
        ?.mountains?.find((candidate: { id: string }) => candidate.id === mountainId);
      assert.ok(mountain, `${key}: missing from actual registry`);
      assert.deepEqual([mountain.skiBaseElevationM, mountain.summitElevationM], [base, summit], key);
      assert.equal(snowForecastElevation(
        mountain.skiBaseElevationM ?? mountain.baseElevationM,
        mountain.summitElevationM ?? mountain.elevationBands?.upperM,
        mountain.elevationM,
        mountain.elevationBands?.midM,
      ), requestM, `${key}: /weather snowElevationM`);
    }
    for (const key of ["whistler/whistler-mountain", "victorias-high-country/mt-buller", "queenstown/coronet-peak"]) {
      const [regionId, mountainId] = key.split("/");
      const mountain = REGIONS.find((region: { id: string }) => region.id === regionId)
        ?.mountains?.find((candidate: { id: string }) => candidate.id === mountainId);
      assert.equal(mountain?.baseElevationM, undefined, `${key}: ski base must not invent a verified village elevation`);
    }
    assert.equal(REGIONS.find((region: { id: string }) => region.id === "snowy-mountains")
      ?.mountains?.find((mountain: { id: string }) => mountain.id === "thredbo")?.baseElevationM, 1365);
    assert.equal(REGIONS.find((region: { id: string }) => region.id === "vail-valley")
      ?.mountains?.find((mountain: { id: string }) => mountain.id === "beaver-creek")?.baseElevationM, 2469,
      "verified village base must not be overwritten with 2,255 m ski-area base");
  } finally {
    await server.close();
  }
});