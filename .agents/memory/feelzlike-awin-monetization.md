---
name: feelzlike affiliate monetization (Awin + CJ)
description: How feelzlike earns — Awin (auto-convert) powers the LIVE booking + Europcar links; CJ (per-advertiser deep links) is wired but inert until approvals. Consent gating + double-tag pitfall.
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

## CJ (Commission Junction) — the SECOND network (`lib/cj.ts`)
- **CJ has NO auto-convert/MasterTag.** Every CJ link must be built by hand: `https://{cjDomain}/click-{PID}-{AID}?url={ENCODED_DEST}&sid=...`. `cjDomain` defaults to anrdoezrs.net (all CJ domains interchangeable).
- Needs TWO ids: **PID** (one publisher/website id, env `VITE_CJ_PUBLISHER_ID`, public config like the Awin id) + a **per-advertiser AID** (8-digit). The AID **only exists after you're approved** for that advertiser AND the advertiser "allows URL redirects". Wrapping a non-approved advertiser does NOT track and may error → only ever wrap advertisers in `CJ_ADVERTISER_AIDS`.
- `CJ_ADVERTISER_AIDS` is a hand-maintained **code map** (StayPlatformId → {aid, domain?}), deliberately EMPTY until approvals land. Adding a merchant = one line once the owner hands over that advertiser's AID. `cjLinkFor` returns null unless PID set + valid 8-digit AID → Stay page falls back to the plain `platformDeepLink` (zero regression). AID validated `^\d{8}$` so typos fail loud (dev warn) not silent.
- **Per merchant, exactly ONE network.** A CJ-wrapped link points at anrdoezrs.net (not the OTA domain), so the Awin MasterTag won't also convert it. If a merchant ever gets BOTH a CJ AID here and Awin Convert-a-Link, that's a conflict — pick one.
- CJ links gated behind `canUseAds` in `TownStay` (no ads consent → plain link), same compliance rule as Awin.

## trivago — JP metasearch, region-keyed, earns via CJ (Evergreen deep link)
- trivago is a **live JP-only** stay platform added to **`lib/places.ts`** (the live system), NOT `affiliateLinks.ts`. `platformsForCountry` appends it for JP only (after Rakuten + Jalan), so AU/NZ never show it.
- **It is metasearch, not an OTA** → there is **no free-text/query deep link.** Result pages are keyed by an internal trivago area id ("locid"). So unlike every other platform, its link can't be built from the query string. Instead `TRIVAGO_DESTINATIONS` (a hand-maintained code map, region id → verified URL) holds it. URL pattern: `https://www.trivago.jp/en-US/odr/hotels-{place}-japan?search=200-{locid}`. **Yamanouchi = locid `200-70117`** (covers Yudanaka, Shibu Onsen, Yomase/Shiga Kogen — all under region id `yamanouchi`).
- **Earns via CJ, NOT Awin.** trivago JP is a CJ advertiser (CID `7819798`); the owner is approved (active relationship). Its AID in `CJ_ADVERTISER_AIDS.trivago` is the **"Evergreen Link for trivago JP"** creative (`17247167`) — the deep-link / URL-redirect-enabled one, so the CJ click URL (`click-{PID}-{AID}?url={ENCODED dest}`) redirects to the region-specific trivago page. The other creatives ("JP Generic", "JP Savings") are FIXED-destination (locked to `trivago.jp/ja/srl?search=200-85`), useless for deep linking — don't use them. **Why CJ not Awin:** the owner's trivago JP programme is on CJ, and it's one network per merchant, so do NOT also rely on Awin Convert-a-Link for trivago. (An earlier session wrongly assumed Awin; corrected once the owner showed the CJ approval.)
- **First REGION-keyed platform.** `platformDeepLink` gained `opts.region`; trivago returns `TRIVAGO_DESTINATIONS[region] ?? ""`. An unmapped region returns `""`, and consumers DROP empty links (no dead button). **Both** `TownStay` (town pages) **and** `StayPlatformBar` (region + yamanouchi stay pages) now CJ-wrap each link via `(adsOk && cjLinkFor(p.id, plainUrl, { sid })) || plainUrl` — StayPlatformBar gained `useConsent` for this (safe: `ConsentProvider` is app-wide). **Filter on the PLAIN url length, never the CJ-wrapped href** (the wrapped href is non-empty even when the destination is empty). **To add a new JP region's trivago button you MUST add its verified locid to `TRIVAGO_DESTINATIONS`** — otherwise it auto-hides (correct, not a bug).
- **When adding/removing a platform, fix the hardcoded site-count copy.** `regions/yamanouchi/pages/stay.tsx` hardcodes "N booking sites" (EN + JA, ~3 spots); `StayPlatformBar`/`TownStay` counts are dynamic. trivago made it 9 — keep those numbers honest (owner is honesty-sensitive).
- **Threading region:** every `StayPlatformBar` call site must pass `region` (RegionStay → `region.id`; yamanouchi custom stay page → hardcoded `"yamanouchi"`). TownStay passes `region.id`.

## Car hire
- Europcar is on **Awin** (not CJ): the "Hire a car" card is a plain Europcar link the MasterTag auto-converts. Lives in a shared `components/CarHireCard.tsx` (`europcarUrlForRegion`).
- **Region-aware on purpose:** Awin's Convert-a-Link only rewrites the EXACT approved country domain. The programme is "Europcar_AU NZ", so AU→europcar.com.au, NZ→europcar.co.nz; JP/other fall back to global europcar.com (works but untracked, won't earn). Do NOT use one global Europcar URL — AU/NZ clicks then don't track.
- **TRAP — "every town's transport" is FOUR surfaces, not one:** the generic `pages/town/TownTransport.tsx` covers most regions, but snowy-mountains, victorias-high-country and yamanouchi have their OWN custom transport pages (`regions/<id>/pages/Transport.tsx`). Any "shown on every transport page" feature MUST be added to the generic page AND those customs, or it silently misses the biggest AU regions. (This trap once made me tell the owner the card was everywhere when it was missing on Snowy + Victoria.)
- Yamanouchi (JP) intentionally keeps its own Japan car-rental list (Toyota/Nippon/Times/etc.) and gets NO Europcar card — JP isn't in the AU/NZ approval.
