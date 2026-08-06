import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Stevens Pass, WA · base town Skykomish, home to one resort:
 *
 *   Stevens Pass Ski Area → Vail Resorts' Epic Local Pass (no
 *                           blackouts) · sole highway access via US-2.
 *
 * Naming collision: none of "stevens-pass" (mountain) or "skykomish"
 * (base town) collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - US-2, the resort's sole highway access, closed Dec 23-31, 2025 due
 *   to flooding/storm damage, delaying the 2025-26 opening to Dec 29,
 *   2025; Vail issued prorated refunds for the affected period per the
 *   research doc. No confirmed season-closing date was found.
 * - Elevation/vertical figures for this resort are genuinely
 *   inconsistent across sources in the research doc (summit figures in
 *   particular vary) — the figures used below are the most commonly
 *   cited set, but this is flagged rather than silently reconciled;
 *   the resort's own official stats page should be checked for the
 *   authoritative figure, the same reconciliation approach used for
 *   Stowe's base elevation in the Vermont pass.
 * - Webcam feeds are listed on the resort's site but were not
 *   independently re-verified as live by direct fetch in research.
 * - Avalanche: covered by the Northwest Avalanche Center (NWAC), which
 *   also names the "Old Faithful" slide path near Stevens Pass as a
 *   recurring highway-avalanche hazard zone.
 *
 * Washington uses a storm-activated, escalating-tier chain law (RCW
 * 47.36.250) — see roads.ts's `waChainEntry()`. WSDOT (wsdot.com) is
 * the road authority. America/Los_Angeles timezone.
 */
export const stevensPassRegion: RegionConfig = {
  id: "stevens-pass",
  name: "Stevens Pass",
  subtitle: "Washington · USA",
  shortTag: "WA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Stevens Pass Ski Area"],
  resorts: [
    { path: "/mountain/stevens-pass", label: "Stevens Pass Ski Area" },
  ],
  mountains: [
    {
      id: "stevens-pass",
      name: "Stevens Pass Ski Area",
      elevationM: 1235,
      lat: 47.74472,
      lng: -121.08889,
      blurb: "Vail Resorts' Epic Local Pass (no blackouts) · sole highway access via US-2 · ⚠️ Dec 2025 US-2 flood/storm closure (Dec 23-31) delayed the 2025-26 opening to Dec 29, 2025; Vail issued prorated refunds for the closure period. Elevation/vertical figures are genuinely inconsistent across sources — check the resort's own stats page for the authoritative figure. Webcam feeds listed on-site but not independently re-verified as live. NWAC also flags the \\\"Old Faithful\\\" slide path near the pass as a recurring highway-avalanche hazard.",
      websiteUrl: "https://www.stevenspass.com/",
      snowReportUrl: "https://www.stevenspass.com/the-mountain/mountain-conditions.aspx",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "skykomish",
      name: "Skykomish",
      lat: 47.71028,
      lng: -121.35833,
      radiusM: 8000,
      blurb: "Small town on US-2, roughly 20 minutes' drive from Stevens Pass Ski Area along the resort's sole highway access route.",
      nearbyMountainIds: ["stevens-pass"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Stevens Pass Ski Area", url: "https://www.stevenspass.com/" },
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
