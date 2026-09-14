# Task181 bounded browser network acceptance

Date: 2026-09-13 UTC (browser context timezone UTC)  
App: feelzlike workflow, public preview domain  
Mode: Playwright browser acceptance pass; no application files changed.

Status: implementation checks and the bounded visible/offscreen browser checks
passed; hidden-tab recurring-request measurement remains unverified.

## Results

- **Data Saver control:** visible in the shared shell. Toggled on, then reloaded
  `/snowy-mountains/`; it remained pressed as `Turn data saver off` / `data
  saver on`. This persisted in the browser context. Later toggled off for the
  normal-mode radar check.
- **Forecast text:** Snowy Mountains/Jindabyne rendered current conditions,
  narrative, hourly and six-day forecast. Yamanouchi/Yudanaka rendered
  `Open-Meteo + JMA`, current `25°C · Clear sky · feelzlike 29°`, narrative,
  hourly and six-day forecast.
- **Data Saver pre-load gate:** with Data Saver on, the Jindabyne radar was
  `radar paused` while offscreen, then `radar ready to load` after scrolling
  into view. Before the explicit load action there were no external
  BOM/RainViewer/Windy/YouTube/tile requests observed. A broad keyword counter
  did match five same-origin Vite source modules (not media/provider data), so
  those were excluded from the external-media count.
- **AU official radar:** clicked only the explicit `load latest radar` control.
  A rendered BOM Canberra/Captains Flat map appeared with `Updated 02:04 AM
  local · 3 min ago`; the loop was disabled. Twelve bounded OpenStreetMap tile
  requests were observed, totaling approximately 156 KB from available
  `Content-Length` headers. No iframe, video, Windy, YouTube or BOM-hosted
  media request was observed in the browser log (the BOM image is represented
  by the app's licensed/source map behavior).
- **JP JMA radar:** selected JMA while Data Saver was on; no map loaded until
  the explicit `load latest radar` action. That action rendered a JMA
  nowcast/OpenStreetMap map with `Updated 02:05 AM local · 3 min ago`,
  JMA attribution, timestamp and zoom controls. No iframe/video was present.
- **Windy:** selecting Windy with Data Saver on created **0** iframes and
  exposed `load windy map`. Clicking that explicit control created exactly one
  `embed.windy.com` iframe; no video/autoplay element was present. Scrolling
  back to the top and waiting 1.5 seconds removed the iframe (`0` remaining).
  No catch-up burst was visible in the available request logs. The third-party
  frame emitted non-fatal WebGL-disabled and `legacy-tile-render` plugin errors
  in this environment.
- **Normal mode:** after toggling Data Saver off, scrolling the Yudanaka radar
  into view produced a loaded interactive RainViewer map automatically, with
  map controls, weather layers, resort markers and a frame scrubber. This
  verifies normal-mode radar actually works.
- **Cams/routes:** `/yamanouchi/map` normalized to `/yamanouchi/`; the current
  route structure embeds radar in `/:town/weather`. `/yamanouchi/yudanaka/cams`
  was not exposed by navigation; `Roads & cams` canonically landed on
  `/yamanouchi/yudanaka/roads`, showing an unavailable-live-road-status message
  and an external official road-camera map link, with no embedded camera iframe.
  The Snowy Mountains requested `/snowy-mountains/thredbo` similarly redirected
  to the region picker; the live canonical forecast tested was
  `/snowy-mountains/jindabyne/weather`.

## Network/timing notes and limitations

- Request listeners were installed before the clean reload of the Jindabyne
  forecast. The pre-load phase settled after ~1.8 s; the explicit BOM/JMA
  phases were observed for ~1.5–1.8 s; Windy iframe cleanup was observed
  after a 1.5 s offscreen settle.
- Counts are browser request/response events and bytes are only summed from
  response `Content-Length` headers; cross-origin providers may omit or
  compress this header, so byte totals are lower bounds. No response bodies
  were downloaded for measurement, no video was played, and no ZIP/export was
  requested. The observed external media total was far below the 10 MB bound.
- Hidden/offscreen behavior was simulated by scrolling the radar out of view,
  not by switching to a separate real hidden tab. The normal-mode interval
  was not advanced through 4/5 minutes; no long-lived stream or refresh burst
  was exercised. The browser's disabled WebGL capability explains the
  third-party Windy console errors; the iframe itself rendered and was removed
  correctly.

## Hidden-timer follow-up limitation

The attempted synthetic-hidden, 310-second virtual-time follow-up could not run.
The persistent browser test harness retained a request listener that threw
`ReferenceError: location is not defined` when creating pages or contexts.
Removing known listeners and attempting a separate harness repair did not
recover the session. No hidden-window or resume request/byte totals were
collected. This is a verification gap, not evidence of either a background
download leak or zero hidden traffic. Do not treat the short offscreen iframe
removal check above as a measured five-minute hidden-tab test.