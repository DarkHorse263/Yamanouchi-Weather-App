# Replit tasks: Europe build (fast track)

The data is already verified and publish-ready. Replit does not need to research anything. There are two tasks: country support first, then the data import.
- Run Task A first, then Task B.
- Each task ends with a GitHub commit and pull request, merged to `main` immediately after publishing.

Unzip `feelzlike-europe-build-pack.zip` at the project root. Its folders match the repo paths:

| Path | What it is |
|---|---|
| `lib/ski-catalogue/data/europe-wave1/` | 5 publish-ready batches (Austria, France, Switzerland, Italy, Germany: 115 resorts) plus the matching `candidate-universe.json` |
| `lib/ski-catalogue/data/europe-wave2/` | 3 publish-ready batches (Andorra/Spain, Nordics, Central/Eastern Europe and Scotland: 39 resorts) plus the cumulative `candidate-universe.json` |
| `docs/coverage/europe/lifecycle-eudem-summit.patch` | Small change to `lib/ski-catalogue/lifecycle.js` (see Task A, step 1) |
| `docs/coverage/europe/Europe-Ski-Resorts-by-Country-and-Region.md`, `europe_ski_resorts.csv` | Reviewable list and every field with source links |

These folders are not read by `generate.mjs` until you copy the files into `data/batches/`. Unzipping is therefore safe and changes nothing on the site.

Every record has:
- lifecycle `published` and classification `verified_operating`
- a 2026-27 season source
- a resort-specific base/top
- an exact OpenStreetMap point with its EU-DEM 25 m terrain height
- its timezone (Europe/Paris, Europe/Zurich, etc.)

I tested both waves against the catalogue generator with the patch applied. Both pass. The only failing test is the hard-coded ledger count, covered in Task B.

---

## Task A: multi-country support (one task, all 15 countries)

Add these country codes in one pass, not one per phase: FR, CH, IT, DE, AD, ES, NO, SE, FI, SI, BG, PL, SK, CZ, GB.

1. **Apply the catalogue patch:** `git apply docs/coverage/europe/lifecycle-eudem-summit.patch`. It does two things.
   - It accepts EU-DEM 25 m (OpenTopoData `eudem25m`, exact stored point) as forecast-elevation evidence, alongside USGS EPQS.
   - It adds `summitElevationM` to the public catalogue projection when a cited base exists and top > base.
   - Add a unit test for both changes.
2. **Snow height for catalogue resorts.** In `artifacts/feelzlike/src/regions/ski-catalogue.ts` (`mountainFor`), pass `summitElevationM: record.summitElevationM`. Also add the field to the `PublicCatalogueRecord` type.
   - Today catalogue mountains only carry a base, so snow is forecast at the base. With the summit, `snowForecastElevation` uses the base–top midpoint.
   - This also improves US and NZ catalogue resorts.
   - Add a test asserting that Sölden resolves to 2345 m (base 1350, top 3340).
3. **Country unions and pickers.** Add the codes everywhere `"AT"` is listed:
   - `regions/index.ts`, `CountryPicker.tsx`, `DesktopHome.tsx`, `CoverageMap.inner.tsx`
   - `types/weather.ts` (`LocationConfig["region"]`)
   - `api-server/src/routes/regions.ts`, the OpenAPI RegionId, `UserPrefsProvider.tsx`
   - `RideshareUnavailableNotice.tsx`, `tripPlanner.ts`, `alertRegionProjection.ts`, `RadarMap.inner.tsx`
   - `scripts/prerender.mjs`, `scripts/seo-regions.mjs`
   - Group them under a "Europe" heading in the picker, with Austria joining that group.
4. **Seasons.** In `skiSeason.ts`, give every new code northern-hemisphere logic. Do not let any new country fall through to the Australian default.
5. **Powder alerts.** Set an explicit threshold per country (the Alpine countries can reuse Austria's). Nordic and Scottish bases sit at 200–700 m, so check that alert copy doesn't assume Alpine heights.
6. **Timezone.** The catalogue weather path already uses `record.timezone`. Check that no other code path (town ensemble, alerts, trip planner) assumes Asia/Tokyo or Australia/Sydney for a non-AU/JP country.
7. **Avalanche link-outs.** Show the official bulletin per country as a link only, with no inferred risk:
   - [avalanche.report](https://avalanche.report/) for Tyrol, South Tyrol and Trentino
   - [SLF](https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/) for Switzerland
   - Météo-France BRA for France
   - AINEVA for Italy
   - Bavarian avalanche service for Germany
   - [Varsom](https://www.varsom.no/en/) for Norway
   - [Lavinprognoser](https://www.lavinprognoser.se/) for Sweden
   - [SAIS](https://www.sais.gov.uk/) for Scotland
   - TOPR for Poland, HZS for Slovakia
   - Confirm each URL before adding it.
8. **Units.** Use metric and °C for all of them. The UK uses mph for road speeds, so check any road or wind copy.
9. **Billing.** Leave currency as it is (euro countries in EUR, others in AUD) and add a TODO. James is deciding CHF, GBP and NOK pricing before purchases reopen.
10. **Checks.** Typecheck, all tests and the production build pass. Nothing in Europe is published yet, so the site looks the same apart from the picker changes. Open a PR, merge it, publish.

## Task B: import the resorts (two waves)

**Wave 1** (Alps: 115 resorts):
1. Copy `lib/ski-catalogue/data/europe-wave1/europe-phase*.json` into `lib/ski-catalogue/data/batches/`.
2. Replace `lib/ski-catalogue/data/candidate-universe.json` with `europe-wave1/candidate-universe.json`.
3. Update the hard-coded ledger counts in `lib/ski-catalogue/test/lifecycle.test.mjs` to candidates 289, records 291, oneToOne 287, splits 2.
4. Run `node lib/ski-catalogue/scripts/generate.mjs`, then the tests, typecheck and the build.
5. Open a PR, merge, publish, and tell James so the smoke test can run.

**Wave 2** (39 resorts), after Wave 1 is live and checked:
1. Copy `europe-wave2/europe-phase*.json` into `data/batches/`.
2. Replace the ledger with `europe-wave2/candidate-universe.json`.
3. Update the test counts to candidates 328, records 330, oneToOne 326, splits 2.
4. Regenerate, test, open a PR, merge and publish.

Rules:
- Keep the existing authored `lech-zuers` and `st-anton` regions exactly as they are. They are not duplicated in the batches.
- Do not change record data to make a test pass. If a record looks wrong, leave it out of the batch and tell James.
- Link-outs only for lift status, webcams, snow reports and avalanche bulletins. No invented live data.

## Before Wave 1 goes live (owner items)

- **Open-Meteo commercial plan.** 154 more mountains plus their villages is a big jump in weather calls. Add a cache warm-up for the busiest resorts.
- **OWM key rotation and `BILLING_ORIGIN`** are still open from the last review.

## Done means

1. Every new resort page loads with live weather, the right country, region and breadcrumb, and the correct local time, on mobile and desktop.
2. The snow height in the weather API equals the base–top midpoint, for example Sölden 2345 m and Val Thorens 2528 m.
3. `/countries`, `/alerts`, `/premium`, search and the sitemap all show the same counts.
4. The PR is merged to GitHub `main` and the site is republished.
