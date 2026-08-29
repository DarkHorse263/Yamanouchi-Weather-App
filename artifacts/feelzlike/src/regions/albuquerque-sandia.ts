import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Albuquerque area, NM · one resort, one base town (Albuquerque):
 *
 *   Sandia Peak Ski Area → Mountain Capital Partners "Power Pass" family
 *                           (unlimited Core tier w/ Sipapu + Pajarito) ·
 *                           NOT on Epic/Ikon/Indy/Mountain Collective ·
 *                           ⚠️ CRITICAL OPERATIONAL FLAG (verify-status
 *                           resort): multi-year full closures 2021-22 &
 *                           2022-23, reopened 2024 under new MCP
 *                           ownership (Abruzzo family retains the
 *                           separate Tramway/TEN 3 restaurant, not part
 *                           of the ski area), continued vulnerability to
 *                           mid-season temporary closures (Feb 2025) ·
 *                           DID operate for 2025-26 per a Jan 11 2026
 *                           KRQE report, but with a delayed, "lift-
 *                           related complication" start, and the exact
 *                           2025-26 closing date / total operating days
 *                           are NOT confirmed by any dated source found
 *                           in research — flagged as an unresolved data
 *                           gap · no confirmed live webcam URL found ·
 *                           no precise base/summit elevation in feet
 *                           from a primary source confirmed (only a
 *                           ~1,700 ft vertical-drop figure and a
 *                           skiresort.info metric-derived estimate of
 *                           ~8,629 ft / ~10,302 ft).
 *
 * No naming collision: resort "sandia-peak" and town "albuquerque" are
 * already distinct ids. Region id "albuquerque-sandia" chosen (rather
 * than plain "albuquerque") to make the Sandia Peak pairing explicit in
 * the URL/id, consistent with the task's region-id plan.
 *
 * America/Denver timezone (shared with all other New Mexico regions).
 * New Mexico has NO statewide chain law — see roads.ts's
 * `nmChainEntry()`.
 *
 * Avalanche: NOT covered by the Taos Avalanche Center's forecast area —
 * per the research doc, no dedicated forecasting center exists for the
 * Albuquerque/Sandia area; in-bounds terrain risk is minimal given
 * active ski patrol, and backcountry users should rely on general NWS
 * guidance only. This gap is called out explicitly in RegionSources.tsx.
 *
 * Honesty-gate note: elevationM below uses the skiresort.info estimate
 * (~2,630 m / ~8,629 ft base — treated as approximate, not a confirmed
 * primary-source figure) because sandia.ski itself does not publish a
 * clear base/summit figure that could be located in research. This is
 * flagged inline in the mountain blurb as well.
 */
export const albuquerqueSandiaRegion: RegionConfig = {
  id: "albuquerque-sandia",
  name: "Albuquerque",
  subtitle: "New Mexico · USA",
  shortTag: "NM",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Sandia Peak Ski Area"],
  resorts: [
    { path: "/mountain/sandia-peak", label: "Sandia Peak Ski Area" },
  ],
  mountains: [
    {
      id: "sandia-peak",
      name: "Sandia Peak Ski Area",
      elevationM: 2630,
      baseElevationM: 2630,
      lat: 35.2062,
      lng: -106.4475,
      blurb: "Mountain Capital Partners \"Power Pass\" (Core tier, unlimited w/ Sipapu + Pajarito) · not on Epic/Ikon/Indy/Mountain Collective · ⚠️ VERIFY-STATUS RESORT: multi-year full closures 2021-23, reopened 2024 under MCP ownership, DID operate 2025-26 per a Jan 2026 KRQE report but with a delayed \"lift-related complication\" start — exact 2025-26 closing date and total operating days are unconfirmed by any dated source, treat as an open data gap · no confirmed live webcam found · base/summit elevation approximate (~8,629 ft / ~10,302 ft per skiresort.info, ~1,700 ft vertical per secondary sources) — no precise primary-source figure located.",
      websiteUrl: "https://www.sandia.ski/",
      snowReportUrl: "https://www.sandia.ski/snow-report",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "albuquerque",
      name: "Albuquerque",
      lat: 35.0844,
      lng: -106.6504,
      radiusM: 15000,
      blurb: "New Mexico's largest city, roughly 30-45 minutes' drive from Sandia Peak Ski Area",
      nearbyMountainIds: ["sandia-peak"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Albuquerque", url: "https://www.sandia.ski/" },
    { category: "Resorts", label: "Sandia Peak Ski Area", url: "https://www.sandia.ski/" },
    { category: "Avalanche", label: "Taos Avalanche Center (regional only, does not cover Albuquerque/Sandia Peak)", url: "https://taosavalanchecenter.org/" },
    { category: "Transport", label: "NMDOT · nmroads.com road conditions", url: "https://www.nmroads.com/mapIndex.html" },
  ],
  roadsSource: {
    label: "NMDOT · nmroads.com",
    url: "https://www.nmroads.com/mapIndex.html",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
