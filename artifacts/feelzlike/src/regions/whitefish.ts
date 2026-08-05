import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Whitefish, MT · one resort, one base town (Whitefish):
 *
 *   Whitefish Mountain Resort → independent (widely described as "the
 *                                largest ski area in the country not on
 *                                Epic/Ikon/Indy") · confirmed live snow
 *                                report · ⚠️ no confirmed dedicated
 *                                official webcam URL — an official
 *                                Mountain Stats page exists, and
 *                                third-party aggregators reference a
 *                                Base Lodge Cam and South Summit Cam
 *                                sourced from the official site, but a
 *                                direct live webcam URL on
 *                                skiwhitefish.com could not be
 *                                independently confirmed, flagged as
 *                                unverified rather than guessed.
 *
 * Avalanche: Flathead Avalanche Center (flatheadavalanche.org) covers
 * Whitefish's backcountry — see RegionSources.tsx. Chain law: Montana
 * has NO statewide passenger-vehicle chain law — only a narrow
 * heavy-vehicle rule (MCA 61-9-436) — see roads.ts's `mtChainEntry()`.
 */
export const whitefishRegion: RegionConfig = {
  id: "whitefish",
  name: "Whitefish",
  subtitle: "Montana · USA",
  shortTag: "MT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Whitefish Mountain Resort"],
  resorts: [
    { path: "/mountain/whitefish-mountain-resort", label: "Whitefish Mountain Resort" },
  ],
  mountains: [
    {
      id: "whitefish-mountain-resort",
      name: "Whitefish Mountain Resort",
      elevationM: 2078,
      lat: 48.4890,
      lng: -114.3670,
      blurb: "Independent · known locally as \"Big Mountain\" · widely described as the largest US ski area not on Epic, Ikon, or Indy Pass · official 2025-26 closing day Apr 5 2026 per resort · ⚠️ no confirmed dedicated official webcam URL found in research, treat as unverified.",
      websiteUrl: "https://skiwhitefish.com/",
      snowReportUrl: "https://skiwhitefish.com/snowreport/",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "whitefish-town",
      name: "Whitefish",
      lat: 48.4111,
      lng: -114.3376,
      radiusM: 10000,
      blurb: "Lakeside base town for Whitefish Mountain Resort, near Glacier National Park",
      nearbyMountainIds: ["whitefish-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Whitefish", url: "https://skiwhitefish.com/" },
    { category: "Resorts", label: "Whitefish Mountain Resort", url: "https://skiwhitefish.com/" },
    { category: "Avalanche", label: "Flathead Avalanche Center", url: "https://www.flatheadavalanche.org/" },
    { category: "Transport", label: "MDT · 511mt.net road conditions", url: "https://www.511mt.net/" },
  ],
  roadsSource: {
    label: "MDT · 511mt.net",
    url: "https://www.511mt.net/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
