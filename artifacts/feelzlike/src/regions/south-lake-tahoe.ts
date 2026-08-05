import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * South Lake Tahoe · base town South Lake Tahoe, home to four resorts:
 *
 *   Heavenly                  → Epic Pass · straddles the CA/NV state
 *                               line, 2025-26 closing date NOT confirmed
 *   Kirkwood                  → Epic Pass · part of the Vail Tahoe trio,
 *                               2025-26 closing date NOT confirmed
 *   Sierra-at-Tahoe           → ⚠️ Ikon Pass affiliated, but the resort's
 *                               own hours-of-operation page states it is
 *                               "officially closed for the 2025/26
 *                               season" — see the honesty-gate note below.
 *   Homewood Mountain Resort  → Independent · reopened for 2025-26 after
 *                               being fully closed all of 2024-25 for
 *                               redevelopment
 *
 * Naming collision: the region id equals the base town name ("South Lake
 * Tahoe"), so the town id is disambiguated as south-lake-tahoe-town,
 * mirroring the Crested Butte/Telluride/park-city `-town` convention. None
 * of the four resort names collide with anything.
 *
 * ⚠️ HONESTY-GATE CASE — Sierra-at-Tahoe (highest-priority flag in this
 * pass): sierraattahoe.com/hours-of-operation/ states the resort is
 * "officially closed for the 2025/26 season," directly conflicting with
 * earlier-season opening plans (targeted ~Nov 28, 2025) and with active
 * Ikon Pass marketing describing 2025/26 participation. There is no
 * dedicated schema field or UI pattern anywhere in this codebase for a
 * mid-season/whole-season closure (checked: quebec-charlevoix.ts's Le
 * Massif entry, referenced as a possible precedent, in fact states "Both
 * resorts are operating normally" — no closed-resort pattern actually
 * exists to mirror). Season dates are therefore NOT populated for
 * Sierra-at-Tahoe (no `seasons` override exists per-mountain in this
 * schema; region-level `seasons: true` is a hemisphere flag, not a status
 * field), its base/summit elevations are omitted rather than guessed (the
 * commonly-cited ~6,640 ft / ~8,852 ft figures were not independently
 * confirmed by a first-party source), and the closure is stated plainly,
 * three times over, in: (1) this mountain's blurb below, (2) its
 * `api-server/src/routes/webcams.ts` entry comment, and (3) its
 * `RegionSources.tsx` "Resorts & lifts" detail text. This is a judgment
 * call — flagged prominently in the commit message and final report.
 *
 * First Pacific-timezone (America/Los_Angeles) region on this branch.
 * Weather is Open-Meteo with the existing OpenWeatherMap fallback.
 * Caltrans QuickMap publishes quickmap.dot.ca.gov (Highway 50) but
 * nothing is integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const southLakeTahoeRegion: RegionConfig = {
  id: "south-lake-tahoe",
  name: "South Lake Tahoe",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Heavenly", "Kirkwood", "Sierra-at-Tahoe", "Homewood Mountain Resort"],
  resorts: [
    { path: "/mountain/heavenly", label: "Heavenly" },
    { path: "/mountain/kirkwood", label: "Kirkwood" },
    { path: "/mountain/sierra-at-tahoe", label: "Sierra-at-Tahoe" },
    { path: "/mountain/homewood-mountain-resort", label: "Homewood Mountain Resort" },
  ],
  mountains: [
    {
      id: "heavenly",
      name: "Heavenly",
      elevationM: 1907,
      lat: 38.9353,
      lng: -119.9400,
      blurb: "Epic Pass · straddles the CA/NV state line above South Lake Tahoe · 2025-26 closing date not confirmed by the resort at time of writing",
      websiteUrl: "https://www.skiheavenly.com/",
      expert_only: true,
      backcountry_access: true,
      terrain_park: true,
    },
    {
      id: "kirkwood",
      name: "Kirkwood",
      elevationM: 2377,
      lat: 38.6840,
      lng: -120.0664,
      blurb: "Epic Pass · one of the highest resort base elevations in the Tahoe region, contributing to more reliable snowpack · 2025-26 closing date not confirmed",
      websiteUrl: "https://www.kirkwood.com/",
      snowReportUrl: "https://www.kirkwood.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
      expert_only: true,
      backcountry_access: true,
    },
    {
      id: "sierra-at-tahoe",
      name: "Sierra-at-Tahoe",
      // No elevationM — base/summit figures are commonly cited industry
      // estimates (~6,640 ft / ~8,852 ft) but were not independently
      // confirmed by a first-party source, and the resort's own season
      // status is itself unconfirmed/conflicting (see below). Omitted
      // rather than guessed, per this field being optional in the schema.
      lat: 38.8002,
      lng: -120.0806,
      // ⚠️ Season-status honesty gate: see the region-file header comment
      // above for full context. Kept front-and-centre in the blurb since
      // there is no dedicated "closed for season" schema field.
      blurb: "⚠️ Officially closed for the 2025/26 season per the resort's own hours-of-operation page — this directly conflicts with earlier-season opening plans and Ikon Pass marketing describing 2025/26 participation. Treat all conditions/season data for this resort as unavailable until independently re-verified.",
      websiteUrl: "https://sierraattahoe.com/",
      backcountry_access: true,
    },
    {
      id: "homewood-mountain-resort",
      name: "Homewood Mountain Resort",
      elevationM: 1899,
      lat: 39.0827,
      lng: -120.1755,
      blurb: "Independent · West Shore lake views · reopened for 2025-26 after a full closure all of 2024-25 for redevelopment and permitting delays",
      websiteUrl: "https://skihomewood.com/",
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "south-lake-tahoe-town",
      name: "South Lake Tahoe",
      lat: 38.9399,
      lng: -119.9772,
      radiusM: 15000,
      blurb: "Lakefront city on the California side of the state line, the main gateway to Heavenly, Kirkwood, Sierra-at-Tahoe and Homewood",
      nearbyMountainIds: ["heavenly", "kirkwood", "sierra-at-tahoe", "homewood-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit South Lake Tahoe", url: "https://tahoesouth.com/" },
    { category: "Resorts", label: "Heavenly", url: "https://www.skiheavenly.com/" },
    { category: "Resorts", label: "Kirkwood", url: "https://www.kirkwood.com/" },
    { category: "Resorts", label: "Sierra-at-Tahoe (closed for 2025/26 season)", url: "https://sierraattahoe.com/" },
    { category: "Resorts", label: "Homewood Mountain Resort", url: "https://skihomewood.com/" },
    { category: "Transport", label: "Caltrans QuickMap · Highway 50 conditions", url: "https://quickmap.dot.ca.gov/" },
    { category: "Safety", label: "Sierra Avalanche Center", url: "https://www.sierraavalanchecenter.org/" },
  ],
  roadsSource: {
    label: "Caltrans QuickMap · quickmap.dot.ca.gov",
    url: "https://quickmap.dot.ca.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
