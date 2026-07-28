---
name: feelzlike adding a region
description: Full registry checklist for adding a new ski region (learned adding Appi & Shizukuishi, July 2026) — including the two easy-to-miss frontend maps.
---

# Adding a region — every registry that must be touched

**Rule:** a new region touches ~15 places. Grep an existing sibling region id (e.g. `hakkoda-aomori-spring`) across the whole repo and mirror EVERY hit.

Frontend (`artifacts/feelzlike`): `src/regions/<id>.ts` + `regions/index.ts` (REGIONS + REGION_COUNTRY), `data/lifts/<id>.ts` + `data/lifts.ts`, `data/transport/<id>.ts` + `transport/index.ts`, `components/home/CountryPicker.tsx` (FALLBACK_REGIONS + PRIMARY_TOWN), `pages/region/TownHome.tsx` MOUNTAIN_TINTS, `scripts/seo-regions.mjs`, `public/sitemap.xml`.

API server: `lib/regions.ts` (REGION_IDS + LOCATION_TO_REGION incl `<id>-roads`), `routes/weather.ts` LOCATIONS (mountains only, towns are not in it), `routes/regions.ts`, `routes/weather-tiles.ts` JAPAN_CITIES (JP), `jobs/alertEvaluator.ts` REGION_ANCHORS, `app.ts` region/town name map.

Spec: `lib/api-spec/openapi.yaml` RegionId enum → `pnpm --filter @workspace/api-spec run codegen` (frontend transport typing fails without it).

**Easy to miss (both caught only by code review):**
- `src/regions/snowy-mountains/components/RadarMap.inner.tsx` — region key union + windy/official config + pins map + country map + label map. TownWeather force-casts region.id, so a missing entry breaks the radar panel at runtime with no type error.
- `src/components/AlertSubscribeForm.tsx` ALERT_REGIONS — otherwise the region can't be picked for snow alerts even though the backend supports it.

**Naming:** if a town and resort share a name, suffix the mountain id `-resort` (zao-onsen/zao-onsen-resort, shizukuishi/shizukuishi-resort). Verify all resort facts independently (Japan bible has known wrong rows); coords/elevations cross-checked via Open-Meteo geocoding/elevation APIs.
