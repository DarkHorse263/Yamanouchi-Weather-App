import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Vail Valley · the I-70 corridor between Vail Pass and Avon, home to two
 * Vail Resorts flagships:
 *
 *   Vail         → Vail Mountain     · the largest single ski mountain in Colorado
 *   Avon         → Beaver Creek      · groomed, upscale, gated-village resort
 *
 * Naming collision: the town of Vail shares its name with the resort
 * ("Vail" the mountain). Per the Canada build's `-resort` suffix convention,
 * the mountain takes `vail-mountain` (matching the resort's actual full
 * name, "Vail Mountain") and the town id stays bare `vail`.
 *
 * Northern-hemisphere season (mid-Nov to mid-Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const vailValleyRegion: RegionConfig = {
  id: "vail-valley",
  name: "Vail Valley",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Vail Mountain", "Beaver Creek"],
  resorts: [
    { path: "/mountain/vail-mountain", label: "Vail Mountain" },
    { path: "/mountain/beaver-creek", label: "Beaver Creek" },
  ],
  mountains: [
    {
      id: "vail-mountain",
      name: "Vail Mountain",
      elevationM: 3527,
      lat: 39.6061,
      lng: -106.3550,
      blurb: "the largest single ski mountain in Colorado · legendary Back Bowls",
      websiteUrl: "https://www.vail.com/",
      snowReportUrl: "https://www.vail.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "beaver-creek",
      name: "Beaver Creek",
      elevationM: 3488,
      lat: 39.6042,
      lng: -106.5165,
      blurb: "gated, upscale resort village · impeccably groomed cruisers",
      websiteUrl: "https://www.beavercreek.com/",
      snowReportUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/terrain-and-lift-status",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "vail",
      name: "Vail",
      lat: 39.6403,
      lng: -106.3742,
      radiusM: 6000,
      blurb: "Bavarian-styled village at the base of Vail Mountain",
      nearbyMountainIds: ["vail-mountain"],
    },
    {
      id: "avon",
      name: "Avon",
      lat: 39.6317,
      lng: -106.5219,
      radiusM: 6000,
      blurb: "valley town at the base of Beaver Creek, a few minutes up the gated access road",
      nearbyMountainIds: ["beaver-creek"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Vail Valley", url: "https://www.visitvailvalley.com/" },
    { category: "Resorts", label: "Vail Mountain", url: "https://www.vail.com/" },
    { category: "Resorts", label: "Beaver Creek", url: "https://www.beavercreek.com/" },
    { category: "Transport", label: "CDOT · cotrip.org road conditions & cameras", url: "https://www.cotrip.org/" },
    { category: "Transport", label: "CDOT · I-70 Mountain Corridor", url: "https://www.codot.gov/travel/i70mountain" },
    { category: "Safety", label: "Colorado Avalanche Information Center", url: "https://avalanche.state.co.us/forecasts" },
  ],
  roadsSource: {
    label: "CDOT · cotrip.org",
    url: "https://www.cotrip.org/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
