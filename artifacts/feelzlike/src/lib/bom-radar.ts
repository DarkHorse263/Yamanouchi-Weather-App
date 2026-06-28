/**
 * Australian BOM radar catalogue + nearest-radar lookup.
 *
 * Powers the /near-you "official radar" override so ANY Australian coordinate
 * (GPS or search) gets its own local Bureau of Meteorology radar loop, not the
 * nearest curated ski-region radar.
 *
 * Every entry is VERIFIED: the animated loop gif (IDR<id><range>.gif) is
 * actually served by bom.gov.au, and the centre coords come from that radar's
 * own loop page. Radars whose gif BOM does not publish (e.g. Townsville,
 * Karratha, Gove) or that are decommissioned are deliberately excluded · we
 * never point at a product that 404s. Captured 2026-06.
 *
 * This module is intentionally PURE (no @/regions import) so it can be unit
 * tested under `tsx --test` · @/regions pulls in PNG assets that crash a plain
 * node import.
 *
 * The shapes below mirror the inline `official` / `windy` config in
 * RadarMap.inner so a nearest-radar result threads straight through RadarMap.
 */

/** An official radar source · matches RadarMap.inner's RegionConfig.official. */
export interface OfficialRadarSource {
  label: string;
  /** Loop gif URL · routed through /api/bom-radar by OfficialView. */
  imageUrl: string | null;
  /** Page URL for the "open source" link. */
  href: string;
  attribution: string;
}

/** A Windy embed centre · matches RadarMap.inner's RegionConfig.windy. */
export interface WindySource {
  lat: number;
  lon: number;
  zoom: number;
}

export interface BomRadar {
  /** Two-digit BOM radar id, e.g. "71". Combined with a range digit it forms
   *  the product id (IDR713 = id 71, range 3 = 128 km). */
  id: string;
  /** Site name from the radar's own loop page (the authoritative label). */
  name: string;
  lat: number;
  lon: number;
  /** Ranges with a published loop gif. 1=512 km, 2=256 km, 3=128 km, 4=64 km. */
  ranges: number[];
}

/** Range digit -> coverage radius in km. */
export const RANGE_KM: Record<number, number> = { 1: 512, 2: 256, 3: 128, 4: 64 };

/**
 * Fraction of a radar's nominal radius we treat as usable. Keeps a matched
 * location comfortably inside the sweep rather than on the noisy outer edge.
 */
const COVERAGE_FACTOR = 0.9;

