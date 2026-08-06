import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Crystal Mountain, WA · base town Enumclaw, home to one resort:
 *
 *   Crystal Mountain Resort → Ikon Pass (Full tier, no blackouts) ·
 *                             independent ownership (Alterra) · the
 *                             largest ski area in Washington by vertical
 *                             drop (3,100 ft) and one of the largest by
 *                             skiable acreage.
 *
 * Naming collision: none of "crystal-mountain" (mountain) or "enumclaw"
 * (base town) collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - SR-410 (the resort's primary access road) sustained flood damage in
 *   late 2025, which delayed the 2025-26 opening from its usual
 *   late-November target to Dec 20-24, 2025 (research doc flags this
 *   window as approximate, not a single confirmed date). No confirmed
 *   season-closing date was found — do not fabricate one.
 * - The resort publishes a webcam page, but no individual webcam feed
 *   URL could be independently confirmed live by direct fetch in
 *   research — `websiteUrl` points at the resort's own conditions hub
 *   rather than a fabricated deep link.
 * - Avalanche: covered by the Northwest Avalanche Center (NWAC), which
 *   forecasts for all Washington Cascades zones including Crystal
 *   Mountain/Mt. Rainier.
 *
 * Washington uses a storm-activated, escalating-tier chain law (RCW
 * 47.36.250) rather than a broad mandatory law like Oregon/Colorado —
 * see roads.ts's `waChainEntry()`. WSDOT (wsdot.com) is the road
 * authority. America/Los_Angeles timezone (Washington is entirely
 * Pacific time).
 */
export const crystalMountainRegion: RegionConfig = {
  id: "crystal-mountain",
  name: "Crystal Mountain",
  subtitle: "Washington · USA",
  shortTag: "WA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Crystal Mountain Resort"],
  resorts: [
    { path: "/mountain/crystal-mountain", label: "Crystal Mountain Resort" },
  ],
  mountains: [
    {
      id: "crystal-mountain",
      name: "Crystal Mountain Resort",
      elevationM: 2138,
      lat: 46.9280,
      lng: -121.4749,
      blurb: "Ikon Pass (Full tier, no blackouts) · independent (Alterra-owned) · base 4,400 ft / summit 7,012 ft / vertical 3,100 ft — the largest ski area in Washington by vertical drop · ⚠️ SR-410, the resort's primary access road, sustained flood damage in late 2025, delaying the 2025-26 opening to approximately Dec 20-24, 2025 (exact date not confirmed by a single dated primary source); no confirmed season-closing date found. Webcam page exists but no individual feed URL independently confirmed live.",
      websiteUrl: "https://www.crystalmountainresort.com/",
      snowReportUrl: "https://www.crystalmountainresort.com/mountain-report",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "enumclaw",
      name: "Enumclaw",
      lat: 47.20111,
      lng: -121.99694,
      radiusM: 10000,
      blurb: "Gateway town on SR-410, the primary access route to Crystal Mountain Resort; roughly 1 hour's drive from the resort itself.",
      nearbyMountainIds: ["crystal-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Crystal Mountain Resort", url: "https://www.crystalmountainresort.com/" },
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
