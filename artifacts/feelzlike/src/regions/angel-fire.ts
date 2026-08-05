import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Angel Fire, NM · one resort, one base town (Angel Fire):
 *
 *   Angel Fire Resort → Powder Alliance (confirmed: 3 reciprocal winter
 *                        lift tickets) · own proprietary Winter Season
 *                        Pass ($950 adult 2025-26) · ⚠️ a secondary source
 *                        claims Indy Pass affiliation too, but this could
 *                        NOT be verified on Indy Pass's own resort
 *                        directory — flagged unconfirmed, not asserted
 *                        here · confirmed live webcams · New Mexico's
 *                        only night skiing · confirmed season Dec 12
 *                        2025 - Mar 22 2026.
 *
 * No naming collision: resort "Angel Fire Resort" and town "Angel Fire"
 * share a base name but the resort's own multi-word official name
 * ("Angel Fire Resort") disambiguates it, mirroring "Jackson Hole
 * Mountain Resort" / "Jackson" in the Wyoming pass — no `-resort` suffix
 * needed on the id since "angel-fire-resort" is already distinct from
 * the town id "angel-fire".
 *
 * America/Denver timezone (shared with all other New Mexico regions).
 * New Mexico has NO statewide chain law — see roads.ts's
 * `nmChainEntry()`.
 *
 * Avalanche: NOT covered by the Taos Avalanche Center's forecast area —
 * per the research doc, "no equivalent dedicated forecasting center
 * exists for the Angel Fire ... area[s]"; in-bounds terrain risk is
 * minimal given active ski patrol, and backcountry users should rely on
 * general NWS guidance only. This gap is called out explicitly (not
 * silently omitted) in RegionSources.tsx.
 */
export const angelFireRegion: RegionConfig = {
  id: "angel-fire",
  name: "Angel Fire",
  subtitle: "New Mexico · USA",
  shortTag: "NM",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Angel Fire Resort"],
  resorts: [
    { path: "/mountain/angel-fire-resort", label: "Angel Fire Resort" },
  ],
  mountains: [
    {
      id: "angel-fire-resort",
      name: "Angel Fire Resort",
      elevationM: 3254,
      lat: 36.3929,
      lng: -105.2853,
      blurb: "Powder Alliance (3 reciprocal winter lift tickets) · own Winter Season Pass · base 8,600 ft / summit 10,677 ft / 2,077 ft vertical · New Mexico's only night skiing · confirmed season Dec 12 2025 - Mar 22 2026 · ⚠️ a secondary source claims Indy Pass affiliation too, unconfirmed on Indy Pass's own directory.",
      websiteUrl: "https://www.angelfireresort.com/",
      snowReportUrl: "https://www.angelfireresort.com/weather/",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "angel-fire",
      name: "Angel Fire",
      lat: 36.3762,
      lng: -105.2894,
      radiusM: 8000,
      blurb: "Moreno Valley town near Wheeler Peak, gateway to Angel Fire Resort",
      nearbyMountainIds: ["angel-fire-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Angel Fire NM", url: "https://visitangelfirenm.com/" },
    { category: "Resorts", label: "Angel Fire Resort", url: "https://www.angelfireresort.com/" },
    { category: "Avalanche", label: "Taos Avalanche Center (regional only, does not cover Angel Fire)", url: "https://taosavalanchecenter.org/" },
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
