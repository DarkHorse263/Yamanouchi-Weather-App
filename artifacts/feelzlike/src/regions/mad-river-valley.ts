import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mad River Valley · two base towns (Warren, Waitsfield), two resorts:
 *
 *   Sugarbush       → Mountain Collective Pass · two connected peaks
 *                      (Lincoln Peak, Mt. Ellen) · 2025-26 closing date
 *                      NOT confirmed by the resort (opening Nov 22 2025)
 *   Mad River Glen  → ⚠️ ski-only (no snowboarding) · independent,
 *                      co-operatively owned · confirmed opening Dec 6
 *                      2025, closing ~Apr 12 2026 (approximate/unconfirmed)
 *
 * No naming collisions: neither resort name matches either base town
 * (Warren, Waitsfield), and the region id "mad-river-valley" matches
 * neither. Confirmed via grep across the full registry.
 *
 * ⚠️ MAD RIVER GLEN — ski-only, same treatment as Alta/Deer Valley in the
 * Utah pass: Mad River Glen banned snowboarding for the 2025-26 season (a
 * trial snowboard-access lift was floated for Feb 29 2026, with a possible
 * permanent policy change starting 2026-27 — NOT yet in effect this
 * season). Flagged in this mountain's blurb and tourismLinks below,
 * matching the Alta/Deer Valley pattern exactly: there is no dedicated
 * schema field for board-restricted resorts in this data model, so it is
 * reflected in copy only.
 *
 * First Eastern-timezone (America/New_York) region in the USA module.
 * Vermont has no dedicated avalanche-forecasting authority and no
 * statewide chain law for passenger vehicles — see roads.ts and
 * RegionSources.tsx.
 */
export const madRiverValleyRegion: RegionConfig = {
  id: "mad-river-valley",
  name: "Mad River Valley",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Sugarbush", "Mad River Glen"],
  resorts: [
    { path: "/mountain/sugarbush", label: "Sugarbush" },
    { path: "/mountain/mad-river-glen", label: "Mad River Glen" },
  ],
  mountains: [
    {
      id: "sugarbush",
      name: "Sugarbush",
      elevationM: 480,
      lat: 44.1358,
      lng: -72.9204,
      blurb: "Mountain Collective Pass · two connected peaks (Lincoln Peak 3,975 ft, Mt. Ellen 4,083 ft) with a 2,600 ft vertical drop · 2025-26 closing date not confirmed by the resort at time of writing (opening Nov 22 2025 at Lincoln Peak)",
      websiteUrl: "https://www.sugarbush.com/",
      snowReportUrl: "https://www.sugarbush.com/mountain/conditions",
      expert_only: false,
      backcountry_access: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "mad-river-glen",
      name: "Mad River Glen",
      elevationM: 488,
      lat: 44.2001,
      lng: -72.9192,
      // ⚠️ Ski-only honesty gate — see region-file header comment above.
      blurb: "⚠️ Ski-only for 2025-26 — snowboarding is not permitted (a trial snowboard-access lift was floated for Feb 29 2026, with a possible permanent policy change starting 2026-27, not yet in effect this season) · independent, co-operatively owned by its skiers · opened Dec 6 2025, closing date ~Apr 12 2026 is approximate/unconfirmed",
      websiteUrl: "https://www.madriverglen.com/",
      expert_only: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "warren",
      name: "Warren",
      lat: 44.1195,
      lng: -72.8626,
      radiusM: 10000,
      blurb: "Small village along VT-100, the closest base town to Sugarbush",
      nearbyMountainIds: ["sugarbush"],
    },
    {
      id: "waitsfield",
      name: "Waitsfield",
      lat: 44.1975,
      lng: -72.8090,
      radiusM: 10000,
      blurb: "Main commercial hub of the Mad River Valley along VT-100, the closest base town to Mad River Glen",
      nearbyMountainIds: ["mad-river-glen"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Mad River Valley Chamber", url: "https://www.madrivervalley.com/" },
    { category: "Resorts", label: "Sugarbush", url: "https://www.sugarbush.com/" },
    { category: "Resorts", label: "Mad River Glen (⚠️ ski-only, no snowboarding)", url: "https://www.madriverglen.com/" },
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
