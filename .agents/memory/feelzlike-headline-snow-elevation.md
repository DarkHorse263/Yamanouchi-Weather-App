---
name: feelzlike headline snow elevation
description: headline snow is computed on-mountain (mid) with a labelled height; the ensemble cross-check must follow the SAME resolved elevation, including the fail-soft fallback to village.
---

- Headline snow (snowfallNext24/48/72h) is derived at MID-MOUNTAIN, not the village, because competitors (snowbest / MetraWeather) forecast at mid-mountain and village snow materially understated what riders see. Temp / feels-like / current conditions stay at the village; ONLY the snow windows change elevation.
- mid = `summit - min(300, round(summit*0.15))`. The frontend `midMountainElevation()` (artifacts/feelzlike/src/lib/elevation.ts) MUST mirror the server `bandElevations().mid` (artifacts/api-server/src/lib/openMeteoElevation.ts) exactly, or the snapshot's labelled height won't line up with the elevation-banded forecast's mid band.
- `/weather/:id` accepts `snowElevationM` and does a SECOND snowfall-only Open-Meteo fetch at that elevation, then returns `snowfallOutlookElevationM` + `snowfallOutlookLevel` ("mid-mountain" | "village"). Elevation is part of the cache key.

**Fail-soft rule:** if the 2nd fetch fails, fall back to village snow AND relabel the level as "village". Never present village snow as mountain.

**Same-elevation rule (honesty):** `EnsembleForecast` fetches `/forecast/:id?elevationM=` independently, so it MUST be passed `current.snowfallOutlookElevationM` (the elevation the headline ACTUALLY resolved to), NOT the precomputed mid `snowElevationM` that was sent to `/weather`. Otherwise, on fail-soft the headline says village while the ensemble still computes + labels at mid-mountain = two contradictory snow stories on one page.

**Why:** accuracy is feelzlike's selling point; showing village snow as mountain, or a headline/ensemble elevation mismatch, is a direct honesty regression and exactly the bug an architect review caught here.

**How to apply:** any new resort/mountain page wiring `EnsembleForecast` must pass the RESOLVED outlook elevation from the weather response (`current.snowfallOutlookElevationM`), not the requested one. On `region/MountainDetail.tsx` `current` can be undefined (no early-return guard) so use optional chaining there; snowy-mountains + yamanouchi destructure a non-null `current`. Towns send no `snowElevationM` and are unaffected.

**Past-24h stat (snowfallPast24h):** model-based "snow last 24h" comes from `past_hours=24` on the SAME Open-Meteo fetches (village + elevation), summed over the 24 full buckets ending at now-1h so it never overlaps the next-24h window (which owns the in-progress hour). It must ride the elevation override with the next windows — mixing a village past with a mid-mountain outlook = two snow stories. Two invariants: (1) the merged `hourly` payload must FILTER OUT the past OM rows (past hours there have always meant real BOM observations; consumers assume OM rows start "now"); (2) OWM fallback has no past hours → undefined, never 0 — unknown must not render as a confident "no snow fell".
