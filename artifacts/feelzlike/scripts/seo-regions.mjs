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
  const start = src.indexOf("mountains: [");
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
