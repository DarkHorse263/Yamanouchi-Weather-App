---
name: feelzlike home region list has two sources of truth
description: The country/home page region list comes from the API but falls back to a hardcoded array; they must stay in sync or regions silently vanish.
---

# feelzlike home region list: API + hardcoded fallback must stay in lockstep

The home/country page region list (the "X regions live" cards) has TWO sources:
- authoritative: the API server's `REGIONS` array (served at `/api/regions`).
- fallback: a hardcoded `FALLBACK_REGIONS` array in the web app's shared `components/home/CountryPicker.tsx` (rendered by BOTH the landing `Welcome.tsx` and the `/countries` page), used ONLY until the API response loads (or whenever the API is slow/down).

**The trap:** if the two drift, the home page silently DROPS whatever regions are missing from the fallback (and shows "-" for temps) any time the API is down or slow. This once made it look like Tasmania, Nozawa Onsen and Iiyama had "disappeared" in the dev preview after the api-server workflow had stopped, even though the live site was fine.

**Why:** the fallback exists so the page renders instantly without waiting on the network; the live numbers come from the API a moment later.

**How to apply:**
- Adding/removing a region in the API `REGIONS` list => make the SAME change to `FALLBACK_REGIONS`.
- Only the card-identity fields must match for the visible render: `id`, `name`, `countryCode`, `status`, `href`, and the town label (`headlineLabel`, or `PRIMARY_TOWN[id]`). The `mountains`/`baseTowns` arrays do NOT affect the country card, so minor drift there is cosmetic-only.
- If the preview ever shows fewer regions than live or "-" temps, first suspect the api-server workflow is stopped, not a code regression.
