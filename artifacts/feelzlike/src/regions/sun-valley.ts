import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Sun Valley, ID · base town Ketchum, home to two resorts:
 *
 *   Bald Mountain ("Baldy") → Ikon Pass (Full tier, no blackouts) +
 *                             Mountain Collective · the largest ski
 *                             area in Idaho by vertical drop.
 *   Dollar Mountain          → same Ikon/Mountain Collective access as
 *                             Baldy · smaller, beginner-oriented.
 *
 * Naming collision: none of "bald-mountain", "dollar-mountain" or
 * "ketchum" collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - Bald Mountain's 2025-26 season opened Dec 3, 2025 (delayed from a
 *   planned Nov 27, 2025 opening) and closed Apr 12, 2026 — both dates
 *   confirmed by the research doc.
 * - Dollar Mountain shares Baldy's pass and general season but its
 *   closing date was NOT separately confirmed in research — flagged
 *   rather than assumed identical to Baldy's.
 * - Avalanche: covered by the Sawtooth Avalanche Center (SAC), the
 *   Idaho avalanche-forecast authority for the Sun Valley/Ketchum zone.
 *
 * IDAHO TIMEZONE NOTE: Sun Valley/Ketchum sits in the Mountain time
 * zone → America/Boise. (Contrast with Sandpoint/Schweitzer in the
 * Idaho Panhandle, which observes Pacific time → America/Los_Angeles.
 * Do not default all Idaho regions to one zone.)
 *
 * Idaho has a narrow, commercial-vehicle-only chain law (Idaho Code
 * § 49-948) that does not apply to passenger vehicles on this region's
 * access roads — see roads.ts's `idChainEntry()`. Idaho 511
 * (511.idaho.gov) is the road-conditions authority.
 */
export const sunValleyRegion: RegionConfig = {
  id: "sun-valley",
  name: "Sun Valley",
  subtitle: "Idaho · USA",
  shortTag: "ID",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Bald Mountain", "Dollar Mountain"],
  resorts: [
    { path: "/mountain/bald-mountain", label: "Bald Mountain" },
    { path: "/mountain/dollar-mountain", label: "Dollar Mountain" },
  ],
  mountains: [
    {
      id: "bald-mountain",
      name: "Bald Mountain",
      elevationM: 2789,
      lat: 43.65500,
      lng: -114.40917,
      blurb: "Ikon Pass (Full tier, no blackouts) + Mountain Collective · base 5,750 ft / summit 9,150 ft / vertical 3,400 ft — the largest ski area in Idaho by vertical drop · confirmed 2025-26 season Dec 3, 2025 (delayed from a planned Nov 27 opening) - Apr 12, 2026.",
      websiteUrl: "https://www.sunvalley.com/",
      snowReportUrl: "https://www.sunvalley.com/the-mountain/mountain-report/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
    {
      id: "dollar-mountain",
      name: "Dollar Mountain",
      elevationM: 2024,
      lat: 43.68306,
      lng: -114.34694,
      blurb: "Ikon Pass (Full tier, no blackouts) + Mountain Collective, shared with Bald Mountain · base 6,010 ft / summit 6,638 ft / vertical 628 ft, beginner-oriented · ⚠️ season-closing date not separately confirmed by research (Baldy's confirmed Apr 12, 2026 close should not be assumed to apply here without verification).",
      websiteUrl: "https://www.sunvalley.com/",
      snowReportUrl: "https://www.sunvalley.com/the-mountain/mountain-report/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "ketchum",
      name: "Ketchum",
      lat: 43.68074,
      lng: -114.36366,
      radiusM: 10000,
      blurb: "Base town for the Sun Valley resort complex, directly adjacent to both Bald Mountain and Dollar Mountain via ID-75.",
      nearbyMountainIds: ["bald-mountain", "dollar-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Sun Valley Resort", url: "https://www.sunvalley.com/" },
    { category: "Avalanche", label: "Sawtooth Avalanche Center (SAC)", url: "https://sawtoothavalanche.com/" },
    { category: "Transport", label: "Idaho 511 · 511.idaho.gov", url: "https://511.idaho.gov/" },
  ],
  roadsSource: {
    label: "Idaho 511 · 511.idaho.gov",
    url: "https://511.idaho.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
