---
name: feelzlike headline snow phase partition
description: Why /weather snow figures are freezing-level partitioned, not Open-Meteo's raw snowfall
---

**Rule:** every snow figure served by `/api/weather/:id` (daily snowfallSum + rainSum, current next24/48/72h + past24h, hourly[].snowfall) is re-derived server-side from hourly precipitation + freezing level at the snow-outlook elevation (client `snowElevationM` else registry elevation), using the SAME physics as the elevation-forecast bands: snow when elev >= FL − 300m, 0.7cm per mm water.

**Why:** Open-Meteo's raw `snowfall` decides rain-vs-snow at its grid cell's own terrain and its `elevation` param does NOT re-partition phase (verified: identical snowfall_sum at elevation=1720/2020/default). Whakapapa showed 7cm headline vs 21cm in the bands on the same page (July 2026); the FL partition figure is the physically right one when the resort sits above the freezing level. A second "snowfall at elevation" fetch used to exist but was a no-op (phase unchanged) and never fired for NZ resorts whose registry elevation is the summit; it was removed.

**How to apply:**
- Shared helpers live in `api-server/src/lib/openMeteoElevation.ts` (`partitionPrecipByBand` daily, `partitionHourlySnowfallCm` hourly). Any new snow surface must go through them, never raw model snowfall.
- Fail-soft: hours/days without a usable freezing level (OWM fallback has none) keep the model's own values, and `snowfallOutlookLevel` only claims "mid-mountain" when the partition actually ran.
- `forecast_hours=168` exists ONLY so the partition covers the 7-day outlook; the served hourly[] strip stays capped at ~72h (consumers assume that). Days 8–14 (AU premium extended) keep model sums — no band panel shows them.
- Daily override requires 24 hourly rows for that date, else a partially covered trailing day would report an undercounted total as confident.
- Residual ~0.2cm diffs vs bands are grid-cell selection (headline=land cell, bands=pinned nearest) — expected, not a bug.
