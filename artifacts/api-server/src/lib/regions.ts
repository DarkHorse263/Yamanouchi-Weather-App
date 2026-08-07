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
  "carrabassett-valley",
  "newry-bethel",
  "rangeley",
  "lake-placid",
  "north-creek",
  "hunter",
  "windham",
  "highmount",
  "harbor-springs",
  "keweenaw-peninsula",
  "poconos",
  "laurel-highlands",
  "berkshires",
  "central-massachusetts",
  "lutsen-north-shore",
  "wausau",
  "wisconsin-dells",
  "litchfield-hills",
  "juneau",
  "girdwood",
  "black-hills",
  "white-mountains-az",
  "flagstaff",
  "lake-tahoe-nevada",
  "shenandoah-valley",
  "blue-ridge",
  "maggie-valley",
  "high-country",
  "canaan-valley",
  "snowshoe",
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

  // Whistler, BC · Whistler Blackcomb's two mountains + the village + roads tile.
  "whistler-mountain": "whistler",
  "blackcomb-mountain": "whistler",
  "whistler": "whistler",
  "whistler-roads": "whistler",

  // Powder Highway, BC · 7 independent resorts, each with its own base town.
  "revelstoke-mountain-resort": "powder-highway",
  "kicking-horse": "powder-highway",
  "fernie-alpine": "powder-highway",
  "whitewater": "powder-highway",
  "kimberley-alpine": "powder-highway",
  "panorama": "powder-highway",
  "sun-peaks-resort": "powder-highway",
  "revelstoke": "powder-highway",
  "golden": "powder-highway",
  "fernie": "powder-highway",
  "nelson": "powder-highway",
  "kimberley": "powder-highway",
  "invermere": "powder-highway",
  "sun-peaks": "powder-highway",
  "powder-highway-roads": "powder-highway",

  // Banff & Lake Louise, AB · SkiBig3 inside Banff National Park.
  "banff-sunshine": "banff-lake-louise",
  "mt-norquay": "banff-lake-louise",
  "lake-louise-resort": "banff-lake-louise",
  "banff": "banff-lake-louise",
  "lake-louise": "banff-lake-louise",
  "banff-lake-louise-roads": "banff-lake-louise",

  // Canmore, AB · 1 mountain (Nakiska, Kananaskis) + the town.
  "nakiska": "canmore",
  "canmore": "canmore",
  "canmore-roads": "canmore",

  // Jasper, AB · 1 mountain (Marmot Basin) + the town.
  "marmot-basin": "jasper",
  "jasper": "jasper",
  "jasper-roads": "jasper",

  // Laurentians, QC · Tremblant + the pedestrian village at its base.
  "tremblant": "quebec-laurentians",
  "mont-tremblant": "quebec-laurentians",
  "quebec-laurentians-roads": "quebec-laurentians",

  // Charlevoix, QC · Mont-Sainte-Anne and Le Massif on the north shore
  // of the St. Lawrence, one base town each.
  "mont-sainte-anne": "quebec-charlevoix",
  "le-massif": "quebec-charlevoix",
  "beaupre": "quebec-charlevoix",
  "petite-riviere-saint-francois": "quebec-charlevoix",
  "quebec-charlevoix-roads": "quebec-charlevoix",

  // Eastern Townships, QC · Ski Bromont and Mont Sutton (name-clash rule:
  // the Bromont resort takes the -resort id against the town).
  "bromont-resort": "quebec-eastern-townships",
  "mont-sutton": "quebec-eastern-townships",
  "bromont": "quebec-eastern-townships",
  "sutton": "quebec-eastern-townships",
  "quebec-eastern-townships-roads": "quebec-eastern-townships",

  // Summit County, CO · Breckenridge, Keystone, Copper Mountain,
  // Arapahoe Basin and Loveland, with 4 base towns (name-clash rule: the
  // Breckenridge/Keystone/Copper Mountain resorts take the -resort id
  // against their identically-named towns).
  "breckenridge-resort": "summit-county",
  "keystone-resort": "summit-county",
  "copper-mountain-resort": "summit-county",
  "arapahoe-basin": "summit-county",
  "loveland": "summit-county",
  "breckenridge": "summit-county",
  "keystone": "summit-county",
  "copper-mountain": "summit-county",
  "georgetown": "summit-county",
  "summit-county-roads": "summit-county",

  // Vail Valley, CO · Vail Mountain and Beaver Creek (name-clash rule:
  // the Vail resort takes the -mountain id against the town of Vail).
  "vail-mountain": "vail-valley",
  "beaver-creek": "vail-valley",
  "vail": "vail-valley",
  "avon": "vail-valley",
  "vail-valley-roads": "vail-valley",

  // Aspen Snowmass, CO · Snowmass, Aspen Mountain, Aspen Highlands and
  // Buttermilk, with 2 base towns (Aspen, Snowmass Village).
  "snowmass": "aspen-snowmass",
  "aspen-mountain": "aspen-snowmass",
  "aspen-highlands": "aspen-snowmass",
  "buttermilk": "aspen-snowmass",
  "aspen": "aspen-snowmass",
  "snowmass-village": "aspen-snowmass",
  "aspen-snowmass-roads": "aspen-snowmass",

  // Steamboat, CO · 1 mountain (Steamboat Resort) + the town.
  "steamboat-resort": "steamboat",
  "steamboat-springs": "steamboat",
  "steamboat-roads": "steamboat",

  // Winter Park, CO · 1 mountain (Winter Park Resort) + the town
  // (name-clash rule: the resort takes the -resort id against the town).
  "winter-park-resort": "winter-park",
  "winter-park": "winter-park",
  "winter-park-roads": "winter-park",

  // Crested Butte, CO · 1 mountain (Crested Butte Mountain Resort) + the
  // town (region id equals the town name, so the town id is
  // disambiguated as crested-butte-town).
  "crested-butte-mountain-resort": "crested-butte",
  "crested-butte-town": "crested-butte",
  "crested-butte-roads": "crested-butte",

  // Telluride, CO · 1 mountain (Telluride Ski Resort) + the town (region
  // id equals the town name, so the town id is disambiguated as
  // telluride-town).
  "telluride-ski-resort": "telluride",
  "telluride-town": "telluride",
  "telluride-roads": "telluride",

  // Durango, CO · 1 mountain (Purgatory Resort) + the town (region id
  // equals the town name, so the town id is disambiguated as
  // durango-town).
  "purgatory-resort": "durango",
  "durango-town": "durango",
  "durango-roads": "durango",

  // Boulder / Front Range, CO · 1 mountain (Eldora Mountain Resort) +
  // the town of Nederland.
  "eldora-mountain-resort": "boulder-front-range",
  "nederland": "boulder-front-range",
  "boulder-front-range-roads": "boulder-front-range",

  // Cottonwood Canyons, UT · Alta, Snowbird, Brighton and Solitude, with 2
  // base towns (Salt Lake City, Sandy). No naming collisions - none of the
  // 4 resort names match either base town, so all mountain ids stay bare.
  "alta": "cottonwood-canyons",
  "snowbird": "cottonwood-canyons",
  "brighton-resort": "cottonwood-canyons",
  "solitude-mountain-resort": "cottonwood-canyons",
  "salt-lake-city": "cottonwood-canyons",
  "sandy": "cottonwood-canyons",
  "cottonwood-canyons-roads": "cottonwood-canyons",

  // Park City, UT · Park City Mountain and Deer Valley (name-clash rule:
  // the region id equals the base town name, so the town id is
  // disambiguated as park-city-town; the lead resort, Park City Mountain,
  // does not collide with anything and keeps its plain slug).
  "park-city-mountain": "park-city",
  "deer-valley-resort": "park-city",
  "park-city-town": "park-city",
  "park-city-roads": "park-city",

  // Ogden Valley, UT · Snowbasin, Powder Mountain and Nordic Valley, with
  // 2 base towns (Ogden, Eden). No naming collisions.
  "snowbasin": "ogden-valley",
  "powder-mountain": "ogden-valley",
  "nordic-valley": "ogden-valley",
  "ogden": "ogden-valley",
  "eden": "ogden-valley",
  "ogden-valley-roads": "ogden-valley",

  // Provo, UT · 1 mountain (Sundance Mountain Resort) with 2 base towns
  // (Provo, Sundance). Both towns take a `-town` suffix for consistency
  // with the flat location registry, mirroring the Crested
  // Butte/Telluride/Durango convention (region id equals a base town
  // name, here "provo").
  "sundance-mountain-resort": "provo",
  "provo-town": "provo",
  "sundance-town": "provo",
  "provo-roads": "provo",

  // Cache Valley, UT · Beaver Mountain and Cherry Peak, with 1 base town
  // (Logan). No naming collisions.
  "beaver-mountain": "cache-valley",
  "cherry-peak": "cache-valley",
  "logan": "cache-valley",
  "cache-valley-roads": "cache-valley",

  // North Lake Tahoe, CA · Palisades Tahoe, Northstar California and
  // Sugar Bowl, with 1 base town (Truckee). No naming collisions - none
  // of the 3 resort names match the base town, so all mountain ids stay
  // bare.
  "palisades-tahoe": "north-lake-tahoe",
  "northstar-california": "north-lake-tahoe",
  "sugar-bowl": "north-lake-tahoe",
  "truckee": "north-lake-tahoe",
  "north-lake-tahoe-roads": "north-lake-tahoe",

  // South Lake Tahoe, CA · Heavenly, Kirkwood, Sierra-at-Tahoe and
  // Homewood, with 1 base town (South Lake Tahoe). Name-clash rule: the
  // region id equals the base town name, so the town id is disambiguated
  // as south-lake-tahoe-town. Sierra-at-Tahoe is flagged as officially
  // closed for the 2025-26 season per the resort's own page (see
  // south-lake-tahoe.ts) - still wired into the registry so the region
  // page can display the closure honestly rather than 404ing.
  "heavenly": "south-lake-tahoe",
  "kirkwood": "south-lake-tahoe",
  "sierra-at-tahoe": "south-lake-tahoe",
  "homewood-mountain-resort": "south-lake-tahoe",
  "south-lake-tahoe-town": "south-lake-tahoe",
  "south-lake-tahoe-roads": "south-lake-tahoe",

  // Mammoth Lakes, CA · Mammoth Mountain and June Mountain, with 1 base
  // town (Mammoth Lakes). Name-clash rule: the region id equals the base
  // town name, so the town id is disambiguated as mammoth-lakes-town.
  "mammoth-mountain": "mammoth-lakes",
  "june-mountain": "mammoth-lakes",
  "mammoth-lakes-town": "mammoth-lakes",
  "mammoth-lakes-roads": "mammoth-lakes",

  // Big Bear, CA · Bear Mountain and Snow Summit, with 1 base town (Big
  // Bear Lake). No naming collisions.
  "bear-mountain": "big-bear",
  "snow-summit": "big-bear",
  "big-bear-lake": "big-bear",
  "big-bear-roads": "big-bear",

  // Bear Valley, CA · 1 mountain (Bear Valley Mountain Resort), with 1
  // base town. Three-way name-clash avoided by using the nearby gateway
  // town Arnold as the base town id, rather than a synthetic
  // bear-valley-town that would still read confusingly next to the
  // resort's own "Bear Valley Mountain Resort" name.
  "bear-valley-mountain-resort": "bear-valley",
  "arnold": "bear-valley",
  "bear-valley-roads": "bear-valley",

  // Mt. Shasta, CA · 1 mountain (Mt. Shasta Ski Park), with 1 base town
  // (Mount Shasta). No naming collisions - distinct id spelling
  // ("mt-shasta" vs "mount-shasta") keeps region and town ids apart.
  "mt-shasta-ski-park": "mt-shasta",
  "mount-shasta": "mt-shasta",
  "mt-shasta-roads": "mt-shasta",

  // Killington/Pico, VT · Killington and Pico Mountain, with 1 base town
  // (Killington). Name-clash rule: the resort "Killington" equals the
  // base town name, so the resort id is disambiguated as
  // killington-resort (mirrors the Breckenridge/Winter Park convention -
  // resort takes the -resort suffix, town stays bare). First
  // America/New_York region in the USA module.
  "killington-resort": "killington-pico",
  "pico-mountain": "killington-pico",
  "killington": "killington-pico",
  "killington-pico-roads": "killington-pico",

  // Stowe/Smugglers' Notch, VT · Stowe Mountain Resort and Smugglers'
  // Notch, with 2 base towns (Stowe, Jeffersonville). No naming
  // collisions. Smugglers' Notch is independent for 2025-26 pending a
  // Feb 2026 acquisition and a 2026-27 joint pass with Burke Mountain
  // (see stowe-smugglers-notch.ts) - reflected as current-season-only.
  "stowe-mountain-resort": "stowe-smugglers-notch",
  "smugglers-notch": "stowe-smugglers-notch",
  "stowe": "stowe-smugglers-notch",
  "jeffersonville": "stowe-smugglers-notch",
  "stowe-smugglers-notch-roads": "stowe-smugglers-notch",

  // Mad River Valley, VT · Sugarbush and Mad River Glen, with 2 base
  // towns (Warren, Waitsfield). No naming collisions. Mad River Glen is
  // ski-only for 2025-26 (no snowboarding) - same treatment as Alta/Deer
  // Valley in the Utah pass - still wired into the registry normally.
  "sugarbush": "mad-river-valley",
  "mad-river-glen": "mad-river-valley",
  "warren": "mad-river-valley",
  "waitsfield": "mad-river-valley",
  "mad-river-valley-roads": "mad-river-valley",

  // Southern Vermont, VT · Stratton, Mount Snow, Bromley Mountain and
  // Magic Mountain, with 4 base towns (Stratton, West Dover, Peru,
  // Manchester). Name-clash rule: the resort "Stratton" equals the base
  // town name, so the resort id is disambiguated as
  // stratton-mountain-resort. Peru and Manchester use a defensive -vt
  // suffix (peru-vt, manchester-vt) even though no current collision
  // exists, per the region file's naming note. Magic Mountain did NOT
  // open for the 2025-26 season (lowest snowfall in 20+ years) - flagged
  // across the stack per the Sierra-at-Tahoe honesty pattern from the CA
  // pass - still wired into the registry so the region page can display
  // the closure honestly rather than 404ing.
  "stratton-mountain-resort": "southern-vermont",
  "mount-snow": "southern-vermont",
  "bromley-mountain": "southern-vermont",
  "magic-mountain": "southern-vermont",
  "stratton": "southern-vermont",
  "west-dover": "southern-vermont",
  "peru-vt": "southern-vermont",
  "manchester-vt": "southern-vermont",
  "southern-vermont-roads": "southern-vermont",

  // Okemo, VT · 1 mountain (Okemo Mountain Resort), with 1 base town
  // (Ludlow). No naming collisions - the resort's full name "Okemo
  // Mountain Resort" already reads distinctly from the bare region id
  // "okemo".
  "okemo-mountain-resort": "okemo",
  "ludlow": "okemo",
  "okemo-roads": "okemo",

  // Jay Peak/Northeast Kingdom, VT · Jay Peak and Burke Mountain, with 2
  // base towns (Jay, East Burke). No naming collisions. Burke Mountain
  // shares the same Bear Den Partners acquisition context as Smugglers'
  // Notch (Feb 2026, joint pass starting 2026-27, not yet in effect) -
  // both resorts reflected as independent for the current season.
  "jay-peak": "jay-peak-nek",
  "burke-mountain": "jay-peak-nek",
  "jay": "jay-peak-nek",
  "east-burke": "jay-peak-nek",
  "jay-peak-nek-roads": "jay-peak-nek",

  // Jackson Hole, WY. Resort id kept as its multi-word official name
  // (no `-resort` suffix needed, no collision with the town "jackson").
  "jackson-hole-mtn-resort": "jackson-hole",
  "snow-king-mountain": "jackson-hole",
  "jackson": "jackson-hole",
  "teton-village": "jackson-hole",
  "jackson-hole-roads": "jackson-hole",

  // Grand Targhee, WY. Town "alta-wy" is disambiguated from Utah's Alta
  // (cottonwood-canyons.ts) with a `-wy` suffix.
  "grand-targhee-resort": "grand-targhee",
  "alta-wy": "grand-targhee",
  "grand-targhee-roads": "grand-targhee",

  // Big Sky, MT.
  "big-sky-resort": "big-sky",
  "big-sky-town": "big-sky",
  "big-sky-roads": "big-sky",

  // Bozeman / Bridger Bowl, MT.
  "bridger-bowl": "bozeman-bridger-bowl",
  "bozeman": "bozeman-bridger-bowl",
  "bozeman-bridger-bowl-roads": "bozeman-bridger-bowl",

  // Whitefish, MT. Town "whitefish-town" disambiguated from the resort's
  // own id since both would otherwise be bare "whitefish".
  "whitefish-mountain-resort": "whitefish",
  "whitefish-town": "whitefish",
  "whitefish-roads": "whitefish",

  // Red Lodge, MT. Town "red-lodge-town" disambiguated from the resort's
  // own id since both would otherwise be bare "red-lodge".
  "red-lodge-mountain": "red-lodge",
  "red-lodge-town": "red-lodge",
  "red-lodge-roads": "red-lodge",

  // Taos, NM. Town "taos-ski-valley-town" disambiguated from the resort's
  // own id "taos-ski-valley" since the base town shares the resort's name.
  "taos-ski-valley": "taos",
  "taos-ski-valley-town": "taos",
  "taos-roads": "taos",

  // Angel Fire, NM. Resort's own multi-word name "angel-fire-resort"
  // disambiguates it from the town "angel-fire".
  "angel-fire-resort": "angel-fire",
  "angel-fire": "angel-fire",
  "angel-fire-roads": "angel-fire",

  // Santa Fe area, NM.
  "ski-santa-fe": "santa-fe",
  "santa-fe": "santa-fe",
  "santa-fe-roads": "santa-fe",

  // Albuquerque area, NM. Sandia Peak Ski Area is a verify-status resort
  // (delayed/uncertain 2025-26 closing date) - see roads.ts and
  // RegionSources.tsx for the honesty-gate framing.
  "sandia-peak": "albuquerque-sandia",
  "albuquerque": "albuquerque-sandia",
  "albuquerque-sandia-roads": "albuquerque-sandia",

  // Michigan · official Eastern time includes Keweenaw/Mt. Bohemia.
  "boyne-mountain": "harbor-springs",
  "boyne-highlands": "harbor-springs",
  "nubs-nob": "harbor-springs",
  "harbor-springs-town": "harbor-springs",
  "harbor-springs-roads": "harbor-springs",
  "mt-bohemia": "keweenaw-peninsula",
  "mohawk": "keweenaw-peninsula",
  "keweenaw-peninsula-roads": "keweenaw-peninsula",
  "camelback-mountain": "poconos",
  "blue-mountain-pa": "poconos",
  "shawnee-mountain": "poconos",
  "tannersville": "poconos",
  "pocono-manor": "poconos",
  "poconos-roads": "poconos",
  "seven-springs-mountain": "laurel-highlands",
  "blue-knob": "laurel-highlands",
  "seven-springs-town": "laurel-highlands",
  "laurel-highlands-roads": "laurel-highlands",
  "jiminy-peak": "berkshires",
  "ski-butternut": "berkshires",
  "berkshire-east": "berkshires",
  "hancock": "berkshires",
  "great-barrington": "berkshires",
  "berkshires-roads": "berkshires",
  "wachusett-mountain": "central-massachusetts",
  "princeton-ma": "central-massachusetts",
  "central-massachusetts-roads": "central-massachusetts",
  "lutsen-mountains": "lutsen-north-shore",
  "lutsen": "lutsen-north-shore",
  "lutsen-north-shore-roads": "lutsen-north-shore",
  "granite-peak": "wausau",
  "wausau-town": "wausau",
  "wausau-roads": "wausau",
  "cascade-mountain": "wisconsin-dells",
  "portage": "wisconsin-dells",
  "wisconsin-dells-roads": "wisconsin-dells",
  "litchfield-hills-roads": "litchfield-hills",
  "cornwall-ct": "litchfield-hills",
  "mohawk-mountain": "litchfield-hills",
  "juneau-roads": "juneau",
  "juneau-town": "juneau",
  "eaglecrest-ski-area": "juneau",
  "girdwood-roads": "girdwood",
  "girdwood-town": "girdwood",
  "alyeska-resort": "girdwood",
  "black-hills-roads": "black-hills",
  "lead-deadwood": "black-hills",
  "terry-peak": "black-hills",
  "white-mountains-az-roads": "white-mountains-az",
  "greer-az": "white-mountains-az",
  "sunrise-park-resort": "white-mountains-az",
  "flagstaff-roads": "flagstaff",
  "flagstaff-town": "flagstaff",
  "arizona-snowbowl": "flagstaff",
  "lake-tahoe-nevada-roads": "lake-tahoe-nevada",
  "incline-village": "lake-tahoe-nevada",
  "diamond-peak": "lake-tahoe-nevada",
  "mt-rose-ski-tahoe": "lake-tahoe-nevada",
  "shenandoah-valley-roads": "shenandoah-valley",
  "mcgaheysville": "shenandoah-valley",
  "massanutten-resort": "shenandoah-valley",
  "blue-ridge-roads": "blue-ridge",
  "wintergreen-town": "blue-ridge",
  "wintergreen-resort": "blue-ridge",
  "maggie-valley-roads": "maggie-valley",
  "maggie-valley-town": "maggie-valley",
  "cataloochee-ski-area": "maggie-valley",
  "high-country-roads": "high-country",
  "banner-elk-beech-mountain": "high-country",
  "beech-mountain": "high-country",
  "sugar-mountain": "high-country",
  "canaan-valley-roads": "canaan-valley",
  "canaan-valley-town": "canaan-valley",
  "timberline-mountain": "canaan-valley",
  "canaan-valley-resort": "canaan-valley",
  "snowshoe-roads": "snowshoe",
  "snowshoe-town": "snowshoe",
  "snowshoe-mountain": "snowshoe",

  // Mt. Hood, OR. Three resorts sharing one base town (Government Camp).
  "mt-hood-meadows": "mt-hood",
  "timberline-lodge": "mt-hood",
  "mt-hood-skibowl": "mt-hood",
  "government-camp": "mt-hood",
  "mt-hood-roads": "mt-hood",

  // Bend, OR.
  "mt-bachelor": "bend",
  "bend": "bend",
  "bend-roads": "bend",

  // Crystal Mountain, WA.
  "crystal-mountain": "crystal-mountain",
  "enumclaw": "crystal-mountain",
  "crystal-mountain-roads": "crystal-mountain",

  // Snoqualmie Pass, WA. Base town shares the mountain's human name, so
  // the town id uses a "-town" suffix to avoid colliding with the
  // mountain id (both would otherwise be "snoqualmie-pass").
  "snoqualmie-pass": "snoqualmie-pass",
  "snoqualmie-pass-town": "snoqualmie-pass",
  "snoqualmie-pass-roads": "snoqualmie-pass",

  // Stevens Pass, WA.
  "stevens-pass": "stevens-pass",
  "skykomish": "stevens-pass",
  "stevens-pass-roads": "stevens-pass",

  // Mt. Baker, WA.
  "mt-baker": "mt-baker",
  "glacier": "mt-baker",
  "mt-baker-roads": "mt-baker",

  // Sun Valley, ID. Two resorts sharing one base town (Ketchum).
  "bald-mountain": "sun-valley",
  "dollar-mountain": "sun-valley",
  "ketchum": "sun-valley",
  "sun-valley-roads": "sun-valley",

  // Sandpoint, ID. Idaho Panhandle — Pacific timezone.
  "schweitzer-mountain-resort": "sandpoint",
  "sandpoint": "sandpoint",
  "sandpoint-roads": "sandpoint",

  // Boise, ID.
  "bogus-basin": "boise",
  "boise": "boise",
  "boise-roads": "boise",

  // Donnelly / McCall, ID. Two resorts sharing one base town (Donnelly).
  "tamarack-resort": "donnelly-mccall",
  "brundage-mountain": "donnelly-mccall",
  "donnelly": "donnelly-mccall",
  "donnelly-mccall-roads": "donnelly-mccall",

  // New Hampshire · White Mountains / North Conway.
  "cranmore-mountain": "white-mountains",
  "wildcat-mountain": "white-mountains",
  "attitash-mountain-resort": "white-mountains",
  "north-conway": "white-mountains",
  "white-mountains-roads": "white-mountains",

  // New Hampshire · Franconia Notch.
  "cannon-mountain": "franconia-notch",
  "bretton-woods": "franconia-notch",
  "loon-mountain": "franconia-notch",
  "franconia": "franconia-notch",
  "bretton-woods-town": "franconia-notch",
  "franconia-notch-roads": "franconia-notch",

  // New Hampshire · Waterville Valley. Town uses a suffix to avoid the region-id collision.
  "waterville-valley-resort": "waterville-valley",
  "waterville-valley-town": "waterville-valley",
  "waterville-valley-roads": "waterville-valley",

  // New Hampshire · Lakes Region.
  "gunstock-mountain-resort": "lakes-region",
  "gilford": "lakes-region",
  "lakes-region-roads": "lakes-region",
  "sugarloaf": "carrabassett-valley",
  "carrabassett-valley-town": "carrabassett-valley",
  "carrabassett-valley-roads": "carrabassett-valley",
  "sunday-river": "newry-bethel",
  "newry": "newry-bethel",
  "newry-bethel-roads": "newry-bethel",
  "saddleback-mountain": "rangeley",
  "rangeley": "rangeley",
  "rangeley-roads": "rangeley",
  "whiteface-mountain": "lake-placid",
  "lake-placid": "lake-placid",
  "wilmington": "lake-placid",
  "lake-placid-roads": "lake-placid",
  "gore-mountain": "north-creek",
  "north-creek": "north-creek",
  "north-creek-roads": "north-creek",
  "hunter-mountain": "hunter",
  "hunter": "hunter",
  "hunter-roads": "hunter",
  "windham-mountain": "windham",
  "windham": "windham",
  "windham-roads": "windham",
  "belleayre-mountain": "highmount",
  "highmount": "highmount",
  "highmount-roads": "highmount",
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
