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
    nameJa: "山ノ内",
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
    nameJa: "野沢温泉",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
    nameJa: "飯山",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
    nameJa: "白馬バレー",
    subtitle: "Nagano · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
    nameJa: "妙高",
    subtitle: "Niigata · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
    nameJa: "ニセコ",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
    slug: "furano",
    name: "Furano",
    nameJa: "富良野",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Furano Ski Resort",      blurb: "Prince-run flagship of central Hokkaido · two linked zones (Kitanomine and Furano) with about 950 m of vertical, on the Ikon Pass from 2025-26" },
      { name: "Kamui Ski Links",        blurb: "Asahikawa's local powder hill about an hour north of Furano · relaxed tree-skiing culture and quiet gondola laps at day-ticket prices" },
      { name: "Hoshino Resorts Tomamu", blurb: "Hotel-tower resort about 50 min south-east of Furano · groomed cruisers off Mt Tomamu, a big kids' programme and the winter Ice Village" },
    ],
    towns: [
      { id: "furano",     name: "Furano",     blurb: "Central Hokkaido's hub town · trains, winter coaches and a 10 minute run up to the ski resort" },
      { id: "kitanomine", name: "Kitanomine", blurb: "Ski village below the Kitanomine gondola · lodges and izakaya walking distance to the lifts" },
    ],
  },
  {
    slug: "sapporo",
    name: "Sapporo",
    nameJa: "札幌",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Sapporo Teine",   blurb: "City powder hill 40 min from downtown Sapporo · two zones (Olympia and Highland) with sea-of-Japan views from Mt Teine and the 1972 Olympic slalom slopes" },
      { name: "Sapporo Kokusai", blurb: "Deep-snow local favourite above Jozankei onsen · wide gondola-served cruisers and some of the heaviest snowfall totals near the city" },
      { name: "Sapporo Bankei",  blurb: "In-city night-skiing hill 20 min from Odori · floodlit runs and lessons, handy for a quick evening ski" },
    ],
    towns: [
      { id: "sapporo",  name: "Sapporo",  blurb: "Hokkaido's capital · stay downtown, ski Teine, Kokusai or Bankei as day hills" },
      { id: "jozankei", name: "Jozankei", blurb: "Hot-spring town in the Toyohira valley · closest beds to Sapporo Kokusai" },
    ],
  },
  {
    slug: "tomamu-sahoro",
    name: "Tomamu & Sahoro",
    nameJa: "トマム・佐幌",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Hoshino Resorts Tomamu", blurb: "Hotel-tower resort off Mt Tomamu on the JR Sekisho Line · groomed cruisers, a big kids' programme, the winter Ice Village and ski-in stays at the towers" },
      { name: "Sahoro Resort",          blurb: "Quiet Tokachi resort on Mt Sahoro above Shintoku · long fall-line cruisers off a single gondola, home to Club Med Sahoro's all-inclusive village" },
    ],
    towns: [
      { id: "tomamu-village", name: "Tomamu",     blurb: "Resort village at the base of Mt Tomamu · hotel towers, the Ice Village and JR Tomamu Station" },
      { id: "shimukappu",     name: "Shimukappu", blurb: "Small village 20 min west of Tomamu · quiet local beds and JR Shimukappu Station on the same line" },
    ],
  },
  {
    slug: "asahikawa",
    name: "Asahikawa",
    nameJa: "旭川",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Kamui Ski Links", blurb: "Asahikawa's local powder hill 40 min west of the city · relaxed tree-skiing culture and quiet gondola laps at day-ticket prices" },
      { name: "Asahidake",       blurb: "Ropeway-served powder on Hokkaido's highest peak in the Daisetsuzan range · ungroomed big-mountain terrain above Asahidake Onsen" },
    ],
    towns: [
      { id: "asahikawa",   name: "Asahikawa",   blurb: "Hokkaido's second city · stay downtown, ski Kamui as a day hill and head up to Asahidake for powder days" },
      { id: "higashikawa", name: "Higashikawa", blurb: "Craft-and-cafe town at the foot of the Daisetsuzan range · the road to Asahidake Onsen and the ropeway starts here" },
    ],
  },
  {
    slug: "rusutsu-kiroro",
    name: "Rusutsu & Kiroro",
    nameJa: "ルスツ・キロロ",
    subtitle: "Hokkaido · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Rusutsu Resort", blurb: "Hokkaido's big all-in-one resort across West Mt, East Mt and Mt Isola · 37 courses and about 42 km of runs, on the Epic Pass" },
      { name: "Kiroro",         blurb: "Deep-snow resort in the hills between Otaru and Sapporo · about 660 m of vertical in one of Hokkaido's heaviest snowfall pockets" },
    ],
    towns: [
      { id: "rusutsu", name: "Rusutsu", blurb: "Small farming village on Route 230 · the resort hotels and lifts are right across the road" },
      { id: "kiroro",  name: "Kiroro",  blurb: "Hotel village at the Kiroro base in Akaigawa · ski-in lodging at the Mountain Center, with Otaru about 40 min downhill" },
    ],
  },
  {
    slug: "minakami",
    name: "Minakami",
    nameJa: "みなかみ",
    subtitle: "Gunma · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Tanigawadake Tenjindaira", blurb: "Ropeway-served snow bowl at 1,319 m on Tanigawa-dake, now Mt.T by Hoshino Resorts · huge snowfalls, a long spring season and famous sidecountry" },
      { name: "Minakami Kogen",           blurb: "Family resort around the ski-in Hotel 200 at 850 m · gentle wide courses, snow activities and kids' areas at the quiet top of the valley" },
      { name: "Norn Minakami",            blurb: "Day-trip hill 5 min off the Kanetsu expressway · compact tree-lined courses to 1,220 m and some of Kanto's best night skiing" },
    ],
    towns: [
      { id: "minakami", name: "Minakami", blurb: "Onsen town on the Tone river · beds, baths and buses to every hill in the valley" },
    ],
  },
  {
    slug: "kusatsu-manza",
    name: "Kusatsu & Manza",
    nameJa: "草津・万座",
    subtitle: "Gunma · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Kusatsu Onsen", blurb: "Historic town hill from 1,245 m to 1,600 m · pulse gondola off the base and the Yubatake baths 10 min down the road" },
      { name: "Manza Onsen",   blurb: "High, cold Prince resort from 1,646 m to 1,994 m above the sulphur springs · reliably dry snow and empty weekday groomers" },
    ],
    towns: [
      { id: "kusatsu-onsen", name: "Kusatsu Onsen", blurb: "One of Japan's most famous onsen towns · the Yubatake steaming in the middle, the ski hill 10 min up the road" },
      { id: "manza-onsen",   name: "Manza Onsen",   blurb: "Sulphur-spring village at 1,800 m · among Japan's highest onsen, with the lifts right off the hotels" },
    ],
  },
  {
    slug: "hachimantai",
    name: "Hachimantai",
    nameJa: "八幡平",
    subtitle: "Iwate · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Hachimantai Panorama",  blurb: "Gentle family hill behind the Hachimantai Mountain Hotel · wide north-facing courses with Mt Iwate views, one ticket with Shimokura" },
      { name: "Hachimantai Shimokura", blurb: "Powder hill on the east slope of Mt Shimokura · wind-sheltered tree lines and very dry snow, 2 km from Panorama by free shuttle" },
    ],
    towns: [
      { id: "hachimantai", name: "Hachimantai", blurb: "Spread-out city below the plateau · Obuke station is the rail gateway, the ski hills 25 min up the hill" },
    ],
  },
  {
    slug: "yuzawa",
    name: "Yuzawa",
    nameJa: "湯沢",
    subtitle: "Niigata · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
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
  {
    slug: "zao-onsen",
    name: "Zao Onsen",
    nameJa: "蔵王温泉",
    subtitle: "Yamagata · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Zao Onsen Ski Resort", blurb: "Yamagata's big classic across a broad juhyo-covered mountainside · about 880 m of vertical to Jizo Sancho at 1,661 m, famous for its snow monsters, on the Ikon Pass" },
    ],
    towns: [
      { id: "zao-onsen", name: "Zao Onsen", blurb: "Hot-spring village at about 880 m with 1,900 years of history · sulfur baths steps from the lifts, ropeways rising straight off the village streets" },
    ],
  },
  {
    slug: "hakkoda-aomori-spring",
    name: "Hakkoda & Aomori Spring",
    nameJa: "八甲田・青森スプリング",
    subtitle: "Aomori · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Hakkoda",       blurb: "Ropeway-served big-mountain riding on Mt Tamoyachi · long ungroomed descents through juhyo snow monsters, more backcountry than resort" },
      { name: "Aomori Spring", blurb: "Quiet powder resort on Mt Iwaki's northwest slopes above Ajigasawa · a gondola and about 545 m of vertical, on its own lift tickets" },
    ],
    towns: [
      { id: "aomori",       name: "Aomori",       blurb: "Prefecture capital on Mutsu Bay · the shinkansen gateway at Shin-Aomori, with the winter Hakkoda-go bus climbing to the ropeway in about an hour" },
      { id: "sukayu-onsen", name: "Sukayu Onsen", blurb: "Historic sulfur bath house at about 900 m in the Hakkoda mountains · the winter bus terminus, in one of Japan's snowiest inhabited places" },
      { id: "ajigasawa",    name: "Ajigasawa",    blurb: "Fishing town on the Sea of Japan coast · the Gono line stops here, with Aomori Spring about 20 minutes up the hill toward Mt Iwaki" },
    ],
  },
  {
    slug: "appi-shizukuishi",
    name: "Appi & Shizukuishi",
    nameJa: "安比・雫石",
    subtitle: "Iwate · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Appi Kogen",  blurb: "One of Tohoku's largest resorts · long groomed runs off a 2.8 km gondola to Mt Maemori, dry inland powder, on the Ikon Pass from 2025-26" },
      { name: "Shizukuishi", blurb: "Prince-operated hill on Takakura that hosted the 1993 Alpine World Championships · about 700 m of vertical, a gondola and ropeway" },
    ],
    towns: [
      { id: "appi-kogen",  name: "Appi Kogen",  blurb: "Purpose-built resort village at the base of the gondola · hotels and pensions at about 620 m, with the JR Hanawa line and a direct Morioka bus" },
      { id: "shizukuishi", name: "Shizukuishi", blurb: "Farming town under Mt Iwate on the Tazawako line · the Akita Shinkansen stops here, with the Prince resort about 15 minutes up the hill" },
      { id: "morioka",     name: "Morioka",     blurb: "Prefecture capital and shinkansen hub · Appi about 50 minutes north, Shizukuishi about 20 minutes west" },
    ],
  },
  {
    slug: "bandai",
    name: "Bandai",
    nameJa: "磐梯",
    subtitle: "Fukushima · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Nekoma Mountain", blurb: "The former Alts Bandai (south) and Nekoma (north) linked by lift into one of Japan's largest resorts · 33 courses from the sunny Lake Inawashiro side to the powder-holding north bowl, on the Ikon Pass" },
      { name: "Grandeco",        blurb: "High-base gondola hill in Urabandai at 1,010-1,590 m · dry Aizu powder, wide groomers with Mt Bandai views and one of Tohoku's longest seasons" },
    ],
    towns: [
      { id: "inawashiro", name: "Inawashiro", blurb: "Lakeside rail gateway on the Ban-etsu West line · winter shuttles up to Nekoma Mountain and Grandeco" },
      { id: "urabandai",  name: "Urabandai",  blurb: "Highland lake district behind Mt Bandai · pensions and resort hotels, closest beds to Grandeco and the Nekoma north side" },
    ],
  },
  {
    slug: "daisen",
    name: "Daisen",
    nameJa: "大山",
    subtitle: "Tottori · Japan",
    country: "JP",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Daisen White Resort", blurb: "Western Japan's biggest ski hill on Mt Daisen · four linked areas from 655 to 1,121 m with Japan-Sea views · a regional day hill under new operators from 2026-27" },
    ],
    towns: [
      { id: "daisenji", name: "Daisenji", blurb: "Temple village at the base of the lifts · inns, onsen baths and the 1,300-year-old Daisenji temple" },
      { id: "yonago",   name: "Yonago",   blurb: "Coastal city hub on the San-in coast · rail and airport gateway, about 40 minutes from the Daisen slopes" },
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

  // ── Canada (BC, Alberta + Québec) ───────────────────────────────────────
  {
    slug: "whistler",
    name: "Whistler",
    subtitle: "British Columbia · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Whistler Mountain",  blurb: "The original 1966 mountain · alpine bowls above a long peak-to-creek descent" },
      { name: "Blackcomb Mountain", blurb: "The higher twin · glacier terrain, 7th Heaven and the Blackcomb Glacier run" },
    ],
    towns: [
      { id: "whistler", name: "Whistler", blurb: "Ski-in village between the two mountains · ~2 hrs from Vancouver on Hwy 99" },
    ],
  },
  {
    slug: "powder-highway",
    name: "Powder Highway",
    subtitle: "BC Interior · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Revelstoke Mountain Resort", blurb: "North America's longest lift-served vertical · 1,713 m top to bottom on Mt Mackenzie" },
      { name: "Kicking Horse",              blurb: "Champagne powder capital · four alpine bowls and 85 inbounds chutes above Golden" },
      { name: "Fernie Alpine Resort",       blurb: "Five alpine bowls in the Lizard Range · one of the biggest snow tallies in the Rockies" },
      { name: "Whitewater",                 blurb: "Independent Kootenay hill · minimal grooming, huge natural snowfall, touring gates" },
      { name: "Kimberley Alpine Resort",    blurb: "Sunny, uncrowded cruisers on North Star Mountain · long lit night runs" },
      { name: "Panorama",                   blurb: "1,300 m of Purcell vertical · Taynton Bowl steeps above long groomed descents" },
    ],
    towns: [
      { id: "revelstoke", name: "Revelstoke", blurb: "Railway town on the Columbia · ~10 min to the gondola base" },
      { id: "golden",     name: "Golden",     blurb: "Trans-Canada town in the Columbia Valley · ~20 min up to Kicking Horse" },
      { id: "fernie",     name: "Fernie",     blurb: "Brick-built Elk Valley town under the Three Sisters · ~5 km to the lifts" },
      { id: "nelson",     name: "Nelson",     blurb: "Heritage arts town on Kootenay Lake · ~20 min up to Whitewater" },
      { id: "kimberley",  name: "Kimberley",  blurb: "Bavarian-themed Rockies town · ~5 min from the Kimberley Alpine base" },
      { id: "invermere",  name: "Invermere",  blurb: "Columbia Valley lake town · ~20 min up Toby Creek Road to Panorama" },
    ],
  },
  {
    slug: "okanagan",
    name: "Okanagan",
    subtitle: "BC Interior · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Big White Ski Resort",         blurb: "BC's biggest ski-in village · dry interior snow and a large gladed high-alpine plateau above Kelowna" },
      { name: "SilverStar Mountain Resort",    blurb: "Victorian-themed ski-through village above Vernon · gentle front side, steep Powder Gulch back bowls" },
      { name: "Apex Mountain Resort",          blurb: "Quiet, steep and uncrowded above Penticton · long fall-line cruisers and the Okanagan's driest snow" },
      { name: "Sun Peaks Resort",              blurb: "Canada's second-largest ski area · Tod, Sundance and Morrisey linked by lift" },
    ],
    towns: [
      { id: "kelowna",   name: "Kelowna",   blurb: "Okanagan Lake city · about 56 km and 1 hr up to the Big White village" },
      { id: "vernon",    name: "Vernon",    blurb: "North Okanagan town · about 22 km up Silver Star Road to the resort" },
      { id: "penticton", name: "Penticton", blurb: "Town between Okanagan and Skaha lakes · about 33 km up Green Mountain Road to Apex" },
      { id: "kamloops",  name: "Kamloops",  blurb: "Thompson Valley city · about 45 min up Sun Peaks Road from Heffley Creek" },
      { id: "sun-peaks", name: "Sun Peaks", blurb: "Ski-through village 45 min above Kamloops · lifts leave from the main street" },
    ],
  },
  {
    slug: "vancouver",
    name: "Vancouver & the Island",
    subtitle: "British Columbia · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Cypress Mountain",              blurb: "The biggest North Shore hill · 2010 Olympic freestyle venue, city day skiing with night runs" },
      { name: "Grouse Mountain",               blurb: "The peak of Vancouver · a Skyride straight up to lit night runs above the city" },
      { name: "Mt Seymour",                    blurb: "The quietest, highest and most family-run North Shore hill · learner terrain and backcountry gates" },
      { name: "Mount Washington Alpine Resort", blurb: "Vancouver Island's destination mountain · a huge maritime snowpack above the Comox Valley, reached by ferry or flight" },
    ],
    towns: [
      { id: "vancouver-city", name: "Vancouver", blurb: "The three North Shore hills are 30-45 min day trips from downtown · night skiing after work" },
      { id: "courtenay",      name: "Courtenay", blurb: "Comox Valley town on Vancouver Island · about 40 min up the road to Mount Washington" },
    ],
  },
  {
    slug: "banff-lake-louise",
    name: "Banff & Lake Louise",
    subtitle: "Alberta · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Banff Sunshine Village",  blurb: "High on the Continental Divide · all-natural snow and a season into late May" },
      { name: "Mt. Norquay",             blurb: "The steep local hill 10 min above town · night skiing and the North American chair" },
      { name: "Lake Louise Ski Resort",  blurb: "Four mountain faces above the Bow Valley · big back bowls, Victoria Glacier views" },
    ],
    towns: [
      { id: "banff",       name: "Banff",       blurb: "Park townsite on the Bow River · shuttle base for all three SkiBig3 mountains" },
      { id: "lake-louise", name: "Lake Louise", blurb: "Small hamlet by the lake · 5 min across the highway from the ski resort base" },
    ],
  },
  {
    slug: "canmore",
    name: "Canmore",
    subtitle: "Alberta · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Nakiska", blurb: "1988 Olympic downhill venue on Mount Allan · fast, reliably groomed Kananaskis pitches" },
    ],
    towns: [
      { id: "canmore", name: "Canmore", blurb: "Bow Valley town outside the park gates · ~45 min down Hwy 40 to Nakiska" },
    ],
  },
  {
    slug: "jasper",
    name: "Jasper",
    subtitle: "Alberta · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Marmot Basin", blurb: "Highest base elevation of any major Canadian ski area · quiet, cold, dry snow" },
    ],
    towns: [
      { id: "jasper", name: "Jasper", blurb: "Rail-town park base on the Athabasca · ~20 min up the road to Marmot Basin" },
    ],
  },
  {
    slug: "quebec-laurentians",
    name: "Laurentians",
    subtitle: "Québec · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Tremblant", blurb: "Eastern Canada's biggest ski area · four faces and the 6 km Nansen run to the village" },
    ],
    towns: [
      { id: "mont-tremblant", name: "Mont-Tremblant", blurb: "Pedestrian village at the gondola base · ~1 hr 45 min north of Montréal" },
    ],
  },
  {
    slug: "quebec-charlevoix",
    name: "Charlevoix",
    subtitle: "Québec · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mont-Sainte-Anne",        blurb: "Three skiable faces 30 min from Québec City · Canada's biggest lit night-ski vertical" },
      { name: "Le Massif de Charlevoix", blurb: "Highest vertical east of the Rockies · 770 m dropping toward the St. Lawrence" },
    ],
    towns: [
      { id: "beaupre",                       name: "Beaupré",                       blurb: "Côte-de-Beaupré town on the river flats · ~10 min up to Mont-Sainte-Anne" },
      { id: "petite-riviere-saint-francois", name: "Petite-Rivière-Saint-François", blurb: "Shoreline village beneath Le Massif · the base station sits at the water's edge" },
    ],
  },
  {
    slug: "quebec-eastern-townships",
    name: "Eastern Townships",
    subtitle: "Québec · Canada",
    country: "CA",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Ski Bromont", blurb: "Seven sectors across Mont Brome · the largest lit night-ski terrain in North America" },
      { name: "Mont Sutton", blurb: "Québec's glade mountain · an interconnected sous-bois network rather than cut trails" },
    ],
    towns: [
      { id: "bromont", name: "Bromont", blurb: "Townships town off Autoroute 10 · ~5 min from the ski hill, 45 min from Montréal" },
      { id: "sutton",  name: "Sutton",  blurb: "Village under the Sutton range near the Vermont line · ~10 min to the lifts" },
    ],
  },

  // ── United States (Colorado) ───────────────────────────────────────────
  {
    slug: "summit-county",
    name: "Summit County",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Breckenridge",     blurb: "historic Victorian mining town's mountain · high alpine terrain above 12,000 ft" },
      { name: "Keystone",         blurb: "three linked mountains · Colorado's most reliable night skiing" },
      { name: "Copper Mountain",  blurb: "naturally divided terrain by ability · roughly midway between Breckenridge and Vail" },
      { name: "Arapahoe Basin",   blurb: "high-alpine independent area · often the state's longest season" },
      { name: "Loveland",         blurb: "no on-mountain lodging, first-tracks locals' favourite on the Continental Divide" },
    ],
    towns: [
      { id: "breckenridge",   name: "Breckenridge",     blurb: "Historic Victorian mining town at the base of the mountain" },
      { id: "keystone",       name: "Keystone / Dillon", blurb: "Purpose-built resort village and the neighbouring reservoir town of Dillon" },
      { id: "copper-mountain", name: "Copper Mountain",  blurb: "Ski-in village at the base, roughly midway between Breckenridge and Vail" },
      { id: "georgetown",     name: "Georgetown",        blurb: "Historic mining town off I-70 · closest base for Arapahoe Basin and Loveland" },
    ],
  },
  {
    slug: "vail-valley",
    name: "Vail Valley",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Vail Mountain",  blurb: "the largest single ski mountain in Colorado · legendary Back Bowls" },
      { name: "Beaver Creek",   blurb: "gated, upscale resort village · impeccably groomed cruisers" },
    ],
    towns: [
      { id: "vail", name: "Vail", blurb: "Bavarian-styled village at the base of Vail Mountain" },
      { id: "avon", name: "Avon", blurb: "Valley town at the base of Beaver Creek, a few minutes up the gated access road" },
    ],
  },
  {
    slug: "aspen-snowmass",
    name: "Aspen Snowmass",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Snowmass",         blurb: "the biggest of the four mountains · full Ikon Pass unlimited access" },
      { name: "Aspen Mountain",   blurb: "steep, expert-leaning terrain rising straight out of downtown Aspen · no green runs" },
      { name: "Aspen Highlands",  blurb: "locals' favourite with Highland Bowl's hike-to extreme terrain" },
      { name: "Buttermilk",       blurb: "gentle, family-friendly terrain · home of the Winter X Games superpipe" },
    ],
    towns: [
      { id: "aspen",            name: "Aspen",            blurb: "Historic mining-town-turned-resort · base for Aspen Mountain, Highlands and Buttermilk" },
      { id: "snowmass-village", name: "Snowmass Village", blurb: "Purpose-built ski-in village about 12 miles from downtown Aspen" },
    ],
  },
  {
    slug: "steamboat",
    name: "Steamboat",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Steamboat Resort", blurb: "home of Champagne Powder® · six interconnected peaks in the Yampa Valley" },
    ],
    towns: [
      { id: "steamboat-springs", name: "Steamboat Springs", blurb: "Ranching-town-turned-resort on the Yampa River · a few minutes' shuttle to the base" },
    ],
  },
  {
    slug: "winter-park",
    name: "Winter Park",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Winter Park Resort", blurb: "Denver's closest big mountain over Berthoud Pass · Mary Jane side is bump-and-glade heavy" },
    ],
    towns: [
      { id: "winter-park", name: "Winter Park", blurb: "Base town at the foot of the resort, about 67 miles from Denver via US-40" },
    ],
  },
  {
    slug: "crested-butte",
    name: "Crested Butte",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Crested Butte Mountain Resort", blurb: "steep, remote and uncrowded · some of the most extreme lift-served terrain in the US" },
    ],
    towns: [
      { id: "crested-butte-town", name: "Crested Butte", blurb: "Historic Victorian mining town about 3 miles from Mt. Crested Butte's resort base" },
    ],
  },
  {
    slug: "telluride",
    name: "Telluride",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Telluride Ski Resort", blurb: "box-canyon setting in the San Juan Mountains · Epic Pass partner resort (up to 7 days)" },
    ],
    towns: [
      { id: "telluride-town", name: "Telluride", blurb: "Historic mining town in a box canyon, connected to Mountain Village by free gondola" },
    ],
  },
  {
    slug: "durango",
    name: "Durango",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Purgatory Resort", blurb: "independent, family-friendly San Juan Mountains resort about 25 miles north of Durango" },
    ],
    towns: [
      { id: "durango-town", name: "Durango", blurb: "Historic railroad town on the Animas River, about 25 miles south of Purgatory" },
    ],
  },
  {
    slug: "boulder-front-range",
    name: "Boulder / Front Range",
    subtitle: "Colorado · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Eldora Mountain Resort", blurb: "the closest lift-served skiing to Denver and Boulder, about an hour up Boulder Canyon" },
    ],
    towns: [
      { id: "nederland", name: "Nederland", blurb: "Small mountain town above Boulder Canyon, about 8 miles from the resort" },
    ],
  },
  {
    slug: "cottonwood-canyons",
    name: "Cottonwood Canyons",
    subtitle: "Utah · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Alta",                         blurb: "ski-only · no snowboarding allowed · classic Wasatch powder, deliberately old-school" },
      { name: "Snowbird",                      blurb: "tram-served big-mountain terrain · Little Cottonwood Canyon's other side" },
      { name: "Brighton",                      blurb: "night skiing pioneer · Big Cottonwood Canyon's laid-back, locals' hill" },
      { name: "Solitude Mountain Resort",      blurb: "understated, uncrowded Big Cottonwood terrain · Ikon Pass partner" },
    ],
    towns: [
      { id: "salt-lake-city", name: "Salt Lake City", blurb: "State capital and international airport gateway, about 30-40 minutes from the canyon mouths" },
      { id: "sandy",          name: "Sandy",           blurb: "Suburb closest to the Little Cottonwood Canyon entrance" },
    ],
  },
  {
    slug: "park-city",
    name: "Park City",
    subtitle: "Utah · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Park City Mountain", blurb: "largest single ski area in the US · joined to Canyons Village · Park City's Epic Pass anchor" },
      { name: "Deer Valley",        blurb: "ski-only · no snowboarding allowed · upscale, famously groomed and limited-ticket terrain" },
    ],
    towns: [
      { id: "park-city-town", name: "Park City", blurb: "Former silver-mining town turned resort hub, about 35 minutes from Salt Lake City" },
    ],
  },
  {
    slug: "ogden-valley",
    name: "Ogden Valley",
    subtitle: "Utah · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Snowbasin",       blurb: "2002 Olympic downhill venue · grand, uncrowded terrain above Ogden Valley" },
      { name: "Powder Mountain", blurb: "largest skiable acreage in Utah · famously low-key, capped daily tickets" },
      { name: "Nordic Valley",   blurb: "small night-skiing hill · 2025-26 season dates unconfirmed at time of writing" },
    ],
    towns: [
      { id: "ogden", name: "Ogden", blurb: "Historic railroad city at the mouth of Ogden Canyon, about 30 minutes from the resorts" },
      { id: "eden",  name: "Eden",  blurb: "Small valley town closest to Powder Mountain and Nordic Valley" },
    ],
  },
  {
    slug: "provo",
    name: "Provo",
    subtitle: "Utah · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Sundance Mountain Resort", blurb: "independent resort founded by Robert Redford · no Ikon or Epic affiliation, Mt. Timpanogos's slopes" },
    ],
    towns: [
      { id: "provo-town",   name: "Provo",    blurb: "Utah Valley's largest city, home to Brigham Young University" },
      { id: "sundance-town", name: "Sundance", blurb: "Small resort community at the base of the mountain, up Provo Canyon" },
    ],
  },
  {
    slug: "cache-valley",
    name: "Cache Valley",
    subtitle: "Utah · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Beaver Mountain", blurb: "family-owned since 1939 · one of the oldest continuously operating resorts in the US" },
      { name: "Cherry Peak",     blurb: "small community hill · 2025-26 opening date unconfirmed by resort at time of writing" },
    ],
    towns: [
      { id: "logan", name: "Logan", blurb: "Cache Valley's main city, home to Utah State University, about 30 minutes from Beaver Mountain" },
    ],
  },
  {
    slug: "north-lake-tahoe",
    name: "North Lake Tahoe",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Palisades Tahoe",       blurb: "2960 acres across two connected mountains · host of the 1960 Winter Olympics" },
      { name: "Northstar California",  blurb: "family-friendly cruisers · Vail-owned, Epic Pass" },
      { name: "Sugar Bowl",             blurb: "Donner Summit classic · Mountain Collective Pass, not Epic or Ikon" },
    ],
    towns: [
      { id: "truckee", name: "Truckee", blurb: "historic railroad town on I-80, the main gateway to North Lake Tahoe's resorts" },
    ],
  },
  {
    slug: "south-lake-tahoe",
    name: "South Lake Tahoe",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Heavenly",                  blurb: "straddles the CA/NV state line · 2025-26 closing date not confirmed by resort at time of writing" },
      { name: "Kirkwood",                  blurb: "high-elevation, snow-reliable · 2025-26 closing date not confirmed by resort at time of writing" },
      { name: "Sierra-at-Tahoe",           blurb: "\u26a0\ufe0f closed for the entire 2025-26 season per the resort's own page — shown here for completeness, not as an open resort" },
      { name: "Homewood Mountain Resort",  blurb: "lakefront skiing on the west shore · reopened for 2025-26 after a full 2024-25 closure" },
    ],
    towns: [
      { id: "south-lake-tahoe-town", name: "South Lake Tahoe", blurb: "the main lodging and services base for the south shore of Lake Tahoe" },
    ],
  },
  {
    slug: "mammoth-lakes",
    name: "Mammoth Lakes",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mammoth Mountain", blurb: "Eastern Sierra giant · often open into June or July on a good season" },
      { name: "June Mountain",    blurb: "quieter sister resort · same ownership and pass as Mammoth Mountain" },
    ],
    towns: [
      { id: "mammoth-lakes-town", name: "Mammoth Lakes", blurb: "the Eastern Sierra base town serving Mammoth Mountain and June Mountain" },
    ],
  },
  {
    slug: "big-bear",
    name: "Big Bear",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Bear Mountain", blurb: "terrain-park focused · 2025-26 closing date reported inconsistently across sources (late Mar 2026)" },
      { name: "Snow Summit",   blurb: "Big Bear's other mountain, shared lift ticket with Bear Mountain · 2025-26 closing date reported inconsistently across sources" },
    ],
    towns: [
      { id: "big-bear-lake", name: "Big Bear Lake", blurb: "Southern California's closest major ski town, about two hours from Los Angeles" },
    ],
  },
  {
    slug: "bear-valley",
    name: "Bear Valley",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Bear Valley Mountain Resort", blurb: "Sierra Nevada resort on Highway 4 · 2025-26 opening date uncertain in source reporting" },
    ],
    towns: [
      { id: "arnold", name: "Arnold", blurb: "Highway 4 gateway community closest to Bear Valley Mountain Resort" },
    ],
  },
  {
    slug: "mt-shasta",
    name: "Mt. Shasta",
    subtitle: "California · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt. Shasta Ski Park", blurb: "small volcano-slope resort in far Northern California · base/summit elevation unverified, closed early for 2025-26 due to lack of snow" },
    ],
    towns: [
      { id: "mount-shasta", name: "Mount Shasta", blurb: "small town at the base of Mt. Shasta, the gateway to Mt. Shasta Ski Park" },
    ],
  },
  {
    slug: "killington-pico",
    name: "Killington/Pico",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Killington", blurb: "Beast of the East · Ikon Pass · typically the earliest and latest resort to operate in the Northeast" },
      { name: "Pico Mountain", blurb: "smaller, quieter neighbor to Killington · 2025-26 closing date not confirmed by resort" },
    ],
    towns: [
      { id: "killington", name: "Killington", blurb: "base town for Killington and Pico Mountain, central Vermont" },
    ],
  },
  {
    slug: "stowe-smugglers-notch",
    name: "Stowe/Smugglers' Notch",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Stowe Mountain Resort", blurb: "Epic Pass · on Vermont's tallest peak, Mt. Mansfield · base elevation reported 1,340–2,035 ft depending on source, treat as approximate" },
      { name: "Smugglers' Notch", blurb: "⚠️ independently owned through the 2025-26 season · acquisition by new ownership announced for Feb 2026 with a joint pass alongside Burke planned from 2026-27, not yet in effect · 2025-26 closing date not confirmed by resort" },
    ],
    towns: [
      { id: "stowe", name: "Stowe", blurb: "classic New England resort town, base for Stowe Mountain Resort" },
      { id: "jeffersonville", name: "Jeffersonville", blurb: "base town for Smugglers' Notch, north side of Mt. Mansfield" },
    ],
  },
  {
    slug: "mad-river-valley",
    name: "Mad River Valley",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Sugarbush", blurb: "Ikon Pass · twin-peak resort (Lincoln Peak & Mt. Ellen) · 2025-26 closing date not confirmed by resort" },
      { name: "Mad River Glen", blurb: "⚠️ ski-only (no snowboarding) · independent, co-operatively owned by its skiers · a trial snowboard-access lift was floated for Feb 29 2026, with a possible permanent policy change starting 2026-27, not yet in effect this season" },
    ],
    towns: [
      { id: "warren", name: "Warren", blurb: "village closest to Sugarbush's Lincoln Peak base" },
      { id: "waitsfield", name: "Waitsfield", blurb: "Mad River Valley's commercial hub, close to both Sugarbush and Mad River Glen" },
    ],
  },
  {
    slug: "southern-vermont",
    name: "Southern Vermont",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Stratton", blurb: "Ikon Pass · gondola-served summit, one of southern Vermont's largest resorts · confirmed 2025-26 season (opened Nov 26 2025, closed Apr 12 2026)" },
      { name: "Mount Snow", blurb: "Epic Pass · Vail's Northeast group with Stowe and Okemo · 2025-26 closing date not confirmed by resort" },
      { name: "Bromley Mountain", blurb: "Indy Pass (first season on Indy for 2025-26) · Vermont's highest base elevation · south-facing sun exposure · 2025-26 closing date not confirmed by resort" },
      { name: "Magic Mountain", blurb: "⚠️ did not open for the 2025-26 season — lowest snowfall in 20+ years produced the resort's first non-opening in over 20 years under Miller family ownership" },
    ],
    towns: [
      { id: "stratton", name: "Stratton", blurb: "base village for Stratton mountain" },
      { id: "west-dover", name: "West Dover", blurb: "base town for Mount Snow" },
      { id: "peru-vt", name: "Peru", blurb: "small village near Bromley Mountain and Manchester" },
      { id: "manchester-vt", name: "Manchester", blurb: "southern Vermont's commercial hub, close to Bromley and Magic Mountain" },
    ],
  },
  {
    slug: "okemo",
    name: "Okemo",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Okemo Mountain Resort", blurb: "Epic Pass · Vail's Northeast group with Stowe and Mount Snow · known for wide groomers and strong beginner terrain" },
    ],
    towns: [
      { id: "ludlow", name: "Ludlow", blurb: "base town for Okemo Mountain Resort" },
    ],
  },
  {
    slug: "jay-peak-nek",
    name: "Jay Peak/Northeast Kingdom",
    subtitle: "Vermont · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Jay Peak", blurb: "independent · highest average annual snowfall in the East, close to the Canadian border" },
      { name: "Burke Mountain", blurb: "independent · 2025-26 closing date not confirmed by resort · joint pass with Smugglers' Notch planned from 2026-27, not yet in effect" },
    ],
    towns: [
      { id: "jay", name: "Jay", blurb: "small village closest to Jay Peak" },
      { id: "east-burke", name: "East Burke", blurb: "base village for Burke Mountain, Northeast Kingdom" },
    ],
  },
  {
    slug: "jackson-hole",
    name: "Jackson Hole",
    subtitle: "Wyoming · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Jackson Hole Mountain Resort", blurb: "Ikon Pass (Full only) · legendary steep terrain, 4,139 ft vertical · reservation required for Ikon/Mountain Collective 2025-26" },
      { name: "Snow King Mountain", blurb: "Indy Pass + Powder Alliance · in-town, night skiing · official 2025-26 closing Mar 22 2026 per resort" },
    ],
    towns: [
      { id: "jackson", name: "Jackson", blurb: "Jackson Hole's town hub, close to Snow King Mountain" },
      { id: "teton-village", name: "Teton Village", blurb: "base village for Jackson Hole Mountain Resort" },
    ],
  },
  {
    slug: "grand-targhee",
    name: "Grand Targhee",
    subtitle: "Wyoming · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Grand Targhee Resort", blurb: "Mountain Collective Pass (not Ikon/Epic) · deepest average annual snowfall on the west side of the Tetons" },
    ],
    towns: [
      { id: "alta-wy", name: "Alta", blurb: "small Wyoming town at the base of Grand Targhee Resort" },
    ],
  },
  {
    slug: "big-sky",
    name: "Big Sky",
    subtitle: "Montana · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Big Sky Resort", blurb: "Ikon Pass (Full, no blackouts) · \"The Biggest Skiing in America\" · ~5,850 skiable acres, 4,350 ft vertical · official 2025-26 closing day Apr 26 2026 per resort" },
    ],
    towns: [
      { id: "big-sky-town", name: "Big Sky", blurb: "base town for Big Sky Resort, midway between Bozeman and Yellowstone's West Entrance" },
    ],
  },
  {
    slug: "bozeman-bridger-bowl",
    name: "Bozeman",
    subtitle: "Montana · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Bridger Bowl", blurb: "independent nonprofit · ⚠️ closed early for the 2025-26 season on Mar 22 2026 due to low snowfall, expected back to its normal schedule for 2026-27" },
    ],
    towns: [
      { id: "bozeman", name: "Bozeman", blurb: "university town and gateway to Bridger Bowl" },
    ],
  },
  {
    slug: "whitefish",
    name: "Whitefish",
    subtitle: "Montana · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Whitefish Mountain Resort", blurb: "independent · known locally as \"Big Mountain\" · official 2025-26 closing day Apr 5 2026 per resort" },
    ],
    towns: [
      { id: "whitefish-town", name: "Whitefish", blurb: "lakeside base town for Whitefish Mountain Resort, near Glacier National Park" },
    ],
  },
  {
    slug: "red-lodge",
    name: "Red Lodge",
    subtitle: "Montana · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Red Lodge Mountain", blurb: "Indy Pass member · ⚠️ 2025-26 closing date not confirmed by a dated primary source · no dedicated avalanche-forecast coverage for this area" },
    ],
    towns: [
      { id: "red-lodge-town", name: "Red Lodge", blurb: "historic base town for Red Lodge Mountain, gateway to the Beartooth Mountains" },
    ],
  },
  {
    slug: "taos",
    name: "Taos",
    subtitle: "New Mexico · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Taos Ski Valley", blurb: "Ikon Pass (Full, no blackouts) · independent ownership · sole access via NM-150, a narrow, steep, switchback road · ⚠️ closed early for 2025-26 on Mar 29 2026 due to unseasonably warm weather" },
    ],
    towns: [
      { id: "taos-ski-valley-town", name: "Taos Ski Valley", blurb: "base village at the literal end of NM-150, directly at the foot of Taos Ski Valley" },
    ],
  },
  {
    slug: "angel-fire",
    name: "Angel Fire",
    subtitle: "New Mexico · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Angel Fire Resort", blurb: "Powder Alliance member · New Mexico's only night skiing · confirmed season Dec 12 2025 - Mar 22 2026" },
    ],
    towns: [
      { id: "angel-fire", name: "Angel Fire", blurb: "Moreno Valley town near Wheeler Peak, gateway to Angel Fire Resort" },
    ],
  },
  {
    slug: "santa-fe",
    name: "Santa Fe",
    subtitle: "New Mexico · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Ski Santa Fe", blurb: "independent · one of the highest-base-elevation resorts in the US (10,350 ft base) · ⚠️ closed early for 2025-26 on Mar 22 2026 due to unseasonably warm, dry conditions" },
    ],
    towns: [
      { id: "santa-fe", name: "Santa Fe", blurb: "New Mexico's state capital, roughly 30 minutes' drive from Ski Santa Fe" },
    ],
  },
  {
    slug: "albuquerque-sandia",
    name: "Albuquerque",
    subtitle: "New Mexico · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Sandia Peak Ski Area", blurb: "Mountain Capital Partners \"Power Pass\" · ⚠️ verify-status resort: exact 2025-26 closing date and total operating days unconfirmed by any dated source · no confirmed live webcam" },
    ],
    towns: [
      { id: "albuquerque", name: "Albuquerque", blurb: "New Mexico's largest city, roughly 30-45 minutes' drive from Sandia Peak Ski Area" },
    ],
  },
  {
    slug: "mt-hood",
    name: "Mt. Hood",
    subtitle: "Oregon · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt. Hood Meadows", blurb: "Indy Pass (2 days, select blackouts) + Indy+ Pass (2 days, no blackouts) · not on Epic or Ikon" },
      { name: "Timberline Lodge", blurb: "Mt. Hood Fusion Pass (bundled with Skibowl) · famous for near-year-round skiing via the Palmer Snowfield · ⚠️ vertical-drop figure disputed across sources (resort's own 4,540 ft claim vs. ~3,590-3,690 ft per independent aggregators)" },
      { name: "Mt. Hood Skibowl", blurb: "Mt. Hood Fusion Pass + Powder Alliance in its own right · America's largest lit night-skiing operation" },
    ],
    towns: [
      { id: "government-camp", name: "Government Camp", blurb: "small mountain village on US-26, gateway to Timberline Lodge and Mt. Hood Skibowl; Mt. Hood Meadows is a short drive further up OR-35" },
    ],
  },
  {
    slug: "bend",
    name: "Bend",
    subtitle: "Oregon · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt. Bachelor", blurb: "Ikon Pass destination · 360°-skiable volcanic cone, one of the largest lift-served ski areas in the US by skiable acreage · ⚠️ avalanche forecasting here is from the smaller, volunteer-run Central Oregon Avalanche Center (COAC), not NWAC" },
    ],
    towns: [
      { id: "bend", name: "Bend", blurb: "Central Oregon's largest city, roughly 30 minutes' drive from Mt. Bachelor via Cascade Lakes Highway/OR-372" },
    ],
  },
  {
    slug: "crystal-mountain",
    name: "Crystal Mountain",
    subtitle: "Washington · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Crystal Mountain Resort", blurb: "Ikon Pass (Full tier, no blackouts) · independent (Alterra-owned) · the largest ski area in Washington by vertical drop (3,100 ft) · ⚠️ SR-410 flood damage delayed the 2025-26 opening to approx. Dec 20-24, 2025; no confirmed season-closing date found" },
    ],
    towns: [
      { id: "enumclaw", name: "Enumclaw", blurb: "gateway town on SR-410, the primary access route to Crystal Mountain Resort" },
    ],
  },
  {
    slug: "snoqualmie-pass",
    name: "Snoqualmie Pass",
    subtitle: "Washington · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "The Summit at Snoqualmie", blurb: "Ikon Pass (Full tier, no blackouts) · independent (Boyne Resorts-owned) · four base areas under one ticket (Summit West/Central/East + Alpental) · ⚠️ 2025-26 season opened Dec 23, 2025 with only Summit West running; other sub-areas' dates unconfirmed" },
    ],
    towns: [
      { id: "snoqualmie-pass-town", name: "Snoqualmie Pass", blurb: "small community directly on I-90 at the pass summit, adjacent to all four Summit at Snoqualmie base areas" },
    ],
  },
  {
    slug: "stevens-pass",
    name: "Stevens Pass",
    subtitle: "Washington · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Stevens Pass Ski Area", blurb: "Vail Resorts' Epic Local Pass (no blackouts) · sole highway access via US-2 · ⚠️ Dec 2025 US-2 flood closure delayed the 2025-26 opening to Dec 29, 2025; elevation figures are inconsistent across sources" },
    ],
    towns: [
      { id: "skykomish", name: "Skykomish", blurb: "small town on US-2, roughly 20 minutes' drive from Stevens Pass Ski Area" },
    ],
  },
  {
    slug: "mt-baker",
    name: "Mt. Baker",
    subtitle: "Washington · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Mt. Baker Ski Area", blurb: "Independent · no major-pass affiliation · holds the world record for most snowfall in a season (1,140 in., 1998-99, verified by NOAA) · confirmed 2025-26 season Dec 21, 2025 - Apr 19, 2026 · ⚠️ no confirmed live webcam" },
    ],
    towns: [
      { id: "glacier", name: "Glacier", blurb: "small town on SR-542 (Mt. Baker Highway), the sole access route to Mt. Baker Ski Area" },
    ],
  },
  {
    slug: "sun-valley",
    name: "Sun Valley",
    subtitle: "Idaho · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Bald Mountain", blurb: "Ikon Pass (Full tier, no blackouts) + Mountain Collective · the largest ski area in Idaho by vertical drop (3,400 ft) · confirmed 2025-26 season Dec 3, 2025 - Apr 12, 2026" },
      { name: "Dollar Mountain", blurb: "Ikon Pass (Full tier, no blackouts) + Mountain Collective, shared with Bald Mountain · beginner-oriented · ⚠️ season-closing date not separately confirmed" },
    ],
    towns: [
      { id: "ketchum", name: "Ketchum", blurb: "base town for the Sun Valley resort complex, adjacent to both Bald Mountain and Dollar Mountain via ID-75" },
    ],
  },
  {
    slug: "sandpoint",
    name: "Sandpoint",
    subtitle: "Idaho · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Schweitzer Mountain Resort", blurb: "Ikon Pass (destination tier) · independent · the 2nd largest ski area in Idaho by vertical drop (2,440 ft) · confirmed 2025-26 season Dec 3, 2025 - Apr 5, 2026, despite a \"historically low snow\" season · ⚠️ Idaho Panhandle region runs on Pacific time, not Mountain time like the rest of Idaho" },
    ],
    towns: [
      { id: "sandpoint", name: "Sandpoint", blurb: "town on Lake Pend Oreille, roughly 30 minutes' drive from Schweitzer Mountain Resort" },
    ],
  },
  {
    slug: "boise",
    name: "Boise",
    subtitle: "Idaho · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Bogus Basin", blurb: "Nonprofit 501(c)(3), largest nonprofit ski area in the US · Powder Alliance/Freedom Pass · ⚠️ CLOSED EARLY for 2025-26 on Mar 22, 2026 due to unseasonably warm weather · ⚠️ no dedicated avalanche-forecast center covers this region" },
    ],
    towns: [
      { id: "boise", name: "Boise", blurb: "Idaho's state capital, roughly 45 minutes' drive from Bogus Basin via Bogus Basin Road" },
    ],
  },
  {
    slug: "donnelly-mccall",
    name: "Donnelly / McCall",
    subtitle: "Idaho · USA",
    country: "US",
    hasAlerts: false,
    hasRoads: true,
    mountains: [
      { name: "Tamarack Resort", blurb: "Indy Pass (capped redemptions); joining Ikon as a Bonus Mountain from 2026-27 · confirmed 2025-26 season opened Dec 22, 2025 · ⚠️ ownership/financial status is a genuinely unresolved conflict in sources — not asserted as fact either way" },
      { name: "Brundage Mountain", blurb: "Indy Pass member · independent · 70 trails, 6 lifts, no night skiing" },
    ],
    towns: [
      { id: "donnelly", name: "Donnelly", blurb: "Valley County town on ID-55, roughly midway between Tamarack Resort and Brundage Mountain near McCall" },
    ],
  },
  {
    slug: "white-mountains", name: "White Mountains", subtitle: "New Hampshire · USA", country: "US", hasAlerts: false, hasRoads: true,
    mountains: [{ name: "Cranmore Mountain", blurb: "Ikon Bonus Mountain (Full Pass only) · White Mountain Superpass" }, { name: "Wildcat Mountain", blurb: "Epic Pass · Vail Resorts-owned · near MWAC's Presidential Range backcountry forecast area · ⚠️ no confirmed live official webcam" }, { name: "Attitash Mountain Resort", blurb: "Epic Pass · Vail Resorts-owned · ⚠️ no distinct first-party snow-report or live webcam URL confirmed" }],
    towns: [{ id: "north-conway", name: "North Conway", blurb: "Mount Washington Valley base town for Cranmore, Attitash and Wildcat" }],
  },
  {
    slug: "franconia-notch", name: "Franconia Notch", subtitle: "New Hampshire · USA", country: "US", hasAlerts: false, hasRoads: true,
    mountains: [{ name: "Cannon Mountain", blurb: "Indy Pass · United States' only state-owned ski area · White Mountain Superpass" }, { name: "Bretton Woods", blurb: "independent Omni-owned resort · anchors the White Mountain Superpass" }, { name: "Loon Mountain", blurb: "Boyne Resorts-owned · Ikon Pass (7 days Full / 5 days Base, Base blackouts)" }],
    towns: [{ id: "franconia", name: "Franconia", blurb: "Franconia Notch gateway town for Cannon Mountain" }, { id: "bretton-woods-town", name: "Bretton Woods", blurb: "on-mountain base village for Bretton Woods" }],
  },
  { slug: "waterville-valley", name: "Waterville Valley", subtitle: "New Hampshire · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Waterville Valley Resort", blurb: "Indy Pass (no blackouts on Indy Base) · White Mountain Superpass · ⚠️ 2025-26 closing date not confirmed" }], towns: [{ id: "waterville-valley-town", name: "Waterville Valley", blurb: "mountain base village reached from I-93 via NH-49" }] },
  { slug: "lakes-region", name: "Lakes Region", subtitle: "New Hampshire · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Gunstock Mountain Resort", blurb: "Belknap County-owned · no major-pass affiliation · historical 2022 governance turmoil, operations have continued normally since" }], towns: [{ id: "gilford", name: "Gilford", blurb: "Lake Winnipesaukee-side base town for Gunstock" }] },
  { slug: "carrabassett-valley", name: "Carrabassett Valley", subtitle: "Maine · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Sugarloaf", blurb: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · ⚠️ webcam sub-URL unconfirmed" }], towns: [{ id: "carrabassett-valley-town", name: "Carrabassett Valley", blurb: "Sugarloaf base town" }] },
  { slug: "newry-bethel", name: "Newry / Bethel", subtitle: "Maine · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Sunday River", blurb: "Boyne Resorts-owned · Ikon Full 7 unrestricted / Base 5 days with blackouts · Boyne New England Pass · ⚠️ webcam sub-URL unconfirmed" }], towns: [{ id: "newry", name: "Newry", blurb: "Sunday River eight-peak base town" }] },
  { slug: "rangeley", name: "Rangeley", subtitle: "Maine · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Saddleback Mountain", blurb: "Indy Pass, no blackouts · reopened 2020 under Arctaris after five-year closure · SKI Magazine readers' #1 East 2025 · ⚠️ exact close unconfirmed" }], towns: [{ id: "rangeley", name: "Rangeley", blurb: "Rangeley Lakes gateway to Saddleback" }] },
  { slug: "lake-placid", name: "Lake Placid", subtitle: "Adirondacks · New York · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Whiteface Mountain", blurb: "ORDA / shared SKI3 pass · new Mountain Collective 2025-26 · total vs lift-served vertical caveat · ⚠️ close/cam unconfirmed" }], towns: [{ id: "lake-placid", name: "Lake Placid", blurb: "Olympic Whiteface base town" }, { id: "wilmington", name: "Wilmington", blurb: "Whiteface's immediate base town" }] },
  { slug: "north-creek", name: "North Creek", subtitle: "Adirondacks · New York · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Gore Mountain", blurb: "ORDA / shared SKI3 pass · official Base Area Webcam" }], towns: [{ id: "north-creek", name: "North Creek", blurb: "Gore Mountain base town" }] },
  { slug: "hunter", name: "Hunter", subtitle: "Catskills · New York · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Hunter Mountain", blurb: "Vail Resorts · Epic Pass · ⚠️ projected close unconfirmed" }], towns: [{ id: "hunter", name: "Hunter", blurb: "Hunter Mountain base town" }] },
  { slug: "windham", name: "Windham", subtitle: "Catskills · New York · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Windham Mountain Club", blurb: "private semi-private club · left Ikon 2025-26 (first ever) · reported $175k-$200k memberships · access / official 1,600 ft vertical (~1,400-1,450 ft community dispute) need verification" }], towns: [{ id: "windham", name: "Windham", blurb: "verify public mountain access before travel" }] },
  { slug: "highmount", name: "Highmount", subtitle: "Catskills · New York · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Belleayre Mountain", blurb: "ORDA / shared SKI3 pass · official webcam · ⚠️ projected close unconfirmed" }], towns: [{ id: "highmount", name: "Highmount", blurb: "Belleayre Mountain base settlement" }] },
  { slug: "harbor-springs", name: "Harbor Springs", subtitle: "Michigan · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Boyne Mountain", blurb: "Boyne-owned · Ikon Pass / Boyne Passport" }, { name: "The Highlands", blurb: "Boyne-owned · Ikon Pass · separate official live webcam URL unconfirmed" }, { name: "Nub's Nob", blurb: "independent · Indy Pass partner with unusual blackout dates" }], towns: [{ id: "harbor-springs-town", name: "Harbor Springs", blurb: "Little Traverse Bay base town for the northern Michigan resorts" }] },
  { slug: "keweenaw-peninsula", name: "Keweenaw Peninsula", subtitle: "Michigan · USA", country: "US", hasAlerts: false, hasRoads: true, mountains: [{ name: "Mt. Bohemia", blurb: "independent · expert-focused · genuine zero grooming and zero snowmaking · no confirmed official live webcam" }], towns: [{ id: "mohawk", name: "Mohawk", blurb: "Keweenaw Peninsula base town for Mt. Bohemia; officially Eastern Time" }] },

  {slug:"poconos",name:"Poconos",subtitle:"Pennsylvania · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Camelback Mountain Resort",blurb:"⚠️ Vail/Epic ownership confirmed, but Ikon + Peak to Peak Pocono claims require direct re-verification"},{name:"Blue Mountain Resort",blurb:"Ikon partner · Pennsylvania's vertical-drop leader"},{name:"Shawnee Mountain Ski Area",blurb:"independent · Indy Pass · no confirmed live webcam"}],towns:[{id:"tannersville",name:"Tannersville",blurb:"Poconos base town"},{id:"pocono-manor",name:"Pocono Manor",blurb:"Poconos lodging base"}]},
  {slug:"laurel-highlands",name:"Laurel Highlands",subtitle:"Pennsylvania · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Seven Springs Mountain Resort",blurb:"Vail/Epic · Pennsylvania's largest by acreage"},{name:"Blue Knob All Seasons Resort",blurb:"independent · Indy Pass · Pennsylvania's highest-elevation ski mountain"}],towns:[{id:"seven-springs-town",name:"Seven Springs",blurb:"Laurel Highlands base area"}]},

  {slug:"berkshires",name:"Berkshires",subtitle:"Massachusetts · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Jiminy Peak",blurb:"independent · Ikon Bonus Mountain"},{name:"Ski Butternut",blurb:"independent · Ikon Bonus Mountain"},{name:"Berkshire East",blurb:"Indy Pass · Bear Den Partners 2026 acquisition · longer regional drive · no confirmed live webcam"}],towns:[{id:"hancock",name:"Hancock",blurb:"Jiminy Peak base town"},{id:"great-barrington",name:"Great Barrington",blurb:"Southern Berkshires base town"}]},
  {slug:"central-massachusetts",name:"Central Massachusetts",subtitle:"Massachusetts · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Wachusett Mountain",blurb:"independent · “Boston's Mountain” day-trip and night-skiing identity"}],towns:[{id:"princeton-ma",name:"Princeton",blurb:"Wachusett base town"}]},

  {slug:"lutsen-north-shore",name:"Lutsen / North Shore",subtitle:"Minnesota · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Lutsen Mountains",blurb:"Indy Pass 2025-26 · ⚠️ confirmed Ikon move 2026-27 · Minnesota's largest/highest vertical, not Midwest highest"}],towns:[{id:"lutsen",name:"Lutsen",blurb:"North Shore base town; Highway 61 lake-effect closure risk"}]},

  {slug:"wausau",name:"Wausau",subtitle:"Wisconsin · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Granite Peak Ski Area",blurb:"Midwest Family Ski Resorts, not Nash/Skyline · Indy 2025-26 · ⚠️ Ikon 2026-27"}],towns:[{id:"wausau-town",name:"Wausau",blurb:"Rib Mountain base city"}]},
  {slug:"wisconsin-dells",name:"Wisconsin Dells",subtitle:"Wisconsin · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Cascade Mountain",blurb:"independent Walz family · no multi-resort pass (not Indy) · ⚠️ Flash webcam likely broken"}],towns:[{id:"portage",name:"Portage",blurb:"Dells-area base town"}]},
  {slug:"snowshoe",name:"Snowshoe",subtitle:"West Virginia · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Snowshoe Mountain",blurb:"Ikon Pass / Alterra · Mid-Atlantic’s largest vertical (~1,500 ft) · snowmaking is central to operations · ⚠️ distinct first-party conditions URL not independently confirmed."}],towns:[{id:"snowshoe-town",name:"Snowshoe",blurb:"Remote Cheat Mountain base community for Snowshoe Mountain."}]},
  {slug:"canaan-valley",name:"Canaan Valley",subtitle:"West Virginia · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Canaan Valley Resort",blurb:"West Virginia State Park system / state-owned resort · ⚠️ exact 2025–26 dates and current pass affiliation require direct confirmation."},{name:"Timberline Mountain",blurb:"Independent (not Indy, Epic or Ikon) · correctly grouped in Canaan Valley, not Snowshoe · core snowmaking operations."}],towns:[{id:"canaan-valley-town",name:"Davis / Canaan Valley",blurb:"Davis/Canaan Valley base area; Canaan Valley Resort and Timberline are only ~2–3 miles apart."}]},
  {slug:"high-country",name:"High Country",subtitle:"North Carolina · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Sugar Mountain",blurb:"Independent (not Indy, Epic or Ikon) · heavy snowmaking reliance · ⚠️ dedicated live conditions URL not independently confirmed."},{name:"Beech Mountain Resort",blurb:"Independent · use beechmountainresort.com (ski operations), not beechmtn.com tourism site · heavy snowmaking reliance · ⚠️ webcam live status needs in-season confirmation."}],towns:[{id:"banner-elk-beech-mountain",name:"Banner Elk / Beech Mountain",blurb:"High Country base towns serving Sugar Mountain and Beech Mountain."}]},
  {slug:"maggie-valley",name:"Maggie Valley",subtitle:"North Carolina · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Cataloochee Ski Area",blurb:"Indy Pass · independently owned · “First in Skiing in the South” · heavy snowmaking reliance."}],towns:[{id:"maggie-valley-town",name:"Maggie Valley",blurb:"Maggie Valley base town for Cataloochee Ski Area."}]},
  {slug:"blue-ridge",name:"Blue Ridge",subtitle:"Virginia · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Wintergreen Resort",blurb:"Indy Pass (recent addition) · ownership history: James C. Justice II → EPR Properties → Pacific Group Resorts · heavy snowmaking reliance."}],towns:[{id:"wintergreen-town",name:"Wintergreen",blurb:"Blue Ridge base community for Wintergreen Resort."}]},
  {slug:"shenandoah-valley",name:"Shenandoah Valley",subtitle:"Virginia · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Massanutten Resort",blurb:"Indy Pass · four-season resort · heavy snowmaking reliance · ⚠️ exact 2025–26 closing day and dedicated first-party webcam URL unconfirmed."}],towns:[{id:"mcgaheysville",name:"McGaheysville",blurb:"Shenandoah Valley base town for Massanutten Resort."}]},
  {slug:"lake-tahoe-nevada",name:"Lake Tahoe Nevada",subtitle:"Nevada · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Mt. Rose Ski Tahoe",blurb:"Independent · Tahoe’s highest base elevation (8,260 ft) · ⚠️ 2025–26 close-date sources conflict; official snow-report figure preferred."},{name:"Diamond Peak",blurb:"Independent; operated by Incline Village General Improvement District · Sierra Avalanche Center has a dedicated Diamond Peak page · actual 2025–26 close was March 29 after warm weather."}],towns:[{id:"incline-village",name:"Incline Village",blurb:"Nevada-side Lake Tahoe base town; this region is distinct from existing California-side Tahoe coverage."}]},
  {slug:"flagstaff",name:"Flagstaff",subtitle:"Arizona · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Arizona Snowbowl",blurb:"Independent proprietary Power Pass · high-elevation, snowmaking-reliant operation · ⚠️ Upper Bowl has genuine informal avalanche-terrain risk despite no formal state forecast center."}],towns:[{id:"flagstaff-town",name:"Flagstaff",blurb:"Flagstaff base city for Arizona Snowbowl. America/Phoenix remains MST (UTC−7) year-round; Arizona does not observe DST."}]},
  {slug:"white-mountains-az",name:"White Mountains",subtitle:"Arizona · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Sunrise Park Resort",blurb:"White Mountain Apache Tribe-owned · Indy Pass · ⚠️ summit reports conflict (~10,924 vs 11,000 ft) and require direct resort confirmation; no confirmed webcam URL."}],towns:[{id:"greer-az",name:"Greer",blurb:"Greer base town for Sunrise Park. America/Phoenix remains MST (UTC−7) year-round; Arizona does not observe DST."}]},
  {slug:"black-hills",name:"Black Hills",subtitle:"South Dakota · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Terry Peak",blurb:"Indy Pass · summit 7,100 ft / ~1,100-ft vertical · ⚠️ standalone conditions and confirmed live webcam URLs remain unresolved"}],towns:[{id:"lead-deadwood",name:"Lead / Deadwood",blurb:"Black Hills base towns are in Mountain Time (America/Denver), not Central Time."}]},
  {slug:"girdwood",name:"Girdwood",subtitle:"Alaska · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Alyeska Resort",blurb:"Ikon Pass since 2023 · Pomeroy Lodging-owned · defining aerial tram · ⚠️ elevation/vertical figures vary depending on whether tram-served terrain is included."}],towns:[{id:"girdwood-town",name:"Girdwood",blurb:"Girdwood base community for Alyeska, reached from Anchorage via the Seward Highway; monitor avalanche-related closures."}]},
  {slug:"juneau",name:"Juneau",subtitle:"Alaska · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Eaglecrest Ski Area",blurb:"City and Borough of Juneau-owned · ⚠️ material operational risk: roughly $1M/year city subsidy, gondola cancelled May 2026, staff reductions and future beyond 2026–27 uncertain · no confirmed webcam feed."}],towns:[{id:"juneau-town",name:"Juneau",blurb:"Juneau has no road connection to Alaska’s contiguous highway system; Eaglecrest access is by local road after arrival by ferry or plane."}]},
  {slug:"litchfield-hills",name:"Litchfield Hills",subtitle:"Connecticut · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Mohawk Mountain",blurb:"Indy Pass · 100% snowmaking · historically credited as the birthplace of modern snowmaking · ⚠️ 2025–26 closing date is not primary-source confirmed."}],towns:[{id:"cornwall-ct",name:"Cornwall",blurb:"Litchfield Hills base town for Mohawk Mountain."}]},
  {slug:"vernon",name:"Vernon",subtitle:"New Jersey · USA",country:"US",hasAlerts:false,hasRoads:true,mountains:[{name:"Mountain Creek Resort",blurb:"Independent Snow Partners ownership (acquired from Koffman family in 2018; formerly Snow Operating) · not Vail-owned and not Epic/Ikon/Indy · 100% snowmaking · limited confirmed webcam coverage."}],towns:[{id:"vernon-nj",name:"Vernon",blurb:"Vernon base town for Mountain Creek Resort."}]},

];

