import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Powder Highway · the BC interior loop through the Selkirk, Purcell and
 * Monashee ranges. Unlike the other Canadian regions this is a road trip,
 * not a single valley: six independent resorts, each with its own base
 * town, strung along Hwys 1 / 3 / 95 / 5.
 *
 *   Revelstoke → Revelstoke Mountain Resort · longest lift-served vertical
 *   Golden     → Kicking Horse              · champagne powder, four bowls
 *   Fernie     → Fernie Alpine Resort       · five Lizard Range bowls
 *   Nelson     → Whitewater                 · independent, barely groomed
 *   Kimberley  → Kimberley Alpine Resort    · sunny, quiet cruisers
 *   Invermere  → Panorama                   · big Purcell vertical
 *
 * Sun Peaks moved to the `okanagan` (BC Interior) region · it sits above
 * Kamloops in the Thompson Valley, not on the Kootenay loop.
 *
 * Northern-hemisphere season (Dec to mid-Apr at most of these). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no Environment
 * Canada observation reconciliation is wired, and DriveBC is a link-out
 * only, hence `roadsSource.dataAvailable: false`.
 */
export const powderHighwayRegion: RegionConfig = {
  id: "powder-highway",
  name: "Powder Highway",
  subtitle: "BC Interior · Canada",
  shortTag: "BC",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Revelstoke", "Kicking Horse", "Fernie", "Whitewater", "Kimberley", "Panorama"],
  resorts: [
    { path: "/mountain/revelstoke-mountain-resort", label: "Revelstoke Mountain Resort" },
    { path: "/mountain/kicking-horse", label: "Kicking Horse" },
    { path: "/mountain/fernie-alpine", label: "Fernie Alpine Resort" },
    { path: "/mountain/whitewater", label: "Whitewater" },
    { path: "/mountain/kimberley-alpine", label: "Kimberley Alpine Resort" },
    { path: "/mountain/panorama", label: "Panorama" },
  ],
  mountains: [
    {
      id: "revelstoke-mountain-resort",
      name: "Revelstoke Mountain Resort",
      elevationM: 2225,
      lat: 50.9581,
      lng: -118.1633,
      blurb: "north america's longest lift-served vertical · 1,713 m top to bottom on mt mackenzie",
      websiteUrl: "https://www.revelstokemountainresort.com/",
      snowReportUrl: "https://www.revelstokemountainresort.com/mountain/conditions/snow-report/",
      terrain_park: true,
      backcountry_access: true,
      expert_only: true,
    },
    {
      id: "kicking-horse",
      name: "Kicking Horse",
      elevationM: 2450,
      lat: 51.2977,
      lng: -117.0464,
      blurb: "champagne powder capital · four alpine bowls and 85 inbounds chutes above golden",
      websiteUrl: "https://kickinghorseresort.com/",
      snowReportUrl: "https://kickinghorseresort.com/conditions/snow-report/",
      backcountry_access: true,
      expert_only: true,
    },
    {
      id: "fernie-alpine",
      name: "Fernie Alpine Resort",
      elevationM: 2134,
      lat: 49.4628,
      lng: -115.0872,
      blurb: "five alpine bowls in the lizard range · one of the biggest snow tallies in the rockies",
      websiteUrl: "https://skifernie.com/",
      snowReportUrl: "https://skifernie.com/conditions/snow-report/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
    {
      id: "whitewater",
      name: "Whitewater",
      elevationM: 2044,
      lat: 49.3830,
      lng: -117.1470,
      blurb: "independent kootenay hill · minimal grooming, huge natural snowfall, touring gates",
      websiteUrl: "https://skiwhitewater.com/",
      snowReportUrl: "https://skiwhitewater.com/snow-reports/",
      backcountry_access: true,
    },
    {
      id: "kimberley-alpine",
      name: "Kimberley Alpine Resort",
      elevationM: 1980,
      lat: 49.6811,
      lng: -116.0053,
      blurb: "sunny, uncrowded cruisers on north star mountain · long lit night runs",
      websiteUrl: "https://skikimberley.com/",
      snowReportUrl: "https://skikimberley.com/conditions/snow-report/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "panorama",
      name: "Panorama",
      elevationM: 2380,
      lat: 50.4600,
      lng: -116.2400,
      blurb: "1,300 m of purcell vertical · taynton bowl steeps above long groomed descents",
      websiteUrl: "https://www.panoramaresort.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "revelstoke",
      name: "Revelstoke",
      lat: 50.9981,
      lng: -118.1957,
      radiusM: 6000,
      blurb: "railway town on the columbia · ~10 min to the gondola base",
      nearbyMountainIds: ["revelstoke-mountain-resort"],
    },
    {
      id: "golden",
      name: "Golden",
      lat: 51.2960,
      lng: -116.9631,
      radiusM: 6000,
      blurb: "trans-canada town in the columbia valley · ~20 min up to kicking horse",
      nearbyMountainIds: ["kicking-horse"],
    },
    {
      id: "fernie",
      name: "Fernie",
      lat: 49.5040,
      lng: -115.0631,
      radiusM: 6000,
      blurb: "brick-built elk valley town under the three sisters · ~5 km to the lifts",
      nearbyMountainIds: ["fernie-alpine"],
    },
    {
      id: "nelson",
      name: "Nelson",
      lat: 49.4928,
      lng: -117.2948,
      radiusM: 6000,
      blurb: "heritage arts town on kootenay lake · ~20 min up to whitewater",
      nearbyMountainIds: ["whitewater"],
    },
    {
      id: "kimberley",
      name: "Kimberley",
      lat: 49.6697,
      lng: -115.9781,
      radiusM: 6000,
      blurb: "bavarian-themed rockies town · ~5 min from the kimberley alpine base",
      nearbyMountainIds: ["kimberley-alpine"],
    },
    {
      id: "invermere",
      name: "Invermere",
      lat: 50.5064,
      lng: -116.0311,
      radiusM: 6000,
      blurb: "columbia valley lake town · ~20 min up toby creek road to panorama",
      nearbyMountainIds: ["panorama"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Destination BC · HelloBC", url: "https://www.hellobc.com/" },
    { category: "Tourism", label: "Tourism Revelstoke", url: "https://www.seerevelstoke.com/" },
    { category: "Tourism", label: "Tourism Golden", url: "https://www.tourismgolden.com/" },
    { category: "Tourism", label: "Tourism Fernie", url: "https://tourismfernie.com/" },
    { category: "Tourism", label: "Nelson Kootenay Lake Tourism", url: "https://nelsonkootenaylake.com/" },
    { category: "Tourism", label: "Tourism Kimberley", url: "https://www.tourismkimberley.com/" },
    { category: "Resorts", label: "Revelstoke Mountain Resort", url: "https://www.revelstokemountainresort.com/" },
    { category: "Resorts", label: "Kicking Horse", url: "https://kickinghorseresort.com/" },
    { category: "Resorts", label: "Fernie Alpine Resort", url: "https://skifernie.com/" },
    { category: "Resorts", label: "Whitewater", url: "https://skiwhitewater.com/" },
    { category: "Resorts", label: "Kimberley Alpine Resort", url: "https://skikimberley.com/" },
    { category: "Resorts", label: "Panorama", url: "https://www.panoramaresort.com/" },
    { category: "Transport", label: "DriveBC · highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { category: "Safety", label: "Avalanche Canada · daily forecasts", url: "https://avalanche.ca/forecasts" },
    { category: "Weather", label: "Environment Canada · BC forecasts", url: "https://weather.gc.ca/" },
  ],
  roadsSource: {
    label: "DriveBC",
    url: "https://www.drivebc.ca/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
