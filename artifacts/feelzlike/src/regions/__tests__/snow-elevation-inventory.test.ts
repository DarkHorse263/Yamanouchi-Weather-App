import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
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

test("all authored base/summit forecasts agree with server summit-derived midpoint, not summit itself", () => {
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
          if (serverSummitM != null) {
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