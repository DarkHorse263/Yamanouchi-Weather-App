import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Québec · the Laurentians. One town, one big mountain:
 *
 *   Mont-Tremblant → Tremblant (Station Mont Tremblant)
 *
 * Tremblant is the largest ski area in eastern Canada and the region's
 * Ikon-affiliated draw · four faces off an 875 m lift-served summit
 * (Pic White) with 645 m of vertical down to the pedestrian village.
 *
 * Northern-hemisphere season, but shorter and colder than the Rockies
 * (late Nov to mid Apr). Weather is Open-Meteo with the existing
 * OpenWeatherMap fallback · no Environment Canada observation
 * reconciliation is wired, and Québec 511 is a link-out only, hence
 * `roadsSource.dataAvailable: false`.
 */
export const quebecLaurentiansRegion: RegionConfig = {
  id: "quebec-laurentians",
  name: "Laurentians",
  subtitle: "Québec · Canada",
  shortTag: "QC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Tremblant"],
  resorts: [{ path: "/mountain/tremblant", label: "Tremblant" }],
  mountains: [
    {
      id: "tremblant",
      name: "Tremblant",
      elevationM: 875,
      lat: 46.2100,
      lng: -74.5850,
      blurb: "eastern canada's biggest ski area · four faces and the 6 km nansen run down to the village",
      websiteUrl: "https://www.tremblant.ca/",
      snowReportUrl: "https://www.tremblant.ca/mountain-village/mountain-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
      summerOpen: true,
    },
  ],
  baseTowns: [
    {
      id: "mont-tremblant",
      name: "Mont-Tremblant",
      lat: 46.2127,
      lng: -74.5844,
      radiusM: 7000,
      blurb: "pedestrian village at the base of the gondola · about 1 hr 45 min north of montréal",
      nearbyMountainIds: ["tremblant"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Tourisme Mont-Tremblant", url: "https://www.mont-tremblant.ca/" },
    { category: "Tourism", label: "Bonjour Québec", url: "https://www.bonjourquebec.com/" },
    { category: "Resorts", label: "Tremblant", url: "https://www.tremblant.ca/" },
    { category: "Resorts", label: "Tremblant · webcams", url: "https://www.tremblant.ca/mountain-village/webcams" },
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
