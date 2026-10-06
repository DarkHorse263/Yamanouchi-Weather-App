/** Scrub credential-bearing query parameters from Sentry events and spans. */
export function redactWeatherCredentials<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/([?&]apikey=)[^&#\s"']+/gi, "$1[REDACTED]") as T;
  }
  if (Array.isArray(value)) return value.map(redactWeatherCredentials) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key, /^(apikey|open_meteo_api_key)$/i.test(key) ? "[REDACTED]" : redactWeatherCredentials(item),
    ])) as T;
  }
  return value;
}
