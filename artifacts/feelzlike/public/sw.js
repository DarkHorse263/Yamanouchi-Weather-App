/* FeelZlike service worker.
 *
 * Two responsibilities:
 *  1. POWDER PUSH NOTIFICATIONS (Sprint 5) — display server-pushed alerts
 *     when forecast snowfall meets a subscriber's threshold.
 *  2. OFFLINE / FAST-RELOAD CACHING (Sprint 6.2 PWA) — workbox-style
 *     strategies hand-rolled with the Cache API so we don't need a build
 *     step for the SW. Three strategies are wired:
 *
 *       cache-first        → static assets (JS/CSS hashed bundles, fonts,
 *                            icons, images). They're immutable in vite's
 *                            dist so cache-first is safe.
 *       network-first      → HTML navigations + live weather/today's-call
 *                            API calls. Network-first ensures the latest
 *                            data wins online; falls back to cache offline.
 *       stale-while-       → curated stay/eat JSON + the regions endpoint.
 *         revalidate         Returns the cached copy instantly, refreshes
 *                            in the background.
 *
 * No build step — this file ships as-is from /public.
 */

// Bump this on any deploy that introduces a new region, route or asset
// shape - the activate handler nukes any cache whose name doesn't match
// the new version, forcing installed PWAs to re-fetch /api/regions and
// the HTML shell instead of serving the previous deploy's cached copy.
// v7: adds Victoria's High Country to the live region set.
// v8: locality search/details go network-first (bypass the stale cache) after
// the search rewrite - the old cached shape showed businesses, not towns.
// v9: BOM radar frame discovery (/api/bom-radar/frames) goes network-first
// (reload) so installed PWAs stop serving the previous session's frame list -
// the radar looked "frozen" because the catch-all SWR returned a stale loop.
// v10: /api/weather + /api/town-weather snowDepth changed units (metres -> cm)
// and unknown depth is now omitted instead of 0 - bust caches holding old shape.
// v11: /api/weather daily gained rainSum (true liquid rain). precipitationSum
// includes melted snow, so cached old-shape responses showed snow again as
// "rain" - bust so installed PWAs pick up the new field promptly.
// v12: daily weatherDescription is now totals-based (Heavy snow / Snow · rain
// etc) instead of the WMO moment-code label - bust cached old labels.
// v13: /api/elevation-forecast bands now come from ONE pinned grid cell with
// freezing-level phase partitioning (was 3 different cells, which could show
// more snow mid than upper) - bust cached incoherent band tables.
// v14: AU Official radar switched to the licensed WillyWeather feed
// (/api/willy-radar) - route it network-first (reload) like the BOM frame
// list so installed PWAs never animate a previous session's frames.
// v15: /api/town-weather gained the JP observedSnow block (AMeDAS measured
// depth) AND moved from the catch-all SWR to the live-weather network-first
// route - it is "right now" data and was being served a session stale. Also
// adds /api/jma-radar/times (JP Official radar frame discovery) network-first
// (reload) like the BOM/WillyWeather frame lists.
// v18: /api/weather/:id/snow-report gained optional baseMinCm (NZ two-station
// range reports render "16-38") - bust cached single-figure responses.
// v19: /api/admin/* excluded from the SW entirely (session-scoped, private,
// and delete-then-refetch must never be served a stale cached list).
const CACHE_VERSION = "v19";
const STATIC_CACHE = `feelzlike-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `feelzlike-runtime-${CACHE_VERSION}`;
const DATA_CACHE = `feelzlike-data-${CACHE_VERSION}`;

// Pre-cached on install: the bare-minimum shell for the offline page to render.
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // Activate the new SW immediately on first install so subscribers don't
  // wait until every tab is closed for the next deploy to take effect.
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll fails atomically — wrap each URL so a single 404 doesn't
      // nuke the whole pre-cache (icons may be missing in some envs).
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => undefined),
          ),
        ),
      ),
  );
});

self.addEventListener("activate", (event) => {
  // Wipe stale caches from previous deploys so we don't grow unbounded.
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, RUNTIME_CACHE, DATA_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.map((n) => (keep.has(n) ? null : caches.delete(n))));
      await self.clients.claim();
    })(),
  );
});

// ─── Caching strategies ────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName, { timeoutMs = 4500, cacheMode } = {}) {
  const cache = await caches.open(cacheName);
  try {
    // Race the network against a timeout so flaky mobile connections don't
    // hang the page indefinitely — fall back to cache if we time out.
    // `cacheMode` ("reload") lets a caller bypass the browser HTTP cache so a
    // stale max-age response can't win over fresh data.
    const networkResponse = await Promise.race([
      fetch(request, cacheMode ? { cache: cacheMode } : undefined),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("net-timeout")), timeoutMs),
      ),
    ]);
    if (networkResponse && networkResponse.ok && request.method === "GET") {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last-resort: return the cached `/` shell for navigation requests so
    // the React app can render its own offline banner. The shell lives in
    // STATIC_CACHE (precached on install), not in this cache, so look there
    // explicitly — otherwise deep-link offline navigations get a JSON 503.
    if (request.mode === "navigate") {
      const staticCache = await caches.open(STATIC_CACHE);
      const shell = await staticCache.match("/");
      if (shell) return shell;
    }
    return new Response(
      JSON.stringify({ offline: true, error: "network-unreachable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await networkPromise) || Response.error();
}

// ─── Fetch router ──────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle GETs — POSTs/PUTs (alerts subscribe etc.) hit network direct.
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Skip cross-origin (Open-Meteo, OWM tiles) — they have their own caching.
  if (url.origin !== self.location.origin) return;

  // 1. Static asset bundles (immutable, hashed) → cache-first
  //    Vite outputs to /assets/*-[hash].(js|css) plus /icons, /branding, /images.
  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/branding/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 2a. SECURITY: never cache token-bearing or per-subscriber endpoints.
  //     `/api/alerts/*` (verify/manage/unsubscribe) carries HMAC tokens and
  //     subscriber data — keeping copies in Cache Storage would expose them
  //     to any later script with origin access. Always go straight to net.
  if (url.pathname.startsWith("/api/alerts")) return;

  // 2a-ter. Admin dashboard endpoints: session-scoped, private, and mutated
  //     in place (e.g. deleting a pending signup then refetching the list).
  //     A stale-while-revalidate copy makes deletions look like "nothing
  //     happened" because the refetch is served from cache. Never cache.
  if (url.pathname.startsWith("/api/admin")) return;

  // 2a-bis. Locality search + details → network-first, bypassing the browser
  //     HTTP cache. Their response shape changes across deploys (the search
  //     rewrite swapped Text Search for Autocomplete), so a stale-while-
  //     revalidate copy would keep showing the old businesses/format on first
  //     paint. `reload` forces past the 1h max-age so fresh localities win.
  if (
    url.pathname.startsWith("/api/places/search") ||
    url.pathname.startsWith("/api/places/details")
  ) {
    event.respondWith(networkFirst(request, DATA_CACHE, { cacheMode: "reload" }));
    return;
  }

  // 2b. Live weather, today's call, roads → network-first (4.5s timeout)
  //     Anything that should reflect "right now" with offline fallback.
  //     NOTE: the /api/weather prefix deliberately also covers
  //     /api/weather/:id/snow-report (resort-reported base) - if that endpoint
  //     ever moves off this prefix it must be added here explicitly or
  //     installed PWAs will serve stale reports from the catch-all SWR.
  //     /api/town-weather is listed explicitly: it does NOT share the
  //     /api/weather prefix and used to fall into the catch-all SWR.
  if (
    url.pathname.startsWith("/api/weather") ||
    url.pathname.startsWith("/api/town-weather") ||
    url.pathname.startsWith("/api/today") ||
    url.pathname.startsWith("/api/road")
  ) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // 2c. BOM radar FRAME DISCOVERY → network-first, bypassing the browser HTTP
  //     cache. The frame list must track BOM's ~10-min publish or an installed
  //     PWA looks frozen (the catch-all SWR below served the previous session's
  //     list). Only the /frames JSON needs this · the frame/layer PNGs are
  //     immutable, unique-URL images and stay on the catch-all (never stale).
  if (url.pathname === "/api/bom-radar/frames") {
    event.respondWith(networkFirst(request, DATA_CACHE, { cacheMode: "reload" }));
    return;
  }

  // 2c-bis. WillyWeather radar discovery (licensed AU feed) → network-first,
  //     bypassing the browser HTTP cache, for the same reason as the BOM
  //     frame list: the JSON must track the 5-min publish cadence or an
  //     installed PWA loops stale frames. The overlay PNGs it points at are
  //     immutable unique-URL images on WillyWeather's CDN · they stay on the
  //     catch-all and can never go stale.
  if (url.pathname === "/api/willy-radar") {
    event.respondWith(networkFirst(request, DATA_CACHE, { cacheMode: "reload" }));
    return;
  }

  // 2c-ter. JMA nowcast frame-time discovery (JP Official radar) → network-
  //     first, bypassing the browser HTTP cache · same rationale again: the
  //     times JSON must track JMA's 5-min publish cadence or an installed
  //     PWA animates a stale loop. The radar tiles it points at are
  //     immutable unique-URL PNGs on JMA's own CDN · they never hit the SW
  //     (cross-origin requests are skipped at the top of this router).
  if (url.pathname === "/api/jma-radar/times") {
    event.respondWith(networkFirst(request, DATA_CACHE, { cacheMode: "reload" }));
    return;
  }

  // 3. Curated data + regions (changes occasionally) → stale-while-revalidate
  if (
    url.pathname.startsWith("/api/regions") ||
    url.pathname.startsWith("/api/stays") ||
    url.pathname.startsWith("/api/eats")
  ) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // 4. Navigations (HTML page loads) → network-first with cached `/` fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Everything else → opportunistic stale-while-revalidate so we don't miss
  // anything obviously cacheable (third-party scripts, etc.) without bloating
  // the cache with one-off fetches.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ─── Push notifications (Sprint 5) ─────────────────────────────────────

self.addEventListener("push", (event) => {
  let payload = { title: "FeelZlike", body: "Powder incoming.", url: "/", tag: "feelzlike-alert" };
  if (event.data) {
    try { payload = { ...payload, ...event.data.json() }; }
    catch { payload.body = event.data.text() || payload.body; }
  }

  const opts = {
    body: payload.body,
    tag: payload.tag,
    data: { url: payload.url || "/" },
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(payload.title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Focus an existing tab if any is already on the same origin
    for (const c of allClients) {
      if ("focus" in c) {
        try { await c.focus(); await c.navigate(url); return; } catch { /* fallthrough */ }
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
