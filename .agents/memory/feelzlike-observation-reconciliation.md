---
name: feelzlike observation reconciliation
description: Why "current conditions" can say sunny while it rains, and the per-country dry->wet surface-obs reconciliation that corrects it (JP=AMeDAS, AU=BOM AWS, NZ=airport METAR). Constraints on extending it (elevation picker, country-gated, fail-soft, 4 wiring points).
---

# feelzlike current-conditions accuracy (model lag vs surface obs)

**Root cause to remember:** every "current conditions" surface (the "local"
button, region headline cards, town hero) is derived from NWP forecast models
(Open-Meteo `best_match` / OpenWeatherMap), and those models LAG real
precipitation by ~1-2h. Verified case: all models reported 0mm clear at 05:15 JST
while JMA AMeDAS valley stations near the user were reporting real rain. So
"sunny while raining" is not a bug in one field — it is the fundamental nature of
model-derived nowcasts. The only fix is to reconcile against real surface
observations.

**Rule:** for Japan, reconcile the model's current condition against JMA AMeDAS
surface observations, **dry->wet only, never wet->dry**. Override only when the
model says dry (weather code null or <50) AND a nearby station reports active
precip. This corrects the false-clear without ever erasing model rain the obs
network might miss.

**Why dry-only:** obs stations are sparse; a station can be between showers (dry)
while the model/radar shows real rain nearby. Overriding wet->dry would
re-introduce the very "it's raining but app says clear" failure from the other
direction. Asymmetry is deliberate.

**Why elevation-aware nearest-station pick (NOT plain nearest):** the original
failure was a 1473m PEAK AMeDAS station 9.6km away reading 0mm while the 576m
valley station 18.8km away (where the resort/user actually is) was raining 6mm/h.
Plain nearest-station would have "confirmed" the false clear. The picker scores
distance + an elevation penalty (~0.05/m vs the grid/ref elevation) so a
same-altitude valley station beats a closer peak. Any future obs-source work must
keep an elevation guard.

**Fail-soft is mandatory:** AMeDAS is a best-effort enhancement layer. Every
AMeDAS fetch is wrapped so `reconcileDryToWet` can NEVER reject — a JMA outage
must degrade to "no override" (raw model value), never break or 500 the base
weather response. The library caches the station table for process lifetime and
the latest obs map ~5min with in-flight dedupe + serve-last-known.

**How to apply / gotchas:**
- JP-only via a bbox gate (`isInJapan`, lat 24-46). AU and everything
  southern-hemisphere can never match, so AU is structurally untouched — keep it
  that way; don't widen the bbox without an obs source for that country.
- When an override fires, set ALL of: weatherCode, description (re-derive from the
  new code), source/observationSource = `JMA AMeDAS · {station}`, observedAt, AND
  reflect the precipitation/rain NUMBER so icon + words + mm all agree. A
  half-applied override (icon says rain, number still 0) looks broken.
- Conservative edge (intended, not a bug): if 10-min obs = 0 but 1h obs >= 0.5mm,
  the computed rate is 0 so no override — rain that just tapered yields no change.
- town-weather stays on `best_match` (retains precipitation_probability); the
  AMeDAS reconcile supersedes any model-swap idea, so do NOT switch town-weather
  to `jma_seamless` for accuracy — reconcile is the accuracy layer.
- Overridden payloads land in the same stale caches (6h), so a corrected "rain"
  can be served stale briefly after rain stops — same staleness class the model
  already had; accepted.
- RainViewer/radar tile PIXEL-SAMPLING was tried as an obs source and REJECTED:
  results were contradictory across zoom levels (unreliable). Use station obs.

**AU/BOM reconciliation (parallel layer to JP, resort `/weather/:id` only):** same
dry->wet-only philosophy, but the inference is different because AU alpine AWS report
air_temp/rel_hum/rain_trace but leave cloud/present-weather/visibility as "-", so you
CANNOT read a "snowing" flag off them. Infer it instead: a RISING rain_trace gauge
(cumulative mm since 9am, resets at 9am -> guard the delta and normalise it to mm/h
over its true window) -> snow(<=1C)/rain; else a model that says clear (code 0/1)
with RH>=97 -> Overcast (in-cloud sanity, never invents precip). The pure decision
lives in `api-server/src/lib/bom-obs.ts` (`reconcileBomCondition`, unit-tested, no
asset imports) and is wired ONLY into the resort current-conditions assembly behind
the existing freshness-gated BOM path, fail-soft. BOM fetch is per-state via
`bomProduct` on LocationConfig (NSW IDN60801 default, VIC IDV60801, TAS IDT60801).
- VERIFIED on-mountain AWS now BOM-primary (temp/rh/rain from station, not model):
  Mt Hotham 94906, Falls Creek 94903, Mt Buller 94894 (all IDV60801). NSW resorts
  (thredbo/perisher) were already BOM-backed and now also get the condition override.
- STILL Open-Meteo (no verified co-located AWS): TAS Ben Lomond, and all
  `/town-weather` lat-lng towns -> the natural follow-ups for fuller AU parity.

**NZ/airport-METAR reconciliation (parallel layer, same dry->wet philosophy):** NZ
has NO free real-time surface-obs API (NIWA/MetService paid; CliFlo ~24h delayed).
The only free key-less "is it raining now" signal is airport METAR from NOAA
`aviationweather.gov/api/data/metar?ids=...&format=json`. NZ airports are AUTO and
reliably populate the `wxString` present-weather group (RA/SN/DZ/SHRA...) when precip
falls, so TRUST `wxString` — do NOT scrape raw METAR (false-positive risk; raw is
absent==no precip anyway). Pure decision lives in `api-server/src/lib/metar-nz.ts`
(`reconcileNzMetarDryToWet` + unit-tested pure fns `parsePresentWeather`,
`presentWeatherToWmo`, `deriveRelHumidity`, `decideNzOverride`; NO `@/regions` import
so `tsx --test` works). Curated ICAO allow-list (NZQN/NZWF/... ); coords+elev read
from each LIVE record (no stale hand-coords). Gates: dist<=30km AND elev delta<=250m
+ 0.05/m tie-break — so a VALLEY airport (NZQN ~356m = Queenstown town) corrects the
town but an alpine resort 1300m above gets NO override (honest: airport METAR is
valley-accurate, resort-approximate). Tier-2 in-cloud sanity is STRICTER than BOM:
requires RH>=97 AND BKN/OVC cloud (METAR temp/dewp are integer-rounded) -> bumps a
clear model to Overcast, never invents precip. Source label = `METAR · {ICAO name}`.
Verified live: NZCH actively "RA" -> override code 63; NZQN dry -> null; wet model ->
null; Coronet Peak 1649m -> null via elev gate.

**Cross-cutting wiring rule (applies to EVERY country's reconciler):** an obs override
must be wired into the SAME FOUR points or surfaces disagree: (1) `regions.ts`
fetchHeadline (region cards), (2) `regions.ts` applyObservedOverride (/near-you
LocalCurrent), (3) `town-weather.ts` current block (lat-lng towns), (4) `weather.ts`
after the model assembly (resort `/weather/:id`). Each country gates by bbox
(`isInJapan`/`isInNewZealand`) or `region`/`countryCode` so they never cross-fire.
Routes mount under `/api` (curl `localhost:$PORT/api/...`).
