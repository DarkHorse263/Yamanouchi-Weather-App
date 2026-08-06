import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Carrabassett Valley, Maine · Sugarloaf's high, above-treeline Boyne destination. Maine has no avalanche authority. */
export const carrabassettValleyRegion: RegionConfig = {
  id: "carrabassett-valley", name: "Carrabassett Valley", subtitle: "Maine · USA", shortTag: "ME", brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Sugarloaf"], resorts: [{ path: "/mountain/sugarloaf", label: "Sugarloaf" }],
  mountains: [{ id: "sugarloaf", name: "Sugarloaf", elevationM: 1291, lat: 45.031, lng: -70.314, blurb: "Boyne Resorts-owned · Ikon Pass (7 unrestricted Full / 5 Base days with blackouts) · Boyne New England Pass · 1,417 ft base / 4,237 ft summit / 2,820 ft vertical · Nov 21, 2025 - Apr 26, 2026 · Maine's tallest ski mountain and East's only lift-served above-treeline skiing. ⚠️ webcam sub-URL unconfirmed; use mountain report.", websiteUrl: "https://www.sugarloaf.com/", snowReportUrl: "https://www.sugarloaf.com/mountain-report", expert_only: true, terrain_park: true, kids_lessons: true }],
  baseTowns: [{ id: "carrabassett-valley-town", name: "Carrabassett Valley", lat: 45.085, lng: -70.265, radiusM: 15000, blurb: "High-elevation western Maine base town for Sugarloaf.", nearbyMountainIds: ["sugarloaf"] }], footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Sugarloaf mountain report", url: "https://www.sugarloaf.com/mountain-report" }, { category: "Transport", label: "MaineDOT · 511 Maine", url: "https://511maine.gov/" }],
  roadsSource: { label: "MaineDOT · 511 Maine", url: "https://511maine.gov/", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
