import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Okemo · single-resort region, base town Ludlow:
 *
 *   Okemo Mountain Resort → Epic Pass, part of Vail's Northeast group with
 *                            Stowe and Mount Snow · celebrating its 70th
 *                            season in 2025-26 · confirmed season (opened
 *                            Nov 22 2025, closed Apr 19 2026)
 *
 * Naming collision: the resort's full official name is "Okemo Mountain
 * Resort," not bare "Okemo," so no `-resort` suffix is needed to
 * disambiguate it from the region id "okemo" — the official name already
 * reads distinctly. No base town shares the "okemo" name (the base town
 * is Ludlow), so no `-town` suffix is needed either. Confirmed via grep
 * across the full registry — no collisions found.
 *
 * First Eastern-timezone (America/New_York) region in the USA module.
 * Vermont has no dedicated avalanche-forecasting authority and no
 * statewide chain law for passenger vehicles — see roads.ts and
 * RegionSources.tsx.
 */
export const okemoRegion: RegionConfig = {
  id: "okemo",
  name: "Okemo",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Okemo Mountain Resort"],
  resorts: [
    { path: "/mountain/okemo-mountain-resort", label: "Okemo Mountain Resort" },
  ],
  mountains: [
    {
      id: "okemo-mountain-resort",
      name: "Okemo Mountain Resort",
      elevationM: 349,
      lat: 43.4009,
      lng: -72.7168,
      blurb: "Epic Pass · Vail's Northeast group with Stowe and Mount Snow · celebrating its 70th season for 2025-26 · confirmed season (opened Nov 22 2025, closed Apr 19 2026)",
      websiteUrl: "https://www.okemo.com/",
      snowReportUrl: "https://www.okemo.com/the-mountain/mountain-report.aspx",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "ludlow",
      name: "Ludlow",
      lat: 43.3959,
      lng: -72.7096,
      radiusM: 10000,
      blurb: "Small town in south-central Vermont, the base town for Okemo Mountain Resort",
      nearbyMountainIds: ["okemo-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Ludlow Area Chamber", url: "https://www.ludlow.org/" },
    { category: "Resorts", label: "Okemo Mountain Resort", url: "https://www.okemo.com/" },
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
