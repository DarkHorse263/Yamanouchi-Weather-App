import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Queenstown · the South Island's flagship resort town (Otago). Two
 * day-trip ski areas hang off the one gateway town:
 *
 *   Coronet Peak   → closest to town · early-season + night skiing
 *   The Remarkables → higher, family + park terrain across the lake
 *
 * Southern-hemisphere season (Jun-Sep). Weather is Open-Meteo primary
 * with the existing OpenWeatherMap fallback · no national AWS feed is
 * wired for NZ, so we don't credit MetService.
 */
export const queenstownRegion: RegionConfig = {
  id: "queenstown",
  name: "Queenstown",
  subtitle: "Otago · New Zealand",
  shortTag: "NZ",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "south",
  summaryMountains: ["Coronet Peak", "The Remarkables"],
  resorts: [
    { path: "/mountain/coronet-peak", label: "Coronet Peak" },
    { path: "/mountain/the-remarkables", label: "The Remarkables" },
  ],
  mountains: [
    {
      id: "coronet-peak",
      name: "Coronet Peak",
      elevationM: 1649,
      lat: -44.9206,
      lng: 168.7361,
      blurb: "closest to queenstown · early-season snowmaking and night skiing",
      websiteUrl: "https://www.coronetpeak.co.nz/",
      snowReportUrl: "https://www.coronetpeak.co.nz/weather-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "the-remarkables",
      name: "The Remarkables",
      elevationM: 1943,
      lat: -45.0556,
      lng: 168.8194,
      blurb: "higher, sheltered bowls across the lake · family and park terrain",
      websiteUrl: "https://www.theremarkables.co.nz/",
      snowReportUrl: "https://www.theremarkables.co.nz/weather-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "queenstown",
      name: "Queenstown",
      lat: -45.0312,
      lng: 168.6626,
      radiusM: 5000,
      blurb: "south island resort hub · ~25 min to coronet peak, ~45 min to the remarkables",
      nearbyMountainIds: ["coronet-peak", "the-remarkables"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Destination Queenstown", url: "https://www.queenstownnz.co.nz/" },
    { category: "Resorts", label: "Coronet Peak (NZSki)", url: "https://www.coronetpeak.co.nz/" },
    { category: "Resorts", label: "The Remarkables (NZSki)", url: "https://www.theremarkables.co.nz/" },
    { category: "Transport", label: "Waka Kotahi NZTA · journeys & road conditions", url: "https://www.journeys.nzta.govt.nz/" },
  ],
  roadsSource: {
    label: "Waka Kotahi NZTA · journeys",
    url: "https://www.journeys.nzta.govt.nz/regions/otago",
    dataAvailable: true,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
