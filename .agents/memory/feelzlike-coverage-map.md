---
name: feelzlike world coverage map
description: home-page world map pin data + routing rules; promo funnel counters; premium prompts
---

# world coverage map (home page)

- `components/home/CoverageMap.tsx` (lazy + error boundary w/ hard-reload retry) + `CoverageMap.inner.tsx` (Leaflet, in-repo, never iframe).
- Pin catalogue: `region-pins.ts` (extracted PURE from RadarMap.inner's REGION_DEFAULTS so tests can import it without leaflet/PNG assets).
- **Routing rule**: town pins → `/:region/:town`; mountain pins → `/:region/mountain/:id`; umbrella pins (shiga-kogen, kita-shiga) resolve `null` and must stay NON-clickable — `/:region/:mountainId` silently redirects to region home (town-first router).
- `resolvePinRoute.ts` is the single resolver; `resolvePinRoute.test.ts` asserts every pin in the catalogue resolves against its region config. Keep pins and region configs in sync or the test fails.
- Region count caption is computed from the registry, never hardcoded.

# promo funnel first-party counters (#17)

- `promo_funnel_daily(day,event,count)` upsert-increment via POST `/api/promo/event` (anonymous, no identifiers, NOT consent-gated — counts read HIGHER than GA by design). Admin stats payload exposes `promoFunnel`.

# premium prompts

- `PremiumFeaturePrompt` is localStorage-dismissable and hidden for signed-in users; mounted sparingly (MountainDetail, TripPlanner). Promo window default now lives ONCE in `lib/promo-constants` (consumed by api-server promo.ts + shell usePremium.ts) — never reintroduce duplicate date literals.

## Coordinate registries duplicate per id (verified Aug 2026)
Every mountain/town id's lat/lng is duplicated across up to 5 places that must agree: `regions/region-pins.ts`, the region file (`regions/<region>.ts` mountains + baseTowns), api-server `routes/weather.ts` LOCATIONS, `jobs/alertEvaluator.ts` anchors, and sometimes `routes/regions.ts`.
**Why:** Aug 2026 audit found ~29 Japan coords copy-drifted 2-11km wrong (Togari, Madarao, Tangram, Kijimadaira, Sapporo Kokusai, Shizukuishi, Hachimantai, Hakuba Goryu/47/Iwatake, Furano etc.) — wrong pins AND wrong forecast points.
**How to apply:** when changing any coordinate, grep the literal value repo-wide and fix all copies. Verify against OSM winter_sports features (photon.komoot.io geocoder works; Nominatim rate-limits fast). AU/NZ/CA audited same pass: only Selwyn (~9km) and Tremblant (off-mountain) were wrong, both fixed; other flags were geocoder noise.

## Pacific-centred rendering (Aug 2026)
The home coverage map shifts western-hemisphere longitudes +360 (pacificLng) so Canada sits east of Japan on ONE world copy; maxBounds [[-58,90],[78,330]] + viscosity 1 stops panning into the empty duplicate copy (the old fitBounds world view opened on Africa on mobile; desktop showed a pinless second copy). Keep tile wrapping ON (no noWrap) or tiles beyond 180 go blank. Country chips flyToBounds via REGION_COUNTRY; a region missing from REGION_COUNTRY silently drops its pins (dev-only console.warn guards this). Overlay chips/legend need z-index above leaflet controls (z-[1001]).
