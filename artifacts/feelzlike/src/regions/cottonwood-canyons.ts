import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Cottonwood Canyons · the two canyons (Little Cottonwood, Big Cottonwood)
 * rising directly above Salt Lake City/Sandy, home to four resorts:
 *
 *   Alta       → Little Cottonwood Canyon · full Ikon Pass only, ski-only
 *   Snowbird   → Little Cottonwood Canyon · Ikon Pass (full: 7 shared days
 *                with Alta; Base: 5 days)
 *   Brighton   → Big Cottonwood Canyon    · Ikon Pass
 *   Solitude   → Big Cottonwood Canyon    · Ikon Pass, unlimited for full
 *                Ikon holders (Utah's only such resort)
 *
 * No naming collisions here: none of the four resort names match the base
 * town (Salt Lake City / Sandy), so all four mountain ids stay bare.
 *
 * ⚠️ Alta is ski-only — snowboarding is not permitted anywhere on Alta's
 * terrain. This is called out in Alta's blurb and tourismLinks entry per
 * the research doc; there is no dedicated schema field for it yet (same
 * gap flagged for Mad River Glen in the upcoming Vermont pass).
 *
 * Northern-hemisphere season (late Nov to mid-May, the longest window of
 * any Utah region because Snowbird and Solitude both run into May).
 * Weather is Open-Meteo with the existing OpenWeatherMap fallback · no NWS
 * observation reconciliation is wired. UDOT publishes cottonwoodcanyons.
 * udot.utah.gov but nothing is integrated yet, hence
 * `roadsSource.dataAvailable: false`.
 */
export const cottonwoodCanyonsRegion: RegionConfig = {
  id: "cottonwood-canyons",
  name: "Cottonwood Canyons",
  subtitle: "Utah · USA",
  shortTag: "UT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Alta", "Snowbird", "Brighton", "Solitude"],
  resorts: [
    { path: "/mountain/alta", label: "Alta" },
    { path: "/mountain/snowbird", label: "Snowbird" },
    { path: "/mountain/brighton-resort", label: "Brighton" },
    { path: "/mountain/solitude-mountain-resort", label: "Solitude" },
  ],
  mountains: [
    {
      id: "alta",
      name: "Alta",
      elevationM: 2600,
      lat: 40.5883,
      lng: -111.6383,
      // Ski-only note kept front-and-centre in the blurb since there is no
      // dedicated schema field for a discipline restriction yet.
      blurb: "ski-only (no snowboarding) · full Ikon Pass only · legendary Little Cottonwood Canyon powder",
      websiteUrl: "https://www.alta.com/",
      snowReportUrl: "https://www.alta.com/weather",
      expert_only: true,
      backcountry_access: true,
    },
    {
      id: "snowbird",
      name: "Snowbird",
      elevationM: 2365,
      lat: 40.5830,
      lng: -111.6556,
      blurb: "tram-served big terrain in Little Cottonwood Canyon · usually the last Utah resort to close",
      websiteUrl: "https://www.snowbird.com/",
      snowReportUrl: "https://www.snowbird.com/mountain-report/",
      expert_only: true,
      backcountry_access: true,
      summerOpen: true,
    },
    {
      id: "brighton-resort",
      name: "Brighton",
      elevationM: 2669,
      lat: 40.5977,
      lng: -111.5836,
      blurb: "Big Cottonwood Canyon local favourite · night skiing and a laid-back, no-frills base",
      websiteUrl: "https://www.brightonresort.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "solitude-mountain-resort",
      name: "Solitude",
      elevationM: 2437,
      lat: 40.6199,
      lng: -111.5928,
      blurb: "Big Cottonwood Canyon · Utah's only Ikon destination with unlimited access for full Ikon Pass holders",
      websiteUrl: "https://www.solitudemountain.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "salt-lake-city",
      name: "Salt Lake City",
      lat: 40.7608,
      lng: -111.8910,
      radiusM: 12000,
      blurb: "Utah's capital, about 25-40 minutes from the Cottonwood Canyon mouths",
      nearbyMountainIds: ["alta", "snowbird", "brighton-resort", "solitude-mountain-resort"],
    },
    {
      id: "sandy",
      name: "Sandy",
      lat: 40.5649,
      lng: -111.8389,
      radiusM: 8000,
      blurb: "suburb at the mouth of Little Cottonwood Canyon, the closest base town for Alta and Snowbird",
      nearbyMountainIds: ["alta", "snowbird"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Salt Lake", url: "https://www.visitsaltlake.com/" },
    { category: "Resorts", label: "Alta (ski-only, no snowboarding)", url: "https://www.alta.com/" },
    { category: "Resorts", label: "Snowbird", url: "https://www.snowbird.com/" },
    { category: "Resorts", label: "Brighton Resort", url: "https://www.brightonresort.com/" },
    { category: "Resorts", label: "Solitude Mountain Resort", url: "https://www.solitudemountain.com/" },
    { category: "Transport", label: "UDOT · Cottonwood Canyons road info & parking reservations", url: "https://cottonwoodcanyons.udot.utah.gov/" },
    { category: "Transport", label: "UDOT · statewide traffic & road conditions", url: "https://www.udottraffic.utah.gov/" },
    { category: "Safety", label: "Utah Avalanche Center · Salt Lake forecast", url: "https://utahavalanchecenter.org/archives/forecasts/salt-lake" },
  ],
  roadsSource: {
    label: "UDOT · cottonwoodcanyons.udot.utah.gov",
    url: "https://cottonwoodcanyons.udot.utah.gov/",
    // No UDOT feed integration in this pass · the UI shows an honest
    // "not wired yet" panel and links out rather than implying live data.
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
