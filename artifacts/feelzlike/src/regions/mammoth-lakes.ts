import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mammoth Lakes · base town Mammoth Lakes, home to two resorts:
 *
 *   Mammoth Mountain → Ikon Pass · one of the highest, latest-closing
 *                       resorts in California, a 199-day 2025-26 season
 *   June Mountain     → Ikon Pass · smaller sister mountain, two peaks
 *                       (Rainbow Mountain + June Mountain)
 *
 * Naming collision: the region id equals the base town name ("Mammoth
 * Lakes"), so the town id is disambiguated as mammoth-lakes-town,
 * mirroring the park-city/provo `-town` convention. Neither resort name
 * ("Mammoth Mountain", "June Mountain") collides with anything.
 *
 * First Pacific-timezone region on this branch (shared with the other
 * five California regions in this pass). Weather is Open-Meteo with the
 * existing OpenWeatherMap fallback. Caltrans QuickMap publishes
 * quickmap.dot.ca.gov but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 *
 * ⚠️ Mammoth Mountain's base (7,953 ft) and summit (11,053 ft) figures are
 * widely and consistently cited industry-wide but were not freshly
 * re-confirmed via a directly fetched, citable first-party URL in the
 * source research pass — kept as the best-available figures, flagged for
 * a follow-up spot-check per california_ski_research.md.
 */
export const mammothLakesRegion: RegionConfig = {
  id: "mammoth-lakes",
  name: "Mammoth Lakes",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mammoth Mountain", "June Mountain"],
  resorts: [
    { path: "/mountain/mammoth-mountain", label: "Mammoth Mountain" },
    { path: "/mountain/june-mountain", label: "June Mountain" },
  ],
  mountains: [
    {
      id: "mammoth-mountain",
      name: "Mammoth Mountain",
      elevationM: 2423,
      lat: 37.6306,
      lng: -119.0326,
      blurb: "Ikon Pass · one of the highest, latest-closing resorts in California · ran a 199-day season into June for 2025-26",
      websiteUrl: "https://www.mammothmountain.com/",
      snowReportUrl: "https://www.mammothmountain.com/on-the-mountain",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      summerOpen: true,
    },
    {
      id: "june-mountain",
      name: "June Mountain",
      elevationM: 2300,
      lat: 37.7683,
      lng: -119.0906,
      blurb: "Ikon Pass · Mammoth's quieter sister mountain across two peaks, Rainbow Mountain and June Mountain proper, near June Lake",
      websiteUrl: "https://www.junemountain.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "mammoth-lakes-town",
      name: "Mammoth Lakes",
      lat: 37.6485,
      lng: -118.9721,
      radiusM: 15000,
      blurb: "Eastern Sierra resort town on US-395, the base for both Mammoth Mountain and June Mountain",
      nearbyMountainIds: ["mammoth-mountain", "june-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Mammoth Lakes", url: "https://www.visitmammoth.com/" },
    { category: "Resorts", label: "Mammoth Mountain", url: "https://www.mammothmountain.com/" },
    { category: "Resorts", label: "June Mountain", url: "https://www.junemountain.com/" },
    { category: "Transport", label: "Caltrans QuickMap · US-395/SR-203 conditions", url: "https://quickmap.dot.ca.gov/" },
    { category: "Safety", label: "Eastern Sierra Avalanche Center", url: "https://www.esavalanche.org/" },
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
