import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Keweenaw Peninsula, MI · Mt. Bohemia near Mohawk/Lac La Belle. Official time is
 * America/Detroit (Eastern), despite the western-UP setting; do not use America/Chicago.
 * Its expert-only, zero-grooming, zero-snowmaking model is a real differentiator, not a
 * missing data field. No official live webcam was confirmed. Michigan has no avalanche
 * authority because its ski terrain has no meaningful avalanche hazard.
 */
export const keweenawPeninsulaRegion: RegionConfig = {
  id: "keweenaw-peninsula", name: "Keweenaw Peninsula", subtitle: "Michigan · USA", shortTag: "MI",
  brand: { wordmarkUrl: wordmark }, seasons: true, hemisphere: "north", summaryMountains: ["Mt. Bohemia"],
  resorts: [{ path: "/mountain/mt-bohemia", label: "Mt. Bohemia" }],
  mountains: [{ id: "mt-bohemia", name: "Mt. Bohemia", elevationM: 457, lat: 47.4080, lng: -88.1010, blurb: "Independent · no Epic/Ikon/Indy/Mountain Collective affiliation · expert-focused, genuinely zero grooming and zero snowmaking (no beginner terrain) · marketed 900 ft vertical, though independently reported figures are ~823-837 ft · no confirmed official live webcam.", websiteUrl: "https://www.mtbohemia.com/", snowReportUrl: "https://www.mtbohemia.com/current-conditions/", expert_only: true, backcountry_access: true }],
  baseTowns: [{ id: "mohawk", name: "Mohawk", lat: 47.3308, lng: -88.3743, radiusM: 25000, blurb: "Keweenaw Peninsula base town for Mt. Bohemia at Lac La Belle; officially Eastern Time despite the western Upper Peninsula location.", nearbyMountainIds: ["mt-bohemia"] }],
  footer: "v0.3 · feelzlike",
  tourismLinks: [{ category: "Resorts", label: "Mt. Bohemia", url: "https://www.mtbohemia.com/" }, { category: "Transport", label: "MDOT · Mi Drive road conditions", url: "https://www.michigan.gov/drive" }],
  roadsSource: { label: "MDOT · Mi Drive", url: "https://www.michigan.gov/drive", dataAvailable: false }, weatherSource: { label: "Open-Meteo" },
};