/** Region sub-sections that actually render for this region (see gating notes above).
 * /alerts renders for EVERY region since Aug 2026: regions without a custom
 * Alerts page fall back to the generic RegionAlerts (RegionLayout), so the
 * hasAlerts flag no longer gates the route. */
export function regionFeatures(region) {
  return ["mountains", "alerts", "stay"];
}

/** Town sub-sections that actually render for this region's towns. */
export function townFeatures(region) {
  return ["weather", "stay", "eat", ...(region.hasRoads ? ["roads"] : []), "transport", "explore"];
}

// ── Mountain page enumeration ─────────────────────────────────────────────
// /:region/mountain/:id renders a real page for every mountain in the app's
// region registry (src/regions/<slug>.ts). Rather than hand-mirroring those
// ids here (they'd rot), extract them from the region source file at build
// time so new mountains and new regions are picked up automatically.

import { readFileSync } from "node:fs";
import { dirname as _dirname, join as _join } from "node:path";
import { fileURLToPath as _fileURLToPath } from "node:url";

const _here = _dirname(_fileURLToPath(import.meta.url));

/**
 * Returns [{ id, name }] for every mountain defined in
 * src/regions/<slug>.ts. Throws (build fails loudly) if the file is missing
 * or fewer ids are found than the mountains listed for that region above —
 * that means the extraction or the mirror drifted and the sitemap would
 * silently lose pages.
 * @param {{ slug: string, mountains: Array<unknown> }} region
 */
