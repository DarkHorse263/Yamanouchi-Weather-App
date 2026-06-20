---
name: feelzlike lift-panel honesty gate
description: Why/how the "Will the lifts spin?" wind panel must gate on season + snow + live feed before speaking as if lifts run.
---

# feelzlike lift-panel honesty gate

The "Will the lifts spin?" panel (LiftWindHoldPanel) computes a pure WIND-hold
prediction per lift. That wind model says nothing about whether lifts are
actually running, so the panel must NOT present wind output as "X/N likely open"
unless the resort is plausibly operating.

**Rule:** before showing any open/running language, pass the wind read through an
operation gate (`computeLiftOperationStatus` in `src/lib/skiSeason.ts`), priority:
1. `off_season` (season window closed) beats everything.
2. authoritative live lift feed (AU): 0 of N open -> `no_lifts_open`; any open ->
   `operating` (trusted OVER a near-zero model snow read).
3. no live feed + KNOWN snow depth < 2cm -> `no_snow`.
4. else `operating`.
When not operating, the panel reframes wind as a conditional "if lifts were
running" outlook (neutral chip, honest banner, wind-only per-lift labels, no
"Watch" alert) and never claims a closed lift is open.

**Why:** the original bug showed off-season JP resorts (season Dec-Apr) as lifts
"likely open" on a June date with 0cm snow, because the panel rendered the wind
model verbatim with no season/snow awareness.

**How to apply:**
- Season windows MUST mirror api-server road-chain windows
  (isAuSnowSeason/isJpSnowSeason/isNzSnowSeason) so the lift panel and road panel
  agree: AU/NZ Jun10-Oct10 inclusive, JP Dec-Apr (month===11||<=3).
- `snowDepthCm` null/undefined means UNKNOWN, never zero: an in-season resort
  with no snow report still shows the normal wind forecast (do not close on null).
- A live feed only overrides snow when BOTH total>0 AND open count is non-null.
- Keep `skiSeason.ts` free of any `@/regions` import: that pulls PNG assets and
  crashes `tsx --test`. Its `SkiCountry` union is structurally identical to
  `CountryCode`, so callers pass `REGION_COUNTRY[id]` directly.
- Operation-priority logic lives in the pure module (not inside the React
  useMemo) so it stays unit-testable; see skiSeason.test.ts op-status matrix.
