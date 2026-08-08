import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Big Sky, MT · one resort, one base town (Big Sky):
 *
 *   Big Sky Resort → Ikon Pass (Full, no blackouts; Base/Session Pass has
 *                     2025-26 blackout dates) · confirmed live snow
 *                     report and webcams · official closing day Apr 26
 *                     2026 per resort (a third-party tracker's "Apr 12
 *                     daily-ops-end + Bonus Weekends" framing conflicts —
 *                     resort's own designated closing day treated as
 *                     authoritative, same pattern as Vermont/Wyoming's
 *                     conflicting-date handling).
 *
 * Yellowstone Club (private, members-only, ~15,200 acres in Big Sky) is
 * intentionally excluded — no public lift tickets or conditions data
 * exist for it, per task instructions and research doc.
 *
 * First Montana region. Avalanche: Gallatin National Forest Avalanche
 * Center (mtavalanche.com) covers Big Sky's backcountry — see
 * RegionSources.tsx. Chain law: Montana has NO statewide passenger-
 * vehicle chain law — only a narrow heavy-vehicle rule (MCA 61-9-436,
 * towing units ≥26,001 lbs GVW) activated by MDT at specific posted
 * mountain locations, which does not apply to visitor vehicles — same
 * narrow posture as Vermont, see roads.ts's `mtChainEntry()`.
 */
export const bigSkyRegion: RegionConfig = {
  id: "big-sky",
  name: "Big Sky",
  subtitle: "Montana · USA",
  shortTag: "MT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Big Sky Resort"],
  resorts: [
    { path: "/mountain/big-sky-resort", label: "Big Sky Resort" },
  ],
  mountains: [
    {
      id: "big-sky-resort",
      name: "Big Sky Resort",
      elevationM: 3403,
      lat: 45.2871,
      lng: -111.4010,
      blurb: "Ikon Pass (Full, no blackouts) · \"The Biggest Skiing in America\" · ~5,850 skiable acres across four connected mountains served by the 75-person Lone Peak Tram, 4,350 ft vertical · official 2025-26 closing day Apr 26 2026 per resort.",
      websiteUrl: "https://www.bigskyresort.com/",
      snowReportUrl: "https://www.bigskyresort.com/current-conditions",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "big-sky-town",
      name: "Big Sky",
      lat: 45.2849,
      lng: -111.3806,
      radiusM: 10000,
      blurb: "Base town for Big Sky Resort, midway between Bozeman and Yellowstone National Park's West Entrance",
      nearbyMountainIds: ["big-sky-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Big Sky", url: "https://www.bigskyresort.com/" },
    { category: "Resorts", label: "Big Sky Resort", url: "https://www.bigskyresort.com/" },
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
