---
name: feelzlike SW cache staleness on shape change
description: Why an /api response-shape or behaviour change can keep showing the OLD data in installed PWAs after a deploy, and the three-part fix.
---

# Stale /api data in the PWA after a deploy

`artifacts/feelzlike/public/sw.js` routes any /api path NOT explicitly listed through a **catch-all stale-while-revalidate** (returns the cached copy first). Cache Storage is cleared only when `CACHE_VERSION` is bumped (the activate handler deletes caches whose name != current version). So a deploy that changes an endpoint's RESPONSE SHAPE or ranking but does NOT bump `CACHE_VERSION` leaves installed PWAs serving the OLD shape on first paint. It is compounded by the server `Cache-Control: max-age` — the browser HTTP cache also holds the old body until the OLD max-age expires; lowering the header later does NOT retroactively shorten an entry already cached under the old TTL.

**Symptom seen:** after the places search Text-Search->Autocomplete rewrite, a prod curl returned correct localities but the user's installed PWA still showed old businesses / full-address shape. The server was correct — it was purely client cache (three layers masking the change).

**Fix pattern (do all three on any /api shape or behaviour change):**
1. Bump `CACHE_VERSION` in sw.js so activate wipes the poisoned caches (skipWaiting + clients.claim are wired, so the next version takes over on the next visit, no tab close needed).
2. Make sure the changed endpoint is NOT left on the catch-all SWR. Volatile / behaviour-changing GETs (e.g. search) belong in network-first; pass `{ cacheMode: "reload" }` to ALSO bypass the browser HTTP cache so an already-cached long-max-age body can't win.
3. Keep the server `Cache-Control` short on volatile endpoints (search = 300s) so a future change self-heals fast even for non-SW clients.

**Why:** three independent cache layers (SW Cache Storage, browser HTTP cache, React Query in-memory) each mask a shape change, and `reload` is the only lever that clears an already-poisoned browser HTTP entry immediately — otherwise its old max-age still applies for up to an hour.

**How to apply:** the new sw.js reaches users only on republish; installed PWAs auto-update on the next navigation. A one-time force-close/reopen accelerates it. Photos (`/api/places/photo`, immutable 24h) and nearby stay on their existing strategies — scope the network-first branch to the endpoint that actually changed.

## Session-state endpoints (Aug 2026 full-site audit)
`/api/auth/*` is excluded from the SW entirely (like /api/admin and /api/account): a SWR-cached /api/auth/user showed stale signed-in state on installed PWAs after magic-link sign-in/sign-out. Any NEW session-scoped or "right now" endpoint must be added to the never-cache or network-first blocks at creation time — the catch-all SWR is the default trap.
