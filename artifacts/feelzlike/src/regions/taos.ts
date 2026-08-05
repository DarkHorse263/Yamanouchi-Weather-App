import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Taos, NM · one resort, one base town (Taos Ski Valley):
 *
 *   Taos Ski Valley → Ikon Pass (Full, no blackouts; Base has blackouts
 *                      Dec 27-31 2025, Jan 17-18 2026, Feb 14-15 2026) ·
 *                      independent ownership (Taos Ski Valley, Inc.) ·
 *                      confirmed live webcams · ⚠️ closed early Mar 29
 *                      2026 due to unseasonably warm weather (part of a
 *                      broader northern-NM early-closure pattern also
 *                      affecting Ski Santa Fe).
 *
 * Naming collision: the resort id "taos-ski-valley" and the town id
 * "taos-ski-valley-town" both derive from the same place name (the base
 * town is literally also called "Taos Ski Valley"), so the town gets an
 * explicit `-town` suffix to disambiguate from the resort — same
 * convention as Wyoming/Montana's `-resort`/`-town` collision handling.
 *
 * First New Mexico region, America/Denver timezone (shared with
 * Colorado/Utah/Wyoming/Montana). New Mexico has NO statewide chain law
 * — NMSA §66-3-847 permits but does not require chains/studded tires —
 * see roads.ts's `nmChainEntry()` for the full framing rationale. NM-150,
 * the sole paved access road to Taos Ski Valley, is a narrow, steep,
 * switchback mountain road and is called out explicitly in the mountain
 * blurb and roads.ts.
 *
 * Avalanche: Taos Avalanche Center (taosavalanchecenter.org) covers "the
 * mountains surrounding Taos" — the only dedicated backcountry avalanche
 * forecasting authority in New Mexico. It does NOT extend to Angel Fire,
 * Santa Fe, or Albuquerque/Sandia Peak — see RegionSources.tsx.
 *
 * Elevation note: sources disagree slightly on Taos Ski Valley's exact
 * base/summit figures. The resort's own site (base 9,350 ft / summit
 * (Kachina Peak) 12,481 ft / vertical 3,131 ft) is used as primary here;
 * secondary sources (USFS, OpenSnow) cite a base nearer 9,207 ft and a
 * summit of roughly 11,819-12,450 ft.
 */
export const taosRegion: RegionConfig = {
  id: "taos",
  name: "Taos",
  subtitle: "New Mexico · USA",
  shortTag: "NM",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Taos Ski Valley"],
  resorts: [
    { path: "/mountain/taos-ski-valley", label: "Taos Ski Valley" },
  ],
  mountains: [
    {
      id: "taos-ski-valley",
      name: "Taos Ski Valley",
      elevationM: 3804,
      lat: 36.5960,
      lng: -105.4478,
      blurb: "Ikon Pass (Full, no blackouts; Base has blackouts Dec 27-31 2025, Jan 17-18 2026, Feb 14-15 2026) · independent ownership (Taos Ski Valley, Inc.) · base 9,350 ft / summit (Kachina Peak) 12,481 ft / 3,131 ft vertical per the resort's own figures (secondary sources cite base ~9,207 ft, summit ~11,819-12,450 ft) · sole access via NM-150, a narrow, steep, switchback mountain road · ⚠️ closed early for the 2025-26 season on Mar 29 2026 due to unseasonably warm temperatures.",
      websiteUrl: "https://www.skitaos.com/",
      snowReportUrl: "https://www.skitaos.com/mountain",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "taos-ski-valley-town",
      name: "Taos Ski Valley",
      lat: 36.5946,
      lng: -105.4497,
      radiusM: 5000,
      blurb: "The base village at the literal end of NM-150, directly at the foot of Taos Ski Valley",
      nearbyMountainIds: ["taos-ski-valley"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Taos Ski Valley", url: "https://www.skitaos.com/" },
    { category: "Resorts", label: "Taos Ski Valley", url: "https://www.skitaos.com/" },
    { category: "Avalanche", label: "Taos Avalanche Center", url: "https://taosavalanchecenter.org/" },
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
