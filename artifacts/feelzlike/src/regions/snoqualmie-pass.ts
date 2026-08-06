import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Snoqualmie Pass, WA · base town Snoqualmie Pass, home to one resort:
 *
 *   The Summit at Snoqualmie → Ikon Pass (Full tier, no blackouts) ·
 *                              independent ownership (Boyne Resorts) ·
 *                              modeled here as ONE resort entry made up
 *                              of four connected sub-areas rather than
 *                              four separate mountain entries (see
 *                              modeling note below).
 *
 * MODELING NOTE (sub-areas): The Summit at Snoqualmie operates four
 * distinct base areas under one ticket/pass — Summit West (first to
 * open, beginner-friendly, base 3,000 ft / summit 3,765 ft / vertical
 * 765 ft), Summit Central (base 2,840 ft / summit 3,865 ft / vertical
 * 1,025 ft), Summit East (base 2,610 ft / summit 3,710 ft / vertical
 * 1,100 ft), and Alpental (steepest/most expert terrain, base 3,140 ft
 * / summit 5,420 ft / vertical 2,280 ft). These are documented here as
 * one resort entry with sub-area detail folded into the blurb, rather
 * than four separate mountain entries, because they share a single
 * resort identity, ticket, and website — consistent with how other
 * multi-base resorts are represented elsewhere in this codebase.
 *
 * Naming collision: none of "snoqualmie-pass" (mountain) or the base
 * town id "snoqualmie-pass-town" collide with any existing region or
 * location id. The mountain and base town share the same human name
 * ("Snoqualmie Pass"), so the base-town id uses the "-town" suffix
 * convention to disambiguate from the mountain id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - The 2025-26 season opened Dec 23, 2025 with only Summit West
 *   operating; the other three sub-areas opened on later, unconfirmed
 *   dates per the research doc. No confirmed full-mountain opening date
 *   or season-closing date was found — do not fabricate either.
 * - Ikon Pass holders may face a reservation requirement here on
 *   high-demand days (per Ikon's general policy) — flagged, not
 *   asserted as certain for every day of the season.
 * - Webcam feeds are listed on the resort's site but were not
 *   independently re-verified as live by direct fetch in research —
 *   `websiteUrl` points at the resort's own conditions hub rather than
 *   a fabricated deep link.
 * - Avalanche: covered by the Northwest Avalanche Center (NWAC).
 *
 * Washington uses a storm-activated, escalating-tier chain law (RCW
 * 47.36.250) — see roads.ts's `waChainEntry()`. I-90 through Snoqualmie
 * Pass is itself a WSDOT avalanche-control corridor. WSDOT (wsdot.com)
 * is the road authority. America/Los_Angeles timezone.
 */
export const snoqualmiePassRegion: RegionConfig = {
  id: "snoqualmie-pass",
  name: "Snoqualmie Pass",
  subtitle: "Washington · USA",
  shortTag: "WA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["The Summit at Snoqualmie"],
  resorts: [
    { path: "/mountain/snoqualmie-pass", label: "The Summit at Snoqualmie" },
  ],
  mountains: [
    {
      id: "snoqualmie-pass",
      name: "The Summit at Snoqualmie",
      elevationM: 1178,
      lat: 47.42400,
      lng: -121.41600,
      blurb: "Ikon Pass (Full tier, no blackouts) · independent (Boyne Resorts-owned) · four connected base areas under one ticket — Summit West (base 3,000 ft/summit 3,765 ft/vertical 765 ft, first to open), Summit Central (base 2,840 ft/summit 3,865 ft/vertical 1,025 ft), Summit East (base 2,610 ft/summit 3,710 ft/vertical 1,100 ft), and Alpental (steepest terrain, base 3,140 ft/summit 5,420 ft/vertical 2,280 ft) · ⚠️ 2025-26 season opened Dec 23, 2025 with only Summit West running; other sub-areas' opening dates and any season-closing date unconfirmed by a single dated primary source. Ikon Pass reservations may be required on high-demand days. Webcam feeds listed on-site but not independently re-verified as live.",
      websiteUrl: "https://summitatsnoqualmie.com/",
      snowReportUrl: "https://summitatsnoqualmie.com/mountain-report/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "snoqualmie-pass-town",
      name: "Snoqualmie Pass",
      lat: 47.39222,
      lng: -121.40000,
      radiusM: 6000,
      blurb: "Small community directly on I-90 at the pass summit, immediately adjacent to all four Summit at Snoqualmie base areas.",
      nearbyMountainIds: ["snoqualmie-pass"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "The Summit at Snoqualmie", url: "https://summitatsnoqualmie.com/" },
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
