import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Steamboat · a single resort ("Steamboat Resort") based out of Steamboat
 * Springs, home of "Champagne Powder®" and Colorado's biggest lit night-ski
 * terrain in the Yampa Valley. No naming collision · the resort's own name
 * ("Steamboat Resort") is already distinct from the town ("Steamboat
 * Springs").
 *
 * Northern-hemisphere season (late Nov to early Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const steamboatRegion: RegionConfig = {
  id: "steamboat",
  name: "Steamboat",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Steamboat Resort"],
  resorts: [{ path: "/mountain/steamboat-resort", label: "Steamboat Resort" }],
  mountains: [
    {
      id: "steamboat-resort",
      name: "Steamboat Resort",
      elevationM: 3221,
      lat: 40.4572,
      lng: -106.8045,
      blurb: "home of Champagne Powder® · six interconnected peaks in the Yampa Valley",
      websiteUrl: "https://www.steamboat.com/",
      snowReportUrl: "https://www.steamboat.com/the-mountain/mountain-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "steamboat-springs",
      name: "Steamboat Springs",
      lat: 40.4850,
      lng: -106.8317,
      radiusM: 7000,
      blurb: "ranching-town-turned-resort on the Yampa River · a few minutes' shuttle to the base",
      nearbyMountainIds: ["steamboat-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Steamboat Springs Chamber", url: "https://www.steamboatchamber.com/" },
    { category: "Resorts", label: "Steamboat Resort", url: "https://www.steamboat.com/" },
    { category: "Resorts", label: "Steamboat Resort · live cams", url: "https://www.steamboat.com/the-mountain/live-cams" },
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
