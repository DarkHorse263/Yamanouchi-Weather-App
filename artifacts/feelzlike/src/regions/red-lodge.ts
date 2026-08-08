import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Red Lodge, MT · one resort, one base town (Red Lodge):
 *
 *   Red Lodge Mountain → Indy Pass member · confirmed live snow report
 *                         and webcams · 2025-26 closing date NOT
 *                         confirmed by a dated primary source — the
 *                         resort's own Mountain Info page states only a
 *                         general pattern ("through the second Sunday
 *                         in April"), and a third-party tracker
 *                         estimates Apr 13 2026 — flagged as
 *                         approximate rather than presented as a firm
 *                         date.
 *
 * ⚠️ Avalanche coverage gap: Gallatin National Forest Avalanche
 * Center's own stated coverage (Bridger, Gallatin, Madison Ranges;
 * Lionhead; Cooke City) does NOT explicitly extend to the Beartooth
 * Mountains or Red Lodge, and no dedicated backcountry avalanche
 * forecast center for this area was identified in research. This is a
 * genuine coverage gap, same honesty pattern as California's Big
 * Bear/Mt. Shasta gap — no avalanche-bulletin link is offered for Red
 * Lodge rather than pointing at GNFAC's bulletin, which doesn't
 * actually cover this area. In-bounds resort skiing is unaffected
 * (ski-patrol-managed mitigation, not a backcountry-forecast concern).
 *
 * ⚠️ Seasonal access note: the scenic Beartooth Highway (US-212) toward
 * Yellowstone/Cooke City is CLOSED in winter (typically mid-October
 * through late May/early June) — winter access to Red Lodge Mountain is
 * via US-212 from Billings, then Ski Run Road only.
 *
 * Chain law: Montana has NO statewide passenger-vehicle chain law —
 * only a narrow heavy-vehicle rule (MCA 61-9-436) — see roads.ts's
 * `mtChainEntry()`.
 */
export const redLodgeRegion: RegionConfig = {
  id: "red-lodge",
  name: "Red Lodge",
  subtitle: "Montana · USA",
  shortTag: "MT",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Red Lodge Mountain"],
  resorts: [
    { path: "/mountain/red-lodge-mountain", label: "Red Lodge Mountain" },
  ],
  mountains: [
    {
      id: "red-lodge-mountain",
      name: "Red Lodge Mountain",
      elevationM: 2870,
      lat: 45.1699,
      lng: -109.4137,
      blurb: "Indy Pass member · ⚠️ 2025-26 closing date not confirmed by a dated primary source, resort states only a general \"through the second Sunday in April\" pattern · ⚠️ no dedicated backcountry avalanche forecast authority covers the Beartooth/Red Lodge area (coverage gap) · winter access via US-212 from Billings + Ski Run Road only, the scenic Beartooth Highway toward Yellowstone is closed in winter.",
      websiteUrl: "https://www.redlodgemountain.com/",
      snowReportUrl: "https://www.redlodgemountain.com/mountain/snow-report/",
      expert_only: true,
      terrain_park: true,
      beginner_friendly: true,
      kids_lessons: true,
    },
  ],
  baseTowns: [
    {
      id: "red-lodge-town",
      name: "Red Lodge",
      lat: 45.1863,
      lng: -109.2468,
      radiusM: 10000,
      blurb: "Historic base town for Red Lodge Mountain, gateway to the Beartooth Mountains (summer-only Beartooth Highway)",
      nearbyMountainIds: ["red-lodge-mountain"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Visit Red Lodge", url: "https://www.redlodgemountain.com/" },
    { category: "Resorts", label: "Red Lodge Mountain", url: "https://www.redlodgemountain.com/" },
    { category: "Transport", label: "MDT · 511mt.net road conditions", url: "https://www.511mt.net/" },
  ],
  roadsSource: {
    label: "MDT · 511mt.net",
    url: "https://www.511mt.net/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
