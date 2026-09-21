---
name: feelzlike trip planner (comparison snapshot)
description: /plan is a simple per-destination comparison snapshot, NOT a best-window ranker. Per-country (AU/JP/NZ) via a switcher, ensemble per mountain id at mid-mountain, fail-soft per mountain.
---

# feelzlike trip planner = comparison snapshot

## Forecast source clock

Use the forecast location's server-resolved timezone for source timestamps, not a
country-wide timezone or the viewer's clock. Missing metadata must stay unknown.

**Why:** Canada and the US span multiple zones, and catalogue-backed mountains
can differ from their surrounding region. The as-of date can be a different day
from the viewer's date.

**How to apply:** reuse the timezone used to bucket the ensemble's daily values
when adding source-time displays; do not maintain a second client timezone map.

## Apparent-temperature scope

Prefer provider-native daily apparent extrema from the existing ensemble's own
models. Do not expand MET Norway coverage by silently inventing an apparent
temperature formula or importing another single-model forecast.

**Why:** apparent temperature depends on synchronized inputs, and different
providers' formulas are not automatically comparable. Honest partial model
coverage is preferable to an apparently complete but inconsistent ensemble.

**How to apply:** preserve visible per-day coverage and unavailable readings
when changing providers; any new derived method needs an explicit comparability
decision before inclusion.

`/plan` (TripPlanner.tsx) is deliberately simple: pick the mountains you're
choosing between and see a side-by-side snapshot so you can compare at a glance.
It does NOT rank a "best window" and it does NOT show travel-day info.

## History (do not silently reintroduce)
A richer version once existed: a "best window to go" ranker (tripWindowScore.ts,
BestWindowCard, alternatives, honest gaps) plus a travel-day layer
(TravelDayPanel.tsx — roads/chains/transport). The user judged that
OVER-COMPLICATED and asked for just a quick comparison snapshot, so both the
ranker and the travel panel were removed (files deleted, not just unwired).
**How to apply:** don't rebuild the best-window ranking or a travel-day panel
into /plan without explicit product sign-off.

## Shape now
- Per-country (AU/JP/NZ), NOT cross-hemisphere. `/plan` is a GLOBAL route with
  no RegionProvider, so country is inferred: `?country=` param -> `readLastTown()`
  regionId -> `readFavouriteRegion()` -> first available, all mapped via
  `REGION_COUNTRY`. A switcher (`plannerCountries()`) lets the user change it and
  syncs `?country=` via `replaceState`.
- Picker: localStorage, max 6, catalog from `tripPlannerCatalog(country)`
  (that country's regions with lat/lng only). Saved set is NAMESPACED per country
  (`feelzlike:trip-mountains:<CC>`). The pre-country AU list lived under the
  un-suffixed key; adopted ONCE only when the AU key is truly ABSENT
  (`getItem === null`) — never on an empty `[]`, or clearing all AU picks would
  resurrect them on reload.
- JP Shiga Kogen has ~22 coord-bearing sub-resorts; all resolve on
  `/api/forecast/:id` so the full catalog is honest (not filtered by parentId —
  that would empty Yamanouchi since Shiga areas all carry a parentId).
- Results: one `DestinationCard` per saved mountain — mountain name + region,
  a total fresh-snow figure, and a row of ~7 day cells (weekday, fresh snow cm,
  daytime temp). No score bands, no ranking, no travel info.

## Data flow (non-obvious, unchanged)
- Each saved mountain fetches its OWN ensemble via `GET /api/forecast/:id?elevationM=`
  at `midMountainElevation(summit)` so snow matches the elevation-adjusted outlook
  the detail pages show.
- The mountain `id` IS a `LOCATIONS` forecast id (api-server routes/weather.ts).
  An id not in LOCATIONS -> 404 -> honest per-mountain "no reliable outlook" card.
- `useTripForecasts` fans out with ONE `useQueries` call (variable-length safe;
  never a hook-in-a-loop). Per mountain: pending -> loading skeleton, error/404 or
  zero days -> honest gap card, ok -> day cells. **Fail-soft is per mountain and
  NEVER fabricates a forecast.** The two types it needs
  (`PlannerForecastDay`, `PlannerForecastEntry`) now live in tripForecasts.ts
  itself (they used to come from the deleted tripWindowScore.ts).
