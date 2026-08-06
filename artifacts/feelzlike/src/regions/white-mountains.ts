import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * White Mountains / North Conway, NH · three close but differently-affiliated
 * resorts. MWAC's daily Presidential Range forecast is relevant to nearby
 * Pinkham Notch / Tuckerman backcountry, not ordinary in-bounds skiing.
 */
export const whiteMountainsRegion: RegionConfig = {
  id: "white-mountains", name: "White Mountains", subtitle: "New Hampshire · USA", shortTag: "NH",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Cranmore Mountain", "Wildcat Mountain", "Attitash Mountain Resort"],
  resorts: [
    { path: "/mountain/cranmore-mountain", label: "Cranmore Mountain" },
    { path: "/mountain/wildcat-mountain", label: "Wildcat Mountain" },
    { path: "/mountain/attitash-mountain-resort", label: "Attitash Mountain Resort" },
  ],
  mountains: [
    { id: "cranmore-mountain", name: "Cranmore Mountain", elevationM: 518, lat: 44.0550, lng: -71.1090, blurb: "Ikon Pass Bonus Mountain (Full Pass only, 2 days with blackouts) · White Mountain Superpass · 800 ft base / 1,700 ft summit / 1,200 ft vertical · confirmed 2025-26 season Nov 28-29, 2025 - Apr 5, 2026.", websiteUrl: "https://cranmore.com/", snowReportUrl: "https://cranmore.com/snow-report", terrain_park: true, kids_lessons: true, beginner_friendly: true },
    { id: "wildcat-mountain", name: "Wildcat Mountain", elevationM: 1238, lat: 44.2590, lng: -71.2370, blurb: "Epic Pass · Vail Resorts-owned · 1,933 ft base / ~4,062 ft summit / ~2,100 ft vertical, directly across Pinkham Notch from Mount Washington · confirmed 2025-26 season Nov 26, 2025 - Apr 12, 2026 · ⚠️ no distinct live official webcam URL confirmed.", websiteUrl: "https://www.skiwildcat.com/", snowReportUrl: "https://www.skiwildcat.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx", expert_only: true, terrain_park: true, kids_lessons: true },
    { id: "attitash-mountain-resort", name: "Attitash Mountain Resort", elevationM: 716, lat: 44.0820, lng: -71.2290, blurb: "Epic Pass · Vail Resorts-owned · 600 ft base / 2,350 ft summit / 1,750 ft vertical · confirmed 2025-26 season Dec 6, 2025 - Apr 5, 2026 · ⚠️ no distinct first-party snow-report or live webcam URL confirmed.", websiteUrl: "https://www.attitash.com/", snowReportUrl: "https://www.attitash.com/the-mountain/about-the-mountain/mountain-info.aspx", terrain_park: true, kids_lessons: true, beginner_friendly: true },
  ],
  baseTowns: [{ id: "north-conway", name: "North Conway", lat: 44.0537, lng: -71.1289, radiusM: 10000, blurb: "Mount Washington Valley base town for Cranmore, Attitash and Wildcat via NH-16 / Route 302.", nearbyMountainIds: ["cranmore-mountain", "wildcat-mountain", "attitash-mountain-resort"] }],
  footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Cranmore Mountain", url: "https://cranmore.com/" }, { category: "Avalanche", label: "Mount Washington Avalanche Center", url: "https://www.mountwashingtonavalanchecenter.org/" }, { category: "Transport", label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index" }],
  roadsSource: { label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
