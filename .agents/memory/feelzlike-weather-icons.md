---
name: feelzlike weather icon rain/snow convention
description: Snow weather codes render as Snowflake (distinct from rain's CloudRain) across all weatherCode->icon sites.
---

Snow weather codes (WMO 71-77 snowfall + snow grains, 85-86 snow showers) must render with the lucide `Snowflake` icon, NOT `CloudSnow`. Rain codes (61-67, plus 80-82 rain showers) stay `CloudRain`. Drizzle 51-57 = `CloudDrizzle`.

**Why:** James reported rain and snow looked identical. `CloudSnow` reads as a generic cloud at small sizes and was confusable with the rain cloud; `Snowflake` gives a distinct silhouette. In the two colored contexts (snowy-mountains weather-icon.tsx and the NearYou hero icon) snow also gets a cool/blue tint to reinforce the distinction.

**How to apply:** The weatherCode->icon mapping is duplicated across ~6 sites (snowy-mountains weather-icon.tsx, NearYou.tsx, WeatherSections.tsx, MountainDetail.tsx, HourlyForecast.tsx, snowy LocationDetail.tsx) plus lib/feelzlike-dashboard MountainOutlook.tsx. Any new mapping site or edit must keep snow=Snowflake AND order the buckets so 80-82 (rain showers) are NOT caught by a snow branch (a `>= 77` catch-all previously mis-bucketed them as snow). yamanouchi pages use Snowflake/CloudRain as static stat icons only (no weatherCode mapping) so leave them as-is.

## DAILY weather_code is "most severe of day" - reconcile with snowfall

Open-Meteo's **daily** `weather_code` is the single most-severe condition of the day, so thunderstorm (>=95) and rain (61-67, 80-82) codes OUTRANK snow even on a day that is mostly snow - producing a thunderstorm/rain icon on a heavy-snow day (e.g. a sub-zero 22cm day). On a ski page snow is the headline, so DAILY forecast cards should reclassify the *display* code to snow when a meaningful amount of snow (>= ~1cm) is forecast on a wet/stormy-coded day. Trace amounts (<1cm) on a real storm day are deliberately NOT reclassified, and days already coded as snow stay snow regardless of amount.

**Why:** a lightning bolt hides a powder day, the most decision-relevant signal for skiers.

**How to apply:** only DAILY cards need this - HOURLY codes are per-hour accurate (HourlyForecast needs no reconciliation). As of this writing the reconciliation lives only on the snowy-mountains LocationDetail (5-day strip + extended 14-day); the generic MountainDetail daily cards for other AU regions carry the same latent bug but were left untouched to avoid an unrequested cross-region change - extend there if asked. NOTE: that 5-day card applies a Tailwind `capitalize` to the description, so weather words render title-cased ("Partly Cloudy") despite the all-lowercase brand rule - pre-existing and consistent within the card, so a reclassified "snow" should match (renders "Snow"), not be forced lowercase.
