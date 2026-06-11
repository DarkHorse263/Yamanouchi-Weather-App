---
name: feelzlike observation reconciliation
description: Why "current conditions" can say sunny while it rains, and the dry->wet JMA AMeDAS reconciliation that corrects it. Constraints on extending it (elevation picker, JP-only, fail-soft).
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
- AU/BOM has its own observation network (not wired yet) — that's the natural
  follow-up for AU accuracy parity; AMeDAS is JP-only.
