---
name: feelzlike map cross-region browsing
description: The interactive RadarMap shows every same-country town + resort, not just the current region. Why, and how to keep it correct.
---

The interactive radar (`RadarMap.inner.tsx`) plots pins for ALL regions that share the current region's country (AU grouped together · JP grouped together), not just the current region. Cross-region pins render dimmed with a region-name tooltip subtitle; a top-left control toggles between "all of <country>" (fitBounds over every country pin) and "this region" (setView back to the region center/zoom).

**Why:** the user explicitly asked to "look at other towns and resorts even when we've chosen a different region," and chose country-grouping over a single worldwide map. Do not silently re-scope the map back to region-only pins — that regresses an intended feature.

**How to apply:**
- Pins come from `countryPinsFor(region)` which merges `REGION_DEFAULTS` entries by a LOCAL `REGION_COUNTRY` map inside `RadarMap.inner.tsx`. This local map intentionally duplicates `REGION_COUNTRY` in `src/regions/index.ts` to keep the leaflet component decoupled from `@/regions` (importing the registry pulls PNG assets — see the tsx test-isolation note). If you add/move a region, update BOTH maps or grouping silently goes wrong.
- Pin `id`s must stay unique within a country (React marker keys + the global `PIN_ICONS` cache are keyed by id). Duplicate ids in the same country will collide.
- Caller-passed `markers` still override and suppress cross-region mode (all tagged `isCurrent`). Today only `TownWeather.tsx` consumes `RadarMap`, passing just `season` + `region` (no markers).
- The map is NOT a navigation surface — pins are look-only (tooltips), by the user's chosen scope. Adding tap-to-jump was a separate, non-chosen option; don't add it unless asked.
