import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Newry / Bethel, Maine · Sunday River's eight-peak Boyne destination. Maine has no avalanche authority. */
export const newryBethelRegion: RegionConfig = {
  id: "newry-bethel", name: "Newry / Bethel", subtitle: "Maine · USA", shortTag: "ME", brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Sunday River"], resorts: [{ path: "/mountain/sunday-river", label: "Sunday River" }],
  mountains: [{ id: "sunday-river", name: "Sunday River", elevationM: 957, lat: 44.473, lng: -70.856, blurb: "Boyne Resorts-owned · Ikon Pass (7 unrestricted Full / 5 Base days with blackouts) · Boyne New England Pass · 800 ft base / 3,140 ft summit / 2,340 ft vertical · Nov 12-13, 2025 - Apr 18-19, 2026 · ⚠️ dedicated webcam sub-URL returned 404; use the official mountain-report page.", websiteUrl: "https://www.sundayriver.com/", snowReportUrl: "https://www.sundayriver.com/mountain-report", terrain_park: true, kids_lessons: true, beginner_friendly: true }],
  baseTowns: [{ id: "newry", name: "Newry", lat: 44.499, lng: -70.800, radiusM: 15000, blurb: "Western Maine base town for Sunday River's eight peaks.", nearbyMountainIds: ["sunday-river"] }], footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Sunday River mountain report", url: "https://www.sundayriver.com/mountain-report" }, { category: "Transport", label: "MaineDOT · 511 Maine", url: "https://www.newengland511.org/region/Maine" }], roadsSource: { label: "MaineDOT · 511 Maine", url: "https://www.newengland511.org/region/Maine", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
