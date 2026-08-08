import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Harbor Springs / Petoskey area, MI · three nearby northern-Lower-Peninsula resorts.
 * Boyne Mountain and The Highlands are Boyne-owned Ikon destinations; Nub's Nob is an
 * independent Indy Pass partner with holiday blackout dates (unusual for Indy). Michigan
 * has no avalanche authority because this low-relief terrain has no meaningful avalanche
 * hazard; Mi Drive is the live road authority. All locations, including Mt. Bohemia in the
 * separate Keweenaw region, use official Eastern Time / America/Detroit.
 */
export const harborSpringsRegion: RegionConfig = {
  id: "harbor-springs", name: "Harbor Springs", subtitle: "Michigan · USA", shortTag: "MI",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north",
  summaryMountains: ["Boyne Mountain", "The Highlands", "Nub's Nob"],
  resorts: [
    { path: "/mountain/boyne-mountain", label: "Boyne Mountain" },
    { path: "/mountain/boyne-highlands", label: "The Highlands" },
    { path: "/mountain/nubs-nob", label: "Nub's Nob" },
  ],
  mountains: [
    { id: "boyne-mountain", name: "Boyne Mountain", elevationM: 341, lat: 45.1639, lng: -84.9308, blurb: "Boyne-owned · Ikon Pass (7 days, no blackouts) / Ikon Base (5 days; official Boyne pages publish slightly inconsistent holiday blackout windows) · Boyne Passport access · 500 ft vertical · 2025-26 closed May 25, the resort's latest closing on record.", websiteUrl: "https://www.boynemountain.com/", snowReportUrl: "https://www.boynemountain.com/mountain-report", terrain_park: true, beginner_friendly: true, kids_lessons: true },
    { id: "boyne-highlands", name: "The Highlands", elevationM: 404, lat: 45.4717, lng: -84.9233, blurb: "Boyne-owned · Ikon Pass / Ikon Base and Boyne Passport · 1,325 ft summit / 552 ft vertical, Michigan's highest vertical terrain in the Lower Peninsula · official mountain-report page confirmed; separate official live-cam URL not confirmed.", websiteUrl: "https://www.highlandsharborsprings.com/", snowReportUrl: "https://www.highlandsharborsprings.com/mountain-report", terrain_park: true, beginner_friendly: true, kids_lessons: true },
    { id: "nubs-nob", name: "Nub's Nob", elevationM: 408, lat: 45.4623, lng: -84.9420, blurb: "Independently owned (Fisher family) · Indy Pass partner with an unusual holiday blackout calendar (unlike most Indy partners) · 1,338 ft summit / 427 ft vertical · official webcam page exists, but current live-feed status was not independently verified.", websiteUrl: "https://www.nubsnob.com/", snowReportUrl: "https://www.nubsnob.com/conditions-tables/", terrain_park: true, beginner_friendly: true, kids_lessons: true },
  ],
  baseTowns: [{ id: "harbor-springs-town", name: "Harbor Springs", lat: 45.4317, lng: -84.9889, radiusM: 18000, blurb: "Little Traverse Bay base town for Boyne Mountain, The Highlands, and Nub's Nob.", nearbyMountainIds: ["boyne-mountain", "boyne-highlands", "nubs-nob"] }],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Resorts", label: "Boyne Mountain", url: "https://www.boynemountain.com/" }, { category: "Resorts", label: "The Highlands", url: "https://www.highlandsharborsprings.com/" }, { category: "Resorts", label: "Nub's Nob", url: "https://www.nubsnob.com/" },
    { category: "Transport", label: "MDOT · Mi Drive road conditions", url: "https://www.michigan.gov/drive" },
  ], roadsSource: { label: "MDOT · Mi Drive", url: "https://www.michigan.gov/drive", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
