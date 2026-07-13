/**
 * Canonical region IDs used across the FeelZlike platform.
 *
 * Matches the canonical region list returned by `/api/regions`.
 */
// Active region set · keep in sync with `lib/api-spec/openapi.yaml` RegionId
// enum, `routes/regions.ts` REGIONS list, `routes/weather.ts` LOCATIONS,
// `jobs/alertEvaluator.ts` REGION_ANCHORS, and the frontend region registry
// at `artifacts/feelzlike/src/regions/index.ts`.
export const REGION_IDS = [
  "snowy-mountains",
  "victorias-high-country",
  "tasmania",
  "yamanouchi",
  "nozawa-onsen",
  "iiyama",
  "hakuba-valley",
  "myoko",
  "queenstown",
  "wanaka",
  "mt-hutt",
  "ruapehu",
] as const;
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

  // Victoria's High Country, AU · 6 mountains across 8 base towns.
  "mt-buller": "victorias-high-country",
  "mt-stirling": "victorias-high-country",
  "falls-creek": "victorias-high-country",
  "mt-hotham": "victorias-high-country",
  "lake-mountain": "victorias-high-country",
  "mt-donna-buang": "victorias-high-country",
  "mansfield": "victorias-high-country",
  "bright": "victorias-high-country",
  "mount-beauty": "victorias-high-country",
  "harrietville": "victorias-high-country",
  "dinner-plain": "victorias-high-country",
  "omeo": "victorias-high-country",
  "marysville": "victorias-high-country",
  "warburton": "victorias-high-country",
  "victorias-high-country-roads": "victorias-high-country",

  // Tasmania, AU · 1 mountain (Ben Lomond · only commercial chairlift),
  // 3 base towns (on-mountain village + Launceston + Hobart).
  "ben-lomond": "tasmania",
  "ben-lomond-base": "tasmania",
  "launceston": "tasmania",
  "hobart": "tasmania",
  "tasmania-roads": "tasmania",

  // Yamanouchi, JP · 22 entries: 18 Shiga Kogen sub-areas + 4 Kita-Shiga resorts (ryuoo, xjam-takaifuji, yomase-onsen, kita-shiga-komaruyama).
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

  // Nozawa Onsen, JP · 1 mountain, 1 base town.
  "nozawa-onsen": "nozawa-onsen",
  "nozawa-onsen-village": "nozawa-onsen",
  "nozawa-onsen-roads": "nozawa-onsen",

  // Iiyama, JP · 5 mountains across 4 base towns.
  "madarao": "iiyama",
  "tangram": "iiyama",
  "togari-onsen": "iiyama",
  "kijimadaira": "iiyama",
  "kijima-snow-park": "iiyama",
  "iiyama": "iiyama",
  "madarao-kogen": "iiyama",
  "togari-onsen-village": "iiyama",
  "kijimadaira-village": "iiyama",
  "iiyama-roads": "iiyama",

  // Hakuba Valley, JP · 10 mountains across 3 base towns (Hakuba, Otari, Omachi).
  "happo-one": "hakuba-valley",
  "hakuba-goryu": "hakuba-valley",
  "hakuba-47": "hakuba-valley",
  "hakuba-iwatake": "hakuba-valley",
  "tsugaike-kogen": "hakuba-valley",
  "hakuba-norikura": "hakuba-valley",
  "hakuba-cortina": "hakuba-valley",
  "hakuba-sanosaka": "hakuba-valley",
  "kashimayari": "hakuba-valley",
  "jiigatake": "hakuba-valley",
  "hakuba": "hakuba-valley",
  "otari": "hakuba-valley",
  "omachi": "hakuba-valley",
  "hakuba-valley-roads": "hakuba-valley",

  // Myoko, JP · 6 mountains across 4 base towns (Akakura, Ikenotaira
  // Onsen, Suginosawa, Arai).
  "akakura-onsen": "myoko",
  "akakura-kanko": "myoko",
  "ikenotaira": "myoko",
  "myoko-suginohara": "myoko",
  "seki-onsen": "myoko",
  "lotte-arai": "myoko",
  "akakura": "myoko",
  "ikenotaira-onsen": "myoko",
  "suginosawa": "myoko",
  "arai": "myoko",
  "myoko-roads": "myoko",

  // Queenstown, NZ · 2 mountains + 1 gateway town + roads cam tile.
  "coronet-peak": "queenstown",
  "the-remarkables": "queenstown",
  "queenstown": "queenstown",
  "queenstown-roads": "queenstown",

  // Wanaka, NZ · 2 mountains + 1 gateway town + roads cam tile.
  "cardrona": "wanaka",
  "treble-cone": "wanaka",
  "wanaka": "wanaka",
  "wanaka-roads": "wanaka",

  // Mt Hutt, NZ · 1 mountain + 1 gateway town (Methven) + roads cam tile.
  "mt-hutt": "mt-hutt",
  "methven": "mt-hutt",
  "mt-hutt-roads": "mt-hutt",

  // Ruapehu, NZ · 2 mountains + 1 gateway town (Ohakune) + roads cam tile.
  "whakapapa": "ruapehu",
  "turoa": "ruapehu",
  "ohakune": "ruapehu",
  "ruapehu-roads": "ruapehu",
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
