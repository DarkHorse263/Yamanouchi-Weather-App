import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * North Lake Tahoe · base town Truckee, home to three resorts:
 *
 *   Palisades Tahoe        → Ikon Pass (full unlimited; Base/Session has
 *                            blackouts) · linked base/Alpine Meadows via
 *                            gondola, two separate base elevations
 *   Northstar California   → Epic Pass (Tahoe Value Pass has Saturday
 *                            blackouts) · part of the Vail Heavenly/
 *                            Northstar/Kirkwood Tahoe trio
 *   Sugar Bowl              → Independent · Mountain Collective (not Epic
 *                            or Ikon) · the only Mountain Collective
 *                            resort in the Tahoe region
 *
 * No naming collisions: none of the three resort names match the base
 * town (Truckee), so all three mountain ids stay bare.
 *
 * First Pacific-timezone (America/Los_Angeles) USA region on this branch —
 * Colorado and Utah both use America/Denver.
 *
 * Northern-hemisphere season (early Dec to late May at Palisades Tahoe,
 * the longest window of the three). Weather is Open-Meteo with the
 * existing OpenWeatherMap fallback · no NWS observation reconciliation is
 * wired. Caltrans QuickMap publishes quickmap.dot.ca.gov but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 *
 * ⚠️ Palisades Tahoe's exact base elevation on the Alpine Meadows side and
 * Sugar Bowl's webcam status were not independently confirmed in research
 * — see california_ski_research.md for the full flag list.
 */
export const northLakeTahoeRegion: RegionConfig = {
  id: "north-lake-tahoe",
  name: "North Lake Tahoe",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Palisades Tahoe", "Northstar California", "Sugar Bowl"],
  resorts: [
    { path: "/mountain/palisades-tahoe", label: "Palisades Tahoe" },
    { path: "/mountain/northstar-california", label: "Northstar California" },
    { path: "/mountain/sugar-bowl", label: "Sugar Bowl" },
  ],
  mountains: [
    {
      id: "palisades-tahoe",
      name: "Palisades Tahoe",
      elevationM: 1890,
      lat: 39.1966,
      lng: -120.2347,
      blurb: "Ikon Pass · gondola-linked Palisades/Alpine Meadows base areas · legendary big-mountain and Olympic terrain (1960 Winter Games)",
      websiteUrl: "https://www.palisadestahoe.com/",
      snowReportUrl: "https://www.palisadestahoe.com/mountain-information/snow-weather",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
    },
    {
      id: "northstar-california",
      name: "Northstar California",
      elevationM: 1930,
      lat: 39.2640,
      lng: -120.1250,
      blurb: "Epic Pass · Vail Resorts' Tahoe trio with Heavenly and Kirkwood · gondola village base and groomed cruisers",
      websiteUrl: "https://www.northstarcalifornia.com/",
      snowReportUrl: "https://www.northstarcalifornia.com/the-mountain/mountain-conditions/northstar-weather.aspx",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "sugar-bowl",
      name: "Sugar Bowl",
      elevationM: 2098,
      lat: 39.3044,
      lng: -120.3358,
      // Independent · the only Mountain Collective resort in the Tahoe
      // region, distinct from the Epic/Ikon resorts around it.
      blurb: "Independent · Mountain Collective Pass (not Epic or Ikon) · Donner Summit's old-school, tram-served terrain",
      websiteUrl: "https://www.sugarbowl.com/",
      snowReportUrl: "https://www.sugarbowl.com/hours",
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "truckee",
      name: "Truckee",
      lat: 39.3280,
      lng: -120.1833,
      radiusM: 15000,
      blurb: "Historic railroad town on I-80, the main gateway to all three North Lake Tahoe resorts",
      nearbyMountainIds: ["palisades-tahoe", "northstar-california", "sugar-bowl"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Truckee-Tahoe", url: "https://truckeetahoeairport.com/" },
    { category: "Resorts", label: "Palisades Tahoe", url: "https://www.palisadestahoe.com/" },
    { category: "Resorts", label: "Northstar California", url: "https://www.northstarcalifornia.com/" },
    { category: "Resorts", label: "Sugar Bowl (Mountain Collective, not Epic/Ikon)", url: "https://www.sugarbowl.com/" },
    { category: "Transport", label: "Caltrans QuickMap · I-80 Donner Summit conditions", url: "https://quickmap.dot.ca.gov/" },
    { category: "Safety", label: "Sierra Avalanche Center", url: "https://www.sierraavalanchecenter.org/" },
  ],
  roadsSource: {
    label: "Caltrans QuickMap · quickmap.dot.ca.gov",
    url: "https://quickmap.dot.ca.gov/",
    // No Caltrans feed integration in this pass · the UI shows an honest
    // "not wired yet" panel and links out rather than implying live data.
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
