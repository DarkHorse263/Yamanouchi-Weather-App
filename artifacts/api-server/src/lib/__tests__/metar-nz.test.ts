import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePresentWeather,
  presentWeatherToWmo,
  deriveRelHumidity,
  decideNzOverride,
  isInNewZealand,
} from "../metar-nz.js";

test("isInNewZealand: NZ towns inside, AU/JP outside", () => {
  assert.equal(isInNewZealand(-45.0312, 168.6626), true); // Queenstown
  assert.equal(isInNewZealand(-39.2547, 175.5619), true); // Whakapapa
  assert.equal(isInNewZealand(-36.45, 148.27), false); // Thredbo, AU
  assert.equal(isInNewZealand(36.7, 138.5), false); // Shiga, JP
});

test("parsePresentWeather: rain with obscuration", () => {
  const p = parsePresentWeather("RA HZ");
  assert.equal(p.rain, true);
  assert.equal(p.snow, false);
  assert.equal(p.any, true);
  assert.equal(p.intensity, "moderate");
});

test("parsePresentWeather: intensity prefixes", () => {
  assert.equal(parsePresentWeather("-DZ").intensity, "light");
  assert.equal(parsePresentWeather("+RA").intensity, "heavy");
  assert.equal(parsePresentWeather("-SHRA").shower, true);
  assert.equal(parsePresentWeather("-SHRA").rain, true);
});

test("parsePresentWeather: snow and mixed", () => {
  const sn = parsePresentWeather("+SN");
  assert.equal(sn.snow, true);
  assert.equal(sn.intensity, "heavy");
  const mix = parsePresentWeather("RASN");
  assert.equal(mix.rain, true);
  assert.equal(mix.snow, true);
});

test("parsePresentWeather: obscuration-only / vicinity is no precip", () => {
  assert.equal(parsePresentWeather("BR").any, false);
  assert.equal(parsePresentWeather("FG").any, false);
  assert.equal(parsePresentWeather("VCSH").any, false);
  assert.equal(parsePresentWeather(null).any, false);
  assert.equal(parsePresentWeather("").any, false);
});

test("presentWeatherToWmo: rain vs showers vs drizzle", () => {
  assert.equal(presentWeatherToWmo(parsePresentWeather("RA"), 8), 63);
  assert.equal(presentWeatherToWmo(parsePresentWeather("+RA"), 8), 65);
  assert.equal(presentWeatherToWmo(parsePresentWeather("-RA"), 8), 61);
  assert.equal(presentWeatherToWmo(parsePresentWeather("SHRA"), 8), 81);
  assert.equal(presentWeatherToWmo(parsePresentWeather("-DZ"), 8), 51);
});

test("presentWeatherToWmo: snow codes", () => {
  assert.equal(presentWeatherToWmo(parsePresentWeather("SN"), -2), 73);
  assert.equal(presentWeatherToWmo(parsePresentWeather("-SN"), -2), 71);
  assert.equal(presentWeatherToWmo(parsePresentWeather("+SN"), -2), 75);
  assert.equal(presentWeatherToWmo(parsePresentWeather("-SHSN"), -2), 85);
  assert.equal(presentWeatherToWmo(parsePresentWeather("SG"), -2), 77);
});

test("presentWeatherToWmo: sleet splits by temperature", () => {
  // mixed rain+snow above freezing reads as rain showers/rain
  assert.equal(presentWeatherToWmo(parsePresentWeather("RASN"), 3), 63);
  // at/below freezing reads as snow
  assert.equal(presentWeatherToWmo(parsePresentWeather("RASN"), 0), 73);
});

test("deriveRelHumidity: saturated when temp==dewpoint", () => {
  const rh = deriveRelHumidity(4, 4);
  assert.ok(rh != null && rh >= 99.9);
  const dry = deriveRelHumidity(20, 5);
  assert.ok(dry != null && dry < 50);
  assert.equal(deriveRelHumidity(4, null), null);
});

test("decideNzOverride: corrects dry model when rain observed (the reported bug)", () => {
  const out = decideNzOverride({
    wxString: "RA",
    tempC: 8,
    dewpC: 7,
    cloudCovers: ["BKN"],
    modelWeatherCode: 0, // model says clear sky
  });
  assert.deepEqual(out, { weatherCode: 63, rateMmh: 2.0 });
});

test("decideNzOverride: never turns a wet model dry", () => {
  // model already says rain (61); a dry station must not override it
  const out = decideNzOverride({
    wxString: null,
    tempC: 8,
    dewpC: 2,
    cloudCovers: [],
    modelWeatherCode: 61,
  });
  assert.equal(out, null);
});

test("decideNzOverride: no precip + dry station = no override", () => {
  const out = decideNzOverride({
    wxString: null,
    tempC: 4,
    dewpC: 0,
    cloudCovers: ["FEW", "SCT", "BKN"],
    modelWeatherCode: 1,
  });
  assert.equal(out, null);
});

test("decideNzOverride: in-cloud overcast bumps clear model to overcast (no precip)", () => {
  const out = decideNzOverride({
    wxString: null,
    tempC: 4,
    dewpC: 4, // saturated
    cloudCovers: ["OVC"],
    modelWeatherCode: 0,
  });
  assert.deepEqual(out, { weatherCode: 3, rateMmh: 0 });
});

test("decideNzOverride: saturated but no overcast cloud = no in-cloud override", () => {
  const out = decideNzOverride({
    wxString: null,
    tempC: 4,
    dewpC: 4,
    cloudCovers: ["FEW", "SCT"],
    modelWeatherCode: 0,
  });
  assert.equal(out, null);
});

test("decideNzOverride: in-cloud only applies to clear model, not partly cloudy", () => {
  const out = decideNzOverride({
    wxString: null,
    tempC: 4,
    dewpC: 4,
    cloudCovers: ["OVC"],
    modelWeatherCode: 3, // already overcast/cloudy (>=2 not clear) -> still dry<50 but not "clear"
  });
  // modelWeatherCode 3 is dry(<50) but not clear(0/1); no precip observed -> null
  assert.equal(out, null);
});
