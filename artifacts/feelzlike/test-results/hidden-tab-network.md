# Task 182 hidden-tab network verification

Date: 2026-09-14 UTC  
App: `feelzlike` workflow, public preview domain  
Harness: fresh Playwright browser context; no application files changed.

## Scope and harness

This is the outstanding hidden-tab verification requested after the prior
`data-saver-network.md` pass. I read that report first, then read:

- `artifacts/feelzlike/src/regions/snowy-mountains/components/RadarMap.inner.tsx`
- `lib/feelzlike-shell/src/hooks/useMediaActivity.ts`
- `artifacts/feelzlike/src/regions/yamanouchi/pages/map.tsx`

The clean harness installed the request listener before navigation:

```js
page.on("request", request => {
  const url = new URL(request.url()); // Node-safe; no browser `location`
  requestLog.push({ url: url.href, path: url.pathname, host: url.host });
});
```

It also installed a response listener and used bounded route fixtures:

- `/api/willy-radar` -> three tiny synthetic AU frame records
- `/api/jma-radar/times` -> seven tiny synthetic JMA frame records
- OSM tiles, JMA tiles, and AU frame image URLs -> a 1x1 PNG fixture
- unrelated forecast/app requests were allowed through normally

The fixture PNG body was 68 bytes. These are synthetic provider/media bodies,
not downloaded production radar data. The app React components, Intersection
Observer lifecycle, fetches, interval timers, and map mounting were retained.
No video was played and no export/download was requested.

For hidden state, the live document was kept mounted and these properties were
simulated before dispatching `visibilitychange`:

```js
Object.defineProperty(document, "visibilityState", {
  configurable: true, get: () => "hidden"
});
Object.defineProperty(document, "hidden", {
  configurable: true, get: () => true
});
document.dispatchEvent(new Event("visibilitychange"));
```

Playwright virtual time then ran the real timers with:

```js
await page.clock.runFor(310000);
```

The same procedure was used for the visible restore and a 7-second resume
window. All request URL parsing used `new URL(request.url())`; the previous
`ReferenceError: location is not defined` did not recur.

## AU official BOM / WillyWeather case

Route: `/snowy-mountains/jindabyne/weather`  
Mode: normal recurring radar, Data Saver initially off  
Source: BOM tab, licensed WillyWeather path.

The forecast rendered and the radar was scrolled into view. The DOM showed BOM
pressed, three frame controls, `pause radar loop`, OSM attribution, and the
WillyWeather/BOM source footer. The route fixture returned three frames, so
this exercised the normal recurring loop rather than a vacuous zero-frame
case.

Visible baseline after settling:

- 19 broad radar/media matches in the browser request log.
- Of those, the external/synthetic media set was 1 Willy discovery request,
  12 OSM tile requests, and 3 bounded AU frame-image requests (16 requests).
- Response `Content-Length` header sum was 0 for this AU fixture phase. This is
  **not** an encoded-transfer measurement.
- The bounded AU frame body contribution was 3 x 68 = 204 bytes. Header
  values are lower-bound instrumentation and are not used as a production
  transfer estimate.

Hidden simulation:

- The UI changed to the app's `radar paused` state after `visibilitychange`.
- Real timers ran for 310 seconds.
- New recurring media requests: **0**.
- New response `Content-Length` header bytes: **0**. No CDP encoded-byte
  measurement was used for this earlier radar phase.
- No Willy refresh, BOM frame, OSM tile, JMA tile, RainViewer, or Windy
  request occurred while hidden.

Visible resume:

- Restoring `visibilityState="visible"` and dispatching `visibilitychange`
  returned the DOM to the mounted radar state (`pause radar loop`).
- A 7-second virtual-time resume window produced **0** additional filtered
  media requests and **0** response `Content-Length` header bytes.
- Therefore no catch-up burst was observed. The map's normal remount/load state
  was allowed; this short window produced no additional request.

