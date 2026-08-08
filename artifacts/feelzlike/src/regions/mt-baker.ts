import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Mt. Baker, WA · base town Glacier, home to one resort:
 *
 *   Mt. Baker Ski Area → independent, no major-pass affiliation (not on
 *                        Epic, Ikon, or Indy) · holds the world record
 *                        for most snowfall in a single season (1,140
 *                        in., 1998-99), verified by NOAA.
 *
 * Naming collision: none of "mt-baker" (mountain) or "glacier" (base
 * town) collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - NO confirmed webcam could be found for this resort in research —
 *   mirrored explicitly on Whitefish's no-webcam pattern from the
 *   Montana pass rather than guessing at a URL. `websiteUrl` points at
 *   the resort's own site only.
 * - Coordinates used here (48.861944, -121.653889) are the ski area's
 *   own published GPS figure, matching the Wikipedia infobox closely.
 *   Do NOT confuse with Mount Baker the volcano peak itself
 *   (48.7766, -121.8145), a different, much higher point roughly 10
 *   miles away.
 * - 2025-26 season dates ARE confirmed for this resort (unlike several
 *   other WA resorts this pass): opened Dec 21, 2025, closed Apr 19,
 *   2026.
 * - Avalanche: covered by the Northwest Avalanche Center (NWAC).
 *
 * Washington uses a storm-activated, escalating-tier chain law (RCW
 * 47.36.250) — see roads.ts's `waChainEntry()`. SR-542 (the Mt. Baker
 * Highway) has WSDOT-designated chain-control mileposts (22.91-57.26).
 * WSDOT (wsdot.com) is the road authority. America/Los_Angeles
 * timezone.
 */
export const mtBakerRegion: RegionConfig = {
  id: "mt-baker",
  name: "Mt. Baker",
  subtitle: "Washington · USA",
  shortTag: "WA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Mt. Baker Ski Area"],
  resorts: [
    { path: "/mountain/mt-baker", label: "Mt. Baker Ski Area" },
  ],
  mountains: [
    {
      id: "mt-baker",
      name: "Mt. Baker Ski Area",
      elevationM: 1515,
      lat: 48.861944,
      lng: -121.653889,
      blurb: "Independent · no major-pass affiliation (not on Epic, Ikon or Indy) · two base areas (~3,500 ft and ~4,300 ft) / summit ~5,000-5,089 ft / vertical ~1,500-1,589 ft · holds the world record for most snowfall recorded in a single season (1,140 in., 1998-99), verified by NOAA · confirmed 2025-26 season Dec 21, 2025 - Apr 19, 2026 · ⚠️ NO confirmed live webcam found in research — do not treat any third-party mirror as official.",
      websiteUrl: "https://www.mtbaker.us/",
      snowReportUrl: "https://www.mtbaker.us/conditions/",
      expert_only: true,
      backcountry_access: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "glacier",
      name: "Glacier",
      lat: 48.88833,
      lng: -121.93389,
      radiusM: 8000,
      blurb: "Small town on SR-542 (the Mt. Baker Highway), the sole access route to Mt. Baker Ski Area.",
      nearbyMountainIds: ["mt-baker"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Mt. Baker Ski Area", url: "https://www.mtbaker.us/" },
    { category: "Avalanche", label: "Northwest Avalanche Center (NWAC)", url: "https://nwac.us/" },
    { category: "Transport", label: "WSDOT · wsdot.com/travel/real-time/mountainpasses", url: "https://wsdot.com/travel/real-time/mountainpasses" },
  ],
  roadsSource: {
    label: "WSDOT · wsdot.com/travel/real-time/mountainpasses",
    url: "https://wsdot.com/travel/real-time/mountainpasses",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
