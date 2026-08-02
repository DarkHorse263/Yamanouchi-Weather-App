import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Québec · Charlevoix. Two towns on the north shore of the St. Lawrence,
 * one mountain each:
 *
 *   Beaupré                       → Mont-Sainte-Anne
 *   Petite-Rivière-Saint-François → Le Massif de Charlevoix
 *
 * Le Massif is the highest vertical east of the Rockies (770 m) and the
 * only major North American ski area whose base sits on tidewater · you
 * drive to the summit and ski down toward the river. Both resorts are
 * operating normally.
 *
 * Northern-hemisphere season (late Nov to mid Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no Environment Canada
 * observation reconciliation is wired, and Québec 511 is a link-out only,
 * hence `roadsSource.dataAvailable: false`.
 */
export const quebecCharlevoixRegion: RegionConfig = {
  id: "quebec-charlevoix",
  name: "Charlevoix",
  subtitle: "Québec · Canada",
  shortTag: "QC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mont-Sainte-Anne", "Le Massif de Charlevoix"],
  resorts: [
    { path: "/mountain/mont-sainte-anne", label: "Mont-Sainte-Anne" },
    { path: "/mountain/le-massif", label: "Le Massif de Charlevoix" },
  ],
  mountains: [
    {
      id: "mont-sainte-anne",
      name: "Mont-Sainte-Anne",
      elevationM: 800,
      lat: 47.0876,
      lng: -70.9324,
      blurb: "three skiable faces 30 min from québec city · canada's biggest lit night-ski vertical",
      websiteUrl: "https://mont-sainte-anne.com/",
      snowReportUrl: "https://mont-sainte-anne.com/conditions-de-neige-ski-alpin/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      summerOpen: true,
    },
    {
      id: "le-massif",
      name: "Le Massif de Charlevoix",
      elevationM: 806,
      lat: 47.2757,
      lng: -70.6257,
      blurb: "highest vertical east of the rockies · 770 m dropping straight toward the st. lawrence",
      websiteUrl: "https://www.lemassif.com/",
      snowReportUrl: "https://www.lemassif.com/en/the-mountain/winter/snow-weather-webcams",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "beaupre",
      name: "Beaupré",
      lat: 47.0443,
      lng: -70.8953,
      radiusM: 6000,
      blurb: "côte-de-beaupré town on the river flats · about 10 min up the road to mont-sainte-anne",
      nearbyMountainIds: ["mont-sainte-anne"],
    },
    {
      id: "petite-riviere-saint-francois",
      name: "Petite-Rivière-Saint-François",
      lat: 47.3100,
      lng: -70.5660,
      radiusM: 6000,
      blurb: "shoreline village beneath le massif · the base station sits at the water's edge",
      nearbyMountainIds: ["le-massif"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Tourisme Charlevoix", url: "https://www.tourisme-charlevoix.com/" },
    { category: "Tourism", label: "Bonjour Québec", url: "https://www.bonjourquebec.com/" },
    { category: "Resorts", label: "Mont-Sainte-Anne", url: "https://mont-sainte-anne.com/" },
    { category: "Resorts", label: "Mont-Sainte-Anne · webcams", url: "https://mont-sainte-anne.com/webcams-ski-alpin/" },
    { category: "Resorts", label: "Le Massif de Charlevoix", url: "https://www.lemassif.com/" },
    { category: "Resorts", label: "Le Massif · snow, weather & webcams", url: "https://www.lemassif.com/en/the-mountain/winter/snow-weather-webcams" },
    { category: "Transport", label: "Québec 511 · road conditions & cameras", url: "https://www.quebec511.info/" },
    { category: "Safety", label: "Avalanche Québec · backcountry bulletins", url: "https://www.avalanchequebec.ca/bulletin-davalanche/" },
    { category: "Weather", label: "Environment Canada · Québec forecasts", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "Québec 511",
    url: "https://www.quebec511.info/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
