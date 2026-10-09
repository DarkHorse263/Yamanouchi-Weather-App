export type EuropeCountryCode = "AT" | "FR" | "CH" | "IT" | "DE" | "AD" | "ES" | "NO" | "SE" | "FI" | "SI" | "BG" | "PL" | "SK" | "CZ" | "GB";
export type CountryCode = "AU" | "NZ" | "JP" | "CA" | "US" | EuropeCountryCode;
export declare const EUROPE_COUNTRIES: Record<EuropeCountryCode, { name: string; timezone: string }>;
export declare const EUROPE_COUNTRY_CODES: EuropeCountryCode[];
export declare const COUNTRY_CODES: CountryCode[];
export declare function isEuropeCountry(code: string | undefined): code is EuropeCountryCode;
export declare const EUROPE_COUNTRY_META: Record<EuropeCountryCode, { name: string; flag: string }>;
export declare const EUROPE_POWDER_THRESHOLDS: Record<EuropeCountryCode, { minSnowfall: number; maxWind: number; minDuration: number; maxTemp: number }>;
export declare function countryTimezone(code: string): string;
