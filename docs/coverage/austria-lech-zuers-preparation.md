# Austria: Lech Zürs preparation

Prepared 12 September 2026. Implementation approved 15 September 2026 (Sydney). Publication remains a separate owner action.

## Initial scope

The owner confirmed Lech Zürs am Arlberg as the first Austrian destination.
Proposed country code: AT; region ID: lech-zuers; timezone: Europe/Vienna.
Start with the Lech and Zürs destination areas. Establish mountain/sector identities from the official trail map before choosing forecast points or counting resorts.
Do not count the entire interconnected Ski Arlberg network as Lech Zürs coverage.
St. Anton, St. Christoph, Stuben, Warth and Schröcken are not included in this initial scope.

## Verified official sources

Retrieved 12 September 2026:

- Season: https://www.skiarlberg.at/en/lech-zuers/tickets-season-times/season-times
  - Published winter dates: 2 December 2026 to 18 April 2027, limited operation possible.
  - These are planned dates, not evidence of current ski operations.
- Arrival: https://www.skiarlberg.at/en/lech-zuers/getting-here-parking
  - Access via Arlbergstraße and Flexenpassstraße.
  - Approach via Warth described for summer only. Do not route winter arrivals that way without current official confirmation.
  - Langen am Arlberg railway station: regional bus 750 via Stuben and Zürs to Lech.
  - St. Anton am Arlberg railway station: regional bus 760 via St. Christoph and Zürs to Lech.
  - Verify seasonal timetables before launch; do not promise fixed journey times or departures.
- Road report: https://www.lechzuers.com/en/live-infos/road-report
  - Lists separate Arlbergpass, Stuben–Alpe Rauz, St. Christoph–Alpe Rauz, Alpe Rauz–Zürs, Zürs–Lech and Lech–Warth corridors.
  - September passability is not a winter route guarantee. No reliable observation timestamp established in this preparation.
- Lift/piste source: https://www.lechzuers.com/en/winter/lifts-and-ski-slopes
- Snow report: https://www.lechzuers.com/en/snow-report
  - Mixed Intermaps content: summer lifts running, zero open ski kilometres, empty snow fields.
  - Avalanche output conflicts within the same extracted page (Level 3 and a summary of 0).
  - Do not ingest avalanche values, treat blank snow as zero, or interpret summer lifts as skiable-now.
- Official webcams entry point linked by the road report: https://www.lechzuers.com/en/live-infos/webcams
  - Individual cameras, vantage points, embedding permission and refresh behaviour remain to be verified.

## Content still needed before launch

### Additional official evidence checked for implementation

- https://www.skiarlberg.at/en/lech-zuers/winter/ski-region identifies Lech Zürs as a distinct ski region within Ski Arlberg. It lists village elevations Lech 1,450 m, Oberlech 1,750 m, Zürs 1,717 m and the Madlochjoch ski link at 2,450 m. Network-wide trail/lift totals on this page must not be attributed to the pilot.
- https://warnung.vorarlberg.at/vtgdb/dist/index.html is the Vorarlberg authority's warning portal. The English avalanche bulletin is linked at `#//lwd_lagebericht_en.html`. Use as a link-out only: its landing-page date is not a current bulletin timestamp.
- Initial counting decision: one combined Lech Zürs resort coverage entry, two village entries, one region. Do not count peaks or sectors as extra resorts. The forecast is a representative point with explicitly defined elevation, not uniform conditions over the whole connected network.
- Initial AT powder threshold policy: use the existing Canada 0.75 cm/hour tier explicitly rather than inheriting Australia's unknown-country fallback. This is a product alert threshold, not a claim about Austrian snow climatology.

- Official sector/resort identity and counting boundaries; coordinates and lower/mid/upper forecast elevations.
- Distinguish village weather from on-mountain forecasts.
- Official lift map and individual lift inventory, without claiming live status until a timestamped winter feed is verified.
- Weather-provider response and fallback tests using Europe/Vienna and northern-hemisphere seasons.
- Explicit Austrian powder-alert thresholds, avoiding the existing unknown-country fallback to Australia.
- Verified Austrian avalanche bulletin source and link-out; no automated risk inference from weather.
- Camera licensing/embedding checks and accurate mountain/village/road labels.
- Winter transport timetables, road restrictions and applicable winter-equipment guidance.
- Initially use official link-outs for unsupported live reports. No fabricated reports, affiliate IDs or paid-partner flags.

## Codebase integration preparation

Initial exploration found no Austrian support. The approved pilot is now implemented
as an authored region rather than a national catalogue pipeline.

Relevant integration surfaces:

- Frontend region module and registry: artifacts/feelzlike/src/regions/lech-zuers.ts (new), src/regions/index.ts.
- Country types, metadata, pickers and fallback lists; explicit AT entries in exhaustive country maps.
- Lift data and transport registries, including src/data/transport/index.ts.
- API region/weather registries, region card response, alert anchors and town-name map.
- OpenAPI RegionId schema and generated clients.
- AlertSubscribeForm, radar-local country/region maps, northern ski-season logic and powder thresholds.
- SEO region list, sitemap, prerender routes, validated artifact rewrites and external-link manifest.
- Keep account-free powder alerts, current weather elevation/phase rules and unknown-condition honesty intact.

Do not interfere with concurrent security remediation or paywall work.
The initial preparation was read-only; implementation followed owner approval.
The pilot includes AT country navigation/search, real seven-day mountain weather,
explicit 1,450/1,950/2,450 m forecast bands, Europe/Vienna regional alerts,
two village pages, curated transport and official-report links.
Snow/lift/road live ingestion and camera embedding are deliberately excluded until verified.

## Release checks

Run targeted frontend/API type checks and region/route tests after implementation.
Validate codegen and project references if schema changes.
Verify country picker and search, Lech/Zürs town and mountain routes, forecast elevations/timezones, alert eligibility, seasonal statuses, and honest unavailable reports.
Check mobile/desktop rendering, direct deep links, sitemap/prerender/rewrite parity and provider failure states before publishing.