---
name: feelzlike snowmaking
description: How the man-made-snow / snowmaking feature is modelled and why it stays client-side only.
---

# feelzlike snowmaking

AU resorts run largely on man-made snow, so showing only natural snowfall misrepresents reality. Snowmaking is modelled as TWO honest layers:

1. **Computed window** — wet-bulb temperature (Stull 2011) decides whether CONVENTIONAL guns can run. Wet-bulb (not air temp) is the deciding number: high humidity can read "too warm to make snow" even at sub-zero air temp. That counter-intuitive result is the whole point of the feature, not a bug. Buckets: good <= -5, marginal <= -2, too_warm > -2.
2. **Curated capability** — per-resort facts, incl. all-weather snow factories (e.g. thredbo's friday flat unit) that make snow up to ~20°C regardless of cold. Conventional-only resorts (e.g. perisher) have no all-weather areas.

**Why client-side only:** the resort page's location-weather hook already returns current temp+humidity and hourly temp+humidity, so the whole feature computes in the browser.
**Why:** no backend / OpenAPI / codegen / project-reference changes is the lowest-risk path on a live, manually-republished app.
**How to apply:** do not add a backend endpoint for snowmaking unless a future layer genuinely needs server-only data.

**Constraints to preserve:**
- The pure logic module must stay import-free (tsx --test isolation — see feelzlike-tsx-test-isolation).
- Wet-bulb MUST be clamped to <= dry-bulb air temp: the Stull approximation overshoots slightly at the cold, very-dry corner (returns a value just above air temp, which is physically impossible). Inputs guarded with `Number.isFinite` (rejects NaN and +/-Infinity).
- Curated capability is keyed by the kebab location id (thredbo/perisher), matching the URL param — not a snake dataset slug.
- Panel is FREE (not premium-gated) and winter-only (shares the lift/dials season gate); it self-hides where no curated data exists, so it is safe to mount unconditionally.

**Why placed after the hourly strip:** snowmaking viability is a "right now / next 24h" operational read, so it belongs with current conditions, not buried below the multi-day forecasts.
