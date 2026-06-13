---
name: feelzlike location-weather endpoint is cross-country shared
description: The /weather/:id (useGetLocationWeather) endpoint serves AU and JP from one LOCATIONS array; how to safely change the forecast horizon.
---

# location-weather endpoint is shared across AU + JP

`GET /api/weather/:id` (frontend `useGetLocationWeather`) is backed by a single
`LOCATIONS` array and one `fetchOpenMeteo` in `artifacts/api-server/src/routes/weather.ts`.
That array holds BOTH Australian (Snowy Mtns, VIC High Country, TAS) and Japanese
(Yamanouchi / Shiga Kogen) resorts. So any change to `fetchOpenMeteo` ripples to
every country at once.

**Rule — gate the forecast horizon by region, never globally.**
`forecast_days` is set as `location.region === "JP" ? "7" : "14"`. AU resorts run a
14-day premium "extended" outlook; JP stays 7.

**Why:**
- Open-Meteo's reliable ceiling is ~16 days and accuracy past ~10 is poor, so 14 is
  the agreed AU cap (a 21-day promise was dropped).
- JP UIs only ever show ~6 days, so widening JP would just bloat payload/egress
  (Open-Meteo throttles our IP).

**Gotchas / how to apply:**
- Snowy Mountains `LOCATIONS` entries have NO `region` field — they are intentionally
  treated as AU. Any region check must treat `undefined` as AU (mirror the existing
  `location.region ?? "AU"` default). Do NOT assume every AU row is tagged `"AU"`.
- Bumping the daily count is visually safe for other consumers ONLY because they cap
  `daily` with explicit slices (VIC `MountainDetail` `slice(1,7)`; JP `MountainOutlook`
  caps at `maxDays=6`). Before bumping, audit consumers for an OPEN-ENDED slice
  (e.g. `daily.slice(5)`), which would silently expand.
- `GetLocationWeatherResponse` zod has no `maxItems`/`.max()` on `daily`, so returning
  more entries parses fine — no codegen needed for a pure count change.
- To screenshot premium-gated sections: a launch promo window auto-unlocks gates
  (`usePremium` → `isPromoPeriod`), else set localStorage `feelzlike.premium.preview=1`.
