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
  "niseko",
  "furano",
  "sapporo",
  "tomamu-sahoro",
  "asahikawa",
  "rusutsu-kiroro",
  "yuzawa",
  "zao-onsen",
  "bandai",
  "daisen",
  "hakkoda-aomori-spring",
  "appi-shizukuishi",
  "minakami",
  "kusatsu-manza",
  "hachimantai",
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

  // Niseko, JP · 5 mountains (the four Niseko United resorts + independent
  // Moiwa) across 3 base towns (Hirafu, Kutchan, Niseko Town).
  "grand-hirafu": "niseko",
  "hanazono": "niseko",
  "niseko-village": "niseko",
  "annupuri": "niseko",
  "moiwa": "niseko",
  "hirafu": "niseko",
  "kutchan": "niseko",
  "niseko-town": "niseko",
  "niseko-roads": "niseko",

  // Furano, JP · anchor resort (Furano Ski Resort) plus two powder-belt
  // day trips (Kamui north toward Asahikawa, Tomamu south-east) across
  // 2 base towns (Furano town, Kitanomine village).
  "furano-ski-resort": "furano",
  "kamui-ski-links": "furano",
  "tomamu": "furano",
  "furano": "furano",
  "kitanomine": "furano",
  "furano-roads": "furano",
  // Sapporo, JP · the three city day hills (Teine, Kokusai, Bankei)
  // plus the two base towns (Sapporo city, Jozankei onsen).
  "sapporo-teine": "sapporo",
  "sapporo-kokusai": "sapporo",
  "sapporo-bankei": "sapporo",
  "sapporo": "sapporo",
  "jozankei": "sapporo",
  "sapporo-roads": "sapporo",

  // Tomamu & Sahoro, JP · the two Sekisho Line destination resorts
  // (Hoshino Resorts Tomamu, Sahoro) plus the two base areas (Tomamu
  // resort village, Shimukappu). Furano keeps its own day-trip
  // "tomamu" mountain entry · this region's ids are distinct.
  "tomamu-resort": "tomamu-sahoro",
  "sahoro": "tomamu-sahoro",
  "tomamu-village": "tomamu-sahoro",
  "shimukappu": "tomamu-sahoro",
  "tomamu-sahoro-roads": "tomamu-sahoro",

  // Asahikawa, JP · the city's local hill (Kamui Ski Links) and the
  // Asahidake ropeway plus the two base towns (Asahikawa city,
  // Higashikawa). Furano keeps its own day-trip "kamui-ski-links"
  // entry · this region's ids are distinct.
  "kamui": "asahikawa",
  "asahidake": "asahikawa",
  "asahikawa": "asahikawa",
  "higashikawa": "asahikawa",
  "asahikawa-roads": "asahikawa",

  // Rusutsu & Kiroro, JP · the two big independent Hokkaido powder
  // resorts either side of the Niseko range, about 90 min apart by
  // road, across 2 base areas (Rusutsu village, Kiroro base village).
  "rusutsu-resort": "rusutsu-kiroro",
  "kiroro-resort": "rusutsu-kiroro",
  "rusutsu": "rusutsu-kiroro",
  "kiroro": "rusutsu-kiroro",
  "rusutsu-kiroro-roads": "rusutsu-kiroro",

  // Yuzawa, JP · 6 mountains (GALA, Yuzawa Kogen and Ishiuchi Maruyama are
  // linked at the top via the Yuzawa Snow Link · Kagura and Naeba linked by
  // the Dragondola · Iwappara independent on Mt Iiji) across 3 base towns
  // (Echigo-Yuzawa, Ishiuchi, Mitsumata).
  "gala-yuzawa": "yuzawa",
  "yuzawa-kogen": "yuzawa",
  "iwappara": "yuzawa",
  "ishiuchi-maruyama": "yuzawa",
  "kagura": "yuzawa",
  "naeba": "yuzawa",
  "echigo-yuzawa": "yuzawa",
  "ishiuchi": "yuzawa",
  "mitsumata": "yuzawa",
  "yuzawa-roads": "yuzawa",

  // Zao Onsen, JP · 1 mountain (Yamagata's juhyo classic, village to
  // Jizo Sancho at 1,661m) + 1 base town (the 1,900-year-old onsen
  // village at ~880m with the ropeways rising straight off it).
  "zao-onsen-resort": "zao-onsen",
  "zao-onsen": "zao-onsen",
  "zao-onsen-roads": "zao-onsen",

  // Hakkoda & Aomori Spring, JP · 2 very different mountains either
  // side of Aomori city (Hakkoda's ropeway big-mountain terrain ·
  // Aomori Spring's quiet gondola resort on Mt Iwaki, about 90 min
  // apart by road) across 3 base towns (Aomori city, Sukayu Onsen,
  // Ajigasawa).
  "hakkoda": "hakkoda-aomori-spring",
  "aomori-spring": "hakkoda-aomori-spring",
  "aomori": "hakkoda-aomori-spring",
  "sukayu-onsen": "hakkoda-aomori-spring",
  "ajigasawa": "hakkoda-aomori-spring",
  "hakkoda-aomori-spring-roads": "hakkoda-aomori-spring",

  // Appi & Shizukuishi, JP · 2 mountains + 3 base towns around Morioka.
  "appi": "appi-shizukuishi",
  "shizukuishi-resort": "appi-shizukuishi",
  "appi-kogen": "appi-shizukuishi",
  "shizukuishi": "appi-shizukuishi",
  "morioka": "appi-shizukuishi",
  "appi-shizukuishi-roads": "appi-shizukuishi",

  // Minakami, JP · 3 mountains + 1 base town (the onsen town on the Tone).
  "tenjindaira": "minakami",
  "minakami-kogen": "minakami",
  "norn-minakami": "minakami",
  "minakami": "minakami",
  "minakami-roads": "minakami",

  // Kusatsu & Manza, JP · 2 mountains + 2 onsen base towns on the
  // Kusatsu-Shirane volcano (name-clash rule: resorts get -resort ids).
  "kusatsu-onsen-resort": "kusatsu-manza",
  "manza-onsen-resort": "kusatsu-manza",
  "kusatsu-onsen": "kusatsu-manza",
  "manza-onsen": "kusatsu-manza",
  "kusatsu-manza-roads": "kusatsu-manza",

  // Hachimantai, JP · 2 shared-ticket hills + 1 base city (Obuke gateway).
  "hachimantai-panorama": "hachimantai",
  "hachimantai-shimokura": "hachimantai",
  "hachimantai": "hachimantai",
  "hachimantai-roads": "hachimantai",

  // Bandai, JP · Nekoma Mountain (former Alts Bandai + Nekoma, linked)
  // and Grandeco in Urabandai, with Inawashiro as the rail gateway.
  "nekoma-mountain": "bandai",
  "grandeco": "bandai",
  "inawashiro": "bandai",
  "urabandai": "bandai",
  "bandai": "bandai",
  "bandai-roads": "bandai",

  // Daisen, JP · western Japan's ski corner on Mt Daisen in Tottori,
  // with the Daisenji temple village at the base and Yonago as the hub.
  "daisen-white-resort": "daisen",
  "daisenji": "daisen",
  "yonago": "daisen",
  "daisen": "daisen",
  "daisen-roads": "daisen",

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
