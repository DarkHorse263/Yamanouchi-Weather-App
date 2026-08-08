import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Jackson Hole, WY · two resorts, two base towns (Jackson, Teton Village):
 *
 *   Jackson Hole Mountain Resort → Ikon Pass (Full only, excluded from
 *                                   Base) · reservation system required
 *                                   for Ikon/Mountain Collective 2025-26 ·
 *                                   no confirmed dedicated webcam URL —
 *                                   flagged unverified, see webcams.ts
 *   Snow King Mountain            → Indy Pass + Powder Alliance · webcams
 *                                    confirmed live at
 *                                    snowkingmountain.com/mountain/webcams/
 *                                    · official closing Mar 22 2026 per
 *                                    resort
 *
 * Naming collision: the resort "Jackson Hole Mountain Resort" is
 * disambiguated from the town "Jackson" by its own multi-word official
 * name (no `-resort` suffix needed, mirroring "Stowe Mountain Resort" in
 * the Vermont pass). Snow King Mountain has no collision either. The town
 * "Teton Village" is the resort's own base village and kept as a
 * distinct town id (teton-village) alongside "jackson" per the task's
 * base-town framing.
 *
 * First Wyoming region, first America/Denver USA timezone reused (shared
 * with Colorado/Utah). WY_CHAIN_LAW note: Wyoming HAS a real, currently
 * postable dynamic chain law (WY Statute §31-5-956) — Level 1 (chains OR
 * snow tires OR AWD/4WD) / Level 2 (chains OR AWD/4WD with M+S/all-weather
 * tires), posted via WYDOT variable message sign, NOT a fixed calendar
 * rule. Teton Pass (WY-22), the main access road between Jackson and
 * Teton Valley/Grand Targhee, is explicitly named by WYDOT as a frequent
 * activation corridor. This is modeled closest on Utah's sign-activated
 * `utChainEntry()` Cottonwood Class 3 pattern (not-required baseline,
 * real rule text in the note) rather than Colorado's fixed-calendar
 * must-carry assertion — see roads.ts's `wyChainEntry()` for the full
 * framing rationale.
 *
 * Avalanche: Bridger-Teton Avalanche Center (bridgertetonavalanchecenter.org)
 * covers this region under its "Tetons" zone — see RegionSources.tsx.
 */
export const jacksonHoleRegion: RegionConfig = {
  id: "jackson-hole",
  name: "Jackson Hole",
  subtitle: "Wyoming · USA",
  shortTag: "WY",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Jackson Hole Mountain Resort", "Snow King Mountain"],
  resorts: [
    { path: "/mountain/jackson-hole-mtn-resort", label: "Jackson Hole Mountain Resort" },
    { path: "/mountain/snow-king-mountain", label: "Snow King Mountain" },
  ],
  mountains: [
    {
      id: "jackson-hole-mtn-resort",
      name: "Jackson Hole Mountain Resort",
      elevationM: 1924,
      lat: 43.5875,
      lng: -110.8279,
      blurb: "Ikon Pass (Full only, excluded from Base) · legendary steep terrain off the Aerial Tram, 4,139 ft vertical · reservation system required for Ikon/Mountain Collective 2025-26 · ⚠️ no confirmed dedicated webcam URL found in research, treat as unverified.",
      websiteUrl: "https://www.jacksonhole.com/",
      snowReportUrl: "https://www.jacksonhole.com/snow-report",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
    {
      id: "snow-king-mountain",
      name: "Snow King Mountain",
      elevationM: 1901,
      lat: 43.4783,
      lng: -110.7581,
      blurb: "Indy Pass + Powder Alliance · Wyoming's original ski resort, in-town in Jackson with night skiing · official 2025-26 closing date Mar 22 2026 per resort (a Apr 5 estimate from a third-party tracker conflicts — resort's own date treated as authoritative).",
      websiteUrl: "https://snowkingmountain.com/",
      snowReportUrl: "https://snowkingmountain.com/mountain/conditions/",
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "jackson",
      name: "Jackson",
      lat: 43.4799,
      lng: -110.7624,
      radiusM: 10000,
      blurb: "Historic town square and main gateway to the valley, home to Snow King Mountain and a short drive from Jackson Hole Mountain Resort",
      nearbyMountainIds: ["snow-king-mountain", "jackson-hole-mtn-resort"],
    },
    {
      id: "teton-village",
      name: "Teton Village",
      lat: 43.5881,
      lng: -110.8273,
      radiusM: 8000,
      blurb: "Base village at the foot of Jackson Hole Mountain Resort's Aerial Tram",
      nearbyMountainIds: ["jackson-hole-mtn-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Jackson Hole Travel & Tourism Board", url: "https://www.jacksonhole.com/" },
    { category: "Resorts", label: "Jackson Hole Mountain Resort", url: "https://www.jacksonhole.com/" },
    { category: "Resorts", label: "Snow King Mountain", url: "https://snowkingmountain.com/" },
    { category: "Avalanche", label: "Bridger-Teton Avalanche Center (Tetons zone)", url: "https://bridgertetonavalanchecenter.org/" },
    { category: "Transport", label: "WYDOT · wyoroad.info road conditions", url: "https://wyoroad.info/" },
  ],
  roadsSource: {
    label: "WYDOT · wyoroad.info",
    url: "https://wyoroad.info/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
