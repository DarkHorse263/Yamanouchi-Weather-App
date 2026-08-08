import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Boise, ID · base town Boise, home to one resort:
 *
 *   Bogus Basin → nonprofit 501(c)(3), the largest nonprofit ski area
 *                 in the United States · Powder Alliance / Freedom Pass
 *                 (NOT on Epic, Ikon, or Indy).
 *
 * Naming collision: none of "bogus-basin" or "boise" collide with any
 * existing region or location id.
 *
 * ⚠️ HONESTY-GATE NOTES (mirrors Bridger Bowl/Santa Fe early-closure
 * pattern from prior states):
 * - Bogus Basin opened Nov 29, 2025, but did not reach full-mountain
 *   operation until Feb 20, 2026.
 * - CRITICAL: Bogus Basin CLOSED EARLY for the 2025-26 season on Mar
 *   22, 2026, due to unseasonably warm weather — this must be shown as
 *   a real early closure, not smoothed over or presented as a normal
 *   end-of-season date.
 * - CRITICAL AVALANCHE-COVERAGE GAP: unlike Sun Valley (Sawtooth
 *   Avalanche Center) and Sandpoint (Idaho Panhandle Avalanche Center),
 *   there is NO avalanche-forecast zone centered on the Boise
 *   Front/Bogus Basin. The nearest Sawtooth Avalanche Center zones are
 *   56-61 miles away — too far to responsibly present as covering this
 *   region. No avalanche-bulletin link is offered for this region
 *   rather than pointing at a zone that doesn't actually apply, the
 *   same honest-gap pattern used for Angel Fire/Santa Fe/Albuquerque in
 *   the New Mexico pass.
 *
 * IDAHO TIMEZONE NOTE: Boise sits in the Mountain time zone →
 * America/Boise. (Contrast with Sandpoint/Schweitzer in the Idaho
 * Panhandle, which observes Pacific time.)
 *
 * Idaho has a narrow, commercial-vehicle-only chain law (Idaho Code
 * § 49-948) that does not apply to passenger vehicles on this region's
 * access roads — see roads.ts's `idChainEntry()`. Idaho 511
 * (511.idaho.gov) is the road-conditions authority.
 */
export const boiseRegion: RegionConfig = {
  id: "boise",
  name: "Boise",
  subtitle: "Idaho · USA",
  shortTag: "ID",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Bogus Basin"],
  resorts: [
    { path: "/mountain/bogus-basin", label: "Bogus Basin" },
  ],
  mountains: [
    {
      id: "bogus-basin",
      name: "Bogus Basin",
      elevationM: 2394,
      lat: 43.76468,
      lng: -116.10329,
      blurb: "Nonprofit 501(c)(3) — the largest nonprofit ski area in the US · Powder Alliance / Freedom Pass, not on Epic, Ikon or Indy · base 5,790 ft / summit 7,852 ft / vertical 1,800 ft · opened Nov 29, 2025, full-mountain operation not until Feb 20, 2026 · ⚠️ CLOSED EARLY for the 2025-26 season on Mar 22, 2026 due to unseasonably warm weather. ⚠️ No dedicated avalanche-forecast center covers the Boise Front — the nearest Sawtooth Avalanche Center zones are 56-61 miles away.",
      websiteUrl: "https://bogusbasin.org/",
      snowReportUrl: "https://bogusbasin.org/mountain-report/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
      kids_lessons: true,
      beginner_friendly: true,
    },
  ],
  baseTowns: [
    {
      id: "boise",
      name: "Boise",
      lat: 43.61583,
      lng: -116.20167,
      radiusM: 12000,
      blurb: "Idaho's state capital, roughly 45 minutes' drive from Bogus Basin via Bogus Basin Road.",
      nearbyMountainIds: ["bogus-basin"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Bogus Basin", url: "https://bogusbasin.org/" },
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
