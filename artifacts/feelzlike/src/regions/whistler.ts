import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Whistler · North America's largest ski resort, two hours up the
 * Sea-to-Sky Highway from Vancouver. One gateway village serving the two
 * linked mountains of Whistler Blackcomb:
 *
 *   Whistler Mountain   → the original 1966 mountain · peak-to-creek
 *   Blackcomb Mountain  → the higher twin · glacier and 7th Heaven terrain
 *
 * Northern-hemisphere season (mid-Nov to late May). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no Environment Canada
 * observation reconciliation is wired, so we don't credit ECCC as a live
 * source. DriveBC publishes an Open511 feed but nothing is integrated yet,
 * hence `roadsSource.dataAvailable: false`.
 */
export const whistlerRegion: RegionConfig = {
  id: "whistler",
  name: "Whistler",
  subtitle: "British Columbia · Canada",
  shortTag: "BC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Whistler Mountain", "Blackcomb Mountain"],
  resorts: [
    { path: "/mountain/whistler-mountain", label: "Whistler Mountain" },
    { path: "/mountain/blackcomb-mountain", label: "Blackcomb Mountain" },
  ],
  mountains: [
    {
      id: "whistler-mountain",
      name: "Whistler Mountain",
      elevationM: 2182,
      lat: 50.0594,
      lng: -122.9575,
      blurb: "the original 1966 mountain · alpine bowls above a long peak-to-creek descent",
      websiteUrl: "https://www.whistlerblackcomb.com/",
      snowReportUrl:
        "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
      summerOpen: true,
    },
    {
      id: "blackcomb-mountain",
      name: "Blackcomb Mountain",
      elevationM: 2284,
      lat: 50.0900,
      lng: -122.8620,
      blurb: "the higher twin · glacier terrain, 7th Heaven and the Blackcomb Glacier run",
      websiteUrl: "https://www.whistlerblackcomb.com/",
      snowReportUrl:
        "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
      summerOpen: true,
    },
  ],
  baseTowns: [
    {
      id: "whistler",
      name: "Whistler",
      lat: 50.1163,
      lng: -122.9574,
      radiusM: 5000,
      blurb: "ski-in village between the two mountains · ~2 hrs from Vancouver on Hwy 99",
      nearbyMountainIds: ["whistler-mountain", "blackcomb-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Destination BC · HelloBC", url: "https://www.hellobc.com/" },
    { category: "Resorts", label: "Whistler Blackcomb", url: "https://www.whistlerblackcomb.com/" },
    {
      category: "Resorts",
      label: "Whistler Blackcomb · mountain cams",
      url: "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    },
    { category: "Transport", label: "DriveBC · highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { category: "Safety", label: "Avalanche Canada · daily forecasts", url: "https://avalanche.ca/forecasts" },
    { category: "Weather", label: "Environment Canada · Whistler forecast", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "DriveBC",
    url: "https://www.drivebc.ca/",
    // No DriveBC Open511 integration in this pass · the UI shows an honest
    // "not wired yet" panel and links out rather than implying live data.
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
