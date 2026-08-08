import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Telluride · a single resort ("Telluride Ski Resort") based out of the town
 * of Telluride in a box canyon in Colorado's southwest San Juan Mountains.
 * No naming collision on the mountain id itself ("Telluride Ski Resort" is
 * distinct from the bare town name), but since the region id is also
 * `telluride`, the base-town id is disambiguated as `telluride-town` to
 * avoid colliding with the region id in the flat location registry (same
 * reasoning applied to Crested Butte and Durango in this pass).
 *
 * Northern-hemisphere season (early Dec to early Apr). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const tellurideRegion: RegionConfig = {
  id: "telluride",
  name: "Telluride",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Telluride Ski Resort"],
  resorts: [{ path: "/mountain/telluride-ski-resort", label: "Telluride Ski Resort" }],
  mountains: [
    {
      id: "telluride-ski-resort",
      name: "Telluride Ski Resort",
      elevationM: 3815,
      lat: 37.9375,
      lng: -107.8123,
      blurb: "box-canyon setting in the San Juan Mountains · Epic Pass partner resort (up to 7 days)",
      websiteUrl: "https://www.tellurideskiresort.com/",
      snowReportUrl: "https://www.telluride.com/weather-report/",
      expert_only: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "telluride-town",
      name: "Telluride",
      lat: 37.9375,
      lng: -107.8123,
      radiusM: 6000,
      blurb: "historic mining town in a box canyon, connected to Mountain Village by free gondola",
      nearbyMountainIds: ["telluride-ski-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Telluride Tourism Board", url: "https://www.telluride.com/" },
    { category: "Resorts", label: "Telluride Ski Resort", url: "https://www.tellurideskiresort.com/" },
    { category: "Resorts", label: "Telluride · webcams", url: "https://www.tellurideskiresort.com/webcams/" },
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
