---
name: feelzlike trip planner (comparison snapshot)
description: /plan is a simple per-destination comparison snapshot, NOT a best-window ranker. AU-only, ensemble per mountain id at mid-mountain, fail-soft per mountain.
---

# feelzlike trip planner = comparison snapshot

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
- Picker: localStorage, max 6, AU-only catalog from `tripPlannerCatalog()`
  (AU regions with lat/lng only).
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
