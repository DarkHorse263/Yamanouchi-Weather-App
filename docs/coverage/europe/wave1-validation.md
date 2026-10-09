# Europe Wave 1 validation

Scope: Task B, Wave 1 only. No deployment is authorised.

## Import

The five Wave 1 files were copied byte-for-byte into the active batch directory:
Austria 32, France 34, Switzerland 21, Italy 21 and Germany 7 (115 resorts).
The Wave 1 candidate ledger replaces the active ledger:
289 candidates, 291 records, 287 one-to-one mappings and 2 splits.
The generated general catalogue now contains 274 published records.

Wave 2 remains staged. No source records, authored Lech Zürs/St Anton region
files, wider country ledger or rollout-readiness document were changed.

## Follow-up corrections

European lift-season checks now include 1 November through 15 May.
Boundary tests cover 31 October, 1 November, 15 May and 16 May for all
European country codes. This is a seasonal eligibility window, not a
claim that any resort's lifts are operating.

Provincial avalanche links remain outbound advice only:

- Vorarlberg: https://warnung.vorarlberg.at/vtgdb/dist/index.html#//lwd_lagebericht_en.html
- Salzburg: https://lawine.salzburg.at/
- Carinthia: https://lawinenwarndienst.ktn.gv.at/
- Styria: https://lawine-steiermark.at/

Checked on 9 October 2026. Vorarlberg, Salzburg and Styria returned HTTP 200.
Carinthia's official URL was identified, but repeated requests timed out and
the independent fetch service also failed. Its availability remains
unconfirmed; no substitute or inferred risk was introduced.

## Verification

- Root typecheck and production build passed.
- Workspace test suites passed (API: 344 passed, one skipped).
- Frontend test:all passed: 355 Node tests, four TripPlanner tests and route parity.
- Two alert-evaluator job tests passed.
- Catalogue generator validation passed.
- All 115 active source files/projections are tested against the unchanged
  supplied Wave 1 source records; Wave 2 countries remain absent.
- Route parity checks cover 573 catalogue mountain routes across the combined
  catalogues; production generation produced 3,246 snapshots and 4,342 exact routes.
- Live development weather API checks returned seven daily forecasts for Sölden
  and Val Thorens, with snowfallOutlookElevationM 2345 and 2528 respectively.
- Val Thorens mobile and Sölden desktop previews load real weather and metric units.
- Service-worker cache version advanced so installed apps refresh their region
  lists when the owner eventually publishes.

Production build's existing Sentry upload 401 warning remains non-fatal.
No new live lift, webcam or snow-report feeds were introduced.
Owner pre-launch provider/key/billing and cache warm-up items in the brief
remain prerequisites for a later release, not permission to republish now.
