---
name: feelzlike resort query elevation
description: Why each resort's LOCATIONS.elevation is an on-mountain forecast height, not its village; Thredbo pinned to mid-mountain 1737m on purpose.
---

# Resort query elevation is ON-MOUNTAIN, not the village

In `api-server/src/routes/weather.ts` `LOCATIONS[].elevation` is the elevation
the base Open-Meteo query runs at. For SKI RESORTS this is deliberately an
on-mountain height, NOT the valley village:
- Perisher 1720m, Charlotte's Pass 1837m, VHC resorts 1805-1862m all already sit
  on-mountain (near their base/mid terrain).
- Thredbo was the lone outlier at 1365m (its "Thredbo Village AWS" valley
  station). It is now pinned to **1737m** = `midMountainElevation(2037 summit)`,
  the exact value both clients already send as `snowElevationM`/`elevationM`.

**Why:** the whole 7-day DAILY array (`daily = om.daily...`) is computed at
`location.elevation` and never upgraded by the mid-mountain snow mechanism (that
only lifts the rolling `current.snowfallNext24/48/72h` outlook). With Thredbo at
the valley floor, a marginal storm (snow level ~1400-1700m) fell as RAIN at 1365m
while snowing at every peer's higher query point, so Thredbo alone showed no
snow on the 7-day cards while all peers showed snow. User confirmed this was a
bug and chose "nudge Thredbo up to match the others".

**How to apply:**
- Do NOT "correct" Thredbo back to 1365m thinking the village number is more
  accurate. It would reintroduce the no-snow bug. Same for any resort: the
  elevation field is a forecast height, not a signpost altitude.
- `location.elevation` is overloaded on the client (snowy `LocationDetail.tsx`):
  the "Elev Xm" byline, the "Xm · top elevation" label, `ElevationBands`
  summitElevationM, and "elevation-corrected for Xm" ALL read it. So bumping it
  shifts all those displays together (consistent with peers). The mid-mountain
  snow query, by contrast, is derived from the REGION config summit
  (`region.mountains[].elevationM`, Thredbo 2037), not from the API value.
- Current conditions stay BOM village-first (Thredbo primary bomWmoId 95908
  Village AWS, secondary 95909 Top Station). The "feels like" hero is meant to be
  what you feel arriving; only the model FORECAST is on-mountain. When Village
  AWS goes stale the existing freshness fallback serves Top Station (on-mountain),
  which happens to align even better with the 1737m daily.
- True valley/arrival weather is covered by the separate town locations
  (e.g. Jindabyne 918m), not by lowering a resort's elevation.
