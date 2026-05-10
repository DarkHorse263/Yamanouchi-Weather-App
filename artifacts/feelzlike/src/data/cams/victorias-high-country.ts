/**
 * Victoria's High Country resort cam page deep-links.
 *
 * We deliberately do NOT scrape per-camera image URLs from these resort
 * sites - their image hosts and IDs change between seasons and any guess
 * would be a fakery risk. Instead we surface the official cam page so the
 * user lands on the resort's own live feed.
 *
 * Each entry maps to a `mountainId` from `victoriasHighCountryRegion.mountains`,
 * so we can show only the cams for the mountains a town serves
 * (using `town.nearbyMountainIds`).
 *
 * URLs verified May 2026.
 */

export interface ResortCamLink {
  mountainId: string;
  resortName: string;
  pageUrl: string;
  /** Short description of what the page contains. */
  blurb: string;
  /** Optional source-of-truth note (e.g. "5 fixed cams + 360 panomax"). */
  cameraNote?: string;
}

export const VHC_RESORT_CAMS: ResortCamLink[] = [
  {
    mountainId: "mt-buller",
    resortName: "Mt Buller",
    pageUrl: "https://www.mtbuller.com.au/winter/weather/web-cams",
    blurb: "Village + on-mountain web cams across the Buller resort.",
    cameraNote: "Multiple village & lift-area cams",
  },
  {
    mountainId: "falls-creek",
    resortName: "Falls Creek",
    pageUrl: "https://www.fallscreek.com.au/snow-cams/",
    blurb: "Snow cams across the Falls Creek village and ski runs.",
    cameraNote: "Winter snow cams (summer mountain cams in green season)",
  },
  {
    mountainId: "mt-hotham",
    resortName: "Mt Hotham",
    pageUrl: "https://www.mthotham.com.au/mountain/conditions/snow-cams",
    blurb: "Snow cams across Hotham village, lift areas and Hotham Heights.",
    cameraNote: "Multiple resort cams",
  },
  {
    mountainId: "mt-stirling",
    resortName: "Mt Stirling",
    pageUrl: "https://www.mtstirling.com.au/plan/live-cams/",
    blurb: "Live cams from Telephone Box Junction & Bluff Spur.",
    cameraNote: "Solar-powered, update frequency varies",
  },
  {
    mountainId: "lake-mountain",
    resortName: "Lake Mountain Alpine Resort",
    pageUrl: "https://lakemountainresort.com.au/cameras/",
    blurb: "Resort cameras showing snow conditions and visitor numbers.",
    cameraNote: "Includes 360° Panomax view",
  },
  // Mt Donna Buang has no operator-run live cam (Parks Victoria summit).
  // We omit it rather than fake a tile.
];

export function getVhcCamsForTown(
  nearbyMountainIds: string[] | undefined,
): ResortCamLink[] {
  if (!nearbyMountainIds || nearbyMountainIds.length === 0) return [];
  const set = new Set(nearbyMountainIds);
  return VHC_RESORT_CAMS.filter((c) => set.has(c.mountainId));
}
