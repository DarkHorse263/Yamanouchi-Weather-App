# feelzlike · Japan rollout one-pager

Reference point as of 06 Jul 2026. feelzlike is an AU + JP + NZ ski-weather PWA
(pnpm monorepo: `feelzlike` web at root, `api-server` at `/api`, `mockup-sandbox`).
Goal: full hand-curated coverage of all Japanese ski resorts (500+), phased,
Nagano first, every resort matching Yamanouchi fidelity. Honesty-first: only
publish publicly-verifiable data, degrade rather than fabricate.

## Where we are (11 regions live)

| Country | Regions live | Notes |
|---|---|---|
| Australia | snowy-mountains, victorias-high-country, tasmania | BOM obs + radar |
| Japan (Nagano) | yamanouchi, nozawa-onsen, iiyama, **hakuba-valley** | Open-Meteo + JMA; JMA AMeDAS obs reconcile |
| New Zealand | queenstown, wanaka, mt-hutt, ruapehu | Open-Meteo (+ OWM fallback); NZTA live roads |

Japan detail:
- **yamanouchi** — Shiga Kogen interconnected cluster (~19 resorts) + towns. First region, the fidelity template.
- **nozawa-onsen** — single village resort.
- **iiyama** — 5 resorts (Madarao, Tangram, Togari, Kijimadaira, Kijima Snow Park).
- **hakuba-valley** — 10 resorts across 3 towns (Hakuba / Otari / Omachi). Newest, done end-to-end.

## Japan rollout: what's next

Nagano carve, one region per batch, checkpoint after each:

1. myoko (Niigata label, borders Nagano)
2. sugadaira-ueda
3. iizuna-togakushi
4. karuizawa-saku
5. yatsugatake-tateshina
6. matsumoto-norikura
7. kiso-ontake
8. south-nagano

After Nagano: expand prefecture-by-prefecture toward the full 500+ (Niigata proper,
Hokkaido, Gunma, Yamagata, Gifu, Tohoku, etc.), same per-region checklist.

## Per-region build checklist (the wiring, correctness-gated)

1. Research dossier: coords, base/summit elevation, JA names, official URLs, verified against official sites (not aggregators).
2. `feelzlike/src/regions/{slug}.ts` — towns-first hard rule; `parentId` for one-ticket clusters.
3. `feelzlike/src/regions/index.ts` — REGIONS + REGION_COUNTRY.
4. `lib/api-spec/openapi.yaml` RegionId enum, then run api-spec codegen (never hand-edit generated files). After codegen, rebuild lib decls: `pnpm exec tsc -b lib/api-zod lib/api-client-react`.
5. `api-server/src/lib/regions.ts` — REGION_IDS + LOCATION_TO_REGION must map every mountain id, town id, and `{slug}-roads`.
6. `api-server/src/routes/regions.ts` headline entry + `routes/weather.ts` LOCATIONS (one per mountain).
7. `api-server/src/jobs/alertEvaluator.ts` REGION_ANCHORS (anchor lat/lng/elevation + displayName).
8. `feelzlike/src/data/transport/{slug}.ts` + register in `transport/index.ts` REGISTRY (loader throws on missing key, duplicate id, or non-self-referencing region; null unverified fields).
9. `feelzlike/src/pages/Countries.tsx` — FALLBACK_REGIONS + PRIMARY_TOWN.

### Two silent-break traps (not typed against RegionId, no compile error)

These do NOT fail typecheck and the server-side registry test cannot see them.
Missing them breaks the live app quietly, so update them every time:

- **`feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx`** — its own local `RegionKey` union + 5 records (REGION_CONFIG, REGION_DEFAULTS, REGION_COUNTRY, REGION_LABEL, and the pins). A missing region throws on that region's town weather page ("radar unavailable" forever).
- **`feelzlike/src/components/AlertSubscribeForm.tsx`** ALERT_REGIONS — drives the powder-alert opt-in tickboxes. A missing region silently vanishes from the form even though the backend already accepts it.

## Quality gates before each checkpoint

- `pnpm --filter @workspace/api-server run typecheck` (EXIT 0)
- `pnpm --filter @workspace/feelzlike run typecheck` (EXIT 0)
- `pnpm --filter @workspace/api-server run test` (registry test + obs tests green)
- Load `/jp`, the region home, a mountain detail (live weather), and a town weather page (radar renders with pins)

Note: root `pnpm run typecheck` short-circuits on a pre-existing unrelated
anthropic-lib error, so validate the two artifacts directly (above).

## Key references

- Plan: `.local/session_plan.md`
- Full add-region checklist + gotchas: `.agents/memory/feelzlike-add-country.md`
- Registry-consistency test: `api-server/src/lib/__tests__/regionRegistry.test.ts`
- Brand voice: `.agents/memory/feelzlike-brand-voice.md` (lowercase, middot ·, no em/en dashes, no emojis)
