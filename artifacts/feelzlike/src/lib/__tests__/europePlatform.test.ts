import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { EUROPE_COUNTRY_CODES, countryTimezone } from "@workspace/ski-catalogue/countries";
import { publicProjection, validateRecord } from "@workspace/ski-catalogue";
import { publishedRecords } from "@workspace/ski-catalogue/public-runtime";
import { snowForecastElevation } from "../elevation";
import { isLiftSeasonOpen } from "../skiSeason";
import { powderThresholdsForCountry } from "../../types/weather";
import { avalancheBulletinFor } from "../avalancheBulletins";

test("all sixteen European country policies are northern, metric-independent and explicitly zoned", () => {
  assert.equal(EUROPE_COUNTRY_CODES.length, 16);
  for (const country of EUROPE_COUNTRY_CODES) {
    assert.equal(isLiftSeasonOpen(country, new Date(2026, 0, 15)), true, country);
    assert.equal(isLiftSeasonOpen(country, new Date(2026, 6, 15)), false, country);
    assert.equal(powderThresholdsForCountry(country).minSnowfall, 0.75, country);
    assert.match(countryTimezone(country), /^Europe\//, country);
    assert.doesNotThrow(() => new Intl.DateTimeFormat("en", { timeZone: countryTimezone(country) }));
  }
});

test("Wave 1 Sölden publishes its cited 2345 m midpoint", () => {
  const batch = JSON.parse(readFileSync(new URL(
    "../../../../../lib/ski-catalogue/data/europe-wave1/europe-phase1-austria.json", import.meta.url,
  ), "utf8"));
  const source = batch.records.find((r: { identity: { name: string } }) => r.identity.name.includes("Sölden"));
  assert.ok(source);
  assert.deepEqual(validateRecord(source), []);
  const record = publicProjection(source)!;
  assert.equal(record.baseElevationM, 1350);
  assert.equal(record.summitElevationM, 3340);
  assert.equal(snowForecastElevation(record.baseElevationM, record.summitElevationM, record.forecastElevationM), 2345);
  assert.deepEqual(publishedRecords.find(r => r.publicId === record.publicId), record);
});

test("low-base European mountains use actual heights rather than an Alpine floor", () => {
  assert.equal(snowForecastElevation(200, 700, 310), 450);
  assert.equal(snowForecastElevation(600, 900, 650), 750);
});

test("Wave 1 publishes exactly 115 untouched source projections; Wave 2 remains staged", () => {
  const root = "../../../../../lib/ski-catalogue/data/";
  let count = 0;
  for (const name of ["europe-phase1-austria", "europe-phase2-france", "europe-phase3-switzerland", "europe-phase4-italy", "europe-phase6-germany"]) {
    const source = readFileSync(new URL(`${root}europe-wave1/${name}.json`, import.meta.url), "utf8");
    assert.equal(readFileSync(new URL(`${root}batches/${name}.json`, import.meta.url), "utf8"), source);
    for (const record of JSON.parse(source).records) {
      const projected = publicProjection(record)!;
      assert.deepEqual(publishedRecords.find(r => r.publicId === projected.publicId), projected);
      count++;
    }
  }
  assert.equal(count, 115);
  assert.equal(publishedRecords.some(r => ["AD", "ES", "NO", "SE", "FI", "SI", "BG", "PL", "SK", "CZ", "GB"].includes(r.countryCode)), false);
  const valThorens = publishedRecords.find(r => r.publicId === "val-thorens")!;
  assert.equal(snowForecastElevation(valThorens.baseElevationM, valThorens.summitElevationM, valThorens.forecastElevationM), 2528);
});

test("avalanche link coverage never treats all Britain as Scotland", () => {
  assert.equal(avalancheBulletinFor("GB", "England"), undefined);
  assert.equal(avalancheBulletinFor("GB", "Wales"), undefined);
  assert.equal(avalancheBulletinFor("GB", "Scotland")?.url, "https://www.sais.gov.uk/");
  assert.equal(avalancheBulletinFor("DE", "Saxony"), undefined);
  assert.match(avalancheBulletinFor("DE", "Bavaria")!.url, /bayern/);
  assert.match(avalancheBulletinFor("AT", "Vorarlberg")!.url, /vorarlberg/);
  assert.equal(avalancheBulletinFor("AT", "Tyrol")?.url, "https://avalanche.report/");
  assert.equal(avalancheBulletinFor("IT", "South Tyrol")?.url, "https://avalanche.report/");
});

test("European lift season includes 1 November through 15 May only", () => {
  for (const country of EUROPE_COUNTRY_CODES) {
    for (const [month, day, expected] of [[9, 31, false], [10, 1, true], [11, 31, true], [0, 1, true], [4, 15, true], [4, 16, false]] as const) {
      assert.equal(isLiftSeasonOpen(country, new Date(2026, month, day, 12)), expected, `${country} ${month + 1}/${day}`);
    }
  }
});

test("Austrian provincial avalanche advice stays outbound and province-specific", () => {
  for (const [province, host] of [
    ["Vorarlberg", "warnung.vorarlberg.at"], ["Salzburg", "lawine.salzburg.at"],
    ["Carinthia", "lawinenwarndienst.ktn.gv.at"], ["Kärnten", "lawinenwarndienst.ktn.gv.at"],
    ["Styria", "lawine-steiermark.at"], ["Steiermark", "lawine-steiermark.at"],
  ]) {
    assert.equal(new URL(avalancheBulletinFor("AT", province)!.url).hostname, host);
  }
  assert.equal(avalancheBulletinFor("AT", "Vienna"), undefined);
});