export const BOM_RADARS: BomRadar[] = [
  { id: "02", name: "Melbourne", lat: -37.852, lon: 144.757, ranges: [1, 2, 3, 4] },
  { id: "03", name: "Wollongong (Appin)", lat: -34.264, lon: 150.874, ranges: [1, 2, 3, 4] },
  { id: "04", name: "Newcastle", lat: -32.732, lon: 152.025, ranges: [1, 2, 3, 4] },
  { id: "06", name: "Geraldton", lat: -28.8, lon: 114.7, ranges: [1, 2, 3, 4] },
  { id: "08", name: "Gympie (Mt Kanigan)", lat: -25.957, lon: 152.577, ranges: [1, 2, 3, 4] },
  { id: "14", name: "Mt Gambier", lat: -37.75, lon: 140.78, ranges: [1, 2, 3] },
  { id: "15", name: "Dampier", lat: -20.652, lon: 116.684, ranges: [1, 2, 3, 4] },
  { id: "16", name: "Pt Hedland", lat: -20.372, lon: 118.632, ranges: [1, 2, 3] },
  { id: "17", name: "Broome", lat: -17.948, lon: 122.235, ranges: [1, 2, 3, 4] },
  { id: "19", name: "Cairns", lat: -16.817, lon: 145.683, ranges: [1, 2, 3, 4] },
  { id: "22", name: "Mackay", lat: -21.117, lon: 149.217, ranges: [1, 2, 3, 4] },
  { id: "23", name: "Gladstone", lat: -23.856, lon: 151.262, ranges: [1, 2, 3] },
  { id: "24", name: "Bowen", lat: -19.886, lon: 148.075, ranges: [1, 2, 3] },
  { id: "25", name: "Alice Springs", lat: -23.817, lon: 133.9, ranges: [1, 2, 3] },
  { id: "26", name: "Perth Airport", lat: -31.933, lon: 115.967, ranges: [1, 2, 3, 4] },
  { id: "27", name: "Woomera", lat: -31.157, lon: 136.803, ranges: [1, 2, 3] },
  { id: "28", name: "Grafton", lat: -29.622, lon: 152.951, ranges: [1, 2, 3] },
  { id: "31", name: "Albany", lat: -34.95, lon: 117.8, ranges: [1, 2, 3, 4] },
  { id: "32", name: "Esperance", lat: -33.83, lon: 121.891, ranges: [1, 2, 3, 4] },
  { id: "33", name: "Ceduna", lat: -32.129, lon: 133.696, ranges: [1, 2, 3, 4] },
  { id: "36", name: "Gulf of Carpentaria (Mornington Is)", lat: -16.666, lon: 139.167, ranges: [1, 2, 3] },
  { id: "37", name: "Hobart Airport", lat: -42.833, lon: 147.51, ranges: [1, 2, 3] },
  { id: "38", name: "Newdegate", lat: -33.097, lon: 119.009, ranges: [1, 2, 3, 4] },
  { id: "39", name: "Halls Creek", lat: -18.231, lon: 127.663, ranges: [1, 2, 3] },
  { id: "40", name: "Canberra (Captains Flat)", lat: -35.663, lon: 149.511, ranges: [1, 2, 3, 4] },
  { id: "41", name: "Willis Island", lat: -16.3, lon: 149.983, ranges: [1, 2, 3] },
  { id: "42", name: "Katherine (Tindal)", lat: -14.513, lon: 132.446, ranges: [1, 2, 3] },
  { id: "44", name: "Giles", lat: -25.03, lon: 128.3, ranges: [1, 2, 3] },
  { id: "46", name: "Adelaide (Sellicks Hill)", lat: -35.331, lon: 138.501, ranges: [1, 2, 3] },
  { id: "48", name: "Kalgoorlie", lat: -30.785, lon: 121.452, ranges: [1, 2, 3, 4] },
  { id: "49", name: "Yarrawonga", lat: -36.03, lon: 146.023, ranges: [1, 2, 3, 4] },
  { id: "50", name: "Brisbane (Marburg)", lat: -27.606, lon: 152.54, ranges: [1, 2, 3, 4] },
  { id: "53", name: "Moree", lat: -29.5, lon: 149.85, ranges: [1, 2, 3] },
  { id: "55", name: "Wagga Wagga", lat: -35.167, lon: 147.467, ranges: [1, 2, 3] },
  { id: "56", name: "Longreach", lat: -23.43, lon: 144.29, ranges: [1, 2, 3] },
  { id: "58", name: "South Doodlakine", lat: -31.777, lon: 117.953, ranges: [1, 2, 3, 4] },
  { id: "62", name: "Norfolk Island", lat: -29.04, lon: 167.94, ranges: [1, 2, 3] },
  { id: "63", name: "Darwin (Berrimah)", lat: -12.457, lon: 130.925, ranges: [1, 2, 3, 4] },
  { id: "64", name: "Adelaide (Buckland Park)", lat: -34.617, lon: 138.469, ranges: [1, 2, 3, 4] },
  { id: "66", name: "Brisbane (Mt Stapylton)", lat: -27.718, lon: 153.24, ranges: [1, 2, 3, 4] },
  { id: "67", name: "Warrego", lat: -26.439, lon: 147.349, ranges: [1, 2, 3] },
  { id: "68", name: "Bairnsdale", lat: -37.888, lon: 147.575, ranges: [1, 2, 3] },
  { id: "69", name: "Namoi (Blackjack Mountain)", lat: -31.024, lon: 150.192, ranges: [1, 2, 3, 4] },
  { id: "70", name: "Perth (Serpentine)", lat: -32.392, lon: 115.867, ranges: [1, 2, 3, 4] },
  { id: "71", name: "Sydney (Terrey Hills)", lat: -33.701, lon: 151.21, ranges: [1, 2, 3, 4] },
  { id: "72", name: "Emerald", lat: -23.55, lon: 148.239, ranges: [1, 2, 3, 4] },
  { id: "74", name: "Greenvale", lat: -18.997, lon: 144.996, ranges: [1, 2, 3, 4] },
  { id: "75", name: "Mount Isa", lat: -20.711, lon: 139.555, ranges: [1, 2, 3, 4] },
  { id: "76", name: "Hobart (Mt Koonya)", lat: -43.112, lon: 147.806, ranges: [1, 2, 3, 4] },
  { id: "77", name: "Warruwi", lat: -11.649, lon: 133.38, ranges: [1, 2, 3, 4] },
  { id: "78", name: "Weipa", lat: -12.666, lon: 141.924, ranges: [1, 2, 3, 4] },
  { id: "79", name: "Watheroo", lat: -30.36, lon: 116.292, ranges: [1, 2, 3, 4] },
  { id: "93", name: "Brewarrina", lat: -29.969, lon: 146.812, ranges: [1, 2, 3, 4] },
  { id: "94", name: "Hillston", lat: -33.552, lon: 145.529, ranges: [1, 2, 3, 4] },
  { id: "95", name: "Rainbow", lat: -35.998, lon: 142.013, ranges: [1, 2, 3, 4] },
  { id: "96", name: "Yeoval", lat: -32.744, lon: 148.708, ranges: [1, 2, 3, 4] },
  { id: "97", name: "Mildura", lat: -34.287, lon: 141.598, ranges: [1, 2, 3, 4] },
  { id: "98", name: "Taroom", lat: -25.696, lon: 149.898, ranges: [1, 2, 3, 4] },
];

