import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * The Austria pilot deliberately covers Lech and Zürs only. It is not a
 * catalogue of the wider Ski Arlberg network: no neighbouring destinations
 * or whole-network lift/piste totals are represented as this region's data.
 */
export const lechZuersRegion: RegionConfig = {
  id: "lech-zuers",
  name: "Lech Zürs",
  subtitle: "Vorarlberg · Austria",
  shortTag: "AT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  language: { locales: ["en"] },
  summaryMountains: ["Lech Zürs Resort"],
  resorts: [
    { path: "/mountain/lech-zuers-resort", label: "Lech Zürs Resort" },
  ],
  mountains: [
    {
      id: "lech-zuers-resort",
      name: "Lech Zürs Resort",
      // Madlochjoch, the Lech–Zürs lift and ski link, is at 2,450 m.
      elevationM: 2450,
      baseElevationM: 1450,
      // Representative midpoint for the combined pilot area, not universal
      // slope weather. The official area page identifies Lech at 1,450 m,
      // Zürs at 1,717 m and the Madlochjoch ski link at 2,450 m.
      elevationBands: {
        upperM: 2450,
        midM: 1950,
        lowerM: 1450,
        sourceLabel: "official base and upper elevations · representative midpoint",
      },
      lat: 47.1900,
      lng: 10.1530,
      blurb: "One combined Lech and Zürs resort view via the Madlochjoch link at 2,450 m. Forecasts use a declared representative midpoint, not conditions for every slope or the wider Ski Arlberg network.",
      websiteUrl: "https://www.skiarlberg.at/en/lech-zuers/winter/ski-region",
      liftStatusUrl: "https://www.lechzuers.com/en/winter/lifts-and-ski-slopes",
      snowReportUrl: "https://www.lechzuers.com/en/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "lech",
      name: "Lech",
      lat: 47.2070,
      lng: 10.1410,
      radiusM: 1300,
      blurb: "Alpine village at 1,450 m; Oberlech is at 1,750 m. This page keeps village weather separate from the representative on-mountain forecast.",
      nearbyMountainIds: ["lech-zuers-resort"],
    },
    {
      id: "zuers",
      name: "Zürs",
      lat: 47.1719,
      lng: 10.1640,
      radiusM: 1000,
      blurb: "Alpine village at 1,717 m. This page keeps village weather separate from the representative on-mountain forecast.",
      nearbyMountainIds: ["lech-zuers-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resort information", label: "Ski Arlberg · Lech Zürs ski region", url: "https://www.skiarlberg.at/en/lech-zuers/winter/ski-region" },
    { category: "Lifts & slopes", label: "Lech Zürs · official lifts and ski slopes", url: "https://www.lechzuers.com/en/winter/lifts-and-ski-slopes" },
    { category: "Snow report", label: "Lech Zürs · official snow report", url: "https://www.lechzuers.com/en/snow-report" },
    { category: "Webcams", label: "Lech Zürs · official webcams", url: "https://www.lechzuers.com/en/live-infos/webcams" },
    { category: "Road report", label: "Lech Zürs · official road report", url: "https://www.lechzuers.com/en/live-infos/road-report" },
    { category: "Avalanche bulletin", label: "Vorarlberg · official Avalanche Bulletin", url: "https://warnung.vorarlberg.at/vtgdb/dist/index.html#//lwd_lagebericht_en.html" },
  ],
  weatherSource: { label: "Open-Meteo + OpenWeatherMap fallback" },
  roadsSource: {
    label: "Lech Zürs · official road report",
    url: "https://www.lechzuers.com/en/live-infos/road-report",
    dataAvailable: false,
  },
};