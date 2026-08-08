import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Big Bear · base town Big Bear Lake, home to two resorts operated
 * together as one company ("Big Bear Mountain Resort"):
 *
 *   Bear Mountain → Ikon Pass · closing-date SOURCE CONFLICT: bigbear.com
 *                   cites March 25, 2026, the operator's own
 *                   bigbearmountainresort.com closing-day event page
 *                   cites March 29, 2026. Using March 29 (primary
 *                   operator source) — flagged below and in the commit.
 *   Snow Summit   → Ikon Pass (same operator) · closing-date SOURCE
 *                   CONFLICT: skiresort.info cites April 6, 2026, the
 *                   operator's own closing-day page cites March 22, 2026.
 *                   Using March 22 (primary operator source) — flagged.
 *
 * Naming: no collisions. "Big Bear Lake" (town) does not collide with
 * either resort name ("Bear Mountain", "Snow Summit"), and the region id
 * "big-bear" is distinct from the town id "big-bear-lake".
 *
 * ⚠️ Big Bear is explicitly OUTSIDE both the Sierra Avalanche Center's and
 * Eastern Sierra Avalanche Center's coverage areas (Big Bear sits in the
 * San Bernardino Mountains of Southern California, not the Sierra
 * Nevada). No dedicated backcountry avalanche forecasting authority was
 * identified for this region in research — this is stated honestly in
 * tourismLinks/RegionSources rather than pointing at SAC/ESAC as if they
 * covered it.
 *
 * First Pacific-timezone region on this branch. Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback. Caltrans QuickMap publishes
 * quickmap.dot.ca.gov but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 */
export const bigBearRegion: RegionConfig = {
  id: "big-bear",
  name: "Big Bear",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Bear Mountain", "Snow Summit"],
  resorts: [
    { path: "/mountain/bear-mountain", label: "Bear Mountain" },
    { path: "/mountain/snow-summit", label: "Snow Summit" },
  ],
  mountains: [
    {
      id: "bear-mountain",
      name: "Bear Mountain",
      elevationM: 2176,
      lat: 34.2267,
      lng: -116.8602,
      // Closing-date conflict noted in blurb per the honesty-gate list —
      // bigbear.com says March 25 2026, the operator's own event page
      // says March 29 2026; March 29 used as primary.
      blurb: "Ikon Pass · Southern California's terrain-park anchor · 2025-26 closing date reported as either Mar 25 (bigbear.com) or Mar 29 2026 (operator's own page, used here) — sources disagree",
      websiteUrl: "https://www.bigbearmountainresort.com/",
      terrain_park: true,
      expert_only: true,
    },
    {
      id: "snow-summit",
      name: "Snow Summit",
      elevationM: 2134,
      lat: 34.2286,
      lng: -116.8911,
      // Closing-date conflict — skiresort.info says April 6 2026, the
      // operator's own event page says March 22 2026; March 22 used as
      // primary.
      blurb: "Ikon Pass (same operator as Bear Mountain) · 2025-26 closing date reported as either Apr 6 (skiresort.info) or Mar 22 2026 (operator's own page, used here) — sources disagree",
      websiteUrl: "https://www.bigbearmountainresort.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "big-bear-lake",
      name: "Big Bear Lake",
      lat: 34.2439,
      lng: -116.9114,
      radiusM: 10000,
      blurb: "San Bernardino Mountains resort town on Highway 18/38, the base for Bear Mountain and Snow Summit",
      nearbyMountainIds: ["bear-mountain", "snow-summit"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Big Bear Lake", url: "https://www.bigbearlakeresortassociation.com/" },
    { category: "Resorts", label: "Bear Mountain", url: "https://www.bigbearmountainresort.com/" },
    { category: "Resorts", label: "Snow Summit", url: "https://www.bigbearmountainresort.com/" },
    { category: "Transport", label: "Caltrans QuickMap · Highway 18/38 conditions", url: "https://quickmap.dot.ca.gov/" },
  ],
  roadsSource: {
    label: "Caltrans QuickMap · quickmap.dot.ca.gov",
    url: "https://quickmap.dot.ca.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
