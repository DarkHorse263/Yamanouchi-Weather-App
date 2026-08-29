import assert from "node:assert/strict";
import test from "node:test";
import { powderThresholdText } from "../powderThresholdText";
import {
  POWDER_THRESHOLDS_AU,
  POWDER_THRESHOLDS_DEFAULT,
  POWDER_THRESHOLDS_NZ_CA,
} from "../../types/weather";

test("formats Australian Powder Window thresholds in metric units", () => {
  assert.equal(
    powderThresholdText(POWDER_THRESHOLDS_AU, "metric").en,
    "Thresholds: snowfall ≥0.5cm/hr, wind <25km/h, ≥3 consecutive hours, ≤+2°C.",
  );
});

test("formats Australian Powder Window thresholds in imperial units", () => {
  assert.equal(
    powderThresholdText(POWDER_THRESHOLDS_AU, "imperial").en,
    "Thresholds: snowfall ≥0.2in/hr, wind <16mph, ≥3 consecutive hours, ≤36°F.",
  );
});

test("formats Japan and NZ/Canada/US country thresholds from metric source values", () => {
  assert.equal(
    powderThresholdText(POWDER_THRESHOLDS_DEFAULT, "imperial").en,
    "Thresholds: snowfall ≥0.4in/hr, wind <12mph, ≥3 consecutive hours, ≤36°F.",
  );
  assert.equal(
    powderThresholdText(POWDER_THRESHOLDS_NZ_CA, "imperial").en,
    "Thresholds: snowfall ≥0.3in/hr, wind <14mph, ≥3 consecutive hours, ≤36°F.",
  );
});