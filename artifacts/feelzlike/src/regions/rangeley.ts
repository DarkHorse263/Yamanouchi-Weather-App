import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/** Rangeley, Maine · Saddleback's resolved five-year closure is an East-coast turnaround story. Maine has no avalanche authority. */
export const rangeleyRegion: RegionConfig = {
  id: "rangeley", name: "Rangeley", subtitle: "Maine · USA", shortTag: "ME", brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Saddleback Mountain"], resorts: [{ path: "/mountain/saddleback-mountain", label: "Saddleback Mountain" }],
  mountains: [{ id: "saddleback-mountain", name: "Saddleback Mountain", elevationM: 1256, lat: 44.936, lng: -70.510, blurb: "Arctaris-owned independent · Indy Pass (no blackouts) · 2,460 ft base / 4,120 ft summit / 2,000 ft vertical · opened Dec 5, 2025; ⚠️ exact 2025-26 closing date unconfirmed. Reopened Dec 2020 after a five-year closure and named SKI Magazine readers' #1 East resort for 2025 — a verified turnaround story. ⚠️ live stream URLs are not confirmed though official webcam page exists.", websiteUrl: "https://www.saddlebackmaine.com/", snowReportUrl: "https://www.saddlebackmaine.com/mountain-report/", expert_only: true, terrain_park: true, kids_lessons: true }],
  baseTowns: [{ id: "rangeley", name: "Rangeley", lat: 44.966, lng: -70.644, radiusM: 25000, blurb: "Rangeley Lakes gateway to Saddleback Mountain.", nearbyMountainIds: ["saddleback-mountain"] }], footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Saddleback mountain report", url: "https://www.saddlebackmaine.com/mountain-report/" }, { category: "Transport", label: "MaineDOT · 511 Maine", url: "https://511maine.gov/" }], roadsSource: { label: "MaineDOT · 511 Maine", url: "https://511maine.gov/", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
