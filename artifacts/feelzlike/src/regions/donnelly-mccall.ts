import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Donnelly / McCall, ID · base town Donnelly, home to two resorts:
 *
 *   Tamarack Resort   → Indy Pass (capped redemptions for 2025-26),
 *                       joining Ikon as a "Bonus Mountain" starting
 *                       2026-27 (NOT for the current 2025-26 season).
 *   Brundage Mountain  → Indy Pass, independent, grouped into this
 *                       region per task guidance since it sits near
 *                       McCall/Donnelly.
 *
 * Naming collision: none of "tamarack-resort", "brundage-mountain" or
 * "donnelly" collide with any existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES:
 * - CRITICAL — Tamarack Resort's ownership/financial status is a
 *   genuinely UNRESOLVED CONFLICT in sources and must not be asserted
 *   as fact in either direction:
 *     · A November 2025 Idaho Business Review piece describes MMG
 *       ownership as "debt-free" following a buyout.
 *     · A March 2025 S&A/SAM ("Stretto"/similar) report instead
 *       describes a fresh Chapter 11 bankruptcy filing tied to the
 *       same underlying ~$262M Credit Suisse debt.
 *   These two claims cannot both be true as stated; this file presents
 *   both without picking a winner, consistent with the "never fabricate
 *   / never silently resolve a genuine conflict" rule applied elsewhere
 *   in this codebase (e.g. Timberline's disputed vertical figure).
 *   Tamarack's own PRNewswire release confirms the 2025-26 season
 *   opened Dec 22, 2025 — that specific operational fact is NOT in
 *   dispute and is shown as confirmed.
 *   Tamarack is an Indy Pass member for 2025-26 (capped redemptions)
 *   and is set to join Ikon as a "Bonus Mountain" starting the
 *   2026-27 season — NOT the current 2025-26 season; do not conflate
 *   the two seasons.
 * - Brundage Mountain: Indy Pass member, 70 trails, 6 lifts, no night
 *   skiing — no comparable ownership dispute found in research.
 * - Avalanche: covered by the Payette Avalanche Center (PAC), the
 *   Idaho avalanche-forecast authority for the Donnelly/McCall zone
 *   (distinct from the Sawtooth Avalanche Center covering Sun Valley
 *   and the Idaho Panhandle Avalanche Center covering Sandpoint).
 *
 * IDAHO TIMEZONE NOTE: Donnelly/McCall sits in the Mountain time zone
 * → America/Boise. (Contrast with Sandpoint/Schweitzer in the Idaho
 * Panhandle, which observes Pacific time.)
 *
 * Idaho has a narrow, commercial-vehicle-only chain law (Idaho Code
 * § 49-948) that does not apply to passenger vehicles on this region's
 * access roads — see roads.ts's `idChainEntry()`. Idaho 511
 * (511.idaho.gov) is the road-conditions authority.
 */
export const donnellyMccallRegion: RegionConfig = {
  id: "donnelly-mccall",
  name: "Donnelly / McCall",
  subtitle: "Idaho · USA",
  shortTag: "ID",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Tamarack Resort", "Brundage Mountain"],
  resorts: [
    { path: "/mountain/tamarack-resort", label: "Tamarack Resort" },
    { path: "/mountain/brundage-mountain", label: "Brundage Mountain" },
  ],
  mountains: [
    {
      id: "tamarack-resort",
      name: "Tamarack Resort",
      elevationM: 1490,
      lat: 44.671,
      lng: -116.123,
      blurb: "Indy Pass (capped redemptions for 2025-26); joining Ikon as a \\\"Bonus Mountain\\\" starting 2026-27, NOT the current season · base 4,888 ft / summit 7,700 ft / vertical 2,800 ft · confirmed 2025-26 season opened Dec 22, 2025 per the resort's own release · ⚠️ OWNERSHIP/FINANCIAL STATUS UNRESOLVED: a Nov 2025 Idaho Business Review piece describes \\\"debt-free\\\" MMG ownership, while a Mar 2025 report describes a fresh Chapter 11 filing tied to the same ~$262M Credit Suisse debt — both are shown here as competing, unreconciled claims rather than one being asserted as fact.",
      websiteUrl: "https://www.tamarackidaho.com/",
      snowReportUrl: "https://tamarackidaho.com/the-mountain/snow-report",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
    {
      id: "brundage-mountain",
      name: "Brundage Mountain",
      elevationM: 2320,
      lat: 45.00500,
      lng: -116.15500,
      blurb: "Indy Pass member · independent · base 5,880 ft / summit 7,610 ft / vertical 1,921 ft · 70 trails, 6 lifts, no night skiing.",
      websiteUrl: "https://www.brundage.com/",
      snowReportUrl: "https://www.brundage.com/on-the-mountain/snow-report/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "donnelly",
      name: "Donnelly",
      lat: 44.73028,
      lng: -116.07444,
      radiusM: 15000,
      blurb: "Valley County town on ID-55, roughly midway between Tamarack Resort (south) and Brundage Mountain near McCall (north).",
      nearbyMountainIds: ["tamarack-resort", "brundage-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Tamarack Resort", url: "https://www.tamarackidaho.com/" },
    { category: "Resorts", label: "Brundage Mountain", url: "https://www.brundage.com/" },
    { category: "Avalanche", label: "Payette Avalanche Center (PAC)", url: "https://payetteavalanche.org/" },
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
