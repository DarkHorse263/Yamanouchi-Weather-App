---
name: feelzlike snowmaking
description: How the man-made-snow / snowmaking feature is modelled and why it stays client-side only.
---

# feelzlike snowmaking

AU resorts run largely on man-made snow, so showing only natural snowfall misrepresents reality. Snowmaking is modelled as TWO honest layers:

1. **Computed window** — wet-bulb temperature (Stull 2011) decides whether CONVENTIONAL guns can run. Wet-bulb (not air temp) is the deciding number: high humidity can read "too warm to make snow" even at sub-zero air temp. That counter-intuitive result is the whole point of the feature, not a bug. Buckets: good <= -5, marginal <= -2, too_warm > -2.
2. **Curated capability** — per-resort facts, incl. all-weather snow factories that make snow up to ~15-20°C regardless of cold. Conventional-only resorts (e.g. perisher) have no all-weather areas. Coverage spans EVERY active AU + NZ resort that genuinely makes snow; **Japan is deliberately excluded** (owner decision). Genuinely all-weather (factory area, not just guns): thredbo (friday flat), mt buller (5 technoalpin factories, up to ~15°C), coronet peak (S.Island's first snow factory, up to ~20°C). Honesty rule: only flag a resort all-weather if it actually runs a snow factory, not merely lots of conventional guns (e.g. the remarkables/cardrona = conventional, NOT all-weather).

**Why client-side only:** the resort page's location-weather hook already returns current temp+humidity and hourly temp+humidity, so the whole feature computes in the browser.
**Why:** no backend / OpenAPI / codegen / project-reference changes is the lowest-risk path on a live, manually-republished app.
**How to apply:** do not add a backend endpoint for snowmaking unless a future layer genuinely needs server-only data.

**Constraints to preserve:**
- The pure logic module must stay import-free (tsx --test isolation — see feelzlike-tsx-test-isolation).
- Wet-bulb MUST be clamped to <= dry-bulb air temp: the Stull approximation overshoots slightly at the cold, very-dry corner (returns a value just above air temp, which is physically impossible). Inputs guarded with `Number.isFinite` (rejects NaN and +/-Infinity).
- Curated capability is keyed by the kebab location id (matching the URL param) across all AU+NZ resorts — not a snake dataset slug.
- Panel is FREE (not premium-gated) and winter-only (shares the lift/dials season gate); it self-hides where no curated data exists, so it is safe to mount unconditionally.
- SnowmakingPanel is a SHARED component (src/components/weather/), mounted by BOTH the snowy-mountains LocationDetail and the generic region MountainDetail. Do not fork it back into a region folder.
- In the generic MountainDetail, hourly is passed `as any` (same as HourlyForecast/PowderCalendar there): that page's local weather type narrows `hourly` and drops `humidity`, even though the runtime endpoint AND generated schema include it. The cast is safe because wetBulbC/bestSnowmakingWindow null-guard missing humidity. The snowy-mountains LocationDetail does NOT need the cast (its hourly type keeps humidity).

**Why placed after the hourly strip:** snowmaking viability is a "right now / next 24h" operational read, so it belongs with current conditions, not buried below the multi-day forecasts.
