/**
 * Shared SEO region/town registry for generate-sitemap.mjs and prerender.mjs.
 *
 * Mirrors src/regions/ (the app's real registry) and the KNOWN_REGIONS block
 * in api-server/src/app.ts. Keep all three in sync when adding regions,
 * towns, or mountains.
 *
 * Feature flags mirror the actual route gating so we never emit URLs that
 * client-redirect (Google files those as "Page with redirect"):
 *  - hasAlerts: RegionLayout only renders /:region/alerts when the region's
 *    custom router ships an Alerts page (snowy-mountains, yamanouchi).
 *    All other regions redirect home.
 *  - hasRoads: TownLayout only renders /:region/:town/roads for regions in
 *    REGIONS_WITH_ROADS_CONTENT (src/lib/navContent.ts).
 *  - Region-level /eat and /explore redirect home for EVERY region (no
 *    region router defines them), so they are never emitted.
 *  - Town-level weather/stay/eat/transport/explore render for every town
 *    (explore requires tourismLinks, which all regions have).
 */

export const REGIONS = [
  // ── Australia ───────────────────────────────────────────────────────────
  {
    slug: "snowy-mountains",
    name: "Snowy Mountains",
    subtitle: "NSW · Australia",
    country: "AU",
    hasAlerts: true,
    hasRoads: true,
    mountains: [
      { name: "Perisher",          blurb: "NSW · the big one (4 resorts)" },
      { name: "Thredbo",           blurb: "NSW · the high one" },
      { name: "Selwyn",            blurb: "NSW · family beginner mountain" },
      { name: "Charlotte's Pass",  blurb: "NSW · ski-in village · day trip via oversnow from Perisher" },
    ],
    towns: [
      { id: "jindabyne",  name: "Jindabyne",  blurb: "Lakeside base town · 30 min to Thredbo & Perisher" },
      { id: "berridale",  name: "Berridale",  blurb: "Quiet village stop on the Snowy Mountains Highway" },
      { id: "cooma",      name: "Cooma",      blurb: "Regional hub · 1 hr to the snowfields" },
    ],
  },
  {
    slug: "victorias-high-country",
    name: "Victoria's High Country",
    subtitle: "VIC · Australia",
    country: "AU",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt Buller",       blurb: "VIC · the big one · 3 hrs from Melbourne" },
      { name: "Falls Creek",     blurb: "VIC · largest skiable area · ski-in village" },
      { name: "Mt Hotham",       blurb: "VIC · the high & steep one · Hotham Airport access" },
      { name: "Mt Stirling",     blurb: "VIC · cross-country & backcountry sister to Buller" },
      { name: "Lake Mountain",   blurb: "VIC · nordic & snow play · closest snow to Melbourne" },
      { name: "Mt Donna Buang",  blurb: "VIC · free snow play summit · 1.5 hrs from Melbourne" },
    ],
    towns: [
      { id: "mansfield",    name: "Mansfield",    blurb: "Cattle country gateway · 50 min to Buller & Stirling" },
      { id: "bright",       name: "Bright",       blurb: "Great Alpine Road hub · gateway to Falls Creek & Hotham" },
      { id: "mount-beauty", name: "Mount Beauty", blurb: "Closest sealed-road town to Falls Creek · 30 min up" },
      { id: "harrietville", name: "Harrietville", blurb: "Last village before Hotham · chains fit on the way up" },
      { id: "dinner-plain", name: "Dinner Plain", blurb: "Alpine village · 10 min from Mt Hotham · ski-in feel" },
      { id: "marysville",   name: "Marysville",   blurb: "Yarra Ranges gateway · 20 min to Lake Mountain" },
      { id: "warburton",    name: "Warburton",    blurb: "Yarra Valley town · closest base to Mt Donna Buang" },
      { id: "omeo",         name: "Omeo",         blurb: "Southern Great Alpine Road · gateway to Hotham from Gippsland" },
    ],
  },
  {
    slug: "tasmania",
    name: "Tasmania",
    subtitle: "TAS · Australia",
    country: "AU",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Ben Lomond", blurb: "Tasmania's only commercial chairlift · weather-dependent, short windows reward locals" },
    ],
    towns: [
      { id: "ben-lomond-base", name: "Ben Lomond Base", blurb: "Tasmania's only chairlift operation · on-mountain village at the foot of the lifts" },
      { id: "launceston",      name: "Launceston",      blurb: "Closest city base for Ben Lomond · ~90 min drive via Jacobs Ladder" },
      { id: "hobart",          name: "Hobart",          blurb: "Tasmania's capital · long day-trips when conditions deliver" },
    ],
  },

  // ── Japan ───────────────────────────────────────────────────────────────
  {
    slug: "yamanouchi",
    name: "Yamanouchi",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: true,
    hasRoads: true,
    mountains: [
      { name: "Shiga Kogen",    blurb: "Japan's largest interconnected ski area · 20 resorts linked" },
      { name: "Ryuoo",          blurb: "Nagano · family resort · accessible from Yudanaka" },
      { name: "XJAM Takaifuji", blurb: "Kita-Shiga · beginner-friendly" },
    ],
    towns: [
      { id: "yudanaka",    name: "Yudanaka",    blurb: "Onsen station town · gateway to Shiga Kogen" },
      { id: "shibu-onsen", name: "Shibu Onsen", blurb: "Traditional ryokan district · 600 m from Yudanaka station" },
      { id: "yomase",      name: "Yomase",      blurb: "Quiet farming village · base for Kita-Shiga resorts" },
    ],
  },
  {
    slug: "nozawa-onsen",
    name: "Nozawa Onsen",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Nozawa Onsen Snow Resort", blurb: "Mt Kenashi summit · long groomers, tree runs and the Nagasaka Olympic course" },
    ],
    towns: [
      { id: "nozawa-onsen-village", name: "Nozawa Onsen", blurb: "Historic onsen village at the base of the resort · 13 free public bathhouses" },
    ],
  },
  {
    slug: "iiyama",
    name: "Iiyama",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Madarao Mountain Resort",             blurb: "Tree-run-famous Madarao · shared 2-mountain pass with Tangram across the ridge" },
      { name: "Tangram Ski Circus",                  blurb: "Niigata-side base of the Madarao massif · family-oriented, lift-linked to Madarao" },
      { name: "Togari Onsen Madarao",                blurb: "Quiet onsen-side mountain · long beginner-intermediate runs above the village" },
      { name: "Kijimadaira · Romance no Kamisama",   blurb: "Wide groomers and family terrain on Mt Kayano" },
      { name: "Kijima Snow Park (Makinoiri Kogen)",  blurb: "Snow play & toboggan park · sledding, snow tubing, kids' first-time terrain" },
    ],
    towns: [
      { id: "iiyama",               name: "Iiyama",        blurb: "Hokuriku Shinkansen gateway · 35 min from Tokyo · bus links to every resort" },
      { id: "madarao-kogen",        name: "Madarao Kogen", blurb: "Plateau ski village · ski-in lodges at the base of Madarao" },
      { id: "togari-onsen-village", name: "Togari Onsen",  blurb: "Quiet onsen hamlet at the base of Togari · minshuku & ryokan" },
      { id: "kijimadaira-village",  name: "Kijimadaira",   blurb: "Valley village between the resort and snow park · family-oriented base" },
    ],
  },
  {
    slug: "hakuba-valley",
    name: "Hakuba Valley",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Hakuba Happo-One",             blurb: "Hakuba's biggest and steepest · 1998 Olympic downhill runs and long Northern Alps views" },
      { name: "Hakuba Goryu (Escal Plaza)",   blurb: "Gentle Toomi base to steep Alps Daira up top · one ticket shared with neighbouring Hakuba 47" },
      { name: "Hakuba 47 Winter Sports Park", blurb: "Renowned terrain park and tree runs · lift-linked and one ticket with Hakuba Goryu" },
      { name: "Hakuba Iwatake Snow Field",    blurb: "Rounded family mountain · home of the Hakuba Mountain Harbor deck, open in the green season too" },
      { name: "Tsugaike Kogen",               blurb: "Vast gentle beginner slope at the base · gated Tsugaike backcountry up high" },
      { name: "Hakuba Norikura Onsen",        blurb: "Quiet Otari mountain · tree skiing off the Alps 11 lift, linked by ticket to Cortina next door" },
      { name: "Hakuba Cortina",               blurb: "Hakuba's powder magnet · deep snow and tree runs under the landmark red hotel" },
      { name: "Hakuba Sanosaka",              blurb: "Southern gateway by Lake Aoki · gentle family slopes with a lake-view run" },
      { name: "Kashimayari (Sun Alpina)",     blurb: "Sun Alpina family resort in Omachi · broad beginner terrain beneath Mt Kashimayari" },
      { name: "Jiigatake",                    blurb: "Gentle south-end learner hill in Omachi · wide easy slopes for first-timers and families" },
    ],
    towns: [
      { id: "hakuba", name: "Hakuba", blurb: "Main Hakuba village · Happo, Goryu, 47, Iwatake and Sanosaka on the doorstep" },
      { id: "otari",  name: "Otari",  blurb: "Northern Otari base · Tsugaike, Cortina and Norikura, the valley's deepest-snow corner" },
      { id: "omachi", name: "Omachi", blurb: "Southern lakes gateway · Kashimayari and Jiigatake at the quiet end of the valley" },
    ],
  },
  {
    slug: "myoko",
    name: "Myoko",
    subtitle: "Niigata · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Akakura Onsen",           blurb: "Myoko's liveliest slopes above the historic onsen village · 100% natural snow and the area's only nightly night skiing" },
      { name: "Akakura Kanko (Akakan)",  blurb: "Japan's first international mountain resort (1937) · long groomers off the Sky Cable beneath the landmark Akakura Kanko Hotel" },
      { name: "Ikenotaira Alpen Blick",  blurb: "Broad, open slopes on Mt Myoko's flank · relaxed cruising above the Ikenotaira onsen village and Imori Pond" },
      { name: "Myoko Suginohara",        blurb: "Japan's longest run · 8.5 km top to bottom off the area's highest lifts, on the Ikon Pass" },
      { name: "Seki Onsen",              blurb: "Two lifts and some of Japan's heaviest snowfall · small, steep and ungroomed on Mt Myoko's north-east side" },
      { name: "Lotte Arai Resort",       blurb: "Big-vertical freeride resort on Mt Okenashi · gated powder zones over 951 m of drop, on the Ikon Pass" },
    ],
    towns: [
      { id: "akakura",          name: "Akakura Onsen",    blurb: "Myoko's main hub village · Akakura Onsen and Akakura Kanko on the doorstep, Seki Onsen up the road" },
      { id: "ikenotaira-onsen", name: "Ikenotaira Onsen", blurb: "Quiet onsen village by Imori Pond · Alpen Blick's slopes rise straight behind town" },
      { id: "suginosawa",       name: "Suginosawa",       blurb: "Small village at the foot of Suginohara · lodges and pensions at the quiet south end" },
      { id: "arai",             name: "Arai",             blurb: "Valley-floor service town · gateway to Lotte Arai's gondola on Mt Okenashi" },
    ],
  },
  {
    slug: "niseko",
    name: "Niseko",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "Niseko Grand Hirafu", blurb: "Niseko's biggest resort · night skiing above Hirafu village and peak gates to the Annupuri summit, on the Niseko United pass (Ikon)" },
      { name: "Niseko Hanazono",     blurb: "Quieter north-east flank linked to Hirafu · powder bowls, tree runs and terrain parks, on the Niseko United pass (Ikon)" },
      { name: "Niseko Village",      blurb: "Gondola from the village base into long fall-line runs · quiet trees between Hirafu and Annupuri, on the Niseko United pass (Ikon)" },
      { name: "Niseko Annupuri",     blurb: "Gentlest of the four united resorts · wide mellow groomers and well-known side-country gates, on the Niseko United pass (Ikon)" },
      { name: "Niseko Moiwa",        blurb: "Small independent hill beside Annupuri · quiet lifts and deep snow, not part of the united pass" },
    ],
    towns: [
      { id: "hirafu",      name: "Hirafu",      blurb: "Niseko's main hub village · Grand Hirafu on the doorstep, Hanazono linked over the hill" },
      { id: "kutchan",     name: "Kutchan",     blurb: "The area's working service town · supermarkets, everyday shops and the nearest train station to Hirafu" },
      { id: "niseko-town", name: "Niseko Town", blurb: "Quieter town on the south-west side · gateway to Niseko Village, Annupuri and Moiwa" },
    ],
  },
  {
    slug: "yuzawa",
    name: "Yuzawa",
    subtitle: "Niigata · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: false,
    mountains: [
      { name: "GALA Yuzawa",       blurb: "Shinkansen straight into the gondola base · linked at the top to Yuzawa Kogen and Ishiuchi Maruyama on the Snow Link ticket" },
      { name: "Yuzawa Kogen",      blurb: "Ropeway straight off the onsen street · gentle high bowl above town, linked at the top to GALA on the Snow Link ticket" },
      { name: "Ishiuchi Maruyama", blurb: "Historic broad hill above Ishiuchi village · big parks and long runs to the valley floor, linked at the top to GALA on the Snow Link ticket" },
      { name: "Iwappara",          blurb: "Wide open slopes on Mt Iiji east of the valley · a long-standing learner and family favourite, independent of the linked resorts" },
      { name: "Kagura",            blurb: "Highest terrain and longest season in the area · three linked zones rising from the Mitsumata base, joined to Naeba by the Dragondola" },
      { name: "Naeba",             blurb: "Big classic resort beneath Mt Takenoko · wide fall-line runs above the Prince hotel base, joined to Kagura by the Dragondola" },
    ],
    towns: [
      { id: "echigo-yuzawa", name: "Echigo-Yuzawa", blurb: "The snow country hub · shinkansen station, onsen street, and the Yuzawa Kogen ropeway right in town" },
      { id: "ishiuchi",      name: "Ishiuchi",      blurb: "Quiet lodge and ryokan village at the north foot of the massif · Ishiuchi Maruyama's lifts on the doorstep" },
      { id: "mitsumata",     name: "Mitsumata",     blurb: "Old post-road hamlet on Route 17 · Kagura's Mitsumata ropeway base, with Naeba a short drive on" },
    ],
  },

  // ── New Zealand ─────────────────────────────────────────────────────────
  {
    slug: "queenstown",
    name: "Queenstown",
    subtitle: "Otago · New Zealand",
    country: "NZ",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Coronet Peak",    blurb: "Closest to Queenstown · early-season snowmaking and night skiing" },
      { name: "The Remarkables", blurb: "Higher, sheltered bowls across the lake · family and park terrain" },
    ],
    towns: [
      { id: "queenstown", name: "Queenstown", blurb: "South Island resort hub · ~25 min to Coronet Peak, ~45 min to The Remarkables" },
    ],
  },
  {
    slug: "wanaka",
    name: "Wanaka",
    subtitle: "Otago · New Zealand",
    country: "NZ",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Cardrona",    blurb: "Wide sunny groomers · NZ's biggest terrain parks and family base" },
      { name: "Treble Cone", blurb: "The steep one · big off-piste and the highest skiable terrain in the lakes" },
    ],
    towns: [
      { id: "wanaka", name: "Wanaka", blurb: "Lakeside base town · ~35 min to Cardrona, ~30 min to Treble Cone" },
    ],
  },
  {
    slug: "mt-hutt",
    name: "Mt Hutt",
    subtitle: "Canterbury · New Zealand",
    country: "NZ",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt Hutt", blurb: "Canterbury's high-alpine basin · long season, closest big field to Christchurch" },
    ],
    towns: [
      { id: "methven", name: "Methven", blurb: "Farm-town base at the foot of the access road · ~35 min up to the lifts" },
    ],
  },
  {
    slug: "ruapehu",
    name: "Ruapehu",
    subtitle: "Central Plateau · New Zealand",
    country: "NZ",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Whakapapa", blurb: "The big one on the northwest face · varied terrain, Knoll Ridge high point" },
      { name: "Turoa",     blurb: "Southwest face above Ohakune · highest lifted terrain in New Zealand" },
    ],
    towns: [
      { id: "ohakune", name: "Ohakune", blurb: "Lively Turoa-side base town · ~17 km up the Ohakune Mountain Road to the lifts" },
    ],
  },
];

/** Region sub-sections that actually render for this region (see gating notes above). */
export function regionFeatures(region) {
  return ["mountains", ...(region.hasAlerts ? ["alerts"] : []), "stay"];
}

/** Town sub-sections that actually render for this region's towns. */
export function townFeatures(region) {
  return ["weather", "stay", "eat", ...(region.hasRoads ? ["roads"] : []), "transport", "explore"];
}
