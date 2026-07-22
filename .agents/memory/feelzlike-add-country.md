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
- `artifacts/feelzlike/src/components/home/CountryPicker.tsx` — both
  `FALLBACK_REGIONS` and `PRIMARY_TOWN` (shared by the landing `Welcome.tsx` and
  the `/countries` page).
- `artifacts/feelzlike/src/components/AlertSubscribeForm.tsx` — its own hardcoded
  `REGIONS` array (id/nameEn/nameJa/country) drives the powder-alert opt-in
  tickboxes. It is NOT typed against RegionId, so a missing region silently just
  vanishes from the form (no compile error) even though the backend evaluator
  (REGION_ANCHORS) and subscribe validation (REGION_IDS) already accept it. This
  is how the form drifted to only 3 of 10 live regions. JA names use the formal
  municipal suffix for JP towns (山ノ内町/野沢温泉村/飯山市); katakana for AU/NZ.
- `RadarMap.inner.tsx` keeps its OWN local `RegionKey` union + REGION_CONFIG /
  REGION_DEFAULTS / REGION_COUNTRY / COUNTRY_LABEL / REGION_LABEL (self-contained
  by design — duplicated on purpose).
- `artifacts/feelzlike/scripts/seo-regions.mjs` — the SEO registry feeding
  generate-sitemap.mjs, prerender.mjs and generate-rewrites.mjs. Miss it and the
  new region gets NO sitemap URLs, prerendered snapshots or edge rewrites at the
  next publish. It's a `.mjs` under `scripts/`, so a `grep -rl` file-set diff
  limited to `*.ts/*.tsx` under `src/` will NOT catch it — include `scripts/`
  and `*.mjs` in the completeness check. After adding the block, re-run
  `node scripts/generate-sitemap.mjs`, AND — critical — splice the output of
  `node scripts/generate-rewrites.mjs` into
  `.replit-artifact/artifact.toml` (the script only PRINTS the block to
  stdout, it writes nothing; running it is not enough). Missing rewrites =
  the edge catch-all serves homepage HTML (homepage canonical/title) for every
  new-region URL in production → GSC "Alternative page with proper canonical
  tag" on sitemap URLs. Then re-publish.
- After editing `openapi.yaml` RegionId enum: run
  `pnpm --filter @workspace/api-spec run codegen`.
- After the region files land: re-run
  `node artifacts/feelzlike/scripts/generate-link-manifest.mjs` so the nightly
  smoke test knows the new region's external links (it writes
  api-server/src/data/external-links.json).

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
- `FALLBACK_REGIONS` in components/home/CountryPicker.tsx is a DELIBERATELY PARTIAL degraded-mode
  safety net (shown only when `/api/regions` fails). It does not list every
  region — do not "fix" it to be exhaustive.

## Adding a region WITHIN an existing country (Niseko precedent)
- Fastest completeness check: pick the closest precedent region (e.g. myoko for a
  JP region) and diff `grep -rl <precedent>` vs `grep -rl <new>` in both
  artifacts' src — the file sets must match (minus precedent-local files like
  yamanouchi map styling).
- JP towns need NO weather.ts LOCATIONS entries (town weather is coordinate-based
  via useTownWeather); only mountains get LOCATIONS rows.
- `weather-tiles.ts JAPAN_CITIES` has a big-cities section at the TOP (Sapporo,
  Aomori, Nagano...) before the ski-town rows. Check it before adding a town
  tile — a duplicate key (e.g. aomori) ships twice in /api/japan-temps and
  renders stacked markers + duplicate React keys on the yamanouchi map.
- Mountain detail routes are REGION-level (`/{region}/mountain/{id}`), not
  town-scoped — a town-scoped URL silently falls through to the region home.

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

## Roads & transport for a no-live-feed country (NZ pattern)
When a country has no free public per-road feed, replicate the yamanouchi
("dataAvailable:false") pattern rather than wiring a live scrape:
- Chain statuses: add region branches in `roads.ts buildChainStatuses` with
  `dataSource:"seasonal-rule"`, `status:"open"`, and an in-season=`must-carry`
  helper (NZ: `isNzSnowSeason`, Jun10-Oct10). Each official road authority is the
  `sourceLabel`/`sourceUrl`. Keep the season helper SEPARATE per hemisphere so
  rule text never implies another country's authority.
- Cams: ONE honest tile per region in `webcams.ts` (`{region}-roads`,
  `webcams:[]`, `webcamPageUrl` = the official interactive map e.g. NZTA
  journeys/regions/<region>). Never fabricate per-camera JPG URLs/IDs when the
  source map has no stable deep-links.
- Wire `{region}-roads` into `LOCATION_TO_REGION`, add the region to
  `navContent.ts REGIONS_WITH_ROADS_CONTENT`, and add `roadsSource{...,
  dataAvailable:false}` to each region config.
- Transport: verified operators only, `phone`/`website`/`schedule_url` = null when
  unverified (never guess). Provider `id`s must be globally unique (prefix by
  country, e.g. `nz-`) and `regions[]` must include the registry key or the
  loader-time guard throws. `winter_only` hides ski shuttles in the green-season
  toggle; year-round coaches/airport transfers omit seasonality.

**Honesty gate (applies to ALL regions, not just the new one):** `TownRoads`
must not claim road data is "live" unless it actually is. Both the PageHeader
description AND the empty-state copy gate on `dataAvailable` / a
`hasLiveChainData = chainStatuses.some(dataSource==="live")` check. Before this
was added, JP regions falsely advertised "updates live" on seasonal/pending data.

**Route paths:** the api-server mounts all routers at `/api` directly, so the
endpoints are `/api/road-conditions` and `/api/webcams` (NOT `/api/roads/...`).
