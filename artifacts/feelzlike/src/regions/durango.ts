import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Durango · a single resort ("Purgatory Resort") about 25 miles north of the
 * town of Durango in the San Juan Mountains. No naming collision between the
 * town ("Durango") and the resort ("Purgatory Resort"). Since the region id
 * is also `durango`, the base-town id is still disambiguated as
 * `durango-town` for consistency with the flat location registry (same
 * pattern used for Crested Butte and Telluride in this pass, where the
 * region id equals the town name).
 *
 * Northern-hemisphere season (late Nov to late Mar/early Apr). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const durangoRegion: RegionConfig = {
  id: "durango",
  name: "Durango",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Purgatory Resort"],
  resorts: [{ path: "/mountain/purgatory-resort", label: "Purgatory Resort" }],
  mountains: [
    {
      id: "purgatory-resort",
      name: "Purgatory Resort",
      elevationM: 3299,
      lat: 37.6297,
      lng: -107.8144,
      blurb: "independent, family-friendly San Juan Mountains resort about 25 miles north of Durango",
      websiteUrl: "https://www.purgatory.ski/",
      snowReportUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/snow-weather/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "durango-town",
      name: "Durango",
      lat: 37.2753,
      lng: -107.8801,
      radiusM: 8000,
      blurb: "historic railroad town on the Animas River, about 25 miles south of Purgatory",
      nearbyMountainIds: ["purgatory-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Durango", url: "https://www.durango.org/" },
    { category: "Resorts", label: "Purgatory Resort", url: "https://www.purgatory.ski/" },
    { category: "Resorts", label: "Purgatory · webcams", url: "https://www.purgatory.ski/mountain/weather-conditions-webcams/" },
    { category: "Transport", label: "CDOT · cotrip.org road conditions & cameras", url: "https://www.cotrip.org/" },
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
