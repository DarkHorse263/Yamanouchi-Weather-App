/**
 * Per-town nav content gating.
 *
 * The town sidebar / bottom-nav (Today, Weather, Roads, Transport, Stay, Eat,
 * Explore) is a fixed list, but not every town has real content behind every
 * entry yet. Rather than route people into polished-but-empty "coming soon"
 * pages, we hide the nav item entirely until the section has something to show.
 *
 * This predicate is the single source of truth for that decision · it reads the
 * same static data layers the pages themselves render from, so the nav and the
 * page never disagree. It lives in the artifact (not the shared shell) because
 * the content data lives here; the shell takes it as an optional prop.
 *
 * Always-on entries (`/`, `/weather`, `/stay`, `/eat`) are never gated · every
 * town has a today dashboard, a forecast, and the universal Stay (booking-
 * platform deep links) + Eat (Google Maps category searches) launch pads. Those
 * two pages work from just a town name + coordinates, so they ship free for
 * every town and never sit behind the paywall.
 */
import type { RegionConfig } from "@workspace/feelzlike-shell";

/**
 * Regions whose Roads & cams page actually renders content today. Roads is
 * driven by live feeds rather than a single static array, so it can't be
 * derived cheaply like the others:
 *   · snowy-mountains       · Live Traffic NSW road conditions + cams
 *   · victorias-high-country· VicEmergency alerts (fire/road) section
 *   · yamanouchi            · curated road webcams
 *   · queenstown/wanaka/mt-hutt/ruapehu (NZ) · seasonal chain rules +
 *     NZTA official road-camera map tile (no live per-road feed wired)
 *   · whistler/powder-highway (BC), banff-lake-louise/canmore/jasper (AB)
 *     and the three quebec-* regions (QC) · seasonal winter-driving rules
 *     plus a DriveBC / 511 Alberta / Québec 511 official camera-map tile
 *     (no live per-road feed wired)
 *   · the nine Colorado (US) regions · CAIC avalanche + CDOT Traction Law /
 *     Passenger Vehicle Chain Law rules plus a cotrip.org official
 *     camera-map tile (no live per-road feed wired)
 * The remaining regions have no wired feed yet, so the entry stays hidden.
 * Add a region here the moment its roads feed or cams go live.
 */
const REGIONS_WITH_ROADS_CONTENT: ReadonlySet<string> = new Set([
  "snowy-mountains",
  "victorias-high-country",
  "yamanouchi",
  "queenstown",
  "wanaka",
  "mt-hutt",
  "ruapehu",
  "whistler",
  "powder-highway",
  "banff-lake-louise",
  "canmore",
  "jasper",
  "quebec-laurentians",
  "quebec-charlevoix",
  "quebec-eastern-townships",
  "summit-county",
  "vail-valley",
  "aspen-snowmass",
  "steamboat",
  "winter-park",
  "crested-butte",
  "telluride",
  "durango",
  "boulder-front-range",
  "cottonwood-canyons",
  "park-city",
  "ogden-valley",
  "provo",
  "cache-valley",
  "north-lake-tahoe",
  "south-lake-tahoe",
  "mammoth-lakes",
  "big-bear",
  "bear-valley",
  "mt-shasta",
  "killington-pico",
  "stowe-smugglers-notch",
  "mad-river-valley",
  "southern-vermont",
  "okemo",
  "jay-peak-nek",
  "jackson-hole",
  "grand-targhee",
  "big-sky",
  "bozeman-bridger-bowl",
  "whitefish",
  "red-lodge",
  "taos",
  "angel-fire",
  "santa-fe",
  "albuquerque-sandia",
  "mt-hood",
  "bend",
  "crystal-mountain",
  "snoqualmie-pass",
  "stevens-pass",
  "mt-baker",
  "sun-valley",
  "sandpoint",
  "boise",
  "donnelly-mccall",
  "white-mountains",
  "franconia-notch",
  "waterville-valley",
  "lakes-region",
]);

/**
 * Returns true when the given town-nav path has real content for this town and
 * should be shown. Unknown paths default to visible so we never hide something
 * we didn't explicitly reason about.
 */
export function townNavHasContent(
  region: RegionConfig,
  townId: string,
  path: string,
): boolean {
  switch (path) {
    case "/":
    case "/weather":
    case "/stay":
    case "/eat":
      return true;
    case "/explore":
      return (region.tourismLinks?.length ?? 0) > 0;
    case "/transport":
      // Always available: every town's Transport page now offers at least the
      // universal car-hire option (Europcar) alongside any scheduled providers.
      return true;
    case "/roads":
      return REGIONS_WITH_ROADS_CONTENT.has(region.id);
    default:
      return true;
  }
}
