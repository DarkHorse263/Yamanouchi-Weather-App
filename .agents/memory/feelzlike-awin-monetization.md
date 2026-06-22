---
name: feelzlike Awin affiliate monetization
description: How feelzlike earns via the Awin network — which system powers the LIVE booking links, the MasterTag, consent gating, and the double-tag pitfall.
---

# feelzlike Awin affiliate monetization

feelzlike monetizes via the **Awin** affiliate network using the **auto-convert** model (not manual per-link deep links).

## WHICH system actually powers the live booking links (read this first)
- The **live** Stay page (`pages/town/TownStay.tsx`) builds town-level search links from **`lib/places.ts`** (`platformsForCountry` + `platformDeepLink`). Country comes from `region.shortTag`.
- `platformsForCountry` returns the base 6 (Booking, Airbnb, Agoda, Trip, Hotels, Expedia) for **any non-JP** country; JP additionally gets Rakuten + Jalan. So **AU, JP and NZ all have live booking links** — NZ is NOT excluded.
- `townNavHasContent` returns `true` for `/stay` unconditionally → **every town** gets the Stay launchpad from just name + coords. No per-town/region stay data needed.
- The OTHER system — `lib/affiliateLinks.ts` (per-property `buildBookingLinks`, `PROVIDER_COUNTRIES` AU|JP only) + curated `data/curated/**/stays.json` + `StayCard`/`StayFilterBar` — is **LEGACY** and does NOT drive the live Stay page. Don't audit it to answer "are booking links live"; audit `places.ts`/`TownStay.tsx`. (Its AU|JP-only matrix is why I once wrongly concluded "NZ has no booking links".)

## How earning actually works
- `VITE_AWIN_PUBLISHER_ID` **is set** (verify with `viewEnvVars` — it's a shared env var, public config not a secret). So the MasterTag (`src/lib/awin.ts`, loads `https://www.dwin1.com/{id}.js`) loads once ads consent is granted.
- The MasterTag alone earns nothing. Money flows only when, on the **Awin dashboard side**, the account is (a) approved for each accommodation advertiser (Booking.com, Agoda, Expedia, Hotels.com, Trip.com, Airbnb each = a separate Awin programme/join request) and (b) has **Convert-a-Link** switched on for their domains. Then the plain outbound OTA links are auto-rewritten into tracked links.
- So "tag present + publisher id set + no approved advertisers = no earnings" is the EXPECTED state, not a bug. This is the one remaining gate and it is **external — only the owner can do it in their Awin account.**

## Consent (compliance) constraint
- The MasterTag sets advertising cookies, so it MUST stay gated behind the `ads` consent category (`canUseAds`). Mounted as `AwinTag` in `App.tsx`. Consequence for earnings: **only visitors who accept ads cookies are tracked/earn** — "Reject non-essential" visitors generate no commission. This is required, not fixable.
- Revocation is best-effort: `removeAwinMasterTag()` only removes the DOM script; cookies already set clear on next page load.

## Double-tag pitfall
- `TownStay` calls `platformDeepLink` WITHOUT an `affiliateId`, and no `VITE_*_AFFILIATE_ID` is set, so live OTA links carry no direct affiliate param — clean for Awin Convert-a-Link, no collision. If a direct id is ever added for an OTA that Awin also converts, the link is double-tagged. Pick ONE channel per merchant.

**Why:** chosen at initial Awin setup (auto-convert over manual deep links) because the app links out to many places — one script + dashboard config beats wrapping every link by hand.
**How to apply:** to answer monetization questions, check `places.ts`/`TownStay.tsx` + `viewEnvVars` for the publisher id, then remember the real blocker is Awin-side advertiser approvals. Keep any new ad/affiliate script behind `canUseAds`.
