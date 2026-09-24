export type BillingCurrency = "AUD" | "USD" | "EUR";

const EURO_COUNTRIES = new Set("AT BE BG HR CY EE FI FR DE GR IE IT LV LT LU MT NL PT SK SI ES".split(" "));
export const BILLING_COUNTRIES = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" ");
const COUNTRY_SET = new Set(BILLING_COUNTRIES);
const STORAGE_KEY = "feelzlike:billing-country:v1";
const CHANGE_EVENT = "feelzlike:billing-country-change";

export function currencyForBillingCountry(country: string): BillingCurrency {
  if (country === "US") return "USD";
  if (EURO_COUNTRIES.has(country)) return "EUR";
  return "AUD";
}

export function pricingForCountry(country: string) {
  const currency = currencyForBillingCountry(country);
  return {
    currency,
    monthly: 5.99,
    annual: 60,
    annualMonthly: 5,
    taxText: currency === "USD"
      ? "plus applicable tax calculated at checkout"
      : currency === "EUR"
        ? "includes VAT where applicable"
        : "includes applicable tax where required, including GST",
  };
}

export function formatBillingPrice(currency: BillingCurrency, amount: number): string {
  const symbol = currency === "EUR" ? "€" : "$";
  const value = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  return `${currency} ${symbol}${value}`;
}

export function countryName(country: string, locale?: string): string {
  try {
    return new Intl.DisplayNames([locale ?? "en"], { type: "region" }).of(country) ?? country;
  } catch {
    return country;
  }
}

export function browserBillingCountrySuggestion(language?: string): string | null {
  try {
    const region = new Intl.Locale(language ?? navigator.language).region;
    return region && COUNTRY_SET.has(region) && region !== "AU" ? region : null;
  } catch {
    return null;
  }
}

export function loadBillingCountry(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && COUNTRY_SET.has(saved) ? saved : "AU";
  } catch {
    return "AU";
  }
}

export function saveBillingCountry(country: string): void {
  if (!COUNTRY_SET.has(country)) return;
  try {
    localStorage.setItem(STORAGE_KEY, country);
  } catch {
    // The in-memory UI selection still applies when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: country }));
}

export const billingCountryChangeEvent = CHANGE_EVENT;