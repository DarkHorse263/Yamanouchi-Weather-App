import assert from "node:assert/strict";
import test from "node:test";
import {
  detectPowderWindows,
  powderThresholdsForCountry,
  type HourlyForecast,
} from "../weather";

function snowRun(rateCmPerHour: number, hours = 3): HourlyForecast[] {
  return Array.from({ length: hours }, (_, index) => ({
    time: `2026-01-20T${String(index).padStart(2, "0")}:00`,
    snowfall: rateCmPerHour,
    windSpeed: 10,
    temperature: -5,
  })) as HourlyForecast[];
}

test("NZ medals sit between AU and Japan for a sustained 0.8 cm/hr window", () => {
  const window = snowRun(0.8);

  assert.equal(detectPowderWindows(window, powderThresholdsForCountry("AU")).length, 1);
  assert.equal(detectPowderWindows(window, powderThresholdsForCountry("NZ")).length, 1);
  assert.equal(detectPowderWindows(window, powderThresholdsForCountry("JP")).length, 0);
});

test("Japan medals require a genuinely strong sustained snowfall window", () => {
  const moderateWindow = snowRun(0.9);
  const strongWindow = snowRun(1.1);

  assert.equal(
    detectPowderWindows(moderateWindow, powderThresholdsForCountry("JP")).length,
    0,
  );
  assert.equal(
    detectPowderWindows(strongWindow, powderThresholdsForCountry("JP")).length,
    1,
  );
});

test("brief NZ snowfall spikes do not earn a medal", () => {
  const interrupted = [
    ...snowRun(0.9, 2),
    ...snowRun(0.2, 1),
    ...snowRun(0.9, 2),
  ];

  assert.equal(
    detectPowderWindows(interrupted, powderThresholdsForCountry("NZ")).length,
    0,
  );
});