import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Santa Fe area, NM · one resort, one base town (Santa Fe):
 *
 *   Ski Santa Fe → Independent (own tiered pass lineup: Platinum/Gold/
 *                  OnePass/Peak Plus; Gold has blackouts Dec 26-31,
 *                  Jan 16-17, Feb 13-14) · owned by the Abruzzo family
 *                  via Alvarado Realty Co. (ARCO), the same family that
 *                  formerly owned Sandia Peak's ski-area operations
 *                  before selling to Mountain Capital Partners in 2024 ·
 *                  confirmed live webcams · one of the highest-base-
 *                  elevation resorts in the US (10,350 ft) · ⚠️ closed
 *                  early Mar 22 2026 due to unseasonably warm, dry
 *                  weather (part of the same northern-NM early-closure
 *                  pattern as Taos Ski Valley).
 *
 * No naming collision: resort "ski-santa-fe" and town "santa-fe" are
 * already distinct ids.
 *
 * America/Denver timezone (shared with all other New Mexico regions).
 * New Mexico has NO statewide chain law — see roads.ts's
 * `nmChainEntry()`.
 *
 * Avalanche: NOT covered by the Taos Avalanche Center's forecast area —
 * per the research doc, no dedicated forecasting center exists for the
 * Santa Fe area; in-bounds terrain risk is minimal given active ski
 * patrol, and backcountry users should rely on general NWS guidance
 * only. This gap is called out explicitly in RegionSources.tsx.
 *
 * Honesty-gate note: no single dedicated "snow report" URL (distinct
 * from the confirmed webcams/season-hours pages) could be pinned down
 * for Ski Santa Fe during research — the season/hours page is used as
 * the best available snowReportUrl; re-verify closer to season.
 */
export const santaFeRegion: RegionConfig = {
  id: "santa-fe",
  name: "Santa Fe",
  subtitle: "New Mexico · USA",
  shortTag: "NM",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Ski Santa Fe"],
  resorts: [
    { path: "/mountain/ski-santa-fe", label: "Ski Santa Fe" },
  ],
  mountains: [
    {
      id: "ski-santa-fe",
      name: "Ski Santa Fe",
      elevationM: 3681,
      lat: 35.8000,
      lng: -105.8000,
      blurb: "Independent (own Platinum/Gold/OnePass/Peak Plus passes; Gold has blackouts Dec 26-31, Jan 16-17, Feb 13-14) · base 10,350 ft / summit 12,075 ft / 1,725 ft vertical, one of the highest-base-elevation resorts in the US · owned by the Abruzzo family (ARCO), formerly also owners of Sandia Peak's ski-area operations · ⚠️ closed early for the 2025-26 season on Mar 22 2026 due to unseasonably warm, dry conditions.",
      websiteUrl: "https://www.skisantafe.com/",
      snowReportUrl: "https://www.skisantafe.com/hours/season",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "santa-fe",
      name: "Santa Fe",
      lat: 35.6870,
      lng: -105.9378,
      radiusM: 10000,
      blurb: "New Mexico's state capital, roughly 30 minutes' drive from Ski Santa Fe",
      nearbyMountainIds: ["ski-santa-fe"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Ski Santa Fe", url: "https://www.skisantafe.com/" },
    { category: "Resorts", label: "Ski Santa Fe", url: "https://www.skisantafe.com/" },
    { category: "Avalanche", label: "Taos Avalanche Center (regional only, does not cover Santa Fe)", url: "https://taosavalanchecenter.org/" },
    { category: "Transport", label: "NMDOT · nmroads.com road conditions", url: "https://www.nmroads.com/mapIndex.html" },
  ],
  roadsSource: {
    label: "NMDOT · nmroads.com",
    url: "https://www.nmroads.com/mapIndex.html",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
