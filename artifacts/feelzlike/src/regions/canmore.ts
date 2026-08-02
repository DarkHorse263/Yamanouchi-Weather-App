import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Canmore · the Bow Valley town just outside the Banff park gates, and the
 * base for Nakiska in Kananaskis Country:
 *
 *   Nakiska → the 1988 Olympic downhill venue on Mount Allan
 *
 * Northern-hemisphere season (mid-Nov to early/mid Apr). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no Environment
 * Canada observation reconciliation is wired, and 511 Alberta is a
 * link-out only, hence `roadsSource.dataAvailable: false`.
 */
export const canmoreRegion: RegionConfig = {
  id: "canmore",
  name: "Canmore",
  subtitle: "Alberta · Canada",
  shortTag: "AB",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Nakiska"],
  resorts: [{ path: "/mountain/nakiska", label: "Nakiska" }],
  mountains: [
    {
      id: "nakiska",
      name: "Nakiska",
      elevationM: 2260,
      lat: 50.9422,
      lng: -115.1519,
      blurb: "1988 olympic downhill venue on mount allan · fast, reliably groomed kananaskis pitches",
      websiteUrl: "https://skinakiska.com/",
      snowReportUrl: "https://skinakiska.com/conditions/snow-report/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "canmore",
      name: "Canmore",
      lat: 51.0884,
      lng: -115.3479,
      radiusM: 6000,
      blurb: "bow valley town outside the park gates · ~45 min down hwy 40 to nakiska",
      nearbyMountainIds: ["nakiska"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Tourism Canmore Kananaskis", url: "https://explorecanmore.ca/" },
    { category: "Tourism", label: "Travel Alberta", url: "https://www.travelalberta.com/" },
    { category: "Resorts", label: "Nakiska", url: "https://skinakiska.com/" },
    { category: "Resorts", label: "Nakiska · mountain cam", url: "https://skinakiska.com/conditions/mountain-cam/" },
    { category: "Transport", label: "511 Alberta · road reports & cameras", url: "https://511.alberta.ca/" },
    { category: "Safety", label: "Avalanche Canada · daily forecasts", url: "https://avalanche.ca/forecasts" },
    { category: "Weather", label: "Environment Canada · Alberta forecasts", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "511 Alberta",
    url: "https://511.alberta.ca/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
