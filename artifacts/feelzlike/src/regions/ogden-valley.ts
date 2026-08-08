import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Ogden Valley · three resorts above the towns of Ogden and Eden:
 *
 *   Snowbasin       → Ikon Pass (7 days for full Ikon Pass holders)
 *   Powder Mountain  → independent, own season pass, not Ikon/Epic
 *   Nordic Valley    → Power Pass (multi-resort, not Ikon/Epic)
 *
 * No naming collisions: none of the three resort names match the base
 * towns (Ogden, Eden), so all three mountain ids stay bare.
 *
 * ⚠️ Nordic Valley's 2025-26 season dates are flagged as unreliable in the
 * research doc: it opened very late (Jan 11, 2026) after a historically
 * low-snow start and had a temporary mid-season closure; no confirmed
 * final closing date was found, and a third-party aggregator's date range
 * conflicts with the confirmed opening date. Rather than guess, the blurb
 * and tourismLinks entry flag this explicitly and no closing-date claim is
 * made anywhere in this file.
 *
 * Northern-hemisphere season (early Dec to late March, the shortest
 * average window of any Utah region here - Snowbasin and Powder Mountain
 * both closed noticeably early in 2025-26 due to a dry winter). Weather is
 * Open-Meteo with the existing OpenWeatherMap fallback · no NWS
 * observation reconciliation is wired. UDOT publishes udottraffic.utah.gov
 * but nothing is integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const ogdenValleyRegion: RegionConfig = {
  id: "ogden-valley",
  name: "Ogden Valley",
  subtitle: "Utah · USA",
  shortTag: "UT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Snowbasin", "Powder Mountain", "Nordic Valley"],
  resorts: [
    { path: "/mountain/snowbasin", label: "Snowbasin" },
    { path: "/mountain/powder-mountain", label: "Powder Mountain" },
    { path: "/mountain/nordic-valley", label: "Nordic Valley" },
  ],
  mountains: [
    {
      id: "snowbasin",
      name: "Snowbasin",
      elevationM: 1925,
      lat: 41.2160,
      lng: -111.8567,
      blurb: "2002 Winter Olympics downhill venue · Ikon Pass (7 days)",
      websiteUrl: "https://www.snowbasin.com/",
      beginner_friendly: true,
      kids_lessons: true,
      terrain_park: true,
    },
    {
      id: "powder-mountain",
      name: "Powder Mountain",
      elevationM: 2103,
      lat: 41.3797,
      lng: -111.7811,
      blurb: "independent, own season pass (not Ikon or Epic) · vast, uncrowded terrain and night skiing",
      websiteUrl: "https://powdermountain.com/",
      snowReportUrl: "https://powdermountain.com/conditions",
      backcountry_access: true,
    },
    {
      id: "nordic-valley",
      name: "Nordic Valley",
      elevationM: 1635,
      lat: 41.3311,
      lng: -111.8497,
      // ⚠️ Season data unreliable/unconfirmed for 2025-26 (very late Jan 11
      // opening after a historically low-snow start, a mid-season
      // temporary closure, and no confirmed final closing date) - flagged
      // rather than guessed, per the research doc.
      blurb: "small, family-friendly night-skiing hill on the Power Pass · 2025-26 season dates unconfirmed/unreliable, flag before trusting an open/close date",
      websiteUrl: "https://www.nordicvalley.ski/",
      snowReportUrl: "https://www.nordicvalley.ski/nordic-valley-weather-conditions-webcams/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "ogden",
      name: "Ogden",
      lat: 41.2230,
      lng: -111.9738,
      radiusM: 10000,
      blurb: "historic railroad city at the mouth of Ogden Canyon, about 35 minutes from Salt Lake City",
      nearbyMountainIds: ["snowbasin", "powder-mountain", "nordic-valley"],
    },
    {
      id: "eden",
      name: "Eden",
      lat: 41.3211,
      lng: -111.8636,
      radiusM: 8000,
      blurb: "small valley community closest to Powder Mountain and Nordic Valley",
      nearbyMountainIds: ["powder-mountain", "nordic-valley"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Ogden Valley", url: "https://www.visitogden.com/" },
    { category: "Resorts", label: "Snowbasin", url: "https://www.snowbasin.com/" },
    { category: "Resorts", label: "Powder Mountain", url: "https://powdermountain.com/" },
    { category: "Resorts", label: "Nordic Valley (season dates unconfirmed - verify before trusting)", url: "https://www.nordicvalley.ski/" },
    { category: "Transport", label: "UDOT · statewide traffic & road conditions", url: "https://www.udottraffic.utah.gov/" },
    { category: "Safety", label: "Utah Avalanche Center · Ogden forecast", url: "https://utahavalanchecenter.org/" },
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
