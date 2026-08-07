/**
 * Region-isolated transport data - single source of truth for the
 * Transport page and any future analytics/region-overview consumers.
 *
 * Loader-time invariants enforced here (so a curation drift never reaches
 * the UI):
 *  - every provider must declare a non-empty `regions[]`
 *  - every provider's `regions[]` must include the region key under which
 *    it is registered (e.g. an entry under "yamanouchi" must list
 *    "yamanouchi" in its regions[])
 *
 * Throws synchronously at module-load time on any violation. This is the
 * desired behaviour: if the data is bad, fail loud at startup rather than
 * leak it into another region.
 */
import type { RegionId } from "@workspace/api-client-react";
import type { TransportProvider, TransportProviderList } from "@/types/transport";
import { SNOWY_MOUNTAINS_TRANSPORT } from "./snowy-mountains";
import { VICTORIAS_HIGH_COUNTRY_TRANSPORT } from "./victorias-high-country";
import { TASMANIA_TRANSPORT } from "./tasmania";
import { YAMANOUCHI_TRANSPORT } from "./yamanouchi";
import { NOZAWA_ONSEN_TRANSPORT } from "./nozawa-onsen";
import { IIYAMA_TRANSPORT } from "./iiyama";
import { HAKUBA_VALLEY_TRANSPORT } from "./hakuba-valley";
import { MYOKO_TRANSPORT } from "./myoko";
import { NISEKO_TRANSPORT } from "./niseko";
import { FURANO_TRANSPORT } from "./furano";
import { SAPPORO_TRANSPORT } from "./sapporo";
import { TOMAMU_SAHORO_TRANSPORT } from "./tomamu-sahoro";
import { ASAHIKAWA_TRANSPORT } from "./asahikawa";
import { RUSUTSU_KIRORO_TRANSPORT } from "./rusutsu-kiroro";
import { YUZAWA_TRANSPORT } from "./yuzawa";
import { ZAO_ONSEN_TRANSPORT } from "./zao-onsen";
import { BANDAI_TRANSPORT } from "./bandai";
import { DAISEN_TRANSPORT } from "./daisen";
import { HAKKODA_AOMORI_SPRING_TRANSPORT } from "./hakkoda-aomori-spring";
import { APPI_SHIZUKUISHI_TRANSPORT } from "./appi-shizukuishi";
import { MINAKAMI_TRANSPORT } from "./minakami";
import { KUSATSU_MANZA_TRANSPORT } from "./kusatsu-manza";
import { HACHIMANTAI_TRANSPORT } from "./hachimantai";
import { QUEENSTOWN_TRANSPORT } from "./queenstown";
import { WANAKA_TRANSPORT } from "./wanaka";
import { MT_HUTT_TRANSPORT } from "./mt-hutt";
import { RUAPEHU_TRANSPORT } from "./ruapehu";
import { WHISTLER_TRANSPORT } from "./whistler";
import { POWDER_HIGHWAY_TRANSPORT } from "./powder-highway";
import { BANFF_LAKE_LOUISE_TRANSPORT } from "./banff-lake-louise";
import { CANMORE_TRANSPORT } from "./canmore";
import { JASPER_TRANSPORT } from "./jasper";
import { QUEBEC_LAURENTIANS_TRANSPORT } from "./quebec-laurentians";
import { QUEBEC_CHARLEVOIX_TRANSPORT } from "./quebec-charlevoix";
import { QUEBEC_EASTERN_TOWNSHIPS_TRANSPORT } from "./quebec-eastern-townships";
import { SUMMIT_COUNTY_TRANSPORT } from "./summit-county";
import { VAIL_VALLEY_TRANSPORT } from "./vail-valley";
import { ASPEN_SNOWMASS_TRANSPORT } from "./aspen-snowmass";
import { STEAMBOAT_TRANSPORT } from "./steamboat";
import { WINTER_PARK_TRANSPORT } from "./winter-park";
import { CRESTED_BUTTE_TRANSPORT } from "./crested-butte";
import { TELLURIDE_TRANSPORT } from "./telluride";
import { DURANGO_TRANSPORT } from "./durango";
import { BOULDER_FRONT_RANGE_TRANSPORT } from "./boulder-front-range";
import { COTTONWOOD_CANYONS_TRANSPORT } from "./cottonwood-canyons";
import { PARK_CITY_TRANSPORT } from "./park-city";
import { OGDEN_VALLEY_TRANSPORT } from "./ogden-valley";
import { PROVO_TRANSPORT } from "./provo";
import { CACHE_VALLEY_TRANSPORT } from "./cache-valley";
import { NORTH_LAKE_TAHOE_TRANSPORT } from "./north-lake-tahoe";
import { SOUTH_LAKE_TAHOE_TRANSPORT } from "./south-lake-tahoe";
import { MAMMOTH_LAKES_TRANSPORT } from "./mammoth-lakes";
import { BIG_BEAR_TRANSPORT } from "./big-bear";
import { BEAR_VALLEY_TRANSPORT } from "./bear-valley";
import { MT_SHASTA_TRANSPORT } from "./mt-shasta";
import { KILLINGTON_PICO_TRANSPORT } from "./killington-pico";
import { STOWE_SMUGGLERS_NOTCH_TRANSPORT } from "./stowe-smugglers-notch";
import { MAD_RIVER_VALLEY_TRANSPORT } from "./mad-river-valley";
import { SOUTHERN_VERMONT_TRANSPORT } from "./southern-vermont";
import { OKEMO_TRANSPORT } from "./okemo";
import { JAY_PEAK_NEK_TRANSPORT } from "./jay-peak-nek";
import { JACKSON_HOLE_TRANSPORT } from "./jackson-hole";
import { GRAND_TARGHEE_TRANSPORT } from "./grand-targhee";
import { BIG_SKY_TRANSPORT } from "./big-sky";
import { BOZEMAN_BRIDGER_BOWL_TRANSPORT } from "./bozeman-bridger-bowl";
import { WHITEFISH_TRANSPORT } from "./whitefish";
import { RED_LODGE_TRANSPORT } from "./red-lodge";
import { TAOS_TRANSPORT } from "./taos";
import { ANGEL_FIRE_TRANSPORT } from "./angel-fire";
import { SANTA_FE_TRANSPORT } from "./santa-fe";
import { ALBUQUERQUE_SANDIA_TRANSPORT } from "./albuquerque-sandia";
import { HARBOR_SPRINGS_TRANSPORT } from "./harbor-springs";
import { KEWEENAW_PENINSULA_TRANSPORT } from "./keweenaw-peninsula";
import { POCONOS_TRANSPORT } from "./poconos";
import { LAUREL_HIGHLANDS_TRANSPORT } from "./laurel-highlands";
import { BERKSHIRES_TRANSPORT } from "./berkshires";
import { CENTRAL_MASSACHUSETTS_TRANSPORT } from "./central-massachusetts";
import { LUTSEN_NORTH_SHORE_TRANSPORT } from "./lutsen-north-shore";
import { WAUSAU_TRANSPORT } from "./wausau";
import { WISCONSIN_DELLS_TRANSPORT } from "./wisconsin-dells";
import { SNOWSHOE_TRANSPORT } from "./snowshoe";
import { CANAAN_VALLEY_TRANSPORT } from "./canaan-valley";
import { HIGH_COUNTRY_TRANSPORT } from "./high-country";
import { MAGGIE_VALLEY_TRANSPORT } from "./maggie-valley";
import { BLUE_RIDGE_TRANSPORT } from "./blue-ridge";
import { SHENANDOAH_VALLEY_TRANSPORT } from "./shenandoah-valley";
import { LAKE_TAHOE_NEVADA_TRANSPORT } from "./lake-tahoe-nevada";
import { FLAGSTAFF_TRANSPORT } from "./flagstaff";
import { WHITE_MOUNTAINS_AZ_TRANSPORT } from "./white-mountains-az";
import { BLACK_HILLS_TRANSPORT } from "./black-hills";
import { MT_HOOD_TRANSPORT } from "./mt-hood";
import { BEND_TRANSPORT } from "./bend";
import { CRYSTAL_MOUNTAIN_TRANSPORT } from "./crystal-mountain";
import { SNOQUALMIE_PASS_TRANSPORT } from "./snoqualmie-pass";
import { STEVENS_PASS_TRANSPORT } from "./stevens-pass";
import { MT_BAKER_TRANSPORT } from "./mt-baker";
import { SUN_VALLEY_TRANSPORT } from "./sun-valley";
import { SANDPOINT_TRANSPORT } from "./sandpoint";
import { BOISE_TRANSPORT } from "./boise";
import { DONNELLY_MCCALL_TRANSPORT } from "./donnelly-mccall";
import { WHITE_MOUNTAINS_TRANSPORT } from "./white-mountains";
import { FRANCONIA_NOTCH_TRANSPORT } from "./franconia-notch";
import { WATERVILLE_VALLEY_TRANSPORT } from "./waterville-valley";
import { LAKES_REGION_TRANSPORT } from "./lakes-region";
import { CARRABASSETT_VALLEY_TRANSPORT } from "./carrabassett-valley";
import { NEWRY_BETHEL_TRANSPORT } from "./newry-bethel";
import { RANGELEY_TRANSPORT } from "./rangeley";
import { LAKE_PLACID_TRANSPORT } from "./lake-placid";
import { NORTH_CREEK_TRANSPORT } from "./north-creek";
import { HUNTER_TRANSPORT } from "./hunter";
import { WINDHAM_TRANSPORT } from "./windham";
import { HIGHMOUNT_TRANSPORT } from "./highmount";

