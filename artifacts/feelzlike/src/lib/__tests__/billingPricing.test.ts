import { test } from "node:test";
import assert from "node:assert/strict";
import { browserBillingCountrySuggestion, currencyForBillingCountry, formatBillingPrice, pricingForCountry, saveBillingCountry } from "../billingPricing";

test("billing country maps to approved regional pricing with AUD fallback", () => {
  assert.equal(currencyForBillingCountry("US"), "USD");
  assert.equal(currencyForBillingCountry("DE"), "EUR");
  assert.equal(currencyForBillingCountry("BG"), "EUR");
  assert.equal(currencyForBillingCountry("CA"), "AUD");
  assert.equal(pricingForCountry("FR").taxText, "includes VAT where applicable");
  assert.equal(pricingForCountry("US").annual, 60);
});

test("browser locale is only a suggestion and AU remains the stored default", () => {
  assert.equal(browserBillingCountrySuggestion("en-US"), "US");
  assert.equal(browserBillingCountrySuggestion("de-DE"), "DE");
  assert.equal(browserBillingCountrySuggestion("en-AU"), null);
});

test("price formatter uses the correct symbol and visible ISO label on every plan value", () => {
  const expected = {
    AUD: ["AUD $5.99", "AUD $60", "AUD $5"],
    USD: ["USD $5.99", "USD $60", "USD $5"],
    EUR: ["EUR €5.99", "EUR €60", "EUR €5"],
  } as const;
  for (const currency of ["AUD", "USD", "EUR"] as const) {
    assert.equal(formatBillingPrice(currency, 5.99), expected[currency][0]);
    assert.equal(formatBillingPrice(currency, 60), expected[currency][1]);
    assert.equal(formatBillingPrice(currency, 5), expected[currency][2]);
  }
});

test("same-tab pricing updates even when local storage is blocked", () => {
  const originals = {
    localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    CustomEvent: Object.getOwnPropertyDescriptor(globalThis, "CustomEvent"),
  };
  let detail = "";
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { setItem: () => { throw new Error("blocked"); } },
    });
    Object.defineProperty(globalThis, "CustomEvent", {
      configurable: true,
      value: class {
        detail: string;
        constructor(_name: string, options: { detail: string }) { this.detail = options.detail; }
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { dispatchEvent: (event: { detail: string }) => { detail = event.detail; return true; } },
    });
    saveBillingCountry("US");
    assert.equal(detail, "US");
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as Record<string, unknown>)[key];
    }
  }
});