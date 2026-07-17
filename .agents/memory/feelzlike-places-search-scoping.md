---
name: feelzlike places search scoping
description: How /api/places/search returns only AU/JP/NZ localities (Autocomplete + includedPrimaryTypes + includedRegionCodes) and resolves coords on pick via /api/places/details; client picked-place -> curated town reconciliation.
---

# Scoping the place-search to AU/JP/NZ localities

**Design (Autocomplete) in `places-google.ts`:** `/places/search` does ONE Google Places (New) `places:autocomplete` (POST) call with `includedPrimaryTypes:["locality","sublocality","postal_town","administrative_area_level_3"]` and `includedRegionCodes:["au","jp","nz"]`. Google enforces BOTH the locality type filter and the country scope server-side, so the response is localities only, already scoped. Returns `{results:[{id,name,address}]}` (predictions carry NO coordinates).

**Why this replaced the old Text Search fan-out:** the previous design ran one `places:searchText` per country (per-country `locationRestriction.rectangle` fanned out via `Promise.allSettled`), then classified each hit place-like vs business and merged place-like first. Text Search ranks businesses above the bare locality even within one country, so generic-word towns still led with a business ("Orange" -> "orange college / restaurant orange / optus orange / ito orange beach" instead of Orange NSW). User signed off on the switch to Autocomplete, which returns bare localities directly. Live-confirmed: "orange" -> Orange NSW first (all localities); "jindab" -> Jindabyne; "niseko" -> Niseko Hokkaido.

**Type list rationale:** explicit 4 types (max is 5), NOT the `(cities)`/`(regions)` collections — `(cities)` omits sublocality (suburbs), `(regions)` adds postal_code/country noise. `includedRegionCodes` is autocomplete-only (do NOT send it to `searchText`, which 400s); it makes the old `SERVED_REGIONS` rectangles + `countryCodeOf` country-code filter + `PLACE_LIKE_TYPES` place-like ranking all obsolete (the JP-rectangle Korea/China leak is gone because Google scopes at the source).

**Coords on pick, not per prediction:** `/places/details` (GET `?placeId=`) does a Place Details call (fieldmask `id,displayName,formattedAddress,location`) -> `{id,name,address,lat,lng}`. `placeId` is validated with `/^[A-Za-z0-9_-]{1,256}$/` before URL interpolation (path-traversal/SSRF guard); 400 on bad/missing id, 502 if no coords. Only fires on an actual selection.

**Cost:** per-request autocomplete + one details-per-pick is CHEAPER than the old 3x Text Search Pro per keystroke-batch. No session tokens (pure billing optimisation, never a correctness issue) — acceptable given client 350ms debounce + MIN_CHARS 3 + React Query 1h staleTime + `Cache-Control` 1h. `nearby` + `photo` routes are unchanged.

**How to apply / adding a country:** add its CLDR code to `includedRegionCodes`. Do NOT reintroduce the per-country rectangle fan-out or a global Text Search — Autocomplete already scopes correctly. Do NOT switch search back to `searchText` (reintroduces the business-label bug the user rejected).

# Curated-first client index (towns Google can't return)

Google's locality-type filter EXCLUDES resort areas — "Madarao" (curated town
Madarao Kogen) returned zero predictions, so relying on Google alone made our
own towns unfindable ("no places found" for a town we serve). Fix lives in
`PlaceSearch`: a module-load index of every region baseTown (keys = town name +
region name + nearby mountain names, en normalized + raw ja) is matched locally
and rendered FIRST in the dropdown (Mountain icon, "subtitle · live conditions"
line), above Google rows; Google rows duplicating a curated name are filtered.
A curated pick navigates straight to `/:region/:town` with NO details call and
bumps `pickSeq` so an in-flight Google pick can't navigate afterwards. Do NOT
"fix" findability by loosening the server's locality restriction (reintroduces
the business-label bug) — the curated index is the intended mechanism.

# Picked-place -> curated town reconciliation (client)

`PlaceSearch.choose()` is async: on pick it fetches `/api/places/details` for coords (row spinner via `resolvingId`, inline "couldn't load that place" error on failure so a pick never silently no-ops), then reconciles against `REGIONS.flatMap(baseTowns)` before navigating. A normalized name match (en or `nameJa`) accepts within 25km; proximity alone accepts only within 6km (tight, so it never grabs a neighbour when there is no name signal). On match it navigates `/:region/:town` (rich town page, correct under the root wouter base); otherwise it keeps the location-first `/near-you?lat&lng&name` fallback. The 6km floor matters where towns are very close (Yudanaka / Shibu Onsen ~1km) — the name match disambiguates them. A monotonic `pickSeq` ref guards against a stale pick: retyping mid-resolve (or picking again) invalidates the in-flight lookup so it can't navigate after the user moved on. `PlaceSearch` is the ONLY caller of `/api/places/search`; the /near-you `?lat&lng&name` contract is unchanged.
