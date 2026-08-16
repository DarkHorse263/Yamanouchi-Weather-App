import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Southern Vermont · three base towns (Stratton, West Dover, Peru/
 * Manchester), four resorts:
 *
 *   Stratton          → Ikon Pass · confirmed 2025-26 season (opened Nov
 *                        26 2025, closed Apr 12 2026)
 *   Mount Snow        → Epic Pass, part of Vail's Northeast group with
 *                        Stowe and Okemo · 2025-26 closing date NOT
 *                        confirmed (target open Nov 22 2025)
 *   Bromley Mountain  → Indy Pass (first season on Indy for 2025-26) ·
 *                        Vermont's highest base elevation (1,950 ft) ·
 *                        2025-26 closing date NOT confirmed (opened Nov
 *                        28 2025; prior season closed Apr 3 2025)
 *   Magic Mountain    → ⚠️ DID NOT OPEN for the 2025-26 season — see the
 *                        dedicated honesty-gate note below
 *
 * Naming collision: the resort "Stratton" and the base town "Stratton"
 * share the same name. Per the Breckenridge/Winter Park/killington-resort
 * convention (resort name equals a town name → the RESORT takes the
 * `-resort` suffix), the resort becomes stratton-mountain-resort while the
 * town keeps the plain slug (stratton). Peru and Manchester are
 * disambiguated with a `-vt` suffix (peru-vt, manchester-vt) as a
 * forward-looking precaution should a Peru (the country) or a Manchester
 * (UK or elsewhere) region ever be added to this platform — neither
 * currently exists, so this is not a strict collision today, just a
 * defensive naming choice flagged here per the task's request to call out
 * naming decisions.
 *
 * ⚠️ MAGIC MOUNTAIN — dedicated honesty-gate case, same treatment as
 * Sierra-at-Tahoe in the California pass: Magic Mountain did NOT open at
 * all for the 2025-26 season — the lowest snowfall in 20+ years produced
 * the resort's first non-opening in over 20 years under the Miller family's
 * ownership. Unlike Sierra-at-Tahoe (where elevation was withheld because
 * it was unconfirmed), Magic Mountain's base (1,350 ft / 411m) and summit
 * (2,850 ft / 869m) elevations ARE confirmed by research and are shown
 * here, since the task brief explicitly permits elevation display for
 * Magic while withholding all current-season live-condition data. Season
 * dates below are the PRIOR (2024-25) season's confirmed dates (opened
 * Dec 7 2024, closed ~Mar 24 2025 — a minority of sources say Apr 13 2025;
 * the resort's own Facebook post is treated as the stronger signal and
 * Mar 24 2025 is used, with the conflict flagged) shown for historical
 * context only, explicitly labelled as prior-season and not asserted as
 * this year's operating dates. No live snow-report or lift-status data is
 * presented for Magic Mountain anywhere in this pass — mirrored
 * consistently across this region file, weather.ts, webcams.ts, roads.ts,
 * RegionSources.tsx and tourismLinks, per the Sierra-at-Tahoe precedent.
 *
 * First Eastern-timezone (America/New_York) region in the USA module.
 * Vermont has no dedicated avalanche-forecasting authority and no
 * statewide chain law for passenger vehicles — see roads.ts and
 * RegionSources.tsx.
 */
