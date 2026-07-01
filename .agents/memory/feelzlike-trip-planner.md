---
name: feelzlike trip planner (best-window finder)
description: /plan is a "find the best window to go" window-finder + travel-day layer, not a per-mountain forecast stack. AU-only v1, ensemble per mountain id, honesty-first gaps.
---

# feelzlike trip planner = best-window finder

`/plan` (TripPlanner.tsx) answers "which 2 to 3 days should i go, at which
mountain". It is NOT the old per-mountain forecast stack — do not regress it back
to one-strip-per-mountain.

## Shape
- User picks mountains they're choosing between (localStorage, max 6, AU-only
  catalog from `tripPlannerCatalog()` — AU regions with lat/lng only).
- The ranker returns `{ best, alternatives, gaps }`. best renders as the hero,
  alternatives as compact rows, gaps as honest "no reliable outlook for X" copy.
- A travel-day panel (roads / chains / curated transport) renders under the best
  window for that mountain.

## Data flow (non-obvious)
- Each saved mountain fetches its OWN ensemble via `GET /api/forecast/:id?elevationM=`
  at `midMountainElevation(summit)` so snow matches the elevation-adjusted outlook
  the detail pages show.
- The mountain `id` IS a `LOCATIONS` forecast id (api-server routes/weather.ts).
  An id not in LOCATIONS → 404 → honest per-mountain gap. LOCATIONS currently
  covers every AU catalog mountain (Snowy / Vic High Country / Tasmania).
- `useTripForecasts` fans out with ONE `useQueries` call (variable-length safe;
  never a hook-in-a-loop). Per mountain: pending → loading gap, error/404 → error
  gap, ok → days. **Fail-soft is per mountain and NEVER fabricates a forecast.**

## Scoring (tripWindowScore.ts)
- PURE lib, ZERO imports (same tsx-test isolation rule as
  feelzlike-tsx-test-isolation.md — importing @/regions crashes on PNG assets).
- Day score 0-100: snow 55 / temp 25 (full credit -6..1C) / precip 10 /
  confidence 10, times a model-agreement multiplier. Window = mean day score +
  powder bonus (peakSnow/3, cap 8). 2 and 3 day windows over a 7-day horizon.
  Same-mountain overlapping windows are deduped after global ranking.
**Why:** honesty-first — low model agreement is penalised, no-data becomes a gap,
snow is weighted highest because that's the trip driver.

## Travel-day layer (TravelDayPanel.tsx)
Each block labels its own data level and must not overclaim: roads
(`useGetRoadConditions` → live / seasonal-rule / pending; empty state links the
official traffic source), chains (live vs published seasonal rule), transport
(`getProvidersForRegion`, curated). AU roads are wired live for Snowy Mountains;
other AU regions honestly show the "no live feed, check official source" state.
