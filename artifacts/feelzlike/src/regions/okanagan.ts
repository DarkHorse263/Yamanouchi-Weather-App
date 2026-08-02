import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Okanagan · the BC Interior's three destination resorts strung across the
 * valley, each with its own gateway city:
 *
 *   Kelowna   → Big White Ski Resort   · the biggest ski-in village in BC
 *   Vernon    → SilverStar Mountain    · a Victorian-themed pedestrian village
 *   Penticton → Apex Mountain Resort   · quiet, steep, uncrowded cruisers
 *
 * Not a single valley like Whistler and not a road-trip loop like the Powder
 * Highway · three independent hills that share the dry interior snowpack and
 * the same lake-town gateways.
 *
 * Northern-hemisphere season (late Nov to early Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no Environment Canada
 * observation reconciliation is wired, and DriveBC is a link-out only,
 * hence `roadsSource.dataAvailable: false`.
 */
export const okanaganRegion: RegionConfig = {
  id: "okanagan",
  name: "Okanagan",
  subtitle: "BC Interior · Canada",
  shortTag: "BC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Big White", "SilverStar", "Apex"],
  resorts: [
    { path: "/mountain/big-white", label: "Big White Ski Resort" },
    { path: "/mountain/silverstar", label: "SilverStar Mountain Resort" },
    { path: "/mountain/apex-resort", label: "Apex Mountain Resort" },
  ],
  mountains: [
    {
      id: "big-white",
      name: "Big White Ski Resort",
      elevationM: 2319,
      lat: 49.7220,
      lng: -118.9330,
      blurb: "bc's biggest ski-in village · dry interior snow and a large gladed high-alpine plateau above kelowna",
      websiteUrl: "https://www.bigwhite.com/",
      snowReportUrl: "https://www.bigwhite.com/mountain-conditions/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "silverstar",
      name: "SilverStar Mountain Resort",
      elevationM: 1915,
      lat: 50.3611,
      lng: -119.0619,
      blurb: "victorian-themed ski-through village above vernon · gentle front side, steep powder gulch back bowls",
      websiteUrl: "https://www.skisilverstar.com/",
      snowReportUrl: "https://www.skisilverstar.com/the-mountain/weather-conditions/snow-report-forecast/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      nordic_focus: true,
    },
    {
      id: "apex-resort",
      name: "Apex Mountain Resort",
      elevationM: 2178,
      lat: 49.3925,
      lng: -119.9036,
      blurb: "quiet, steep and uncrowded above penticton · long fall-line cruisers and the okanagan's driest snow",
      websiteUrl: "https://apexresort.com/",
      snowReportUrl: "https://apexresort.com/weather/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "kelowna",
      name: "Kelowna",
      lat: 49.8880,
      lng: -119.4960,
      radiusM: 8000,
      blurb: "okanagan lake city · about 56 km and 1 hr up to the big white village",
      nearbyMountainIds: ["big-white"],
    },
    {
      id: "vernon",
      name: "Vernon",
      lat: 50.2670,
      lng: -119.2720,
      radiusM: 7000,
      blurb: "north okanagan town · about 22 km up silver star road to the resort",
      nearbyMountainIds: ["silverstar"],
    },
    {
      id: "penticton",
      name: "Penticton",
      lat: 49.4991,
      lng: -119.5937,
      radiusM: 7000,
      blurb: "town between okanagan and skaha lakes · about 33 km up green mountain road to apex",
      nearbyMountainIds: ["apex-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Destination BC · HelloBC", url: "https://www.hellobc.com/" },
    { category: "Tourism", label: "Tourism Kelowna", url: "https://www.tourismkelowna.com/" },
    { category: "Tourism", label: "Tourism Vernon", url: "https://tourismvernon.com/" },
    { category: "Tourism", label: "Visit Penticton", url: "https://www.visitpenticton.com/" },
    { category: "Resorts", label: "Big White Ski Resort", url: "https://www.bigwhite.com/" },
    { category: "Resorts", label: "SilverStar Mountain Resort", url: "https://www.skisilverstar.com/" },
    { category: "Resorts", label: "Apex Mountain Resort", url: "https://apexresort.com/" },
    { category: "Transport", label: "DriveBC · highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { category: "Safety", label: "Avalanche Canada · daily forecasts", url: "https://avalanche.ca/forecasts" },
    { category: "Weather", label: "Environment Canada · Okanagan forecast", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "DriveBC",
    url: "https://www.drivebc.ca/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
