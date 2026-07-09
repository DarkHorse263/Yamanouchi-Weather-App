---
name: feelzlike resort-reported snow depth
description: Reported-vs-model snow depth seam, always-200 snow-report endpoint contract, Thredbo XML pilot, strict-parse honesty rules
---

# Resort-reported snow depth (Thredbo pilot)

## The seam
- `GET /api/weather/:locationId/snow-report` — adapter registry in api-server `lib/resortSnowReports.ts`, keyed by LOCATIONS id (pilot: `thredbo`). A reported base REPLACES the model snow-depth stat on detail pages ("snow depth · resort reported · Xh ago") and flows into skiability + LiftWindHoldPanel as `snowDepthCm` + `snowDepthSource:"reported"`.
- Only a REPORTED base may honestly assert `no_base` — the model depth is snowmaking-blind and stays advisory. `deriveSkiableNowRead` carries `baseSource` so the chip caption reads "Base Xcm · resort reported".
- Phase-1 links: `snowReportUrl` on MountainLink (region configs, AU+NZ; JP has none on purpose) rendered via `SnowReportLink` on both snowy-mountains LocationDetail and generic MountainDetail.

## Contract rules (don't break)
- **Always 200**: the endpoint returns `{locationId, report:null}` for no-adapter / unknown id / zod failure / parse failure / stale feed. **Why:** the shared client fetch throws on non-2xx and the hook runs on EVERY resort page — a 404/500 here would error every detail page.
- **Strict parse, never 0-default**: `units="metric"` required, `<base amount>` must be present + numeric. Reported `0` is a real value and must surface (client branches on the report OBJECT, never on `baseCm` truthiness).
- **36h feed-age guard at SERVE time** against the feed's own `updated` timestamp — a cached-fresh-but-feed-stale report still degrades to null.
- **Failure backoff**: fetch failures set a 60s negative-cache (`lastFailureAt`) so an outage past the 30min TTL doesn't hold every request for the 10s timeout. Parse-nulls are NOT failures (feed answered) and cache for the full TTL.
- Serve-stale ≤24h applies only to fetch rejections, never to parse failures (honest choice: a malformed 200 replaces the cache with null).

## How to add a resort
Add an adapter entry (feedUrl + parse) in resortSnowReports.ts — no route/client changes needed; pages already call the hook everywhere and degrade to model when report is null. Thredbo feed shape: `<snowReport updated units="metric"><mountain><base amount/><season/><snow24Hours/>`.
