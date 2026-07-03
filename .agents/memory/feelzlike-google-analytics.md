---
name: feelzlike Google Analytics 4
description: consent-gated GA4 wiring + the two non-obvious gotchas that make it silently fail or leak alert tokens.
---

# feelzlike Google Analytics 4 (GA4)

GA4 is wired the same consent-gated way as Awin: a small loader lib plus a
component mounted in the router that loads/disables the tag on consent change
and drives page_view manually. It only loads after the visitor grants the
`analytics` consent category, and revoke works mid-session. The Measurement ID
is public config (ships in HTML), not a secret.

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
those. Fix: pin a stripped `page_location` (`origin + pathname`, never the raw
href) in the initial `gtag("config", ...)` call so every automatic hit is
token-free too. Manual page_views also strip query+hash.
**How to apply:** whenever a new tokened route exists, the config-level
`page_location` (pathname-only) already covers it · pathname never holds the
token · but re-verify `dl` has no `token=` if the URL scheme changes.

## Minor
`anonymize_ip` is a UA-era param GA4 ignores (GA4 does not log/store IPs by
default), so it was dropped and the Privacy copy says "does not store IP
addresses" rather than "IP anonymisation". Privacy discloses GA4 as a
US sub-processor and is gated behind the analytics consent category.
