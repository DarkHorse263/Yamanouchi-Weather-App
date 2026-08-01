import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Jasper · the northern Rockies park town, four hours up the Icefields
 * Parkway from Banff, with one ski area above it:
 *
 *   Marmot Basin → the highest base elevation of any major Canadian field
 *
 * Northern-hemisphere season (mid-Nov to early May). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no Environment Canada
 * observation reconciliation is wired, and 511 Alberta is a link-out only,
 * hence `roadsSource.dataAvailable: false`.
 */
export const jasperRegion: RegionConfig = {
  id: "jasper",
  name: "Jasper",
  subtitle: "Alberta · Canada",
  shortTag: "AB",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Marmot Basin"],
  resorts: [{ path: "/mountain/marmot-basin", label: "Marmot Basin" }],
  mountains: [
    {
      id: "marmot-basin",
      name: "Marmot Basin",
      elevationM: 2612,
      lat: 52.8000,
      lng: -118.0833,
      blurb: "highest base elevation of any major canadian ski area · quiet, cold, dry snow",
      websiteUrl: "https://www.skimarmot.com/",
      snowReportUrl: "https://www.skimarmot.com/news-snow-report/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "jasper",
      name: "Jasper",
      lat: 52.8737,
      lng: -118.0814,
      radiusM: 6000,
      blurb: "rail-town park base on the athabasca · ~20 min up the road to marmot basin",
      nearbyMountainIds: ["marmot-basin"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Tourism Jasper", url: "https://www.tourismjasper.com/" },
    { category: "Tourism", label: "Travel Alberta", url: "https://www.travelalberta.com/" },
    { category: "Tourism", label: "Parks Canada · Jasper National Park", url: "https://www.pc.gc.ca/en/pn-np/ab/jasper" },
    { category: "Resorts", label: "Marmot Basin", url: "https://www.skimarmot.com/" },
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
