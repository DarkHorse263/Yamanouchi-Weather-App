import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { readLocalUnits, readStoredLocalUnits, defaultUnitsForCountry, effectiveUnits, profileUpdateInput } from "../userPrefsStorage";

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function setGlobal(name: "navigator" | "localStorage", value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
  });
}

function restoreGlobal(
  name: "navigator" | "localStorage",
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(globalThis, name, descriptor);
  } else {
    Reflect.deleteProperty(globalThis, name);
  }
}

function storageReturning(value: string | null): Pick<Storage, "getItem"> {
  return { getItem: () => value };
}

afterEach(() => {
  restoreGlobal("navigator", originalNavigator);
  restoreGlobal("localStorage", originalLocalStorage);
});

test("an unset en-US browser defaults to imperial", () => {
  setGlobal("localStorage", storageReturning(null));
  setGlobal("navigator", { language: "en-US", languages: ["en-US"] });

  assert.equal(readLocalUnits(), "imperial");
});

test("an unset non-US browser defaults to metric", () => {
  setGlobal("localStorage", storageReturning(null));
  setGlobal("navigator", { language: "en-AU", languages: ["en-AU"] });

  assert.equal(readLocalUnits(), "metric");
});

test("region defaults use imperial only for the US, without pretending it was a stored choice", () => {
  setGlobal("localStorage", storageReturning(null));
  assert.equal(readStoredLocalUnits(), null);
  for (const country of ["AU", "NZ", "JP", "AT", "CA"]) assert.equal(defaultUnitsForCountry(country), "metric");
  assert.equal(defaultUnitsForCountry("US"), "imperial");
});

test("legacy implicit account metric does not erase an explicit local choice or US region default", () => {
  const legacy = { units: "metric" as const, unitsExplicit: false };
  assert.equal(effectiveUnits(legacy, "imperial", "AU", "metric"), "imperial");
  assert.equal(effectiveUnits(legacy, null, "US", "metric"), "imperial");
  assert.equal(effectiveUnits(legacy, null, "JP", "imperial"), "metric");
});

test("saved account choices override local choice and region even on other devices", () => {
  assert.equal(effectiveUnits({ units: "metric", unitsExplicit: true }, "imperial", "US", "imperial"), "metric");
  assert.equal(effectiveUnits({ units: "imperial", unitsExplicit: true }, "metric", "AU", "metric"), "imperial");
  assert.equal(effectiveUnits({ units: "imperial" }, null, "NZ", "metric"), "imperial");
});

test("home region edits leave implicit units untouched; tapping units explicitly saves even the same value", () => {
  assert.deepEqual(profileUpdateInput("jackson-hole", "metric", false), { homeRegionId: "jackson-hole" });
  assert.deepEqual(profileUpdateInput("", "metric", true), { homeRegionId: null, units: "metric" });
});

test("a saved metric choice overrides a US locale", () => {
  setGlobal("localStorage", storageReturning("metric"));
  setGlobal("navigator", { language: "en-US", languages: ["en-US"] });

  assert.equal(readLocalUnits(), "metric");
});

test("a saved imperial choice overrides a non-US locale", () => {
  setGlobal("localStorage", storageReturning("imperial"));
  setGlobal("navigator", { language: "en-AU", languages: ["en-AU"] });

  assert.equal(readLocalUnits(), "imperial");
});

test("unavailable browser storage fails safely to metric", () => {
  setGlobal("localStorage", {
    getItem: () => {
      throw new Error("storage unavailable");
    },
  });
  setGlobal("navigator", { language: "en-US", languages: ["en-US"] });

  assert.equal(readLocalUnits(), "metric");
});

test("unavailable locale APIs fail safely to metric", () => {
  setGlobal("localStorage", storageReturning(null));
  Reflect.deleteProperty(globalThis, "navigator");

  assert.equal(readLocalUnits(), "metric");
});