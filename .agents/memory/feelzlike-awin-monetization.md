---
name: feelzlike Awin affiliate monetization
description: How feelzlike earns via the Awin network — MasterTag, Convert-a-Link, consent gating, and the double-tag pitfall.
---

# feelzlike Awin affiliate monetization

feelzlike monetizes via the **Awin** affiliate network using the **auto-convert** model (not manual per-link deep links).

## How earning actually works
- The in-app MasterTag (`src/lib/awin.ts`, loads `https://www.dwin1.com/{VITE_AWIN_PUBLISHER_ID}.js`) is necessary but **not sufficient**. On its own it earns nothing.
- Money only flows when, on the **Awin dashboard side**, the account is (a) approved for specific advertisers/programmes and (b) has **Convert-a-Link** switched on for those advertisers' domains. Then plain outbound links to those domains are auto-rewritten into tracked links.
- So "tag present + no approved advertisers = no earnings" is the EXPECTED state, not a bug.

## Consent (compliance) constraint
- The MasterTag sets advertising cookies, so it MUST stay gated behind the `ads` consent category (`canUseAds(consent.choices)` from `lib/consent`). Mounted as `AwinTag` in `App.tsx`. Never load it unconditionally or hardcode it in index.html.
- Revocation is best-effort: `removeAwinMasterTag()` only removes the DOM script; cookies/runtime already set clear on next page load. Accepted in review.

## Double-tag pitfall
- The app ALSO has a direct per-OTA affiliate system (`affiliateLinks.ts`, `VITE_*_AFFILIATE_ID`). If one OTA (e.g. Booking.com) is ever earned through BOTH a direct id AND Awin Convert-a-Link, the link is double-tagged / attribution conflicts. Pick ONE channel per merchant.
- Currently safe because no `VITE_*_AFFILIATE_ID` is set, so OTA links carry no direct affiliate param for Awin to collide with.

**Why:** chosen at initial Awin setup (auto-convert over manual deep links) because the app already links out to many places — one script + dashboard config beats wrapping every link by hand.
**How to apply:** when earning on a new merchant, decide direct-vs-Awin per merchant; keep any new ad/affiliate script behind `canUseAds`.
