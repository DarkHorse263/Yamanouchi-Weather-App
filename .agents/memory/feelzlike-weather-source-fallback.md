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

## visitor "near you" page must degrade per-section, not all-or-nothing

**Rule:** the arbitrary-coords visitor page (NearYouWeather) must render each
piece from its own data source and fail each piece independently — never gate the
whole page on the heaviest request.
- Radar (RainViewer/RadarMap) depends ONLY on coords → render it UNCONDITIONALLY
  once located, as a sibling outside the weather block. It is the most reliable
  thing on the page; burying it inside a weather success branch is the bug that
  makes the page look "hung".
- Current conditions come from the CHEAP `/api/local-weather` `current` block
  (few vars, 1 day). The rich hourly/7-day comes from the EXPENSIVE
  `/api/town-weather` (~41 vars × 7 days). Open-Meteo throttles the expensive
  request far harder than the cheap one, so render the hero from local-current
  first and treat the extended forecast as an enhancement.
- BOTH `/local-weather` AND `/town-weather` now route through the same OWM
  reshaper fallback (`fetchOpenWeatherMapAsOpenMeteo`, Open-Meteo-shaped
  current/hourly/daily). In `/town-weather` a `serveOwm()` helper runs BEFORE
  `serveStale` in both error branches (upstream-not-ok AND fetch-threw), and the
  shared `buildTownPayload(d,lat,lng)` builds the response from either source so
  the shapes are identical. OWM-sourced payloads are cached as FRESH (they're
  genuinely current) and a later OM success overwrites them. Degraded fields on
  the OWM path (rain/gusts/visibility/uv/dewpoint/per-hour precip-prob, 7-day
  compresses to ~5) all resolve to null → the client renders "-", never NaN.
  Response carries `X-Feelzlike-Source: openweathermap`.
- Distinguish loading from error per query: only show an "unavailable" notice on
  `query.isError`, never merely on `!query.data` (the in-flight gap would flash a
  false error after the hero already rendered).
- The "always a fallback behind Open-Meteo" rule applies to EVERY Open-Meteo call
  path, not just the town forecast route. Any direct Open-Meteo fetch you add (e.g.
  the cheap visitor current-conditions endpoint) must route through the same
  OpenWeatherMap fallback reshaper, or it fails in isolation when the egress IP is
  throttled while other pages still work — surfacing as "local conditions are
  unavailable right now" to visitors even though town pages are fine.

**Why:** repeated "the /near-you page just hangs on loading weather" complaints.
Town pages survive Open-Meteo throttling via the warm 6h serve-stale cache keyed
by rounded lat/lng; a cold visitor's unique coords have NO warm entry, so the
expensive request 503s with nothing to fall back on while the cheap request and
the radar still work fine.

## reverse-geocoding (place name): Google primary, free sources as fallback

**Rule:** the visitor's place name (`/local-weather` `place.name`, shown on the
home "near you" card and the /near-you page) is resolved by `fetchPlaceName`,
which tries three sources in order of suburb-accuracy then reliability and returns
`google ?? bdc ?? owmCity`:
1. Google Geocoding API (keyed by `GOOGLE_PLACES_API_KEY`) - PRIMARY. Reverse
   geocode, then take the `locality` component + `administrative_area_level_1` as
   the region. LOCALITY-FIRST is critical and is correct in BOTH markets: AU
   suburb = locality ("Woolloomooloo", "Surry Hills"; the Sydney CBD correctly
   reads "Sydney"); JP town/village = locality ("Hakuba", "Niseko", "Yamanouchi").
   Do NOT rank `sublocality` above `locality` - JP `sublocality` is a hyper-local
   district ("Hokujo"/"Fujimi"/"Sano") nobody recognises and stops matching the
   app's region names. JP (Hakuba/Niseko/Yamanouchi) is the canary if you re-rank.
2. BigDataCloud keyless `reverse-geocode-client` - free suburb fallback, called
   ONLY when Google returns null.
3. OpenWeatherMap `/geo/1.0/reverse` (keyed by `OWM_API_KEY`) - the town/city
   FLOOR; always answers, so the label degrades to the city rather than vanishing.

**Why:** OWM alone only resolves to town/city, so every suburb read as its city
("Sydney"). The owner, testing from an inner-city suburb (Woolloomooloo), asked
for finer labels - the WEATHER was
always point-accurate (fetched for the exact GPS coords); only this LABEL was
coarse. BigDataCloud returns the suburb but its keyless endpoint can be throttled
from the single deployment egress IP, so it can't be the sole primary. Google
Geocoding is the reliable server-appropriate suburb source; it just needed the
"Geocoding API" ENABLED on the key's Google Cloud project (the owner enabled it;
the key has no application restrictions). Before that it returned REQUEST_DENIED "This
API is not activated on your API project". The fallback chain means a Google
quota/key problem can NEVER blank the label - never blank, never wrong, never a
regression.

**How to apply:**
- Keep Google PRIMARY with locality-first parsing; keep BDC + OWM as the fallback
  so a Google outage degrades gracefully. Do NOT drop the fallback.
- Avoid OSM Nominatim as a primary: it returns the suburb but its public instance
  forbids production-scale use and can block the IP.
- Results stay wrapped in the 24h `placeNameCache` (~one call per ~1.1km cell per
  day), which keeps the BILLABLE Google volume - and cost - tiny. CAVEAT: the
  cache stores whatever `fetchPlaceName` returned, so if Google AND BDC both fail
  and only the OWM city floor answered, that coarse label is cached up to 24h
  (in-memory, cleared on every deploy/restart) before a retry.
- LATENCY edge (accepted): `fetchPlaceName` awaits Google (6s timeout) THEN, only
  on failure, the BDC+OWM fallback (6s) - up to ~12s worst case on a Google hang.
  It's best-effort, runs in parallel with the weather fetch, and is gated by the
  24h cache, so it bites at most once per cell per day. Bound it tighter only if
  prod latency shows it mattering.
- Verify by curling `/api/local-weather` on the api-server's local PORT (the mTLS
  proxy blocks plain curl on `$REPLIT_DEV_DOMAIN` -> HTTP 000; read PORT from
  `/proc/<pid>/environ`). Confirm in PROD after deploy too.
