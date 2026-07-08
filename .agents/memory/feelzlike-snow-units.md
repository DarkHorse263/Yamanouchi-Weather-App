---
name: feelzlike snow units
description: Snow amounts are cm, rain is mm, Open-Meteo snow DEPTH is METRES; cm is app-canonical; omit unknown depth, never coerce to 0; only "reported" depth may assert no-base.
---

# feelzlike snow units

Open-Meteo daily fields used by the resort forecast: `snowfall_sum` is in **cm**, `precipitation_sum` (rain) is in **mm**. The API passes both through unconverted as `snowfallSum` / `precipitationSum`.

## Snow DEPTH is metres at the source — cm is app-canonical

Open-Meteo `current.snow_depth` (and hourly `snow_depth`) is in **METRES**, unlike `snowfall_sum` (cm). The api-server converts m→cm (rounded) at the wire boundary; every `snowDepth` the client sees is cm.

**Why:** the raw metre value passed through as-if-cm made Thredbo's 0.1m (10cm) base read as "0.1cm" ≈ zero, and the app asserted "No skiable base" mid-July while lifts were spinning — the worst possible honesty failure for this brand.

Two companion rules from the same incident:
1. **Omit unknown depth, never coerce to 0.** When the model has no depth, the API omits `snowDepth` (field is optional, NOT nullable, in the OpenAPI contract). A `?? 0` on the client turns "unknown" into a confident zero — audit any new consumer for this.
2. **Only "reported" depth may assert a negative.** `skiSeason.ts` skiability takes `snowDepthSource: "model" | "reported"` (default "model"). Model depth is blind to snowmaking, so it can only inform the hedged "Base ~Xcm · check resort" chip; a no-base/no-snow claim requires a reported source (none exist yet). UI labels model depth as "Snow depth · model" / "積雪 · 予測値".

**How to apply:** any new depth source or consumer must (a) convert to cm at the server boundary, (b) preserve unknown as omitted/undefined end-to-end, (c) pass an honest `snowDepthSource` — never let model data force a negative claim.

**Rule:** label snow amounts **cm** and rain amounts **mm**. Snow depth and snow-next-24h already use cm; daily/extended snow amounts must match.

**Why:** snow and rain sit side-by-side in the same daily-forecast card, so it is tempting to reuse one unit label for both. A cm value mislabelled as mm understates snowfall 10x (e.g. 5cm shown as "5mm" looks like nothing) - a serious honesty failure for a ski app. The snowy-mountains free 5-day strip historically mislabelled snow as mm; it was corrected to cm.

**How to apply:** whenever you render a snow total, confirm the source is `snowfall_sum`/snowfallSum (cm) and label it cm; only rain/precip is mm. Check both the snowy-mountains LocationDetail (free 5-day + extended 14-day) and the generic MountainDetail daily cards stay consistent.