const REGISTRY: Record<RegionId, TransportProviderList> = {
  "snowy-mountains": SNOWY_MOUNTAINS_TRANSPORT,
  "victorias-high-country": VICTORIAS_HIGH_COUNTRY_TRANSPORT,
  tasmania: TASMANIA_TRANSPORT,
  yamanouchi: YAMANOUCHI_TRANSPORT,
  "nozawa-onsen": NOZAWA_ONSEN_TRANSPORT,
  iiyama: IIYAMA_TRANSPORT,
  "hakuba-valley": HAKUBA_VALLEY_TRANSPORT,
  myoko: MYOKO_TRANSPORT,
  niseko: NISEKO_TRANSPORT,
  furano: FURANO_TRANSPORT,
  sapporo: SAPPORO_TRANSPORT,
  bandai: BANDAI_TRANSPORT,
  daisen: DAISEN_TRANSPORT,
  "tomamu-sahoro": TOMAMU_SAHORO_TRANSPORT,
  asahikawa: ASAHIKAWA_TRANSPORT,
  "rusutsu-kiroro": RUSUTSU_KIRORO_TRANSPORT,
  yuzawa: YUZAWA_TRANSPORT,
  "zao-onsen": ZAO_ONSEN_TRANSPORT,
  "hakkoda-aomori-spring": HAKKODA_AOMORI_SPRING_TRANSPORT,
  "appi-shizukuishi": APPI_SHIZUKUISHI_TRANSPORT,
  minakami: MINAKAMI_TRANSPORT,
  "kusatsu-manza": KUSATSU_MANZA_TRANSPORT,
  hachimantai: HACHIMANTAI_TRANSPORT,
  // NZ · verified ski-season operators only (resort ski buses, RealNZ +
  // local mountain shuttles, InterCity). Unverified phone/website/schedule
  // fields are null per the no-guess rule.
  queenstown: QUEENSTOWN_TRANSPORT,
  wanaka: WANAKA_TRANSPORT,
  "mt-hutt": MT_HUTT_TRANSPORT,
  ruapehu: RUAPEHU_TRANSPORT,
  // CA · no operators curated to the AU/JP/NZ verification standard yet, so
  // these are registered empty rather than filled with guessed timetables.
  whistler: WHISTLER_TRANSPORT,
  "powder-highway": POWDER_HIGHWAY_TRANSPORT,
  "banff-lake-louise": BANFF_LAKE_LOUISE_TRANSPORT,
  canmore: CANMORE_TRANSPORT,
  jasper: JASPER_TRANSPORT,
  "quebec-laurentians": QUEBEC_LAURENTIANS_TRANSPORT,
  "quebec-charlevoix": QUEBEC_CHARLEVOIX_TRANSPORT,
  "quebec-eastern-townships": QUEBEC_EASTERN_TOWNSHIPS_TRANSPORT,
  // US (Colorado) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "summit-county": SUMMIT_COUNTY_TRANSPORT,
  "vail-valley": VAIL_VALLEY_TRANSPORT,
  "aspen-snowmass": ASPEN_SNOWMASS_TRANSPORT,
  steamboat: STEAMBOAT_TRANSPORT,
  "winter-park": WINTER_PARK_TRANSPORT,
  "crested-butte": CRESTED_BUTTE_TRANSPORT,
  telluride: TELLURIDE_TRANSPORT,
  durango: DURANGO_TRANSPORT,
  "boulder-front-range": BOULDER_FRONT_RANGE_TRANSPORT,
  "cottonwood-canyons": COTTONWOOD_CANYONS_TRANSPORT,
  "park-city": PARK_CITY_TRANSPORT,
  "ogden-valley": OGDEN_VALLEY_TRANSPORT,
  "provo": PROVO_TRANSPORT,
  "cache-valley": CACHE_VALLEY_TRANSPORT,
  "north-lake-tahoe": NORTH_LAKE_TAHOE_TRANSPORT,
  "south-lake-tahoe": SOUTH_LAKE_TAHOE_TRANSPORT,
  "mammoth-lakes": MAMMOTH_LAKES_TRANSPORT,
  "big-bear": BIG_BEAR_TRANSPORT,
  "bear-valley": BEAR_VALLEY_TRANSPORT,
  "mt-shasta": MT_SHASTA_TRANSPORT,
  // US (Vermont) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "killington-pico": KILLINGTON_PICO_TRANSPORT,
  "stowe-smugglers-notch": STOWE_SMUGGLERS_NOTCH_TRANSPORT,
  "mad-river-valley": MAD_RIVER_VALLEY_TRANSPORT,
  "southern-vermont": SOUTHERN_VERMONT_TRANSPORT,
  okemo: OKEMO_TRANSPORT,
  "jay-peak-nek": JAY_PEAK_NEK_TRANSPORT,
  // US (Wyoming) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "jackson-hole": JACKSON_HOLE_TRANSPORT,
  "grand-targhee": GRAND_TARGHEE_TRANSPORT,

  // US (Montana) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "big-sky": BIG_SKY_TRANSPORT,
  "bozeman-bridger-bowl": BOZEMAN_BRIDGER_BOWL_TRANSPORT,
  "whitefish": WHITEFISH_TRANSPORT,
  "red-lodge": RED_LODGE_TRANSPORT,

  // US (New Mexico) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "taos": TAOS_TRANSPORT,
  "angel-fire": ANGEL_FIRE_TRANSPORT,
  "santa-fe": SANTA_FE_TRANSPORT,
  "albuquerque-sandia": ALBUQUERQUE_SANDIA_TRANSPORT,
  "harbor-springs": HARBOR_SPRINGS_TRANSPORT,
  "keweenaw-peninsula": KEWEENAW_PENINSULA_TRANSPORT,
  "poconos": POCONOS_TRANSPORT,
  "laurel-highlands": LAUREL_HIGHLANDS_TRANSPORT,
  "berkshires": BERKSHIRES_TRANSPORT,
  "central-massachusetts": CENTRAL_MASSACHUSETTS_TRANSPORT,
  "lutsen-north-shore": LUTSEN_NORTH_SHORE_TRANSPORT,
  wausau: WAUSAU_TRANSPORT,
  "wisconsin-dells": WISCONSIN_DELLS_TRANSPORT,

  "snowshoe": SNOWSHOE_TRANSPORT,
  "canaan-valley": CANAAN_VALLEY_TRANSPORT,
  "high-country": HIGH_COUNTRY_TRANSPORT,
  "maggie-valley": MAGGIE_VALLEY_TRANSPORT,
  "blue-ridge": BLUE_RIDGE_TRANSPORT,
  "shenandoah-valley": SHENANDOAH_VALLEY_TRANSPORT,
  "lake-tahoe-nevada": LAKE_TAHOE_NEVADA_TRANSPORT,
  "flagstaff": FLAGSTAFF_TRANSPORT,
  "white-mountains-az": WHITE_MOUNTAINS_AZ_TRANSPORT,
  "black-hills": BLACK_HILLS_TRANSPORT,
  // US (Oregon) · no operators curated to the AU/JP/NZ verification
  // standard yet, so these are registered empty rather than filled with
  // guessed timetables.
  "mt-hood": MT_HOOD_TRANSPORT,
  "bend": BEND_TRANSPORT,
  "crystal-mountain": CRYSTAL_MOUNTAIN_TRANSPORT,
  "snoqualmie-pass": SNOQUALMIE_PASS_TRANSPORT,
  "stevens-pass": STEVENS_PASS_TRANSPORT,
  "mt-baker": MT_BAKER_TRANSPORT,
  "sun-valley": SUN_VALLEY_TRANSPORT,
  "sandpoint": SANDPOINT_TRANSPORT,
  "boise": BOISE_TRANSPORT,
  "donnelly-mccall": DONNELLY_MCCALL_TRANSPORT,
  "white-mountains": WHITE_MOUNTAINS_TRANSPORT,
  "franconia-notch": FRANCONIA_NOTCH_TRANSPORT,
  "waterville-valley": WATERVILLE_VALLEY_TRANSPORT,
  "lakes-region": LAKES_REGION_TRANSPORT,
  "carrabassett-valley": CARRABASSETT_VALLEY_TRANSPORT,
  "newry-bethel": NEWRY_BETHEL_TRANSPORT,
  "rangeley": RANGELEY_TRANSPORT,
  "lake-placid": LAKE_PLACID_TRANSPORT,
  "north-creek": NORTH_CREEK_TRANSPORT,
  "hunter": HUNTER_TRANSPORT,
  "windham": WINDHAM_TRANSPORT,
  "highmount": HIGHMOUNT_TRANSPORT,
};

