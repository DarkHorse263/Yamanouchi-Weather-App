import type { RegionConfig } from "@workspace/feelzlike-shell";
import wordmark from "@assets/feelzlike_trimmed/feelzlike_WordMarque_colour_160426_1777334678269_trim.png";

/**
 * Bear Valley · one mountain (Bear Valley Mountain Resort), on Highway 4
 * near Ebbetts Pass between Lake Tahoe and Yosemite.
 *
 * Naming collision: "Bear Valley" is the region id, the resort's own name
 * ("Bear Valley Mountain Resort"), and the name of the small unincorporated
 * community at its base. To avoid a three-way collision, the base town id
 * uses the name of the larger nearby town, Arnold (the more commonly used
 * gateway/mailing town for the area, about 20 minutes down Highway 4), and
 * the resort keeps its full official name "Bear Valley Mountain Resort" so
 * neither id needs a `-resort`/`-town` suffix.
 *
 * ⚠️ Opening-date honesty gate: the source article (myMotherLode.com) has
 * an internal date conflict, stating in one place that the resort "hit
 * the slopes" on Nov 28, 2025, and elsewhere that the "season began on
 * Saturday, December 27, 2025." Reconciled here as best-effort — an
 * initial partial opening around Nov 28, 2025, then a fuller reopening
 * around Dec 25, 2025 — and flagged as not fully confirmed in the blurb
 * below and in the commit message. The March 29, 2026 closing date is
 * consistently reported and treated as reliable.
 *
 * Bear Valley sits near the southern edge of the Sierra Avalanche
 * Center's coverage area — Ebbetts Pass (Highway 4), SAC's southern
 * boundary, is the access road into the resort, and SAC's own coverage
 * description names Bear Valley explicitly.
 *
 * First Pacific-timezone region on this branch. Weather is Open-Meteo
 * with the existing OpenWeatherMap fallback. Caltrans QuickMap publishes
 * quickmap.dot.ca.gov (Highway 4/89 near Ebbetts Pass) but nothing is
 * integrated yet, hence `roadsSource.dataAvailable: false`.
 */
export const bearValleyRegion: RegionConfig = {
  id: "bear-valley",
  name: "Bear Valley",
  subtitle: "California · USA",
  shortTag: "CA",
  brand: { wordmarkUrl: wordmark },
  seasons: true,
  hemisphere: "north",
  summaryMountains: ["Bear Valley Mountain Resort"],
  resorts: [{ path: "/mountain/bear-valley-mountain-resort", label: "Bear Valley Mountain Resort" }],
  mountains: [
    {
      id: "bear-valley-mountain-resort",
      name: "Bear Valley Mountain Resort",
      elevationM: 2012,
      lat: 38.4706,
      lng: -120.0471,
      // Opening-date uncertainty flagged directly in copy — see the
      // region-file header comment above for the full reconciliation.
      blurb: "Indy Pass · own multi-resort \"Cali Pass\" + Powder Alliance reciprocity · 2025-26 opening date uncertain in source reporting (best-effort: partial open ~Nov 28, fuller reopen ~Dec 25, 2025), closing date Mar 29 2026 reliably reported",
      websiteUrl: "https://www.bearvalley.com/",
      backcountry_access: true,
    },
  ],
  baseTowns: [
    {
      id: "arnold",
      name: "Arnold",
      lat: 38.2494,
      lng: -120.3552,
      radiusM: 15000,
      blurb: "Highway 4 gateway town about 20 minutes below Bear Valley Mountain Resort, the main service town for the area",
      nearbyMountainIds: ["bear-valley-mountain-resort"],
    },
  ],
  footer: "v0.3 · feelzlike",
  tourismLinks: [
    { category: "Tourism", label: "Ebbetts Pass Scenic Byway", url: "https://scenic4.org/" },
    { category: "Resorts", label: "Bear Valley Mountain Resort", url: "https://www.bearvalley.com/" },
    { category: "Transport", label: "Caltrans QuickMap · Highway 4/89 Ebbetts Pass conditions", url: "https://quickmap.dot.ca.gov/" },
    { category: "Safety", label: "Sierra Avalanche Center", url: "https://www.sierraavalanchecenter.org/" },
  ],
  roadsSource: {
    label: "Caltrans QuickMap · quickmap.dot.ca.gov",
    url: "https://quickmap.dot.ca.gov/",
    dataAvailable: false,
  },
  weatherSource: {
    label: "Open-Meteo",
  },
};
