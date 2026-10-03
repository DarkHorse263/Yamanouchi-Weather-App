# European expansion: initial scope

Prepared 4 October 2026. Research and recommendations only; no new regions
implemented or approved for publication in this pass.

## Austria status

Current authored coverage: Lech Zürs and St Anton am Arlberg, with two
representative resort forecasts and three village pages (Lech, Zürs, St Anton).
This is not nationwide Austrian coverage or full Ski Arlberg coverage.

The six Austria coverage tests pass against the current workspace, including
forecast elevations/timezones, seven-day horizon, scoped region identities,
official-link-only St Anton reports and existing built SEO route outputs.
This is not a new production audit or fresh provider-response test.

The Lech Zürs preparation document records intentionally excluded live snow,
lift and road ingestion and camera embedding. St Anton likewise uses official
report links. Those exclusions must stay visible; an official link is not a
live feed.

Before describing the limited rollout as release-ready again, check current
weather responses/fallbacks, seasonal winter arrival information, source
freshness and mobile rendering. Publication status was not checked here.

## Recommended country pilots, in order

### 1. France: Tignes–Val d’Isère

- Start with Tignes and Val d’Isère destination pages and separately declared
  representative forecast points. Confirm village/sub-village identities from
  official maps before setting the final town count.
- Model the connected ski area without counting the network again as a third
  resort. Do not imply identical conditions across its terrain.
- Official operator source fetched:
  https://www.valdisere.ski/en/ski-area
- Next evidence: official piste map, terrain/base elevations and coordinates,
  distinct snow-report measurement points, winter lift report timestamps,
  seasonal transport and road access, Météo-France avalanche bulletin coverage,
  camera rights and exact viewpoints.
- Next French candidates: Les Trois Vallées, then Chamonix. These are a
  shortlist, not verified inventories. Chamonix needs distinct ski-area
  boundaries and explicit separation of sightseeing/off-piste attractions
  from ordinary lift-served ski terrain.

### 2. Switzerland: Jungfrau

- Official operator source fetched:
  https://www.jungfrau.ch/en-gb/jungfrau-ski-region/
- It explicitly separates Grindelwald–Wengen, Grindelwald–First and
  Mürren–Schilthorn. Use these as candidate ski-area boundaries, not a single
  forecast for all three.
- Candidate base towns: Grindelwald, Wengen and Mürren; assess Lauterbrunnen
  separately as an access base rather than automatically counting a resort.
- Next evidence: per-area terrain elevations, measured snow locations and
  timestamps, winter railway/cableway connections, car-free arrival rules,
  SLF avalanche bulletin links, camera rights and forecast-point suitability.
- Later candidate: Zermatt. Resolve the Swiss/Italian boundary with Cervinia
  before adding shared network counts or linked-access claims.

### 3. Italy: limited Dolomites pilot

- Official umbrella source fetched:
  https://www.dolomitisuperski.com/en/areas
- The operator describes twelve ski areas, not one resort. Start with
  Val Gardena / Seiser Alm and Alta Badia as candidate areas; do not claim all
  Dolomiti Superski coverage.
- Candidate town research: Ortisei, Santa Cristina, Selva, Corvara and
  Colfosco. Validate their actual terrain access before assigning mountains.
- Next evidence: separate sector geography/elevations, Italian/German/Ladin
  name aliases, official lift and snow reporting boundaries, avalanche
  bulletin jurisdiction, seasonal pass access and public transport.
- Cortina is a later candidate, not part of this first pilot.
- Neither the shared pass nor a ski circuit implies that every area is
  continuously ski-connected or reachable by an open winter road.

## Austria expansion alongside new countries

Candidate research order: Sölden, Ischgl, SkiWelt, then other major areas.
This is not an exhaustive Austrian inventory.

Ischgl's official source was fetched:
https://www.ischgl.com/en/winter/silvretta-arena
It explicitly connects Austrian Ischgl with Swiss Samnaun. Scope the Austrian
view honestly and resolve cross-border ownership/counting before suggesting
Swiss coverage. Its page includes summer operating information: open summer
lifts are not evidence of current skiing.

SkiWelt official snow-report source was located in search:
https://www.skiwelt.at/en/snow-report.html
It remains a lead to inspect, not a verified usable feed. Sölden's detailed
source pack remains to be researched.

Existing Arlberg gaps also remain: St Christoph, Stuben, Warth and Schröcken
are not automatically covered by the current two authored regions.

## Shared implementation scope and release gates

For FR, CH and IT, add country support explicitly rather than relying on
unknown-country fallbacks. Audit country types/maps, pickers and offline
fallbacks, search/map discovery, region and weather API registries, schemas and
generated clients, alert anchors and thresholds, radar behaviour, northern
ski seasons, transport registries, navigation, sitemap/prerender/rewrites.
Use Europe/Paris, Europe/Zurich and Europe/Rome respectively and test DST.

For each pilot:
1. Establish canonical area identities, aliases and counting boundaries.
2. Verify sourced terrain elevations; label representative forecast levels
   separately from measured elevations and village weather.
3. Test real weather responses, snowfall phase/elevation consistency,
   timezone/date boundaries, provider failures and alert eligibility.
4. Provide curated winter transport with authoritative road and avalanche
   links. Do not turn bulletin link-outs into inferred safety advice.
5. Start with official links for unsupported snow/lift/camera data. A live
   integration requires permission, measurement scope, timestamps and stale
   behaviour, not just a scrapeable page.
6. Check public mobile/desktop routes, discovery and SEO output. Preserve
   honest unavailable states, account-free powder alerts and consent.
7. Publish only after a separate release decision. Do not announce nationwide
   completeness or invent affiliate programme approval.

## Research limitations

This pass establishes an initial shortlist and verifies the official
geographic boundaries above. It does not establish complete resort
inventories, exact forecast coordinates/elevations, feed licences, current
winter operations or transport timetables. These are evidence-gathering
requirements for the next scoping pass, not facts to populate speculatively.