import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Boulder / Front Range · a single resort ("Eldora Mountain Resort") above
 * the town of Nederland, the closest lift-served skiing to Denver and
 * Boulder. No naming collision between the town ("Nederland") and the
 * resort ("Eldora Mountain Resort").
 *
 * Northern-hemisphere season (mid-Nov to early Apr). Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback · no NWS observation
 * reconciliation is wired. CDOT publishes cotrip.org but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const boulderFrontRangeRegion: RegionConfig = {
  id: "boulder-front-range",
  name: "Boulder / Front Range",
  subtitle: "Colorado · USA",
  shortTag: "CO",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Eldora Mountain Resort"],
  resorts: [{ path: "/mountain/eldora-mountain-resort", label: "Eldora Mountain Resort" }],
  mountains: [
    {
      id: "eldora-mountain-resort",
      name: "Eldora Mountain Resort",
      // Base elevation source discrepancy flagged in research (9,200 ft vs
      // 9,360 ft) · Wikipedia's 9,360 ft (2,853 m) figure used as primary.
      elevationM: 2853,
      lat: 39.9375,
      lng: -105.5828,
      blurb: "the closest lift-served skiing to Denver and Boulder, about an hour up Boulder Canyon",
      websiteUrl: "https://www.eldora.com/",
      snowReportUrl: "https://www.eldora.com/the-mountain/webcams/lower-mountain-live-cam/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      nordic_focus: true,
    },
  ],
  baseTowns: [
    {
      id: "nederland",
      name: "Nederland",
      lat: 39.9614,
      lng: -105.5108,
      radiusM: 6000,
      blurb: "small mountain town above Boulder Canyon, about 8 miles from the resort",
      nearbyMountainIds: ["eldora-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Boulder", url: "https://www.bouldercoloradousa.com/" },
    { category: "Resorts", label: "Eldora Mountain Resort", url: "https://www.eldora.com/" },
    { category: "Resorts", label: "Eldora · webcams", url: "https://www.eldora.com/the-mountain/webcams/lower-mountain-live-cam/" },
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
