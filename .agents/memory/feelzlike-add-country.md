---
name: feelzlike adding a country/region
description: The full set of registries to touch when adding a country or region, plus two non-obvious validation gotchas.
---

# Adding a country/region to feelzlike

The header comment in `artifacts/api-server/src/lib/regions.ts` lists a
"keep in sync" set (REGION_IDS, openapi RegionId enum, routes/regions.ts
REGIONS, weather.ts LOCATIONS, alertEvaluator.ts REGION_ANCHORS, frontend
regions/index.ts). That list is REAL but INCOMPLETE.

Also required, not in that comment:
- Frontend transport registry `artifacts/feelzlike/src/data/transport/index.ts`
  — an exhaustive `Record<RegionId, ...>` that THROWS at module load if a key
  is missing. New regions with no curated transport still need a `[]` entry.
- `artifacts/feelzlike/src/pages/Countries.tsx` — both `FALLBACK_REGIONS` and
  `PRIMARY_TOWN`.
- `RadarMap.inner.tsx` keeps its OWN local `RegionKey` union + REGION_CONFIG /
  REGION_DEFAULTS / REGION_COUNTRY / COUNTRY_LABEL / REGION_LABEL (self-contained
  by design — duplicated on purpose).
- After editing `openapi.yaml` RegionId enum: run
  `pnpm --filter @workspace/api-spec run codegen`.

**Why:** several exhaustive `Record<RegionId>` maps live outside the documented
sync set; a full monorepo typecheck is the only reliable way to surface them
(the transport one fails compile; a missed one would throw at runtime).

## Validation gotchas

- `pnpm run typecheck` (root) SHORT-CIRCUITS on a PRE-EXISTING, unrelated failure
  in `lib/integrations-anthropic-ai` ("Cannot find type definition file for
  'node'"). The `&&` chain means your artifact typechecks never run. To validate
  your own changes: `tsc --build lib/api-zod lib/api-client-react lib/feelzlike-shell`
  (rebuild decls after codegen), then typecheck artifacts directly with
  `pnpm --filter @workspace/api-server run typecheck` and
  `pnpm --filter @workspace/feelzlike run typecheck`.
- `FALLBACK_REGIONS` in Countries.tsx is a DELIBERATELY PARTIAL degraded-mode
  safety net (shown only when `/api/regions` fails). It does not list every
  region — do not "fix" it to be exhaustive.

## NZ specifics (the third country, added southern-hemisphere)
- No national obs feed wired (unlike AU BOM / JP JMA AMeDAS): `bom*` fields blank,
  no obs reconciler. Open-Meteo primary + OpenWeatherMap fallback.
- timezone `Pacific/Auckland`; forecast 14d via the existing non-JP branch of
  `forecast_days` (no code change needed — NZ just isn't "JP").
- Ensemble: NZ has no national model, so map `location.region === "NZ"` →
  ensemble `"OTHER"` (global blend). alertEvaluator REGION_ANCHORS region is also
  `"OTHER"`.
- weatherSource label is `Open-Meteo` (do NOT imply MetService integration). The
  radar "official" link-outs to MetService rain radar are a separate UI element
  (parallel to JP→JMA), not a data-source claim.
