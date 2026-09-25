import { createServer } from "vite";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Run from the workspace root. SSR loads the actual published region registry,
// including its strict village provenance checks and catalogue projections.
const root = resolve("artifacts/feelzlike");
const input = resolve("attached_assets/US_and_Canada_snow_elevation_audit_data_1790298108999.csv");
const out = resolve("exports/elevation-reconciliation.csv");
// Explicit, independently fetched resort-operated sources supersede the
// earlier audit's proposed heights; an internally inconsistent source does not.
const officialReview = {
  "hilltop-ski-area-and-bike-park": {
    base: 150, summit: 240, midpoint: 195,
    source: "https://www.hilltopskiarea.org/the-mountain",
    reason: "Official resort: base 492ft, top 786ft; 150/240m after exact conversion.",
  },
  "mt-eyak-ski-area": {
    base: 122, summit: 366, midpoint: 244,
    source: "https://www.mteyak.org/",
    reason: "Official ski-area homepage: 400ft base, 1200ft top of chairlift; 122/366m.",
  },
};
// Vite config requires the artifact environment even in middleware/SSR mode.
// This script never listens on the port or starts the application.
process.env.PORT ||= "23968";
process.env.BASE_PATH ||= "/";
const server = await createServer({
  root,
  configFile: resolve(root, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});
try {
  const { REGIONS } = await server.ssrLoadModule("/src/regions/index.ts");
  const { snowForecastElevation } = await server.ssrLoadModule("/src/lib/elevation.ts");
  const lines = readFileSync(input, "utf8").trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  const rows = lines.map(line => Object.fromEntries(line.split(",").map((value, i) => [headers[i], value])));
  const csv = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const numberOrNull = value => value === "" || value == null ? null : Number(value);
  const output = [["country","region","mountain_id","name","old_live_m","new_runtime_m","audit_suggested_m","base_m","summit_m","status","reason","source_url","checked_at","source_type"].join(",")];
  const results = {};
  for (const row of rows) {
    const region = REGIONS.find(region => region.id === row.region);
    const mountain = region?.mountains?.find(mountain => mountain.id === row.mountain_id);
    const base = mountain?.skiBaseElevationM ?? mountain?.baseElevationM;
    const summit = mountain?.summitElevationM ?? mountain?.elevationBands?.upperM;
    const actual = mountain && snowForecastElevation(base, summit, mountain.elevationM, mountain.elevationBands?.midM);
    const suggested = numberOrNull(row.suggested_snow_elevation_m);
    const expectedBase = numberOrNull(row.base_m);
    let status = "matched";
    let reason = "Published region elevation agrees with audit";
    if (!mountain) { status = "missing"; reason = "Mountain absent from current runtime region"; }
    else if (actual == null) { status = "missing-height"; reason = "No publishable terrain height"; }
    else if (base != null && actual < base) { status = "below-base"; reason = "Forecast below published resort base"; }
    else if (expectedBase != null && expectedBase > 0 && actual < expectedBase) {
      status = "below-audit-base"; reason = "Forecast below audit base; investigate competing elevation sources";
    } else if (suggested != null && Math.abs(actual - suggested) > 150) {
      status = "review"; reason = "Difference >150m from audit suggestion; audit may use different elevation provenance";
    } else if (suggested != null && Math.abs(actual - suggested) > 1) {
      status = "near"; reason = "Within 150m of audit; current published terrain inputs differ";
    }
    let sourceUrl = "", checkedAt = "", sourceType = "";
    const official = officialReview[row.mountain_id];
    if (official && region?.id === row.region) {
      if (base !== official.base || summit !== official.summit || actual !== official.midpoint)
        throw new Error(`${row.mountain_id}: published heights no longer match official correction`);
      status = "official-correction";
      reason = official.reason;
      sourceUrl = official.source;
      checkedAt = "2026-09-25";
      sourceType = "resort-operated";
    } else if (row.mountain_id === "powder-king-mountain-resort" && region?.id === row.region) {
      // Official Powder King page presents conflicting ft/m pairs AND a
      // vertical drop inconsistent with either pair. No single canonical
      // elevation is supportable from that source alone.
      if (base !== 1267 || summit !== 1838 || actual !== 1553)
        throw new Error("Powder King changed without resolving its contradictory official source");
      status = "source-unresolved";
      reason = "Official page says summit 1829m (5500ft), base 935m (3000ft), vertical 640m (2100ft): mutually inconsistent. Existing values retained pending resort clarification.";
      sourceUrl = "https://www.powderking.com/contact/about-us";
      checkedAt = "2026-09-25";
      sourceType = "resort-operated, internally inconsistent";
    } else if (suggested == null && status === "matched") {
      reason = "Audit has no suggested replacement; published pin/base retained without guessing a summit";
    }
    output.push([row.country,row.region,row.mountain_id,row.name,row.snow_forecast_elevation_m_live,actual,suggested,base,summit,status,reason,sourceUrl,checkedAt,sourceType].map(csv).join(","));
    results[status] = (results[status] ?? 0) + 1;
  }
  mkdirSync(resolve("exports"), { recursive: true });
  writeFileSync(out, output.join("\n") + "\n");
  console.log(JSON.stringify({ rows: rows.length, ...results, file: out }, null, 2));
  // A supplied audit suggestion is a comparison target, not a source of
  // authority for overwriting terrain data. Fail the release review on any
  // discrepancy so each one must be resolved or explicitly investigated.
  if (output.length !== 375 || (results.missing ?? 0) || (results["below-base"] ?? 0) ||
      (results["below-audit-base"] ?? 0) || (results.review ?? 0) || (results.near ?? 0) ||
      results["official-correction"] !== 2 || results["source-unresolved"] !== 1)
    process.exitCode = 1;
} finally {
  await server.close();
}