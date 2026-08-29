import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Bend area, OR · one resort, one base town (Bend):
 *
 *   Mt. Bachelor → Ikon Pass destination (full destination access; exact
 *                  tier/blackout details for Mt. Bachelor specifically
 *                  were not itemized in sources reviewed — flagged for
 *                  follow-up) · confirmed official webcam hub with 8+
 *                  live feeds · one of the largest lift-served ski areas
 *                  in the US by skiable acreage (360°-skiable volcanic
 *                  cone).
 *
 * No naming collision: resort "mt-bachelor" and town "bend" are already
 * distinct ids.
 *
 * America/Los_Angeles timezone (shared with Mt. Hood and all Oregon
 * regions). Oregon has a BROAD, MANDATORY, statewide traction/chain law
 * — see roads.ts's `orChainEntry()`.
 *
 * ⚠️ HONESTY-GATE — avalanche authority gap: unlike Mt. Hood (covered by
 * the well-resourced Northwest Avalanche Center), Bend/Mt. Bachelor sits
 * OUTSIDE NWAC's forecast domain. The relevant authority here is the
 * Central Oregon Avalanche Center (COAC), a smaller, volunteer-run
 * nonprofit — this is a "different/lesser-resourced authority" flag,
 * not a "no coverage" gap. Called out explicitly in RegionSources.tsx
 * rather than silently treating COAC as equivalent to NWAC.
 */
export const bendRegion: RegionConfig = {
  id: "bend",
  name: "Bend",
  subtitle: "Oregon · USA",
  shortTag: "OR",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mt. Bachelor"],
  resorts: [
    { path: "/mountain/mt-bachelor", label: "Mt. Bachelor" },
  ],
  mountains: [
    {
      id: "mt-bachelor",
      name: "Mt. Bachelor",
      elevationM: 2763,
      baseElevationM: 1737,
      lat: 43.9794,
      lng: -121.6885,
      blurb: "Ikon Pass destination (full destination access; exact tier/blackout details specific to Mt. Bachelor were not itemized in sources reviewed) · base ~6,300 ft (5,700 ft per an alternate source) / summit 9,065 ft · 360°-skiable volcanic cone, one of the largest lift-served ski areas in the US by skiable acreage · confirmed official webcam hub with 8+ live feeds · ⚠️ avalanche forecasting here comes from the smaller, volunteer-run Central Oregon Avalanche Center (COAC), not the better-resourced NWAC that covers Mt. Hood.",
      websiteUrl: "https://www.mtbachelor.com/",
      snowReportUrl: "https://www.mtbachelor.com/the-mountain/mountain-report/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "bend",
      name: "Bend",
      lat: 44.05806,
      lng: -121.31528,
      radiusM: 12000,
      blurb: "Central Oregon's largest city, roughly 30 minutes' drive from Mt. Bachelor via Cascade Lakes Highway/OR-372.",
      nearbyMountainIds: ["mt-bachelor"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Bend", url: "https://www.visitbend.com/" },
    { category: "Resorts", label: "Mt. Bachelor", url: "https://www.mtbachelor.com/" },
    { category: "Avalanche", label: "Central Oregon Avalanche Center (COAC)", url: "https://coavalanche.org/" },
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
