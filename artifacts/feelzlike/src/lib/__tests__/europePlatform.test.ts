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

test("staged Sölden produces the 2345 m midpoint without being published", () => {
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
  assert.equal(publishedRecords.some(r => r.publicId === record.publicId), false);
});

test("low-base European mountains use actual heights rather than an Alpine floor", () => {
  assert.equal(snowForecastElevation(200, 700, 310), 450);
  assert.equal(snowForecastElevation(600, 900, 650), 750);
});

test("avalanche link coverage never treats all Britain as Scotland", () => {
  assert.equal(avalancheBulletinFor("GB", "England"), undefined);
  assert.equal(avalancheBulletinFor("GB", "Wales"), undefined);
  assert.equal(avalancheBulletinFor("GB", "Scotland")?.url, "https://www.sais.gov.uk/");
  assert.equal(avalancheBulletinFor("DE", "Saxony"), undefined);
  assert.match(avalancheBulletinFor("DE", "Bavaria")!.url, /bayern/);
  assert.equal(avalancheBulletinFor("AT", "Vorarlberg"), undefined);
  assert.equal(avalancheBulletinFor("AT", "Tyrol")?.url, "https://avalanche.report/");
  assert.equal(avalancheBulletinFor("IT", "South Tyrol")?.url, "https://avalanche.report/");
});
