---
name: feelzlike resort-reported snow depth
description: Reported-vs-model-vs-course snow depth seam, always-200 snow-report endpoint contract, in-season model suppression, strict-parse honesty rules
---

# Resort-reported snow depth (Thredbo + Falls Creek + Mt Hotham + Snowy Hydro course)

## The seam
- `GET /api/weather/:locationId/snow-report` — adapter registry in api-server `lib/resortSnowReports.ts`, keyed by LOCATIONS id (`thredbo` XML, `falls-creek` JSON, `mt-hotham` HTML scrape, `perisher`+`charlottes-pass` Snowy Hydro course JSON). A report REPLACES the model snow-depth stat on detail pages and flows into skiability + LiftWindHoldPanel as `snowDepthCm` + `snowDepthSource`.
- `ResortSnowReport.kind: "resort" | "course"` (optional in OpenAPI for cache back-compat; absent = resort). **"course"** = official OFF-RESORT weekly measurement (Snowy Hydro Spencers Creek 1830m, serves Perisher + Charlotte Pass). Course may DISPLAY a base but may NEVER assert `no_base`/`no_snow` — natural-snow-only, off-site, up to a week old. Only `"reported"` (the resort's own figure) may force the negative; model never does either.
- Course caption = source name + reading DATE (`21 July`), never "Xd ago" (weekly cadence would read stale). Date label must pin `timeZone: "Australia/Sydney"` or overseas viewers see the previous day.
- **In-season model suppression** (architected, applies AU+NZ now, JP in their winter): when `isLiftSeasonOpen` and there is no report, detail pages show "Snow depth · not reported" + "-" and pass `snowDepthCm: null` into skiability (unknown, not a confident wrong ~0). Off-season the model figure returns (melt curve is fine to show). 3 seams per page (stat display, HourlyForecast skiability, LiftWindHoldPanel) in BOTH generic MountainDetail.tsx and snowy-mountains LocationDetail.tsx — keep them in lockstep.
- Selwyn deliberately has NO course adapter: nearest course (Three Mile Dam) reads ~0 natural while Selwyn runs on snowmaking — a course figure there would be honestly wrong.

## Contract rules (don't break)
- **Always 200**: the endpoint returns `{locationId, report:null}` for no-adapter / unknown id / zod failure / parse failure / stale feed. **Why:** the shared client fetch throws on non-2xx and the hook runs on EVERY resort page — a 404/500 here would error every detail page.
- **Strict parse, never 0-default**: reported `0` is a real value and must surface (client branches on the report OBJECT, never on `baseCm` truthiness). Course parser: quality "G" only, strict course-name match, latest timestamp wins, feed timestamps without a zone get `+10:00` appended (never treated as UTC), row-date fallback = local noon AEST.
- **Freshness guard at SERVE time** against the feed's own timestamp: default 36h (`MAX_REPORT_AGE_MS`), per-adapter override `maxAgeMs` (courses use ~10 days). `buildFeedUrl()` exists for date-parameterised URLs (Snowy Hydro getData.php is year-parameterised).
- **Failure backoff**: fetch failures set a 60s negative-cache so an outage doesn't hold every request for the 10s timeout. Parse-nulls are NOT failures (feed answered) and cache for the full TTL. Serve-stale ≤24h applies only to fetch rejections, never parse failures.
- Any response-shape change here must bump sw.js CACHE_VERSION (endpoint rides the SW catch-all SWR).

## How to add a resort
Add an adapter entry in resortSnowReports.ts — no route/client changes needed; pages already call the hook everywhere and degrade honestly when report is null. Feed shapes vary per resort:
- Thredbo XML: `<snowReport updated units="metric"><mountain><base amount/>...`.
- Falls Creek JSON: numbers may arrive as strings — coerce strictly, blank string = null never 0.
- Mt Hotham: HTML scrape (label-anchored regexes + a parseable page timestamp mandatory). Scrapes ROT when the site restructures: a parse failure honestly serves null, so a resort silently losing its pill is the rot signal — re-verify markup, don't loosen the parse.
- Snowy Hydro course JSON: `{year: {snowyhydro: {level: [{-date, snow: obj|array of {-name,-quality,-dataTimestamp,#text}}]}}}` — lake-level rows have no `snow` key; use `makeSnowyHydroCourseParser(courseName)`.
- Mt Buller / Perisher own feeds: no machine-readable source found (re-checked Jul 2026); Perisher now rides the course, Buller shows "not reported" in season.
