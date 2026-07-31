import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cToF,
  cmToIn,
  tempRounded,
  snowValue,
  formatSnow,
  tempUnitLabel,
  snowUnitLabel,
  kmhToMph,
  mToFt,
  windRounded,
  elevationRounded,
  windUnitLabel,
  elevationUnitLabel,
} from "../unitsFormat.js";

test("cToF converts correctly", () => {
  assert.equal(cToF(0), 32);
  assert.equal(cToF(100), 212);
  assert.equal(cToF(-5), 23);
});

test("cmToIn converts correctly", () => {
  assert.equal(cmToIn(2.54), 1);
  assert.ok(Math.abs(cmToIn(30) - 11.811) < 0.001);
});

test("tempRounded · metric passthrough, imperial converts, null-safe", () => {
  assert.equal(tempRounded(-3.4, "metric"), -3);
  assert.equal(tempRounded(0, "imperial"), 32);
  assert.equal(tempRounded(-5, "imperial"), 23);
  assert.equal(tempRounded(null, "metric"), null);
  assert.equal(tempRounded(undefined, "imperial"), null);
});

test("snowValue · metric respects decimals, imperial always 1dp", () => {
  assert.equal(snowValue(12.6, "metric"), "13");
  assert.equal(snowValue(12.6, "metric", 1), "12.6");
  assert.equal(snowValue(2.54, "imperial"), "1.0");
  assert.equal(snowValue(30, "imperial", 1), "11.8");
  assert.equal(snowValue(null, "metric"), "-");
});

test("formatSnow appends the right unit", () => {
  assert.equal(formatSnow(15, "metric"), "15 cm");
  assert.equal(formatSnow(2.54, "imperial"), "1.0 in");
  assert.equal(formatSnow(undefined, "imperial"), "-");
});

test("unit labels", () => {
  assert.equal(tempUnitLabel("metric"), "°C");
  assert.equal(tempUnitLabel("imperial"), "°F");
  assert.equal(snowUnitLabel("metric"), "cm");
  assert.equal(snowUnitLabel("imperial"), "in");
  assert.equal(windUnitLabel("metric"), "km/h");
  assert.equal(windUnitLabel("imperial"), "mph");
  assert.equal(elevationUnitLabel("metric"), "m");
  assert.equal(elevationUnitLabel("imperial"), "ft");
});

test("kmhToMph converts correctly", () => {
  assert.ok(Math.abs(kmhToMph(100) - 62.137) < 0.001);
  assert.equal(kmhToMph(0), 0);
});

test("mToFt converts correctly", () => {
  assert.ok(Math.abs(mToFt(1000) - 3280.84) < 0.01);
  assert.equal(mToFt(0), 0);
});

test("windRounded · metric passthrough, imperial converts, null-safe", () => {
  assert.equal(windRounded(25.4, "metric"), 25);
  assert.equal(windRounded(25, "imperial"), 16);
  assert.equal(windRounded(100, "imperial"), 62);
  assert.equal(windRounded(null, "metric"), null);
  assert.equal(windRounded(undefined, "imperial"), null);
});

test("elevationRounded · metric passthrough, imperial converts, null-safe", () => {
  assert.equal(elevationRounded(1737.4, "metric"), 1737);
  assert.equal(elevationRounded(1737, "imperial"), 5699);
  assert.equal(elevationRounded(null, "imperial"), null);
  assert.equal(elevationRounded(undefined, "metric"), null);
});
