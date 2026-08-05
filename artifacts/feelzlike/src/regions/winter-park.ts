import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Winter Park · a single resort ("Winter Park Resort") based out of the town
 * of Winter Park, just over Berthoud Pass from Denver.
 *
 * Naming collision: the town and the resort share the exact name "Winter
 * Park". Per the Canada build's `-resort` suffix convention (sun-peaks →
 * sun-peaks-resort), the mountain takes `winter-park-resort` and the town
 * id stays bare `winter-park`.
 *
 * Northern-hemisphere season (late Oct/Nov to mid/late Apr). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const winterParkRegion: RegionConfig = {
  id: "winter-park",
  name: "Winter Park",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Winter Park Resort"],
  resorts: [{ path: "/mountain/winter-park-resort", label: "Winter Park Resort" }],
  mountains: [
    {
      id: "winter-park-resort",
      name: "Winter Park Resort",
      elevationM: 3676,
      lat: 39.8868,
      lng: -105.7625,
      blurb: "Denver's closest big mountain over Berthoud Pass · Mary Jane side is bump-and-glade heavy",
      websiteUrl: "https://www.winterparkresort.com/",
      snowReportUrl: "https://www.winterparkresort.com/the-mountain/mountain-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "winter-park",
      name: "Winter Park",
      lat: 39.8867,
      lng: -105.7631,
      radiusM: 6000,
      blurb: "base town at the foot of the resort, about 67 miles from Denver via US-40",
      nearbyMountainIds: ["winter-park-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Winter Park & Fraser Valley Chamber", url: "https://www.playwinterpark.com/" },
    { category: "Resorts", label: "Winter Park Resort", url: "https://www.winterparkresort.com/" },
    { category: "Resorts", label: "Winter Park Resort · mountain cams", url: "https://www.winterparkresort.com/the-mountain/mountain-cams" },
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
