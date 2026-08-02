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
