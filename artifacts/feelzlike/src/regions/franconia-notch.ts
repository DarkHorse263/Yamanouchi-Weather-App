import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Franconia Notch, NH · Cannon (state-owned/Indy), independent Bretton
 * Woods, and Boyne/Ikon Loon. Cannon, Bretton Woods, Cranmore and Waterville
 * Valley share the regional White Mountain Superpass. */
export const franconiaNotchRegion: RegionConfig = {
  id: "franconia-notch", name: "Franconia Notch", subtitle: "New Hampshire · USA", shortTag: "NH",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Cannon Mountain", "Bretton Woods", "Loon Mountain"],
  resorts: [{ path: "/mountain/cannon-mountain", label: "Cannon Mountain" }, { path: "/mountain/bretton-woods", label: "Bretton Woods" }, { path: "/mountain/loon-mountain", label: "Loon Mountain" }],
  mountains: [
    { id: "cannon-mountain", name: "Cannon Mountain", elevationM: 1244, lat: 44.1569, lng: -71.6980, blurb: "Indy Pass · the United States' only state-owned ski area (NH Division of Parks & Recreation) · White Mountain Superpass · 1,883 ft base / 4,080 ft summit / 2,180 ft vertical · confirmed 2025-26 season Nov 22, 2025 - Apr 12, 2026.", websiteUrl: "https://www.cannonmt.com/", snowReportUrl: "https://www.cannonmt.com/", expert_only: true, terrain_park: true, kids_lessons: true },
    { id: "bretton-woods", name: "Bretton Woods", elevationM: 945, lat: 44.2600, lng: -71.4410, blurb: "Independent, Omni Hotels & Resorts-owned · anchors the White Mountain Superpass · 1,600 ft base / 3,100 ft summit / 1,500 ft vertical · first NH area to open in 2025-26 (Nov 15, 2025), closed by Apr 12, 2026.", websiteUrl: "https://www.brettonwoods.com/", snowReportUrl: "https://www.brettonwoods.com/snow-trail-report/", terrain_park: true, kids_lessons: true, beginner_friendly: true },
    { id: "loon-mountain", name: "Loon Mountain", elevationM: 930, lat: 44.0360, lng: -71.6220, blurb: "Boyne Resorts-owned · Ikon Pass (7 days Full / 5 days Base, Base blackouts) · 860 ft base / 3,050 ft summit / 2,100-2,190 ft vertical · confirmed 2025-26 season Nov 21, 2025 - approx. Apr 19, 2026.", websiteUrl: "https://www.loonmtn.com/", snowReportUrl: "https://www.loonmtn.com/mountain-stats", terrain_park: true, kids_lessons: true, beginner_friendly: true },
  ],
  baseTowns: [{ id: "franconia", name: "Franconia", lat: 44.2270, lng: -71.7470, radiusM: 10000, blurb: "Franconia Notch gateway town for Cannon Mountain.", nearbyMountainIds: ["cannon-mountain"] }, { id: "bretton-woods-town", name: "Bretton Woods", lat: 44.2580, lng: -71.4410, radiusM: 10000, blurb: "On-mountain base village for Bretton Woods; Loon is reached via the I-93 / Kancamagus corridor.", nearbyMountainIds: ["bretton-woods", "loon-mountain"] }],
  footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Cannon Mountain", url: "https://www.cannonmt.com/" }, { category: "Avalanche", label: "Mount Washington Avalanche Center", url: "https://www.mountwashingtonavalanchecenter.org/" }, { category: "Transport", label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index" }],
  roadsSource: { label: "NHDOT · New England 511", url: "https://newengland511.org/Home/Index", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