export const southernVermontRegion: RegionConfig = {
  id: "southern-vermont",
  name: "Southern Vermont",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Stratton", "Mount Snow", "Bromley Mountain", "Magic Mountain"],
  resorts: [
    { path: "/mountain/stratton-mountain-resort", label: "Stratton" },
    { path: "/mountain/mount-snow", label: "Mount Snow" },
    { path: "/mountain/bromley-mountain", label: "Bromley Mountain" },
    { path: "/mountain/magic-mountain", label: "Magic Mountain" },
  ],
  mountains: [
    {
      id: "stratton-mountain-resort",
      name: "Stratton",
      elevationM: 571,
      lat: 43.1131,
      lng: -72.9081,
      blurb: "Ikon Pass · gondola-served summit, one of southern Vermont's largest resorts · confirmed 2025-26 season (opened Nov 26 2025, closed Apr 12 2026)",
      websiteUrl: "https://www.stratton.com/",
      snowReportUrl: "https://www.stratton.com/the-mountain/mountain-report",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "mount-snow",
      name: "Mount Snow",
      elevationM: 579,
      lat: 42.9601,
      lng: -72.9201,
      blurb: "Epic Pass · Vail's Northeast group with Stowe and Okemo · popular with Boston/NYC day-trippers · 2025-26 closing date not confirmed by the resort at time of writing (target open Nov 22 2025)",
      websiteUrl: "https://www.mountsnow.com/",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "bromley-mountain",
      name: "Bromley Mountain",
      elevationM: 594,
      lat: 43.2226,
      lng: -72.9376,
      blurb: "Indy Pass (first season on Indy for 2025-26) · Vermont's highest base elevation (1,950 ft) · south-facing sun exposure · opened Nov 28 2025, 2025-26 closing date not confirmed (prior season closed Apr 3 2025)",
      websiteUrl: "https://www.bromley.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "magic-mountain",
      name: "Magic Mountain",
      elevationM: 411,
      lat: 43.1706,
      lng: -72.7534,
      // ⚠️ Whole-season non-opening honesty gate — see region-file header
      // comment above for full context.
      blurb: "⚠️ Did NOT open for the 2025-26 season — the lowest snowfall in 20+ years produced the resort's first non-opening in over 20 years under Miller family ownership. Dates shown are the PRIOR (2024-25) season for historical context only: opened Dec 7 2024, closed ~Mar 24 2025 (a minority of sources report Apr 13 2025 — the resort's own social post is treated as the stronger signal). Treat all current-season conditions data for this resort as unavailable.",
      websiteUrl: "https://www.magicmtn.com/",
      expert_only: true,
    },
  ],
  baseTowns: [
    {
      id: "stratton",
      name: "Stratton",
      lat: 43.1334,
      lng: -72.9298,
      radiusM: 8000,
      blurb: "Small village closest to Stratton resort's base area",
      nearbyMountainIds: ["stratton-mountain-resort"],
    },
    {
      id: "west-dover",
      name: "West Dover",
      lat: 42.9709,
      lng: -72.8265,
      radiusM: 8000,
      blurb: "Village along VT-100, the main gateway to Mount Snow",
      nearbyMountainIds: ["mount-snow"],
    },
    {
      // `-vt` suffix is a defensive naming choice, not a strict collision
      // today — see region-file header comment above.
      id: "peru-vt",
      name: "Peru",
      lat: 43.2333,
      lng: -72.8990,
      radiusM: 8000,
      blurb: "Small hill town near Bromley and Magic Mountain",
      nearbyMountainIds: ["bromley-mountain", "magic-mountain"],
    },
    {
      id: "manchester-vt",
      name: "Manchester",
      lat: 43.1642,
      lng: -73.0729,
      radiusM: 10000,
      blurb: "Larger shopping/dining town along US-7, a common base for visiting Bromley, Magic Mountain and Stratton",
      nearbyMountainIds: ["bromley-mountain", "magic-mountain", "stratton-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Manchester and the Mountains", url: "https://www.visitmanchestervt.com/" },
    { category: "Resorts", label: "Stratton", url: "https://www.stratton.com/" },
    { category: "Resorts", label: "Mount Snow", url: "https://www.mountsnow.com/" },
    { category: "Resorts", label: "Bromley Mountain", url: "https://www.bromley.com/" },
    { category: "Resorts", label: "Magic Mountain (⚠️ did not open for 2025-26 season)", url: "https://www.magicmtn.com/" },
    { category: "Transport", label: "VTrans · New England 511 road conditions", url: "https://www.newengland511.org/region/Vermont" },
  ],
  roadsSource: {
    label: "VTrans · New England 511",
    url: "https://www.newengland511.org/region/Vermont",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
