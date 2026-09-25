import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifySnowConsistency, SNOW_CONSISTENCY_CANARIES } from "../../jobs/smokeTest.js";
import { canonicalSnowElevation, resolveWeatherLocation } from "../../routes/weather.js";
import { bandElevations } from "../openMeteoElevation.js";

const [thredbo, whakapapa, happo] = SNOW_CONSISTENCY_CANARIES;
const weather = (height: number, snowfallSum = 12) => ({
  current: { snowfallOutlookElevationM: height },
  daily: [{ date: "2026-07-20", snowfallSum }],
});
const forecast = (band: "mid" | "upper", snowfallCm = 12) => ({
  forecast: { days: [{ date: "2026-07-20", bands: { [band]: { snowfallCm } } }] },
});
const gate = { error: "AUTH_REQUIRED", entitlement: "forecast.peak" };

describe("daily smoke snow canaries", () => {
  it("requests server-supported canonical heights, with the comparison band at that height", () => {
    for (const canary of SNOW_CONSISTENCY_CANARIES) {
      const location = resolveWeatherLocation(canary.id);
      assert.ok(location);
      const resolved = canonicalSnowElevation(location, String(canary.snowM)) ?? location.elevation;
      assert.equal(resolved, canary.snowM, canary.id);
      assert.equal(bandElevations(canary.summitM)[canary.band], canary.snowM, canary.id);
    }
    assert.equal(thredbo.snowM, 1737);
    const thredboLocation = resolveWeatherLocation("thredbo");
    assert.ok(thredboLocation);
    // 1737 is the configured base weather height; 1701 is a separate
    // authored override. An arbitrary query must not become a forecast height.
    assert.equal(thredboLocation.elevation, 1737);
    assert.equal(canonicalSnowElevation(thredboLocation, "1737"), undefined);
    assert.equal(canonicalSnowElevation(thredboLocation, "1701"), 1701);
    assert.equal(canonicalSnowElevation(thredboLocation, "1600"), undefined);
    assert.notEqual(canonicalSnowElevation(thredboLocation, "1600") ?? thredboLocation.elevation, 1600);
    assert.equal(canonicalSnowElevation(resolveWeatherLocation("whakapapa")!, "1720"), undefined);
    assert.equal(canonicalSnowElevation(resolveWeatherLocation("happo-one")!, "1556"), undefined);
    assert.equal(whakapapa.snowM, 2020);
    assert.equal(happo.snowM, 1831);
  });

  it("treats only the expected anonymous premium gate as healthy", () => {
    assert.equal(classifySnowConsistency(thredbo, 200, weather(1737), 401, gate), null);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1737), 401, { error: "UNAUTHORIZED" })!, /401/);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1737), 402, { error: "PAYMENT_REQUIRED" })!, /402/);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1737), 500, {})!, /500/);
    assert.match(classifySnowConsistency(thredbo, 503, {}, 401, gate)!, /weather/);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1701), 401, gate)!, /resolved at 1701m/);
  });

  it("keeps real same-height snow disagreement detection when forecast data is available", () => {
    assert.equal(classifySnowConsistency(thredbo, 200, weather(1737), 200, forecast("mid", 11)), null);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1737), 200, forecast("mid", 28))!, /two snow stories/);
    assert.match(classifySnowConsistency(whakapapa, 200, weather(2020), 200, forecast("upper", 28))!, /upper band/);
    assert.match(classifySnowConsistency(happo, 200, weather(1831), 200, forecast("upper", 28))!, /upper band/);
    assert.match(classifySnowConsistency(thredbo, 200, weather(1701), 200, forecast("mid"))!, /resolved at 1701m/);
  });
});