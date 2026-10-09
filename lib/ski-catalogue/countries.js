// Country support is independent of publication. Registering a country must
// never publish the staged Europe batches or manufacture a destination.
export const EUROPE_COUNTRIES = {
  AT: { name: "Austria", timezone: "Europe/Vienna" },
  FR: { name: "France", timezone: "Europe/Paris" },
  CH: { name: "Switzerland", timezone: "Europe/Zurich" },
  IT: { name: "Italy", timezone: "Europe/Rome" },
  DE: { name: "Germany", timezone: "Europe/Berlin" },
  AD: { name: "Andorra", timezone: "Europe/Andorra" },
  ES: { name: "Spain", timezone: "Europe/Madrid" },
  NO: { name: "Norway", timezone: "Europe/Oslo" },
  SE: { name: "Sweden", timezone: "Europe/Stockholm" },
  FI: { name: "Finland", timezone: "Europe/Helsinki" },
  SI: { name: "Slovenia", timezone: "Europe/Ljubljana" },
  BG: { name: "Bulgaria", timezone: "Europe/Sofia" },
  PL: { name: "Poland", timezone: "Europe/Warsaw" },
  SK: { name: "Slovakia", timezone: "Europe/Bratislava" },
  CZ: { name: "Czechia", timezone: "Europe/Prague" },
  GB: { name: "United Kingdom", timezone: "Europe/London" },
};
export const EUROPE_COUNTRY_CODES = Object.keys(EUROPE_COUNTRIES);
export const COUNTRY_CODES = ["AU", "NZ", "JP", "CA", "US", ...EUROPE_COUNTRY_CODES];
export const isEuropeCountry = (code) => Object.hasOwn(EUROPE_COUNTRIES, code ?? "");
export const EUROPE_COUNTRY_META = Object.fromEntries(Object.entries(EUROPE_COUNTRIES).map(([code, { name }]) => [
  code, { name, flag: String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397)) },
]));
// Explicit product thresholds, not a claim about measured regional climate.
export const EUROPE_POWDER_THRESHOLDS = Object.fromEntries(EUROPE_COUNTRY_CODES.map(code => [
  code, { minSnowfall: 0.75, maxWind: 22, minDuration: 3, maxTemp: 2 },
]));
export function countryTimezone(code) {
  return EUROPE_COUNTRIES[code]?.timezone ?? {
    AU: "Australia/Sydney", NZ: "Pacific/Auckland", JP: "Asia/Tokyo",
  }[code] ?? "auto";
}
