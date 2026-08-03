---
name: feelzlike per-country powder thresholds
description: Powder window medals use country-specific threshold sets, selected via REGION_COUNTRY.
---

Powder windows/medals are judged per country, not one AU set everywhere.

- Sets in `@/types/weather`: AU 0.5cm/hr <25km/h; JP = Japow default 1cm/hr <20km/h; NZ+CA middle 0.75cm/hr <22km/h; all ≥3h ≤+2°C.
- Select via `powderThresholdsForCountry(REGION_COUNTRY[region.id])` — the generic MountainDetail page does this; bespoke pages (Snowy Mountains = AU, Yamanouchi = JP) pass their set explicitly.
- **Why:** an "epic" AU day is ordinary in Hokkaido; AU thresholds made JP/NZ medals meaningless.
- **How to apply:** any new PowderCalendar/HourlyForecast call site must pass country-appropriate thresholds; never hardcode POWDER_THRESHOLDS_AU on a multi-country page. The PowderDetail explainer text renders from the actual thresholds (no hardcoded AU/Japow strings) — keep it that way. weather.ts keeps a local country string union (no @/regions import) for tsx --test safety.