/** Great-circle distance in km. */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

interface RadarMatch {
  radar: BomRadar;
  range: number;
  rangeKm: number;
  distanceKm: number;
}

/**
 * Find the best BOM radar for a coordinate, or null if none covers it.
 *
 * For each radar we take the SMALLEST (sharpest) range whose usable radius
 * (rangeKm * 0.9) still contains the point. Across all radars we then prefer
 * the smallest such range (most detail), tie-breaking by distance (closest
 * centre). A point outside every radar's 512 km sweep returns null · the
 * caller falls back to the global interactive radar.
 */
export function nearestBomRadar(lat: number, lng: number): OfficialRadarSource | null {
  let best: RadarMatch | null = null;

  for (const radar of BOM_RADARS) {
    const distanceKm = haversineKm(lat, lng, radar.lat, radar.lon);

    // Smallest available range from this radar that still covers the point.
    let bestRange: number | null = null;
    let bestRangeKm = Infinity;
    for (const range of radar.ranges) {
      const km = RANGE_KM[range];
      if (km == null) continue;
      if (distanceKm <= km * COVERAGE_FACTOR && km < bestRangeKm) {
        bestRange = range;
        bestRangeKm = km;
      }
    }
    if (bestRange == null) continue;

    if (
      best == null ||
      bestRangeKm < best.rangeKm ||
      (bestRangeKm === best.rangeKm && distanceKm < best.distanceKm)
    ) {
      best = { radar, range: bestRange, rangeKm: bestRangeKm, distanceKm };
    }
  }

  if (!best) return null;

  const product = `IDR${best.radar.id}${best.range}`;
  const distLabel = Math.round(best.distanceKm);
  return {
    label: `BOM ${best.radar.name}`,
    imageUrl: `https://www.bom.gov.au/radar/${product}.gif`,
    href: `https://www.bom.gov.au/products/${product}.loop.shtml`,
    attribution: `Bureau of Meteorology · ${product} · ${best.rangeKm} km · ${distLabel} km away`,
  };
}
