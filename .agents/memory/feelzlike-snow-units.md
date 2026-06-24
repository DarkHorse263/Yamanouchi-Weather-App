---
name: feelzlike snow units
description: Snow amounts are centimetres, rain is millimetres - do not conflate them in the shared daily forecast UI.
---

# feelzlike snow units

Open-Meteo daily fields used by the resort forecast: `snowfall_sum` is in **cm**, `precipitation_sum` (rain) is in **mm**. The API passes both through unconverted as `snowfallSum` / `precipitationSum`.

**Rule:** label snow amounts **cm** and rain amounts **mm**. Snow depth and snow-next-24h already use cm; daily/extended snow amounts must match.

**Why:** snow and rain sit side-by-side in the same daily-forecast card, so it is tempting to reuse one unit label for both. A cm value mislabelled as mm understates snowfall 10x (e.g. 5cm shown as "5mm" looks like nothing) - a serious honesty failure for a ski app. The snowy-mountains free 5-day strip historically mislabelled snow as mm; it was corrected to cm.

**How to apply:** whenever you render a snow total, confirm the source is `snowfall_sum`/snowfallSum (cm) and label it cm; only rain/precip is mm. Check both the snowy-mountains LocationDetail (free 5-day + extended 14-day) and the generic MountainDetail daily cards stay consistent.
