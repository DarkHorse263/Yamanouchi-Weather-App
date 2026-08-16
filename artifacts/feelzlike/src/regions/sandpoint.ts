import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Sandpoint, ID · base town Sandpoint, home to one resort:
 *
 *   Schweitzer Mountain Resort → Ikon Pass (destination tier) ·
 *                                independent ownership · the 2nd
 *                                largest ski area in Idaho by vertical
 *                                drop.
 *
 * Naming collision: none of "schweitzer-mountain-resort" or
 * "sandpoint" collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - 2025-26 season opened Dec 3, 2025 (delayed from an earlier planned
 *   Nov 28/21, 2025 window per conflicting research sources) and closed
 *   Apr 5, 2026, DESPITE a research-doc note describing the season as
 *   "historically low snow" — both dates are confirmed and shown as-is
 *   rather than adjusted for the low-snow framing.
 * - Avalanche: covered by the Idaho Panhandle Avalanche Center (IPAC),
 *   the Idaho avalanche-forecast authority for the Sandpoint/Schweitzer
 *   zone (distinct from the Sawtooth Avalanche Center that covers Sun
 *   Valley, and the Payette Avalanche Center that covers
 *   Donnelly/McCall — Idaho has three separate avalanche centers, none
 *   of them statewide).
 *
 * IDAHO TIMEZONE NOTE — CRITICAL: The Idaho Panhandle (Sandpoint /
 * Schweitzer / Bonner County) observes PACIFIC time, not Mountain time
 * like the rest of Idaho → America/Los_Angeles. Do NOT default this
 * region to America/Boise along with Sun Valley/Boise/Donnelly-McCall.
 *
 * Idaho has a narrow, commercial-vehicle-only chain law (Idaho Code
 * § 49-948) that does not apply to passenger vehicles on this region's
 * access roads — see roads.ts's `idChainEntry()`. Note Lookout Pass on
 * I-90 (one of the few roads where the commercial chain law can apply)
 * is a separate mountain pass east of Sandpoint, not on Schweitzer's
 * own access road. Idaho 511 (511.idaho.gov) is the road authority.
 */
export const sandpointRegion: RegionConfig = {
  id: "sandpoint",
  name: "Sandpoint",
  subtitle: "Idaho · USA",
  shortTag: "ID",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Schweitzer Mountain Resort"],
  resorts: [
    { path: "/mountain/schweitzer-mountain-resort", label: "Schweitzer Mountain Resort" },
  ],
  mountains: [
    {
      id: "schweitzer-mountain-resort",
      name: "Schweitzer Mountain Resort",
      elevationM: 1951,
      lat: 48.36700,
      lng: -116.62300,
      blurb: "Ikon Pass (destination tier) · independent ownership · base 3,957 ft / summit 6,400 ft / vertical 2,440 ft — the 2nd largest ski area in Idaho by vertical drop · confirmed 2025-26 season Dec 3, 2025 (delayed from an earlier planned Nov 28/21 window) - Apr 5, 2026, despite a \\\"historically low snow\\\" season per research.",
      websiteUrl: "https://www.schweitzer.com/",
      snowReportUrl: "https://www.schweitzer.com/mountain-info/mountain-report",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "sandpoint",
      name: "Sandpoint",
      lat: 48.28222,
      lng: -116.56139,
      radiusM: 10000,
      blurb: "Town on Lake Pend Oreille, roughly 30 minutes' drive from Schweitzer Mountain Resort.",
      nearbyMountainIds: ["schweitzer-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Schweitzer Mountain Resort", url: "https://www.schweitzer.com/" },
    { category: "Avalanche", label: "Idaho Panhandle Avalanche Center (IPAC)", url: "https://www.idahopanhandleavalanche.org/" },
    { category: "Transport", label: "Idaho 511 · 511.idaho.gov", url: "https://511.idaho.gov/" },
  ],
  roadsSource: {
    label: "Idaho 511 · 511.idaho.gov",
    url: "https://511.idaho.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
