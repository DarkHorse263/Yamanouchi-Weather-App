import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * St Anton is represented as one authored resort view. The wider Ski Arlberg
 * network is not attributed to this page: the forecast point is a declared
 * representative St Anton midpoint and live resort information remains an
 * official link-out.
 */
export const stAntonRegion: RegionConfig = {
  id: "st-anton",
  name: "St Anton am Arlberg",
  subtitle: "Tyrol · Austria",
  shortTag: "AT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en"] },
  summaryMountains: ["St Anton Resort"],
  resorts: [
    { path: "/mountain/st-anton-resort", label: "St Anton Resort" },
  ],
  mountains: [
    {
      id: "st-anton-resort",
      name: "St Anton Resort",
      // Valluga (2,811 m) is the upper point named by the official St Anton
      // ski-region source; the independently cited 1,304 m village value is
      // recorded in verified-village-elevations.ts.
      elevationM: 2811,
      baseElevationM: 1304,
      // Lower and upper values are published elevations; the midpoint is a
      // declared representative forecast band for the combined resort view.
      elevationBands: {
        upperM: 2811,
        midM: 2058,
        lowerM: 1304,
        sourceLabel: "official St Anton base and Valluga elevations · representative midpoint",
      },
      lat: 47.1297,
      lng: 10.2683,
      blurb: "A representative St Anton forecast from the village at 1,304 m toward Valluga at 2,811 m. This view is St Anton-specific and does not claim conditions across the wider Ski Arlberg network.",
      websiteUrl: "https://www.skiarlberg.at/en/st-anton/winter/ski-region",
      liftStatusUrl: "https://www.skiarlberg.at/en/st-anton/live-info/cable-cars-lifts",
      snowReportUrl: "https://www.skiarlberg.at/en/st-anton/live-info/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "st-anton",
      name: "St Anton am Arlberg",
      lat: 47.1297,
      lng: 10.2683,
      radiusM: 1400,
      blurb: "Tyrolean resort village at 1,304 m. Village weather is kept separate from the representative on-mountain forecast.",
      nearbyMountainIds: ["st-anton-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resort information", label: "Ski Arlberg · St Anton ski region", url: "https://www.skiarlberg.at/en/st-anton/winter/ski-region" },
    { category: "Lifts & status", label: "Ski Arlberg · St Anton lifts and cable cars", url: "https://www.skiarlberg.at/en/st-anton/live-info/cable-cars-lifts" },
    { category: "Snow report", label: "Ski Arlberg · St Anton snow report", url: "https://www.skiarlberg.at/en/st-anton/live-info/snow-report" },
    { category: "Webcams", label: "St Anton am Arlberg · official webcams", url: "https://www.stantonamarlberg.com/en/webcams" },
    { category: "Road report", label: "St Anton am Arlberg · arrival information", url: "https://www.stantonamarlberg.com/en/arrival" },
    { category: "Avalanche bulletin", label: "Tyrol · official Avalanche Bulletin", url: "https://lawine.tirol.gv.at/" },
  ],
  weatherSource: { label: "Open-Meteo + OpenWeatherMap fallback" },
  roadsSource: {
    label: "St Anton am Arlberg · official arrival information",
    url: "https://www.stantonamarlberg.com/en/arrival",
    dataAvailable: false,
  },
};