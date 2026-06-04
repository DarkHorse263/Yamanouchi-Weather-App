---
name: feelzlike weather source fallback
description: Non-BOM locations need a live forecast fallback; Open-Meteo periodically 502s/throttles the egress IP. How the OpenWeatherMap fallback + serve-stale cache work and the constraints on touching them.
---

# feelzlike weather source resilience

Every non-BOM location (all of Victoria's High Country, Tasmania, Japan, and the
AU gateway towns) gets its forecast from a single live source. BOM-backed resorts
(Thredbo, Perisher) are the only ones that survive a forecast-source outage on
their own.

**Rule:** there must always be a working forecast fallback behind Open-Meteo.
Open-Meteo's gateway periodically returns 502s / times out / throttles the Replit
egress IP for sustained periods. When it has no fallback, every non-BOM
`/api/weather/:id` hard-500s and the client hangs on "Loading mountain
conditions…". The fallback is OpenWeatherMap (free 2.5 `weather` + `forecast`
endpoints, keyed by `OWM_API_KEY`), reshaped into the **same object shape
Open-Meteo returns** so the assembly code consumes it unchanged.

**Why:** repeated user-visible outages ("why do these faults keep happening") were
all the same single-point-of-failure: one degraded upstream took down whole
regions. OWM onecall 3.0 returns 401 (paid) — use the 2.5 endpoints only.

**How to apply:**
- Any new weather field consumed downstream must be provided by BOTH sources (or
  safely defaulted), or the fallback path silently breaks for that field. OWM 2.5
  cannot supply freezing level or lying snow depth — those are left undefined/0 in
  the fallback.
- Keep unit normalization consistent with Open-Meteo's conventions: wind m/s→km/h
  (*3.6); snowfall mm-liquid→cm snow (*0.7, i.e. 7cm snow = 10mm water).
- OWM forecast is 3-hourly; it's expanded to 1-hourly with accumulation fields
  split across the 3 hours so the next-24/48/72h snowfall sums keep per-hour
  semantics. Accepted degradation: near-term window can shift up to ~2h.
- The `/weather/:id` route caches the assembled payload (10min fresh / 6h stale)
  with serve-stale-on-error + in-flight coalescing. This both smooths transient
  blips and cuts request volume against Open-Meteo's IP throttling — don't remove
  the cache thinking it's just a perf nicety; it's load-shedding.
- Bound every upstream weather fetch with an AbortController timeout (~8s). A
  degraded gateway can hang for tens of seconds and stall the request before the
  fallback even runs.
- The per-region `weatherSource.label` (e.g. "Open-Meteo + BOM") is a STATIC
  attribution string, not a live readout — it won't say "OpenWeatherMap" while the
  fallback is active. That's intentional/accepted, not a bug.
