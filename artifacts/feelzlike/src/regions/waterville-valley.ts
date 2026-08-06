import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Waterville Valley, NH · Indy Pass resort and White Mountain Superpass
 * member. Its town id is suffixed to avoid colliding with the region id. */
export const watervilleValleyRegion: RegionConfig = {
  id: "waterville-valley", name: "Waterville Valley", subtitle: "New Hampshire · USA", shortTag: "NH",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north", summaryMountains: ["Waterville Valley Resort"],
  resorts: [{ path: "/mountain/waterville-valley-resort", label: "Waterville Valley Resort" }],
  mountains: [{ id: "waterville-valley-resort", name: "Waterville Valley Resort", elevationM: 1170, lat: 43.9500, lng: -71.5140, blurb: "Indy Pass (no blackouts on Indy Base) · White Mountain Superpass · 1,820 ft base / 3,840 ft summit / 2,020 ft vertical · confirmed 2025-26 opening weekend Nov 28-30, 2025 · ⚠️ season-closing date and standalone snow-report URL not confirmed.", websiteUrl: "https://www.waterville.com/", snowReportUrl: "https://www.waterville.com/", terrain_park: true, kids_lessons: true, beginner_friendly: true }],
  baseTowns: [{ id: "waterville-valley-town", name: "Waterville Valley", lat: 43.9500, lng: -71.4990, radiusM: 10000, blurb: "Compact mountain village at the resort base, reached from I-93 via NH-49.", nearbyMountainIds: ["waterville-valley-resort"] }],
  footer: "v0.3 · feelzlike", tourismLinks: [{ category: "Resorts", label: "Waterville Valley Resort", url: "https://www.waterville.com/" }, { category: "Avalanche", label: "Mount Washington Avalanche Center", url: "https://www.mountwashingtonavalanchecenter.org/" }, { category: "Transport", label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index" }],
  roadsSource: { label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
