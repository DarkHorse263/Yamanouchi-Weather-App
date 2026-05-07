/**
 * Canonical region IDs used across the FeelZlike platform.
 *
 * Matches the canonical region list returned by `/api/regions`.
 */
// Iiyama is temporarily removed from the active region set while we focus on
// shipping Snowy Mountains and Yamanouchi to v1.0. To re-enable, add "iiyama"
// back to this tuple, restore the iiyama entry in `routes/regions.ts`, the
// iiyama LOCATIONS in `routes/weather.ts`, the iiyama-roads webcam entry,
// the iiyama enum value in `lib/api-spec/openapi.yaml`, and the LOCATION_TO_REGION
// mappings below.
export const REGION_IDS = ["snowy-mountains", "yamanouchi"] as const;
export type RegionId = (typeof REGION_IDS)[number];

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === "string" && (REGION_IDS as readonly string[]).includes(value);
}

/**
 * Maps every known weather/webcam/lift/road locationId to its parent region.
 * When a new resort or town is added, register it here.
 */
export const LOCATION_TO_REGION: Record<string, RegionId> = {
  // Snowy Mountains, AU
  "thredbo": "snowy-mountains",
  "perisher": "snowy-mountains",
  "charlottes-pass": "snowy-mountains",
  "jindabyne": "snowy-mountains",
  "selwyn": "snowy-mountains",
  "snowy-mountains-roads": "snowy-mountains",

  // Yamanouchi, JP - 22 mountains: 18 Shiga Kogen sub-areas + 4 Kita-Shiga resorts.
  "shiga-sun-valley": "yamanouchi",
  "shiga-maruike": "yamanouchi",
  "shiga-hasuike": "yamanouchi",
  "shiga-giant": "yamanouchi",
  "shiga-hoppo-bunadaira": "yamanouchi",
  "shiga-higashidateyama": "yamanouchi",
  "shiga-nishidateyama": "yamanouchi",
  "shiga-terakoya": "yamanouchi",
  "shiga-takamagahara": "yamanouchi",
  "shiga-tannenomori-okojo": "yamanouchi",
  "shiga-ichinose-family": "yamanouchi",
  "shiga-ichinose-diamond": "yamanouchi",
  "shiga-ichinose-yamanokami": "yamanouchi",
  "shiga-yakebitaiyama": "yamanouchi",
  "shiga-okushiga-kogen": "yamanouchi",
  "shiga-kumanoyu": "yamanouchi",
  "shiga-yokoteyama": "yamanouchi",
  "shiga-shibutoge": "yamanouchi",
  "ryuoo": "yamanouchi",
  "xjam-takaifuji": "yamanouchi",
  "yomase-onsen": "yamanouchi",
  "kita-shiga-komaruyama": "yamanouchi",
  "yamanouchi-roads": "yamanouchi",
};

export function regionForLocation(locationId: string): RegionId | undefined {
  return LOCATION_TO_REGION[locationId];
}

/**
 * Parses an optional `?region=` query param. Returns `undefined` when no
 * filter is requested (i.e. caller wants the full multi-region payload).
 *
 * Throws `RegionParamError` when the value is provided but not a known
 * region id, so handlers can return a clean 400.
 */
export class RegionParamError extends Error {
  readonly received: string;
  constructor(received: string) {
    super(
      `Invalid region '${received}'. Expected one of: ${REGION_IDS.join(", ")}`,
    );
    this.name = "RegionParamError";
    this.received = received;
  }
}

export function parseRegionParam(
  raw: unknown,
): RegionId | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;

  if (Array.isArray(raw)) {
    // Validate EVERY array entry. Reject mixed/invalid inputs rather than
    // silently dropping them - a request like `?region=valid&region=bogus`
    // should fail loudly.
    const values: string[] = [];
    for (const v of raw) {
      if (v === undefined || v === null || v === "") continue;
      if (typeof v !== "string") throw new RegionParamError(String(v));
      values.push(v);
    }
    if (values.length === 0) return undefined;
    for (const v of values) {
      if (!isRegionId(v)) throw new RegionParamError(v);
    }
    if (values.some((v) => v !== values[0])) {
      throw new RegionParamError(values.join(","));
    }
    return values[0] as RegionId;
  }

  if (typeof raw !== "string") throw new RegionParamError(String(raw));
  if (!isRegionId(raw)) throw new RegionParamError(raw);
  return raw;
}

/**
 * True when `locationId` belongs to `region`. Used by route handlers
 * that filter arrays of `{ locationId, ... }` records.
 */
export function locationMatchesRegion(
  locationId: string,
  region: RegionId | undefined,
): boolean {
  if (!region) return true;
  return regionForLocation(locationId) === region;
}
