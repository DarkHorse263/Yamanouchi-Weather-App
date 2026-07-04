---
name: feelzlike ensemble forecast resilience
description: why the multi-model /forecast card must survive Open-Meteo failure and how it degrades honestly
---

# Ensemble ("Next 6 days" / extended outlook) resilience

The `/api/forecast/:id` multi-model card (`getEnsembleForecast` in `ensemble-forecast.ts`) blends Open-Meteo (ECMWF+GFS+ICON, one multi-model request) with MET Norway. It renders on town/mountain detail pages via `EnsembleForecast.tsx`.

## The failure mode that bit us
In production the HEAVIER multi-model Open-Meteo request gets throttled (429) / times out for the prod egress IP **even while the single-model `/api/weather` call still succeeds**. So "extended forecast won't load" ≠ Open-Meteo is down; it's specifically the multi-model call being rejected.

**Rule:** the ensemble must survive Open-Meteo failing while any other source works.
**Why:** three compounding bugs made one OM failure blank the card:
1. The date grid was built ONLY from Open-Meteo (`firstModelWithTime`). OM throws → `perModel` empty → `dates=[]` → `days=[]`, silently discarding a healthy MET Norway source.
2. The empty result was cached for the full 30-min TTL, so one failure blanked the card for 30 min even after OM recovered.
3. The OM multi-model `fetch` had no timeout (other call sites use `AbortSignal.timeout(8000)`), so it hung ~10s.

## How it degrades now (keep it this way)
- Date grid = OM dates when present, else MET's sorted dates capped to `q.days`. Keep the MET `sampleCount>=12` gate (drops the partial "today"); drop any `sourcesCount===0` day so no 0/0/0 rows.
- Cache uses freshUntil/staleUntil/builtAt + an inFlight coalescing map (mirrors `regions.ts` / `getLocationWeatherCached`). NEVER cache a `days.length===0` result over a good one; serve last-good stale (6h window) with a `_stale:{ageSeconds}` field on total failure.
- `_stale` reaches the client because `/forecast/:id` spreads `...ensemble` with NO zod parse (a parse would strip the unknown key). Client shows an honest "showing the outlook from <time>" byline; empty days → amber "temporarily unavailable" notice, never a blank header.
- **MET Norway has NO snowfall channel.** A MET-only freezing day would render as rain. So when no model supplied snow (`snows.length===0`) AND `precipMean>0` AND `tempMaxMean<=1°C`, derive `snowMean = precipMean * 0.7` (same cm-per-mm ratio as the OWM fallback). Only fires single-source; can't override real model snow.
- Client "Today" label is `isToday(parseISO(day.date))`, NOT `index===0` (index 0 mislabels tomorrow as Today in the MET-only path where today was dropped).

**How to apply:** any change here is per-process in-memory cache, so a fix only reaches prod after a re-publish. Change is additive (`_stale` optional, days can be []) → no SW CACHE_VERSION bump needed.
