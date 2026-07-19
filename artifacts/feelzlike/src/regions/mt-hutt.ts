import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mt Hutt · Canterbury's big day-tripper (South Island), the closest
 * major ski field to Christchurch. One ski area off one gateway town:
 *
 *   Mt Hutt → wide high-alpine basin, long season, exposed summit road
 *   Methven → farm-town base at the foot of the access road (~35 min up)
 *
 * Southern-hemisphere season (Jun-Sep). Open-Meteo primary + the existing
 * OpenWeatherMap fallback · no national AWS feed wired for NZ.
 */
export const mtHuttRegion: RegionConfig = {
  id: "mt-hutt",
  name: "Mt Hutt",
  subtitle: "Canterbury · New Zealand",
  shortTag: "NZ",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  summaryMountains: ["Mt Hutt"],
  resorts: [
    { path: "/mountain/mt-hutt", label: "Mt Hutt" },
  ],
  mountains: [
    {
      id: "mt-hutt",
      name: "Mt Hutt",
      elevationM: 2075,
      lat: -43.4707,
      lng: 171.5306,
      blurb: "canterbury's high-alpine basin · long season, closest big field to christchurch",
      websiteUrl: "https://www.nzski.com/mt-hutt",
      snowReportUrl: "https://www.mthutt.co.nz/weather-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "methven",
      name: "Methven",
      lat: -43.6333,
      lng: 171.6500,
      radiusM: 5000,
      blurb: "farm-town base at the foot of the access road · ~35 min up to the lifts",
      nearbyMountainIds: ["mt-hutt"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Mid Canterbury NZ", url: "https://midcanterbury.co.nz/" },
    { category: "Resorts", label: "Mt Hutt (NZSki)", url: "https://www.nzski.com/mt-hutt" },
    { category: "Transport", label: "Waka Kotahi NZTA · journeys & road conditions", url: "https://www.journeys.nzta.govt.nz/" },
  ],
  roadsSource: {
    label: "Waka Kotahi NZTA · journeys",
    url: "https://www.journeys.nzta.govt.nz/regions/canterbury",
    dataAvailable: true,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