export function regionMountains(region) {
  const file = _join(_here, "..", "src", "regions", `${region.slug}.ts`);
  const src = readFileSync(file, "utf8");
  const mountainsMatch = /mountains\s*:\s*\[/.exec(src);
  const start = mountainsMatch?.index ?? -1;
  if (start === -1) {
    if (region.mountains.length === 0) return [];
    throw new Error(`[seo-regions] no mountains array found in ${file}`);
  }
  // Walk to the matching closing bracket of the mountains array.
  let depth = 0;
  let end = -1;
  for (let i = src.indexOf("[", start); i < src.length; i++) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error(`[seo-regions] unbalanced mountains array in ${file}`);
  const block = src.slice(start, end);
  const out = [];
  const re = /\{\s*id:\s*"([^"]+)"\s*,\s*name:\s*"((?:[^"\\]|\\.)*)"/g;
  for (const m of block.matchAll(re)) out.push({ id: m[1], name: m[2].replace(/\\"/g, '"') });
  if (out.length < region.mountains.length) {
    throw new Error(
      `[seo-regions] extracted ${out.length} mountain ids from ${file} but ${region.mountains.length} mountains are listed for ${region.slug} — extraction drifted, fix before shipping the sitemap`,
    );
  }
  return out;
}

// ── Japanese SEO copy extraction ─────────────────────────────────────────
// Japan pages get Japanese meta descriptions in the prerendered snapshots so
// Google Japan shows Japanese snippets. The app's region registry
// (src/regions/<slug>.ts) already carries nameJa/blurbJa for JP mountains and
// towns — extract them here rather than duplicating the copy. Missing fields
// simply return undefined; prerender.mjs falls back to templated Japanese.

/** Extract nameJa/blurbJa from the object literal containing `id: "<id>"`. */
function extractJaById(src, id) {
  const m = new RegExp(`id:\\s*"${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).exec(src);
  if (!m) return {};
  const start = src.lastIndexOf("{", m.index);
  if (start === -1) return {};
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return {};
  const block = src.slice(start, end);
  return {
    nameJa: /nameJa:\s*"([^"]+)"/.exec(block)?.[1],
    blurbJa: /blurbJa:\s*"([^"]+)"/.exec(block)?.[1],
  };
}

/**
 * Returns { mountains: { [id]: {nameJa?, blurbJa?} }, towns: { [id]: ... } }
 * for a JP region, or null for every other country (English SEO output for
 * non-JP countries must stay unchanged).
 */
export function regionJapanese(region) {
  if (region.country !== "JP") return null;
  const file = _join(_here, "..", "src", "regions", `${region.slug}.ts`);
  const src = readFileSync(file, "utf8");
  const mountains = {};
  for (const m of regionMountains(region)) mountains[m.id] = extractJaById(src, m.id);
  const towns = {};
  for (const t of region.towns) towns[t.id] = extractJaById(src, t.id);
  return { mountains, towns };
}
