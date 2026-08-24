import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Killington/Pico · base town Killington, home to two resorts:
 *
 *   Killington     → Epic Pass + Beast 365 · "The Beast of the East,"
 *                     Vermont's largest ski area · confirmed 183-day
 *                     2025-26 season (opened Nov 12 2025, closed May 25
 *                     2026)
 *   Pico Mountain  → Ikon Base Pass (with blackouts) · quieter neighbour,
 *                     2025-26 closing date NOT confirmed by the resort
 *
 * Naming collision: the resort "Killington" and the base town "Killington"
 * share the same name. Per the Breckenridge/Winter Park convention
 * established in the Colorado pass (resort name equals a town name), the
 * RESORT takes the `-resort` suffix (killington-resort) while the town
 * keeps the plain slug (killington). This is the opposite direction from
 * the Crested Butte/park-city `-town` convention, which applies when the
 * REGION id (not the resort id) collides with the town — deliberately
 * following whichever existing precedent matches the actual collision
 * shape here.
 *
 * First Eastern-timezone (America/New_York) region in the USA module —
 * Colorado and Utah use America/Denver, California uses
 * America/Los_Angeles.
 *
 * Vermont has no dedicated avalanche-forecasting authority (the terrain
 * does not carry significant avalanche danger) and no statewide chain law
 * for passenger vehicles — see roads.ts and RegionSources.tsx for the
 * honesty-gate treatment shared by all 6 Vermont regions.
 *
 * Weather is Open-Meteo with the existing OpenWeatherMap fallback. VTrans
 * publishes New England 511 but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 */
export const killingtonPicoRegion: RegionConfig = {
  id: "killington-pico",
  name: "Killington/Pico",
  subtitle: "Vermont · USA",
  shortTag: "VT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Killington", "Pico Mountain"],
  resorts: [
    { path: "/mountain/killington-resort", label: "Killington" },
    { path: "/mountain/pico-mountain", label: "Pico Mountain" },
  ],
  mountains: [
    {
      id: "killington-resort",
      name: "Killington",
      elevationM: 355,
      lat: 43.6045,
      lng: -72.8201,
      blurb: "Epic Pass + Beast 365 · \"The Beast of the East,\" Vermont's largest ski area with 6 interconnected peaks · confirmed 183-day 2025-26 season (opened Nov 12 2025, closed May 25 2026)",
      websiteUrl: "https://www.killington.com/",
      snowReportUrl: "https://www.killington.com/mountain-report",
      expert_only: false,
      backcountry_access: false,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "pico-mountain",
      name: "Pico Mountain",
      elevationM: 610,
      lat: 43.6659,
      lng: -72.8323,
      blurb: "Ikon Base Pass (with blackouts) · quieter, family-oriented neighbour to Killington · 2025-26 closing date not confirmed by the resort at time of writing (opened Dec 12 2025)",
      websiteUrl: "https://www.picomountain.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "killington",
      name: "Killington",
      lat: 43.6042,
      lng: -72.8092,
      radiusM: 12000,
      blurb: "Vermont's best-known ski town, along US-4 in the Green Mountains, the main gateway to Killington and Pico Mountain",
      nearbyMountainIds: ["killington-resort", "pico-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Killington Chamber of Commerce", url: "https://www.killingtonchamber.com/" },
    { category: "Resorts", label: "Killington", url: "https://www.killington.com/" },
    { category: "Resorts", label: "Pico Mountain", url: "https://www.picomountain.com/" },
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