## JP official JMA case

Route: `/yamanouchi/yudanaka/weather`  
Mode: Data Saver explicitly opted in  
Source: JMA tab.

Data Saver was turned on through the visible shell control; the sidebar showed
`Turn data saver off` / `data saver on`. Before explicit loading, selecting JMA
showed `radar ready to load`, `data saver is on`, and `load latest radar`; no
JMA discovery request was observed merely from selecting the tab.

The explicit `load latest radar` action then mounted the JMA map. The
accessibility tree showed JMA pressed, OSM and Japan Meteorological Agency
attribution, one `show 01:10 AM` frame, and the Data Saver-disabled
`play radar loop` control.

Visible opted-in load:

- **25** filtered requests: 1 `/api/jma-radar/times`, 12 OSM tiles, and 12
  JMA tiles.
- Response `Content-Length` headers summed to **2,063 bytes**. This is **not**
  an encoded-transfer measurement; CDP URL-attributed encoded-byte
  instrumentation was added for the separate Windy-only follow-up below.
- The bounded synthetic image-body contribution was 24 x 68 = **1,632 bytes**;
  the JSON discovery response is included in the header total where the
  server/fixture exposed it. These are fixture/provider-data numbers, not a
  claim about production CDN transfer encoding.

Hidden simulation:

- The mounted JMA view changed to `radar paused` / `live radar pauses while
  this map is offscreen`.
- Real timers ran for 310 seconds.
- New filtered media requests: **0**.
- New response `Content-Length` header bytes: **0**. No CDP encoded-byte
  measurement was used for this earlier radar phase.
- No JMA discovery refresh, JMA tile, OSM tile, RainViewer, Windy, or other
  filtered radar media request occurred while hidden.

Visible resume:

- Restoring visible state retained the mounted JMA DOM, attribution and frame
  control.
- A 7-second virtual-time resume window produced **0** additional filtered
  media requests and **0** response `Content-Length` header bytes.
- No catch-up burst occurred.

## JP timer-claim correction

The earlier wording that both paths “exercised their 4-minute refresh timers”
was too strong and is corrected here. The AU Willy and JP JMA effects install
4-minute intervals only while their `mediaActive` path is mounted. When the
hidden `visibilitychange` made `useMediaActivity().active` false, the radar
surface unmounted and its interval was cleared. The 310-second hidden runs
therefore verified lifecycle teardown and zero hidden traffic across the
interval horizon; they did **not** prove that an active hidden 4-minute
provider callback fired and was suppressed. `useForegroundRefresh` separately
guards on `document.visibilityState === "visible"` and a 90-second minimum
gap. The measured result remains valid: zero hidden requests and no resume
burst, but it is not evidence of a callback executing while unmounted.

## Windy iframe follow-up (targeted evidence gap)

This was run separately without repeating the BOM/JMA radar flows. Route:
`/snowy-mountains/jindabyne/weather`, Windy selected with Data Saver on, then
the explicit `load windy map` control clicked. A page-scoped route intercepted
only `https://embed.windy.com/**` and returned this tiny HTML:

```html
<!doctype html><title>fixture windy</title>
<main>bounded iframe fixture</main>
```

No live third-party frame or subresource was allowed. Before hiding:

- iframe count: **1**
- embed request count: **1** (URL began
  `https://embed.windy.com/embed2.html?lat=-36.42&lon=148.42...`)
- iframe body: `bounded iframe fixture`
- the fixture body is intentionally tiny; it is not production provider data.

The CDP instrumentation used for this narrow test was:

```js
const cdp = await context.newCDPSession(windyPage);
await cdp.send("Network.enable");
const urls = new Map(), finished = [];
cdp.on("Network.requestWillBeSent", e => {
  urls.set(e.requestId, new URL(e.request.url()).href);
});
cdp.on("Network.loadingFinished", e => {
  const url = urls.get(e.requestId);
  if (url) finished.push({url, encodedDataLength: e.encodedDataLength});
});
```

