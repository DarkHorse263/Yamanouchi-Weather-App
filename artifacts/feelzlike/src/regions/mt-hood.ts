import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mt. Hood area, OR · base town Government Camp, home to three resorts:
 *
 *   Mt. Hood Meadows  → Indy Pass (2 days, select blackouts) + Indy+ Pass
 *                       (2 days, no blackouts) · not on Epic/Ikon · own
 *                       proprietary season passes sold directly.
 *   Timberline Lodge  → Mt. Hood Fusion Pass (bundled with Skibowl) or
 *                       standalone · not on Epic/Ikon/Indy · famous for
 *                       near-year-round Palmer Snowfield summer skiing.
 *   Mt. Hood Skibowl   → Mt. Hood Fusion Pass (bundled with Timberline) +
 *                       Powder Alliance in its own right · not confirmed
 *                       on Epic/Ikon/Indy · America's largest lit
 *                       night-skiing operation.
 *
 * Naming collision: none of "mt-hood-meadows", "timberline-lodge",
 * "mt-hood-skibowl" or the base town "government-camp" collide with any
 * existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - 2025-26 was a historically low-early-season-snowfall winter across
 *   Oregon; most Mt. Hood areas opened later than usual (mid-to-late
 *   December 2025) per the research doc. No single resort here is
 *   flagged as fully closed for the season (unlike Idaho's Bogus Basin/
 *   Tamarack cases) — Mt. Hood Meadows, Timberline, and Skibowl were all
 *   operating for 2025-26, just later-starting than typical.
 * - Timberline Lodge's summit/vertical figures are genuinely disputed
 *   across sources (Timberline's own "4,540 ft, longest in the U.S."
 *   claim, measured top-of-Palmer to the old Summit Pass base, vs.
 *   independent aggregators' ~3,590-3,690 ft figure measured to a
 *   higher base). Timberline's own official claim is used as the
 *   headline figure per the research doc's recommendation; the
 *   discrepancy is noted here rather than silently picking one.
 * - No webcam URL for any of the three Mt. Hood resorts could be
 *   independently confirmed by direct fetch in research (JS-rendered
 *   pages / third-party mirrors only) — each mountain's `websiteUrl`
 *   points at the resort's own conditions hub rather than a fabricated
 *   webcam deep link.
 * - Avalanche: covered by the Northwest Avalanche Center (NWAC), the
 *   same authority used for Washington — NWAC's forecast zones extend
 *   south into northern Oregon and explicitly include Mt. Hood.
 *
 * First Oregon region on this branch. America/Los_Angeles timezone.
 * Oregon has a BROAD, MANDATORY, statewide traction/chain law (ORS
 * 815.045/815.140/815.142/815.145 + OAR 734-017) applying to ALL
 * vehicles, not just trucks, when ODOT posts a chain-up zone — see
 * roads.ts's `orChainEntry()`. ODOT's TripCheck (tripcheck.com) is the
 * road-conditions authority.
 */
export const mtHoodRegion: RegionConfig = {
  id: "mt-hood",
  name: "Mt. Hood",
  subtitle: "Oregon · USA",
  shortTag: "OR",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mt. Hood Meadows", "Timberline Lodge", "Mt. Hood Skibowl"],
  resorts: [
    { path: "/mountain/mt-hood-meadows", label: "Mt. Hood Meadows" },
    { path: "/mountain/timberline-lodge", label: "Timberline Lodge" },
    { path: "/mountain/mt-hood-skibowl", label: "Mt. Hood Skibowl" },
  ],
  mountains: [
    {
      id: "mt-hood-meadows",
      name: "Mt. Hood Meadows",
      elevationM: 2225,
      lat: 45.32889,
      lng: -121.66250,
      blurb: "Indy Pass (2 days, select blackouts) + Indy+ Pass (2 days, no blackouts) · not on Epic or Ikon, sells its own proprietary season passes · base 4,523 ft / lift-served summit 7,300 ft · 2,150 skiable acres · ⚠️ exact 2025-26 opening/closing dates not confirmed by a single dated primary source; historically low early-season snowfall across Oregon delayed most Mt. Hood-area openings into mid/late December 2025.",
      websiteUrl: "https://www.skihood.com/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
    },
    {
      id: "timberline-lodge",
      name: "Timberline Lodge",
      elevationM: 2603,
      lat: 45.33111,
      lng: -121.71000,
      blurb: "Mt. Hood Fusion Pass (bundled with Mt. Hood Skibowl) or standalone season pass · Powder Alliance (winter only) · not on Epic, Ikon or Indy · famous for near-year-round skiing via the Palmer Snowfield (snowcat/lift access to 8,540 ft) · ⚠️ vertical-drop figure is genuinely disputed across sources: Timberline's own marketing claims 4,540 ft (\"longest in the U.S.\", top-of-Palmer to the old Summit Pass base at 4,000 ft), while several independent aggregators report a smaller ~3,590-3,690 ft figure measured to a higher ~4,850-4,950 ft base — both figures are shown here rather than silently picking one. 2025-26 winter season passes ran through May 25, 2026; by August 2026 the mountain was in its normal spring/summer closed-for-season state.",
      websiteUrl: "https://timberlinelodge.com/",
      snowReportUrl: "https://www.timberlinelodge.com/Conditions",
      expert_only: true,
      backcountry_access: true,
      beginner_friendly: true,
    },
    {
      id: "mt-hood-skibowl",
      name: "Mt. Hood Skibowl",
      elevationM: 1554,
      lat: 45.30189,
      lng: -121.773212,
      blurb: "Mt. Hood Fusion Pass (bundled with Timberline) + Powder Alliance in its own right (3 free days at 18 partner resorts) · not confirmed on Epic, Ikon or Indy · America's largest lit night-skiing operation, closest ski area to Portland · base 3,600 ft / summit (Tom, Dick & Harry Mountain) ~5,027-5,100 ft / 1,500 ft vertical · ⚠️ 2025-26 opening date conflicting across sources (~Dec 6, 2025 vs. a raw \"01/09/26\" data field) — not independently resolved.",
      websiteUrl: "https://skibowl.com/",
      snowReportUrl: "https://skibowl.com/winter-condition-and-lift-status/",
      beginner_friendly: true,
      terrain_park: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "government-camp",
      name: "Government Camp",
      lat: 45.30222,
      lng: -121.75250,
      radiusM: 8000,
      blurb: "Small mountain village on US-26, the main gateway to Timberline Lodge and Mt. Hood Skibowl; Mt. Hood Meadows is a short drive further up OR-35.",
      nearbyMountainIds: ["mt-hood-meadows", "timberline-lodge", "mt-hood-skibowl"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Mt. Hood Territory", url: "https://www.mthoodterritory.com/" },
    { category: "Resorts", label: "Mt. Hood Meadows", url: "https://www.skihood.com/" },
    { category: "Resorts", label: "Timberline Lodge", url: "https://timberlinelodge.com/" },
    { category: "Resorts", label: "Mt. Hood Skibowl", url: "https://skibowl.com/" },
    { category: "Avalanche", label: "Northwest Avalanche Center (NWAC)", url: "https://nwac.us/" },
    { category: "Transport", label: "ODOT TripCheck · tripcheck.com", url: "https://www.tripcheck.com/" },
  ],
  roadsSource: {
    label: "ODOT TripCheck · tripcheck.com",
    url: "https://www.tripcheck.com/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
