import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Cache Valley · two independent resorts above the town of Logan:
 *
 *   Beaver Mountain → Indy Pass
 *   Cherry Peak      → Indy Pass (25%/50% off, not full access)
 *
 * No naming collisions: neither resort name matches the base town
 * (Logan), so both mountain ids stay bare.
 *
 * ⚠️ Cherry Peak's 2025-26 opening date is not officially confirmed by the
 * resort itself per the research doc - only inferred from a dated social
 * video upload (~Jan 10, 2026), with no press release or resort statement
 * confirming it. The resort was also reportedly listed for sale
 * (~$22.5M) as of July 2026. Both flagged in the blurb/tourismLinks
 * rather than treated as confirmed facts.
 *
 * Northern-hemisphere season (late Dec to mid-March, the shortest average
 * window of any Utah region here - both resorts closed early in 2025-26
 * due to a heat wave / dry conditions). Weather is Open-Meteo with the
 * existing OpenWeatherMap fallback · no NWS observation reconciliation is
 * wired. UDOT publishes udottraffic.utah.gov but nothing is integrated
 * yet, hence `roadsSource.dataAvailable: false`.
 */
export const cacheValleyRegion: RegionConfig = {
  id: "cache-valley",
  name: "Cache Valley",
  subtitle: "Utah · USA",
  shortTag: "UT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Beaver Mountain", "Cherry Peak"],
  resorts: [
    { path: "/mountain/beaver-mountain", label: "Beaver Mountain" },
    { path: "/mountain/cherry-peak", label: "Cherry Peak" },
  ],
  mountains: [
    {
      id: "beaver-mountain",
      name: "Beaver Mountain",
      elevationM: 2182,
      lat: 41.9742,
      lng: -111.4547,
      blurb: "family-run since 1939, one of the oldest continuously-operated ski areas in the US · Indy Pass",
      websiteUrl: "https://www.skithebeav.com/",
      snowReportUrl: "https://www.skithebeav.com/mountain/conditions/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "cherry-peak",
      name: "Cherry Peak",
      elevationM: 1760,
      lat: 41.9897,
      lng: -111.9250,
      // ⚠️ Opening date not officially confirmed by the resort for 2025-26
      // (only inferred from a dated social video) - flagged rather than
      // guessed, per the research doc. Also reportedly listed for sale.
      blurb: "small, family-friendly Cache Valley hill on the Indy Pass · 2025-26 opening date unconfirmed by the resort, reportedly listed for sale in 2026",
      websiteUrl: "https://www.skicpr.com/",
      snowReportUrl: "https://www.skicpr.com/ski-report",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "logan",
      name: "Logan",
      lat: 41.7370,
      lng: -111.8338,
      radiusM: 12000,
      blurb: "Cache Valley's main town, about 30 minutes from Beaver Mountain and Cherry Peak",
      nearbyMountainIds: ["beaver-mountain", "cherry-peak"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Cache Valley", url: "https://www.explorelogan.com/" },
    { category: "Resorts", label: "Beaver Mountain", url: "https://www.skithebeav.com/" },
    { category: "Resorts", label: "Cherry Peak (2025-26 opening date unconfirmed by resort)", url: "https://www.skicpr.com/" },
    { category: "Transport", label: "UDOT · statewide traffic & road conditions", url: "https://www.udottraffic.utah.gov/" },
    { category: "Safety", label: "Utah Avalanche Center · Logan forecast", url: "https://utahavalanchecenter.org/forecast/logan" },
  ],
  roadsSource: {
    label: "UDOT · udottraffic.utah.gov",
    url: "https://www.udottraffic.utah.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
