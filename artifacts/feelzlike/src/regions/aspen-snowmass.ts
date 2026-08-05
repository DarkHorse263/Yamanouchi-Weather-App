import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Aspen Snowmass · four independently-named mountains sharing one lift
 * ticket and one operator, across two base towns:
 *
 *   Aspen            → Aspen Mountain, Aspen Highlands, Buttermilk
 *   Snowmass Village → Snowmass
 *
 * No naming collisions here (Aspen Mountain / Aspen Highlands / Buttermilk
 * are all distinct from the town name "Aspen"), so no `-resort` suffixes
 * are needed.
 *
 * Northern-hemisphere season (late Nov to mid-Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const aspenSnowmassRegion: RegionConfig = {
  id: "aspen-snowmass",
  name: "Aspen Snowmass",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Snowmass", "Aspen Mountain", "Aspen Highlands", "Buttermilk"],
  resorts: [
    { path: "/mountain/snowmass", label: "Snowmass" },
    { path: "/mountain/aspen-mountain", label: "Aspen Mountain" },
    { path: "/mountain/aspen-highlands", label: "Aspen Highlands" },
    { path: "/mountain/buttermilk", label: "Buttermilk" },
  ],
  mountains: [
    {
      id: "snowmass",
      name: "Snowmass",
      elevationM: 3813,
      lat: 39.2110,
      lng: -106.9500,
      blurb: "the biggest of the four mountains · full Ikon Pass unlimited access",
      websiteUrl: "https://www.aspensnowmass.com/four-mountains",
      snowReportUrl: "https://www.aspensnowmass.com/four-mountains/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "aspen-mountain",
      name: "Aspen Mountain",
      elevationM: 3418,
      lat: 39.1836,
      lng: -106.8231,
      blurb: "steep, expert-leaning terrain rising straight out of downtown Aspen · no green runs",
      websiteUrl: "https://www.aspensnowmass.com/four-mountains/aspen-mountain",
      snowReportUrl: "https://www.aspensnowmass.com/four-mountains/snow-report",
      expert_only: true,
      backcountry_access: true,
    },
    {
      id: "aspen-highlands",
      name: "Aspen Highlands",
      elevationM: 3559,
      lat: 39.1811,
      lng: -106.8697,
      blurb: "locals' favourite with Highland Bowl's hike-to extreme terrain",
      websiteUrl: "https://www.aspensnowmass.com/four-mountains",
      snowReportUrl: "https://www.aspensnowmass.com/four-mountains/snow-report",
      expert_only: true,
      backcountry_access: true,
    },
    {
      id: "buttermilk",
      name: "Buttermilk",
      elevationM: 3018,
      lat: 39.1997,
      lng: -106.8683,
      blurb: "gentle, family-friendly terrain · home of the Winter X Games superpipe",
      websiteUrl: "https://www.aspensnowmass.com/four-mountains",
      snowReportUrl: "https://www.aspensnowmass.com/four-mountains/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
  ],
  baseTowns: [
    {
      id: "aspen",
      name: "Aspen",
      lat: 39.1911,
      lng: -106.8175,
      radiusM: 7000,
      blurb: "historic mining-town-turned-resort · base for Aspen Mountain, Highlands and Buttermilk",
      nearbyMountainIds: ["aspen-mountain", "aspen-highlands", "buttermilk"],
    },
    {
      id: "snowmass-village",
      name: "Snowmass Village",
      lat: 39.2103,
      lng: -106.9378,
      radiusM: 6000,
      blurb: "purpose-built ski-in village about 12 miles from downtown Aspen",
      nearbyMountainIds: ["snowmass"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Aspen Chamber Resort Association", url: "https://www.aspenchamber.org/" },
    { category: "Resorts", label: "Aspen Snowmass · all four mountains", url: "https://www.aspensnowmass.com/" },
    { category: "Resorts", label: "Aspen Snowmass · mountain cams", url: "https://www.aspensnowmass.com/four-mountains/mountain-cams" },
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