The initial visible CDP aggregate was page-wide (18,775,497 bytes) because
URL attribution was installed after those events; it is deliberately **not**
reported as iframe transfer. The URL-attributed CDP measurement for the
hidden interval was:

- hidden duration: **310 seconds** via `await windyPage.clock.runFor(310000)`
- iframe count after hidden run: **0** (the app removed it)
- new `embed.windy.com` requests: **0**
- URL-attributed CDP `encodedDataLength`: **0 bytes**

After restoring visible state and dispatching `visibilitychange`, the app
remounted exactly one fixture iframe. During the short 7-second visible
window:

- iframe count stayed **1**
- new embed requests: **0**
- URL-attributed CDP encoded bytes: **0**

Thus hidden Windy removal and the absence of hidden iframe traffic are verified;
the visible restore was a normal remount, with no catch-up request burst.

## Reproducible harness data

The route fixture schemas used by the radar portions were:

```js
// /api/willy-radar
{
  provider: {
    name: "Captain's Flat", lat: -35, lng: 149,
    bounds: {minLat:-36,minLng:148,maxLat:-34,maxLng:150},
    interval: 300, statusCode: "OK"
  },
  frames: [
    {ts:"202609130201", url:"/fixtures/bom-1.png"},
    {ts:"202609130202", url:"/fixtures/bom-2.png"},
    {ts:"202609130203", url:"/fixtures/bom-3.png"}
  ]
}

// /api/jma-radar/times
{times: [{basetime:"20260913020000", validtime:"202609130010000"}, /* 6 more */]}
```

Provider/tile/frame routes returned a 68-byte 1x1 PNG fixture. The request
listener always parsed URLs with `new URL(request.url())`. Hidden clock and
visibility snippets are reproduced in the harness section above. The report
now distinguishes:

1. browser request counts;
2. response `Content-Length` headers from the earlier radar pass;
3. synthetic fixture body sizes; and
4. CDP `encodedDataLength`, used and URL-attributed only for the targeted
   Windy hidden test.

## Verdict

The outstanding hidden-tab checks passed for both requested provider paths.
Both cases had a real loaded provider/media fixture before the hidden interval,
so the zero hidden counts are not caused by an unloaded Data Saver gate:

| Case | Pre-hidden loaded media | Hidden duration | Hidden new media | Resume window | Resume new media |
|---|---:|---:|---:|---:|---:|
| AU BOM/Willy normal | 16 external/synthetic requests | 310 s | 0 | 7 s | 0 |
| JP JMA Data Saver opt-in | 24 tile requests + 1 discovery | 310 s | 0 | 7 s | 0 |
| Windy fixture iframe | 1 iframe + 1 embed request | 310 s | 0 embed / 0 CDP bytes | 7 s | 0 embed / 0 CDP bytes |

The prior offscreen-only Windy check has now been closed with the hidden
visibility test above. RainViewer's optional 5-minute case was not repeated.
The AU/JP hidden results are lifecycle-teardown results across the 310-second
horizon, not proof that a provider interval callback executed while hidden.

## Limitations / visual evidence

- Cross-origin and fixture responses may omit or synthesize `Content-Length`;
  those earlier header totals are not encoded-transfer measurements. CDP
  `encodedDataLength` was only URL-attributed for the targeted Windy follow-up;
  its zero hidden value is robust to the fixture's body size.
- The browser screenshot capture intermittently showed a solid teal/green main
  region on the Yamanouchi route even while the accessibility tree showed the
  fully mounted weather and JMA controls. This did not prevent DOM lifecycle or
  network verification. The AU screenshot showed the working forecast and
  mounted BOM controls, although the tiny synthetic image fixture rendered as
  dark/blank map imagery.
- Audio, animation smoothness, and actual production provider payload sizes
  were not evaluated. This test does not establish causation for reported
  router usage.
