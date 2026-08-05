import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Bozeman area, MT · one resort, one base town (Bozeman):
 *
 *   Bridger Bowl → independent nonprofit (not Ikon/Epic/Indy, dropped
 *                  Powder Alliance after 2020-21) · confirmed live snow
 *                  report and webcams · ⚠️ CLOSED EARLY for the 2025-26
 *                  season on March 22, 2026 due to low snowfall (only
 *                  138" total, one of the earliest closures in the
 *                  resort's history) — this is a season-specific early
 *                  closure, NOT a permanent shutdown; the resort is
 *                  expected to reopen for the 2026-27 season on its
 *                  normal schedule. Flagged in the mountain blurb and
 *                  the webcams.ts/roads.ts comments rather than marked
 *                  as a defunct resort (same honesty-gate approach used
 *                  for Sierra-at-Tahoe/Magic Mountain in prior states,
 *                  adapted here for a temporary early closure rather
 *                  than a multi-season shutdown).
 *
 * Avalanche: Gallatin National Forest Avalanche Center (mtavalanche.com)
 * covers Bridger Bowl's backcountry — see RegionSources.tsx. Chain law:
 * Montana has NO statewide passenger-vehicle chain law — only a narrow
 * heavy-vehicle rule (MCA 61-9-436) — see roads.ts's `mtChainEntry()`.
 */
export const bozemanBridgerBowlRegion: RegionConfig = {
  id: "bozeman-bridger-bowl",
  name: "Bozeman",
  subtitle: "Montana · USA",
  shortTag: "MT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Bridger Bowl"],
  resorts: [
    { path: "/mountain/bridger-bowl", label: "Bridger Bowl" },
  ],
  mountains: [
    {
      id: "bridger-bowl",
      name: "Bridger Bowl",
      elevationM: 2682,
      lat: 45.8266,
      lng: -110.8988,
      blurb: "Independent nonprofit ski area (not Ikon/Epic/Indy) · Schlasman's/Ridge expert terrain requires an avalanche transceiver · ⚠️ closed early for the 2025-26 season on Mar 22 2026 due to low snowfall (138\" season total) — a season-specific early closure, expected back to its normal schedule for 2026-27.",
      websiteUrl: "https://bridgerbowl.com/",
      snowReportUrl: "https://bridgerbowl.com/weather/snow-report/",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "bozeman",
      name: "Bozeman",
      lat: 45.6770,
      lng: -111.0429,
      radiusM: 10000,
      blurb: "University town and gateway to Bridger Bowl, about 16 miles north",
      nearbyMountainIds: ["bridger-bowl"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Bozeman", url: "https://bridgerbowl.com/" },
    { category: "Resorts", label: "Bridger Bowl", url: "https://bridgerbowl.com/" },
    { category: "Avalanche", label: "Gallatin National Forest Avalanche Center", url: "https://www.mtavalanche.com/" },
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