// Loader-time integrity check.
const seenIds = new Map<string, RegionId>();
for (const [regionKey, providers] of Object.entries(REGISTRY) as [RegionId, TransportProviderList][]) {
  for (const p of providers) {
    if (!Array.isArray(p.regions) || p.regions.length === 0) {
      throw new Error(
        `[transport] provider '${p.id}' (under '${regionKey}') has empty regions[]`,
      );
    }
    if (!p.regions.includes(regionKey)) {
      throw new Error(
        `[transport] provider '${p.id}' is registered under region '${regionKey}' but its regions[] is ${JSON.stringify(p.regions)} - missing self-reference`,
      );
    }
    const previous = seenIds.get(p.id);
    if (previous !== undefined) {
      throw new Error(
        `[transport] duplicate provider id '${p.id}' (registered under both '${previous}' and '${regionKey}')`,
      );
    }
    seenIds.set(p.id, regionKey);
  }
}

/** Get all transport providers for a region. Returns an empty array if the region has no curated transport yet. */
export function getProvidersForRegion(regionId: RegionId): TransportProviderList {
  return REGISTRY[regionId] ?? [];
}

/** All providers across all regions. Useful for admin/analytics views. */
export function getAllProviders(): TransportProvider[] {
  return Object.values(REGISTRY).flat();
}

export type { TransportProvider, TransportProviderList };
