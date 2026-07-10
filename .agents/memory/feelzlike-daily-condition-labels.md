---
name: feelzlike daily condition labels
description: Daily forecast labels are totals-derived server-side, never the raw WMO daily weather_code description.
---

# Daily condition labels are totals-based, not code-based

**Rule:** Open-Meteo's DAILY `weather_code` is the single most-severe MOMENT of the day, not the day's story. Never surface `getWeatherDescription(daily code)` directly as a day label. All daily `weatherDescription` strings come from the shared server helper `dailyConditionLabel()` (api-server lib), which derives the label from the day's snowfall + rain totals.

**Why:** July 2026 user report ("really bad and serious fault"): a 2.7cm-snow day read "Heavy Snow Fall" while a steady ~16cm day read plain "Snow"/thunderstorm, and a rain-dominant day (9mm rain vs 2.9cm snow) hid the rain entirely behind a snow label. Honesty-first brand: rain on snow is the single most important warning for skiers.

**Label rules (helper):**
- snow < 0.5cm → fallback code description, EXCEPT rain ≥ 2mm with a snow WMO code (71-77, 85, 86) → "Rain" (inverse contradiction).
- snow ≥ 0.5cm: rain ≥ 2mm and rain ≥ snowWater (snow/0.7) → "Rain · snow"; rain ≥ 0.4×snowWater → "Snow · rain"; else snow ≥ 15 → "Heavy snow"; ≥ 4 → "Snow"; else "Light snow".
- Water equivalent = snowCm / 0.7, mirroring client `dailyRainMm()`.

**How to apply:** Any new daily-forecast surface (server route or lib emitting `weatherDescription`) must go through the helper with the day's snowfall_sum + true rain (rain_sum + showers_sum, NOT precipitation_sum). Icons stay code-driven, but the snowy-mountains LocationDetail `displayDayCode` is rain-aware both ways (force snow icon only when snow-led; demote snow codes to rain icon when snow<0.5cm and rain≥2mm). weatherDescription consumers are render-only (safe to reword labels), lowercase at render for brand voice. Behaviour changes here need a sw.js CACHE_VERSION bump.
