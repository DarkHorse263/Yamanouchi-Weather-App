import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Lakes Region, NH · Gunstock is Belknap County-owned rather than a
 * major-pass property. Its 2022 commission/staff resignation turmoil is
 * historical context, not a current operating interruption. */
export const lakesRegionRegion: RegionConfig = {
  id: "lakes-region", name: "Lakes Region", subtitle: "New Hampshire · USA", shortTag: "NH",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north", summaryMountains: ["Gunstock Mountain Resort"],
  resorts: [{ path: "/mountain/gunstock-mountain-resort", label: "Gunstock Mountain Resort" }],
  mountains: [{ id: "gunstock-mountain-resort", name: "Gunstock Mountain Resort", elevationM: 684, lat: 43.5270, lng: -71.3690, blurb: "Belknap County-owned, no Epic/Ikon/Indy affiliation · 921 ft base / 2,245 ft summit / ~1,340 ft vertical · confirmed 2025-26 season Dec 5, 2025 - Apr 30, 2026 · historical 2022 county-governance turmoil prompted commission and staff resignations, but operations have continued normally since.", websiteUrl: "https://www.gunstock.com/", snowReportUrl: "https://www.gunstock.com/winter/snow-report/", terrain_park: true, kids_lessons: true, beginner_friendly: true }],
  baseTowns: [{ id: "gilford", name: "Gilford", lat: 43.5480, lng: -71.4060, radiusM: 10000, blurb: "Lake Winnipesaukee-side base town for Gunstock Mountain Resort.", nearbyMountainIds: ["gunstock-mountain-resort"] }],
  footer: "v0.3 · feelzlike", tourismLinks: [{ category: "Resorts", label: "Gunstock Mountain Resort", url: "https://www.gunstock.com/" }, { category: "Avalanche", label: "Mount Washington Avalanche Center", url: "https://www.mountwashingtonavalanchecenter.org/" }, { category: "Transport", label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index" }],
  roadsSource: { label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
