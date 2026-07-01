---
name: feelzlike skiable-now split
description: Why live conditions carry TWO separate ski reads (skiable-now vs snow-incoming) and the honesty rules binding them.
---

# feelzlike skiable-now / snow-incoming split

Live conditions on the mountain/resort pages carry **two separate, clearly-labelled reads**, never merged:

- **"Snow incoming"** = the existing forward-looking Powder Window medal (gold/silver/bronze) — a *forecast* of fresh snow.
- **"Skiable now"** = a chip about base / season / lift *reality* right now.

**Why:** the powder medal alone was read as "there is a skiable base" when it only ever meant "fresh snow is coming." Fresh-snow-but-no-base misled users. The two signals answer different questions and must be visually distinct with their own labels.

## Honesty model (do not weaken)
- `deriveSkiableNowRead(input)` in `skiSeason.ts` **wraps** `computeLiftOperationStatus` and maps its result — never re-implement the status logic.
- Read union: `off_season | no_base | lifts_closed | lifts_open{liftsOpen,totalLifts} | unverified{baseCm}`.
- The **only authoritative positive** ("lifts_open") is a *live lift feed* reporting lifts>0. Model snow base NEVER asserts skiable.
- Unknown base -> `unverified(null)` -> "Base not reported · check resort". Off-season beats everything.
- `liveStatusKnown=false` downgrades a would-be `lifts_open` back to `unverified` (mirrors the panel's `operating = status==="operating" && liveStatusKnown`).

## Non-divergence rule (critical)
The `skiability` prop passed to `HourlyForecast` MUST mirror **each page's `LiftWindHoldPanel` prop expressions verbatim**, per page, so the chip and the panel can never disagree on the same screen:
- AU `LocationDetail` (snowy-mountains): `snowDepthCm` / `actualLiftsOpen` **gated on `hasLiveLiftStatus`**, plus `liveStatusKnown`, `actualTotalLifts`.
- JP `resort.tsx` and generic `MountainDetail` (VHC/NZ): **ungated** `snowDepthCm = current.snowDepth`.
**How to apply:** if you ever change one page's LiftWindHoldPanel inputs, change its HourlyForecast `skiability` prop in lockstep, or the two reads drift.

## Known upstream leak (pre-existing, not this change)
Server coerces `snow_depth ?? 0` (weather.ts), so on the **ungated** pages (JP/VHC/NZ) a genuinely-unknown depth arrives as a known `0` and yields "No skiable base" instead of `unverified(null)`. This matches the panel exactly (consistency was the goal) but partially defeats the unknown->unverified intent there. Real fix is server-side (stop coercing null->0) — out of scope for the split. Same root cause makes LiveConditions show "Snow depth 0 cm" ungated while the chip honestly says "Base not reported".
