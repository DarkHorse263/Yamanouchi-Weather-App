# Europe platform preparation

Task A only. The wave1/wave2 source batches and their candidate universes remain
staged. No records were copied to `data/batches`; the published general catalogue
still contains 159 records. Authored Lech Zürs and St Anton data are unchanged.
The wider country ledger and rollout-readiness documents are unchanged.

## Platform support

The shared country registry supports AT plus FR, CH, IT, DE, AD, ES, NO, SE, FI,
SI, BG, PL, SK, CZ and GB. Country pages, map filters and picker entries remain
publication-gated; registering a country does not advertise empty coverage.
The picker groups Austria and future published European countries under Europe.

Exact-point EU-DEM eudem25m evidence is accepted. Public records expose a summit
only with a cited base and a higher top. Mountain-page and comparison forecasts,
server height admission and catalogue powder alerts support the cited midpoint.
The staged Sölden fixture proves 1350/3340 -> 2345 m without publishing it.
Low-base mountains use their supplied elevations, with no Alpine minimum.

All European countries have explicit northern winter and 0.75 cm/hour powder
policies. Catalogue records retain their own timezone; town-ensemble country
defaults now use European IANA zones rather than Sydney/Tokyo/UTC. Countries
without a dedicated model use the global ensemble, not Australia's model.
Units remain metric by default, respecting explicit preferences. UK road-speed
conventions do not change weather wind units. Billing pricing is unchanged;
CHF/GBP/NOK decisions remain an owner TODO before purchases reopen.

## Official avalanche advice

Outbound links only, with service coverage labels; no inferred avalanche risk.
Checked for HTTP 200 on 9 October 2026:

- https://avalanche.report/ (Tyrol, South Tyrol, Trentino)
- https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/
- https://meteofrance.com/meteo-montagne
- https://aineva.it/en/
- https://lawinenwarndienst.bayern.de/ (Bavaria only)
- https://www.varsom.no/en/
- https://www.lavinprognoser.se/
- https://www.sais.gov.uk/ (Scotland only, not all GB)
- https://lawiny.topr.pl/?language=en (Polish Tatras)
- https://www.laviny.sk/

## Verification

- Root typecheck and production build.
- Workspace package tests and frontend test:all, including Sölden, EU-DEM,
  country policies, lower terrain heights and avalanche coverage tests.
- Generated catalogue check and sitemap/prerender/page-server route parity.
- Country picker preview; no new European resort imports.

Existing test harnesses were updated for the current Clerk hook/query key,
OpenWeather quota guard, named Helmet export and production page server.
The production build needs service environment values when invoked from a
shell; Sentry's existing 401 upload warning remains non-fatal.

No republish is authorised. Task B remains unstarted.
