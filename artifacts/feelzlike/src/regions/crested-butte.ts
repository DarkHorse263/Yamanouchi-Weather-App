import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Crested Butte · a single resort ("Crested Butte Mountain Resort") based
 * out of the town of Crested Butte in the Gunnison Valley, one of Colorado's
 * more remote and steep-terrain-heavy fields. The mountain id itself has no
 * collision ("Crested Butte Mountain Resort" is distinct from the bare town
 * name), but since the region id is also `crested-butte`, the base-town id
 * is disambiguated as `crested-butte-town` to avoid colliding with the
 * region id in the flat location registry (same reasoning applied to
 * Telluride and Durango in this pass).
 *
 * Northern-hemisphere season (late Nov to early Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const crestedButteRegion: RegionConfig = {
  id: "crested-butte",
  name: "Crested Butte",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Crested Butte Mountain Resort"],
  resorts: [{ path: "/mountain/crested-butte-mountain-resort", label: "Crested Butte Mountain Resort" }],
  mountains: [
    {
      id: "crested-butte-mountain-resort",
      name: "Crested Butte Mountain Resort",
      elevationM: 3620,
      lat: 38.8992,
      lng: -106.9650,
      blurb: "steep, remote and uncrowded · some of the most extreme lift-served terrain in the US",
      websiteUrl: "https://www.skicb.com/",
      snowReportUrl: "https://www.skicb.com/the-mountain/mountain-conditions/weather-report.aspx",
      expert_only: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "crested-butte-town",
      name: "Crested Butte",
      lat: 38.8697,
      lng: -106.9878,
      radiusM: 6000,
      blurb: "historic Victorian mining town about 3 miles from Mt. Crested Butte's resort base",
      nearbyMountainIds: ["crested-butte-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Crested Butte Chamber of Commerce", url: "https://www.cbchamber.com/" },
    { category: "Resorts", label: "Crested Butte Mountain Resort", url: "https://www.skicb.com/" },
    { category: "Resorts", label: "Crested Butte · mountain cams", url: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx" },
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
