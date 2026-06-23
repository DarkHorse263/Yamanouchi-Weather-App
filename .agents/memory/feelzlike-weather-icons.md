---
name: feelzlike weather icon rain/snow convention
description: Snow weather codes render as Snowflake (distinct from rain's CloudRain) across all weatherCode->icon sites.
---

Snow weather codes (WMO 71-77 snowfall + snow grains, 85-86 snow showers) must render with the lucide `Snowflake` icon, NOT `CloudSnow`. Rain codes (61-67, plus 80-82 rain showers) stay `CloudRain`. Drizzle 51-57 = `CloudDrizzle`.

**Why:** James reported rain and snow looked identical. `CloudSnow` reads as a generic cloud at small sizes and was confusable with the rain cloud; `Snowflake` gives a distinct silhouette. In the two colored contexts (snowy-mountains weather-icon.tsx and the NearYou hero icon) snow also gets a cool/blue tint to reinforce the distinction.

**How to apply:** The weatherCode->icon mapping is duplicated across ~6 sites (snowy-mountains weather-icon.tsx, NearYou.tsx, WeatherSections.tsx, MountainDetail.tsx, HourlyForecast.tsx, snowy LocationDetail.tsx) plus lib/feelzlike-dashboard MountainOutlook.tsx. Any new mapping site or edit must keep snow=Snowflake AND order the buckets so 80-82 (rain showers) are NOT caught by a snow branch (a `>= 77` catch-all previously mis-bucketed them as snow). yamanouchi pages use Snowflake/CloudRain as static stat icons only (no weatherCode mapping) so leave them as-is.
