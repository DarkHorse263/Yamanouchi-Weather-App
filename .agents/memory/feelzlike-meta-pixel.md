---
name: feelzlike Meta Pixel
description: consent-gated Meta (Facebook) Pixel wiring + the token-safety constraints that must never be relaxed.
---

# feelzlike Meta Pixel

The Meta Pixel (lib/metaPixel.ts + MetaPixelTag in App.tsx) follows the same
loader pattern as GA/Awin but is gated behind the **ads** consent category
(canUseAds), NOT analytics — it is advertising tech (ad measurement +
retargeting), and the Privacy policy discloses it that way. Pixel id is public
config (default in source, VITE_META_PIXEL_ID override).

## Constraint 1 · fbevents reports the RAW URL and cannot be overridden
Unlike gtag (which accepts page_location), fbevents.js sends
`dl=window.location.href` with every hit and offers no supported override.
Alert links carry HMAC `?token=...`, so token safety needs two layers that
must BOTH stay:
1. `fbq('set','autoConfig',false,id)` BEFORE `init` — kills Meta's automatic
   collection (microdata scraping, SubscribedButtonClick events), so the only
   network hits are our explicit calls.
2. `metaPixelPageView()` refuses to fire while the URL carries ANY query param
   outside the closed campaign whitelist (same list as lib/ga.ts). Tokened
   pages send no pixel hit at all — that is intended, not a bug.
**Why:** GA solved this with a page_location override; the pixel has no such
knob, so "skip the hit entirely" is the only safe shape.
**How to apply:** never add an `fbq('track',...)` call site outside
metaPixel.ts; any new event must route through a helper that checks
`urlSafeForPixel()` first. New ad-network click ids get added to BOTH
whitelists (ga.ts + metaPixel.ts) together.

## Constraint 2 · revoke keeps the script, never re-init
`disableMetaPixel()` = `fbq('consent','revoke')` + module flag; it deliberately
does NOT remove the script tag, and `loadMetaPixel()` guards on an
`initialised` flag — a same-session revoke→re-grant must only re-grant
consent, never re-run `fbq('init')` (duplicate-pixel warning, double-processed
queue). Fresh loads are safe because the loader only runs on grant.

## Verification bar
Script load alone proves nothing (same lesson as the gtag stub). Proof =
observed `facebook.com/tr?ev=PageView&id=...` requests after Accept-all, a
second on SPA route change, and NO /tr hit on a `?token=` URL. The fbq stub
must queue the real `arguments` object (canonical Meta snippet form).

## Related copy that must stay in sync
Privacy.tsx: Meta bullet in sub-processors (s4), honest advertising wording in
s5 ("we do not run advertising" was removed — do not reintroduce), ads-gated
storage in s9 cookies; bump `lastUpdated` on material changes. ConsentBanner
ads-category description mentions affiliate cookies + Meta ad measurement.
Policy currently discloses MEASUREMENT only — if retargeting audiences are
ever switched on in Ads Manager, update the policy FIRST.
