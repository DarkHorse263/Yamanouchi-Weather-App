---
name: feelzlike Google Analytics 4
description: GA4 wiring (Consent Mode v2 since July 2026) + the non-obvious gotchas that make it silently fail or leak alert tokens.
---

# feelzlike Google Analytics 4 (GA4)

Since July 2026 GA4 runs in **Consent Mode v2** (owner choice, to count
decliners): gtag.js loads for EVERY visitor with `gtag("consent","default",
all denied)` queued BEFORE js/config; decliners send anonymous cookieless
pings (verify with `gcs=G100` on /g/collect); grant/revoke flows through
`gaConsentUpdate({analytics, ads})` mid-session · never revert to
load-after-consent or the visitor totals go dishonest again, and never remove
the consent-default-before-config ordering. page_view is sent on every route
change regardless of consent. Privacy page copy describes this · keep in sync.
The Measurement ID is public config (ships in HTML), not a secret. Meta Pixel
and Awin stay strictly load-after-ads-consent (NOT consent mode).

## Gotcha 1 · the gtag stub MUST push the real `arguments` object
gtag.js never replaces `window.gtag`; it only processes `dataLayer` entries and
treats an entry as a command *only if it is an Arguments object*. A stub that
pushes a rest-param array (`function gtag(...args){ dataLayer.push(args) }`)
loads the script but sends **nothing** · every `js`/`config`/`event` is silently
ignored. Use Google's canonical form: `function gtag(){ dataLayer.push(arguments) }`.
**Why:** first pass shipped the array form, typechecked clean, looked fine, and
sent zero hits. **How to apply:** any hand-written gtag stub must push
`arguments`; verify at runtime that `google-analytics.com/g/collect` requests
fire after consent · the `gtag/js` script load alone does NOT prove it works.

## Gotcha 2 · `send_page_view:false` does NOT stop token leaks
Alert links carry an HMAC `?token=...`. `send_page_view:false` only suppresses
the automatic page_view; gtag still sends automatic hits (session_start,
first_visit, user_engagement) and each carries `dl` = `document.location.href`
unless overridden. Per-event `page_location` on manual page_views does not cover
those. Fix: override `page_location` in the initial `gtag("config", ...)` call
AND on every manual page_view so every hit is token-free.
**How to apply:** whenever a new tokened route exists, the config-level
`page_location` override already covers it · but re-verify `dl` has no
`token=` if the URL scheme changes.

## Gotcha 3 · stripping ALL query params blinds ad attribution
The original fix pinned `page_location` to bare origin+pathname · that also
strips `utm_*` and ad click ids, so every paid Facebook/Google visit reports as
"direct" in GA4 (attribution derives from `page_location` on session_start /
the landing page_view). Fix: `page_location` = origin+pathname + a CLOSED
whitelist of campaign params (`utm_source/medium/campaign/term/content/id`,
`gclid`, `wbraid`, `gbraid`, `fbclid`, `msclkid`, `ttclid`), rebuilt from
scratch with URLSearchParams so nothing off-list (tokens, emails) can pass.
**Why:** token safety and ad attribution pull opposite ways · the whitelist is
the only shape that gives both; never revert to "strip everything" NOR widen to
"pass everything but token". **How to apply:** new ad-network click ids get
ADDED to the whitelist explicitly; the campaign UTM convention lives in the
campaign pack script (source=facebook, medium=paid vs social for unpaid posts,
content=per-tile slug).

## Custom events go through track(), never a parallel GA call path
`lib/analytics.ts` `track()` is the single vendor-agnostic seam: it writes a
Sentry breadcrumb AND forwards to `gaEvent()` (lib/ga.ts). So EVERY `track()`
call (search, favourites, nav, filters, plus the conversion events
`book_accommodation` / `book_car_hire` / `alert_subscribe`) becomes a GA4 event
with zero call-site churn. `gaEvent` no-ops until gtag exists (consent gate) and
returns early on the literal `"page_view"` so it never double-counts with
`gaPageView`.
**Why:** adding a second, direct `gtag("event", ...)` path would fragment the
consent gating and re-introduce the double-count risk. **How to apply:** to add
a new tracked action, call `track(name, {category, data})` at the site · do NOT
call `gaEvent`/`window.gtag` directly. Keep `data` non-PII (region/town/country
ids, counts, thresholds · never email, never a tokened href). GA4 event names
must be `[a-z][a-z0-9_]*` <=40 chars (normaliseEventName enforces). New params
only show in GA reports after the owner registers them as custom dimensions.

## Minor
`anonymize_ip` is a UA-era param GA4 ignores (GA4 does not log/store IPs by
default), so it was dropped and the Privacy copy says "does not store IP
addresses" rather than "IP anonymisation". Privacy discloses GA4 as a
US sub-processor and is gated behind the analytics consent category.
