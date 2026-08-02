import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Banff & Lake Louise · the three SkiBig3 mountains, all inside Banff
 * National Park and all on one lift ticket + shuttle network. Two base
 * towns share them:
 *
 *   Banff       → Banff Sunshine Village, Mt. Norquay
 *   Lake Louise → Lake Louise Ski Resort
 *
 * Naming: the hamlet id `lake-louise` and the ski area share a name, so
 * the mountain takes the `-resort` suffix per the region convention.
 *
 * Northern-hemisphere season (Nov to May · Sunshine runs into late May).
 * Weather is Open-Meteo with the existing OpenWeatherMap fallback · no
 * Environment Canada observation reconciliation is wired, and 511 Alberta
 * is a link-out only, hence `roadsSource.dataAvailable: false`.
 */
export const banffLakeLouiseRegion: RegionConfig = {
  id: "banff-lake-louise",
  name: "Banff & Lake Louise",
  subtitle: "Alberta · Canada",
  shortTag: "AB",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Banff Sunshine Village", "Mt. Norquay", "Lake Louise Ski Resort"],
  resorts: [
    { path: "/mountain/banff-sunshine", label: "Banff Sunshine Village" },
    { path: "/mountain/mt-norquay", label: "Mt. Norquay" },
    { path: "/mountain/lake-louise-resort", label: "Lake Louise Ski Resort" },
  ],
  mountains: [
    {
      id: "banff-sunshine",
      name: "Banff Sunshine Village",
      elevationM: 2730,
      lat: 51.0781,
      lng: -115.7772,
      blurb: "high on the continental divide · all-natural snow and a season into late may",
      websiteUrl: "https://www.skibanff.com/",
      snowReportUrl: "https://www.skibanff.com/conditions",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "mt-norquay",
      name: "Mt. Norquay",
      elevationM: 2133,
      lat: 51.1990,
      lng: -115.5980,
      blurb: "the steep local hill 10 min above town · night skiing and the north american chair",
      websiteUrl: "https://banffnorquay.com/",
      snowReportUrl: "https://banffnorquay.com/conditions/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      summerOpen: true,
    },
    {
      id: "lake-louise-resort",
      name: "Lake Louise Ski Resort",
      elevationM: 2637,
      lat: 51.4419,
      lng: -116.1622,
      blurb: "four mountain faces above the bow valley · big back bowls, victoria glacier views",
      websiteUrl: "https://www.skilouise.com/",
      snowReportUrl: "https://www.skilouise.com/snow-conditions/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
      summerOpen: true,
    },
  ],
  baseTowns: [
    {
      id: "banff",
      name: "Banff",
      lat: 51.1784,
      lng: -115.5708,
      radiusM: 6000,
      blurb: "park townsite on the bow river · shuttle base for all three skibig3 mountains",
      nearbyMountainIds: ["banff-sunshine", "mt-norquay", "lake-louise-resort"],
    },
    {
      id: "lake-louise",
      name: "Lake Louise",
      lat: 51.4254,
      lng: -116.1773,
      radiusM: 5000,
      blurb: "small hamlet by the lake · 5 min across the highway from the ski resort base",
      nearbyMountainIds: ["lake-louise-resort", "banff-sunshine"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Banff & Lake Louise Tourism", url: "https://www.banfflakelouise.com/" },
    { category: "Tourism", label: "Travel Alberta", url: "https://www.travelalberta.com/" },
    { category: "Tourism", label: "Parks Canada · Banff National Park", url: "https://www.pc.gc.ca/en/pn-np/ab/banff" },
    { category: "Resorts", label: "Banff Sunshine Village", url: "https://www.skibanff.com/" },
    { category: "Resorts", label: "Mt. Norquay", url: "https://banffnorquay.com/" },
    { category: "Resorts", label: "Lake Louise Ski Resort", url: "https://www.skilouise.com/" },
    { category: "Resorts", label: "SkiBig3 · webcams", url: "https://www.skibig3.com/webcams/" },
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
