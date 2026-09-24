import { useEffect, useMemo, useState } from "react";
import {
  BILLING_COUNTRIES,
  billingCountryChangeEvent,
  browserBillingCountrySuggestion,
  countryName,
  loadBillingCountry,
  pricingForCountry,
  saveBillingCountry,
} from "@/lib/billingPricing";

export function useBillingCountry() {
  const [country, setCountryState] = useState(loadBillingCountry);
  useEffect(() => {
    const update = (event: Event) => setCountryState((event as CustomEvent<string>).detail);
    window.addEventListener(billingCountryChangeEvent, update);
    return () => window.removeEventListener(billingCountryChangeEvent, update);
  }, []);
  const setCountry = (next: string) => {
    setCountryState(next);
    saveBillingCountry(next);
  };
  return { country, setCountry, pricing: pricingForCountry(country) };
}

export function BillingCountryPicker() {
  const { country, setCountry, pricing } = useBillingCountry();
  const suggestion = useMemo(() => browserBillingCountrySuggestion(), []);
  const countries = useMemo(() => BILLING_COUNTRIES
    .map(code => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name)), []);
  return <div className="space-y-2">
    <label htmlFor="billing-country" className="block text-sm font-bold text-slate-700">payment billing country</label>
    <select id="billing-country" value={country} onChange={event => setCountry(event.target.value)}
      data-testid="select-billing-country"
      className="w-full max-w-sm rounded-lg border border-border bg-white px-3 py-2 text-sm text-slate-900">
      {countries.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}
    </select>
    {suggestion && suggestion !== country && <button type="button"
      data-testid="button-use-browser-country" onClick={() => setCountry(suggestion)}
      className="block text-xs text-[#0055FF] underline">
      browser language suggests {countryName(suggestion)} · use it
    </button>}
    <p className="text-xs text-slate-600" data-testid="text-billing-currency">
      prices shown and charged in {pricing.currency}. Choose the country on your payment billing address, not the ski region you are viewing.
    </p>
  </div>;
}