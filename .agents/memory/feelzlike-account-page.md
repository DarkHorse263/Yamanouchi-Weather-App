---
name: feelzlike account page
description: /account member page pattern — session-authorised alert editing, soft gate, SW exclusion
---

# feelzlike account page

- `/account` (global route + nav/footer links) is the member home base: email, profile basics (homeRegionId/units on `users`), and powder-alert editing.
- **Session = proof of email ownership**: `PUT /api/account/alerts` edits the `alert_subscribers` row matched by the signed-in user's email — no HMAC manage token needed. The tokened `/alerts/manage` flow stays for email-link access; keep both in sync when subscription fields change.
- Signed-out visitors are soft-gated: the page auto-opens the SignUpSheet via `promptSignUp` once auth resolves (never an error, never a redirect). Server side returns 401 `AUTH_REQUIRED`.
- `/api/account*` is excluded from the service worker entirely (like `/api/admin`) — session-scoped, private, mutated in place. Adding new session-scoped endpoints? Exclude them in `sw.js` and bump CACHE_VERSION.
- **Why:** cached member data survives sign-out and makes saves look ignored.
- Prefs ARE consumed app-wide (July 2026): `UserPrefsProvider` (components/auth) shares queryKey `["account"]` with the /account page and only fetches when authenticated — anonymous stays metric/no-home-region by context default. Display-edge conversion lives in pure `lib/unitsFormat.ts` (canonical data stays metric; convert at render only). A profile save must invalidate `["account"]` so the whole app flips. Welcome shows a home-region chip for members; units flip covers headline surfaces (WeatherSections + all THREE mountain detail pages per the 3-component rule), not yet charts/hourly strips/dashboard.
