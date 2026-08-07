import { Router, type IRouter } from "express";
import { GetWebcamsResponse, GetLocationWebcamsResponse, GetLocationWebcamsParams } from "@workspace/api-zod";
import { locationMatchesRegion, parseRegionParam, RegionParamError } from "../lib/regions.js";

const router: IRouter = Router();

type WebcamType = "mountain" | "road" | "village";

interface WebcamConfig {
  locationId: string;
  locationName: string;
  webcamPageUrl: string;
  webcams: {
    id: string;
    name: string;
    description?: string;
    imageUrl: string;
    pageUrl: string;
    elevation?: number;
    direction?: string;
    type?: WebcamType;
    roadName?: string;
  }[];
}

const THREDBO_S3 = "https://thredbo-services-prod-s3-sftp-server-public.s3.ap-southeast-2.amazonaws.com/webcams";

// Display order for Snowy Mountains is curated (Perisher, Thredbo, Selwyn,
// Charlotte's Pass) - Perisher and Thredbo are the flagship day-tripper
// resorts and lead the list. Selwyn has no public webcams. Charlotte's Pass
// is reachable as a day trip but only via oversnow transfer from Perisher
// (DayTripper package), so it sits last. Keep this order in sync with
// artifacts/feelzlike/src/regions/snowy-mountains.ts.
const WEBCAM_DATA: WebcamConfig[] = [
  {
    locationId: "perisher",
    locationName: "Perisher",
    webcamPageUrl: "https://www.perisher.com.au/reports-cams/cams",
    // Source: https://www.perisher.com.au/reports-cams/cams - all 12 official
    // Perisher snowcams. Image URL pattern: /images/snowcams/X<id>.jpg.
    webcams: ([
      ["front", "Front Valley", "Beginner area looking up Front Valley from Perisher Centre - the heart of the resort."],
      ["smiggin", "Smiggin Holes", "Smiggin Holes village - entry point to the Perisher network."],
      ["bluecow", "Blue Cow", "Blue Cow summit looking across to Guthega and Mt Perisher."],
      ["cowt", "Cow T-Bar", "Cow T-Bar / Brumby area - popular intermediate runs."],
      ["cv", "Crackenback Valley", "Crackenback Valley looking down toward Pretty Valley."],
      ["excelerator", "Excelerator Express", "Top of the Excelerator Express quad - wide alpine view."],
      ["guthegamain", "Guthega Main", "Guthega base - the quietest village in the Perisher network."],
      ["happy", "Happy Valley", "Happy Valley looking toward Mt Perisher - beginner / intermediate slopes."],
      ["kosci", "Kosciuszko Chair", "Top of Mt Perisher Double Chair - looking out toward Mt Kosciuszko."],
      ["mtp", "Mt Perisher", "Mt Perisher summit area - the highest lifted terrain in the resort."],
      ["summit", "Perisher Summit", "Perisher summit panorama across the Main Range."],
      ["v8", "V8 Express", "Top of the V8 Express quad - North Perisher terrain."],
    ] as const).map(([slug, name, description]) => ({
      id: `perisher-${slug}`,
      name,
      description,
      imageUrl: `https://www.perisher.com.au/images/snowcams/X${slug}.jpg`,
      pageUrl: `https://www.perisher.com.au/reports-cams/cams#X${slug}`,
      type: "mountain" as const,
    })),
  },
  {
    locationId: "thredbo",
    locationName: "Thredbo",
    webcamPageUrl: "https://www.thredbo.com.au/weather/snow-cams",
    webcams: [
      {
        id: "thredbo-kosciuszko-express",
        name: "Kosciuszko Express",
        description: "View from the Kosciuszko Express chairlift area",
        imageUrl: `${THREDBO_S3}/KosciuszkoExpress01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 2037,
        direction: "South-East",
        type: "mountain",
      },
      {
        id: "thredbo-cruiser",
        name: "Cruiser",
        description: "Mid-mountain view of the Cruiser area and main ski runs",
        imageUrl: `${THREDBO_S3}/Cruiser01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1700,
        direction: "North-East",
        type: "mountain",
      },
      {
        id: "thredbo-eagles-nest-1",
        name: "Eagles Nest (View 1)",
        description: "View from the Eagles Nest area at the top of the mountain",
        imageUrl: `${THREDBO_S3}/EaglesNest01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1937,
        direction: "North",
        type: "mountain",
      },
      {
        id: "thredbo-eagles-nest-2",
        name: "Eagles Nest (View 2)",
        description: "Second view from the Eagles Nest area overlooking the valley",
        imageUrl: `${THREDBO_S3}/EaglesNest02.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1937,
        direction: "South",
        type: "mountain",
      },
      {
        id: "thredbo-coaster",
        name: "Coaster",
        description: "View from the Coaster area showing snow conditions",
        imageUrl: `${THREDBO_S3}/Coaster01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1365,
        direction: "West",
        type: "mountain",
      },
      {
        id: "thredbo-super-trail",
        name: "Super Trail",
        description: "View of the Super Trail run, one of Thredbo's iconic black runs",
        imageUrl: `${THREDBO_S3}/SuperTrail02.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1800,
        direction: "East",
        type: "mountain",
      },
    ],
  },
  {
    locationId: "charlottes-pass",
    locationName: "Charlotte's Pass",
    webcamPageUrl: "https://www.charlottespass.com.au/snow-cams/",
    webcams: [],
  },
  {
    locationId: "jindabyne",
    locationName: "Jindabyne",
    webcamPageUrl: "https://www.jindabyne.org/webcam/",
    webcams: [],
  },

  // ─── Roadside cams: Snowy Mountains (NSW) ────────────────────────────────
  // pageUrl deep-links to the specific camera on Live Traffic NSW where possible.
  // TfNSW does not operate cameras inside Kosciuszko NP, so we lean on Snowy Hydro
  // (Cabramurra) and the resort village cams for in-park visibility.
  {
    locationId: "snowy-mountains-roads",
    locationName: "Roads to the snowfields",
    webcamPageUrl: "https://www.livetraffic.com/desktop.html#/map/?lat=-36.45&lng=148.45&zoom=10",
    webcams: [
      {
        id: "smh-kosciuszko-perisher-valley",
        name: "Kosciuszko Rd and Perisher Valley",
        description: "Official Live Traffic NSW alpine camera at the Perisher Valley turnoff - the highest point on Kosciuszko Rd, often the first place to ice over. Image refreshes when TfNSW reactivates the camera for snow season.",
        imageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_perisher_valley_kosciuszko_national_park.jpeg",
        pageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_perisher_valley_kosciuszko_national_park.jpeg",
        elevation: 1720,
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-kosciuszko-alpine-way",
        name: "Kosciuszko Rd & Alpine Way",
        description: "Official Live Traffic NSW camera at the Kosciuszko Rd / Alpine Way junction near Jindabyne - the decision point between heading up to Perisher or across to Thredbo.",
        imageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_alpine_way_jindabyne.jpeg",
        pageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_alpine_way_jindabyne.jpeg",
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-kosciuszko-wilsons-valley",
        name: "Kosciuszko Road (Wilsons Valley)",
        description: "Official Live Traffic NSW camera at Wilsons Valley between Sawpit Creek and Smiggin Holes - exposed alpine section, watch for chains.",
        imageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_road_wilsons_valley.jpeg",
        pageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_road_wilsons_valley.jpeg",
        elevation: 1580,
        type: "road",
        roadName: "Kosciuszko Road",
      },
    ],
  },

  // ─── Roadside cams: Yamanouchi (JP) ──────────────────────────────────────
  // Source: 北信地域道路カメラ (Hokushin Regional Road Camera, Nagano Pref).
  // The site's frame layout means we can't deep-link to individual cameras -
  // every cam links back to the same index where the user picks the camera
  // on the map. That IS the source the locals use.
  // The Hokushin Nagano prefecture road-camera service is an interactive map
  // - it does not expose deep-linkable per-camera image URLs or pages. Rather
  // than fake three identical-image cards, we surface a single honest tile per
  // region that opens the official map where users pick the camera themselves.
  {
    locationId: "yamanouchi-roads",
    locationName: "山ノ内町への道路 · Roads to Yamanouchi",
    webcamPageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    webcams: [],
  },

  // ─── Roadside cams: Nozawa Onsen + Iiyama (JP) ────────────────────────
  // Same Hokushin pref-Nagano regional camera map covers all of NE Nagano ·
  // we surface a tile per region rather than fake per-camera deep links.
  {
    locationId: "nozawa-onsen-roads",
    locationName: "野沢温泉への道路 · Roads to Nozawa Onsen",
    webcamPageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    webcams: [],
  },
  {
    locationId: "iiyama-roads",
    locationName: "飯山エリアへの道路 · Roads to Iiyama",
    webcamPageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    webcams: [],
  },

  // ─── Roadside cams: New Zealand ───────────────────────────────────────
  // Waka Kotahi NZTA's "journeys" site is the official traffic-camera map,
  // but it's an interactive regional map that doesn't expose stable, deep-
  // linkable per-camera image URLs we can verify. Per the JP pattern we
  // surface one honest tile per region that opens the official map where the
  // user picks the camera on their route. We never fabricate camera images.
  {
    locationId: "queenstown-roads",
    locationName: "Roads to the Queenstown ski fields",
    webcamPageUrl: "https://www.journeys.nzta.govt.nz/regions/otago",
    webcams: [],
  },
  {
    locationId: "wanaka-roads",
    locationName: "Roads to the Wanaka ski fields",
    webcamPageUrl: "https://www.journeys.nzta.govt.nz/regions/otago",
    webcams: [],
  },
  {
    locationId: "mt-hutt-roads",
    locationName: "Roads to Mt Hutt",
    webcamPageUrl: "https://www.journeys.nzta.govt.nz/regions/canterbury",
    webcams: [],
  },
  {
    locationId: "ruapehu-roads",
    locationName: "Roads to the Ruapehu ski fields",
    webcamPageUrl: "https://www.journeys.nzta.govt.nz/regions/manawatu-whanganui",
    webcams: [],
  },

  // ─── Roadside cams: Canada (BC + Alberta) ─────────────────────────────
  // DriveBC and 511 Alberta both run large public highway-camera networks,
  // but neither exposes a stable deep link per camera that survives a season.
  // Same honest tile pattern as JP/NZ: one link per region into the official
  // camera map, and never a fabricated image.
  {
    locationId: "whistler-roads",
    locationName: "Roads to Whistler · Sea-to-Sky Highway",
    webcamPageUrl: "https://www.drivebc.ca/cameras",
    webcams: [],
  },
  {
    locationId: "powder-highway-roads",
    locationName: "Roads on the Powder Highway",
    webcamPageUrl: "https://www.drivebc.ca/cameras",
    webcams: [],
  },
  {
    locationId: "banff-lake-louise-roads",
    locationName: "Roads to Banff & Lake Louise",
    webcamPageUrl: "https://511.alberta.ca/cctv",
    webcams: [],
  },
  {
    locationId: "canmore-roads",
    locationName: "Roads to Canmore & Kananaskis",
    webcamPageUrl: "https://511.alberta.ca/cctv",
    webcams: [],
  },
  {
    locationId: "jasper-roads",
    locationName: "Roads to Jasper & Marmot Basin",
    webcamPageUrl: "https://511.alberta.ca/cctv",
    webcams: [],
  },

  // ─── Roadside cams: Canada (Québec) ───────────────────────────────────
  // Québec 511 runs the province's highway-camera network but the whole
  // domain is bot-gated, so no deep camera path can be verified from here ·
  // link the documented root only rather than guess a sub-path.
  {
    locationId: "quebec-laurentians-roads",
    locationName: "Roads to Mont-Tremblant · Autoroute 15 & Route 117",
    webcamPageUrl: "https://www.quebec511.info/",
    webcams: [],
  },
  {
    locationId: "quebec-charlevoix-roads",
    locationName: "Roads through Charlevoix · Route 138",
    webcamPageUrl: "https://www.quebec511.info/",
    webcams: [],
  },
  {
    locationId: "quebec-eastern-townships-roads",
    locationName: "Roads to Bromont & Sutton · Autoroute 10",
    webcamPageUrl: "https://www.quebec511.info/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Nozawa Onsen ──────────────────────────────
  // Each resort publishes a live-cam landing page (JPG-refresh + occasional
  // YouTube embeds). Linking to the official page rather than the raw
  // stream because deep-link URLs change every season.
  {
    locationId: "nozawa-onsen",
    locationName: "野沢温泉ライブカメラ · Nozawa Onsen live cams",
    webcamPageUrl: "https://www.nozawaski.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Iiyama cluster ────────────────────────────
  {
    locationId: "madarao",
    locationName: "斑尾ライブカメラ · Madarao live cam",
    webcamPageUrl: "https://www.madarao.jp/",
    webcams: [],
  },
  {
    locationId: "tangram",
    locationName: "タングラム ライブカメラ · Tangram live cam",
    webcamPageUrl: "https://www.tangram.jp/ski/",
    webcams: [],
  },
  {
    locationId: "togari-onsen",
    locationName: "戸狩温泉ライブカメラ · Togari Onsen live cam",
    webcamPageUrl: "https://www.togari.jp/",
    webcams: [],
  },
  {
    locationId: "kijimadaira",
    locationName: "ロマンスの神様 ライブカメラ · Kijimadaira (Romance no Kamisama) live cam",
    webcamPageUrl: "https://kijimadaira.jp/",
    webcams: [],
  },
  {
    locationId: "kijima-snow-park",
    locationName: "キジマスノーパーク · Kijima Snow Park",
    webcamPageUrl: "https://kijimadaira.org/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Colorado (Summit County) ─────────────────
  // Breckenridge's webcams are embedded in an interactive mountain-map
  // widget rather than a standalone gallery page, so we link the mountain
  // conditions hub instead of fabricating per-camera entries.
  {
    locationId: "breckenridge-resort",
    locationName: "Breckenridge live cams",
    webcamPageUrl: "https://www.breckenridge.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  {
    locationId: "keystone-resort",
    locationName: "Keystone live cams",
    webcamPageUrl: "https://www.keystoneresort.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  // Copper Mountain's snow-report URL could not be independently
  // re-verified in research for this pass (flagged gap) · linking the
  // broader mountain-conditions hub as the safer, honest fallback.
  {
    locationId: "copper-mountain-resort",
    locationName: "Copper Mountain live cams",
    webcamPageUrl: "https://www.coppercolorado.com/the-mountain",
    webcams: [],
  },
  {
    locationId: "arapahoe-basin",
    locationName: "Arapahoe Basin live cams",
    webcamPageUrl: "https://www.arapahoebasin.com/the-mountain/mountain-report",
    webcams: [],
  },
  // Loveland's official webcam URL was not independently confirmed in
  // research for this pass (only a third-party aggregator was verified) ·
  // linking the official site only, no fabricated camera entries.
  {
    locationId: "loveland",
    locationName: "Loveland Ski Area",
    webcamPageUrl: "https://www.skiloveland.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Colorado (Vail Valley) ─────────────────
  // No single canonical vail.com webcam gallery URL could be independently
  // confirmed in research for this pass (flagged gap) · link the official
  // snow/weather report page rather than guess a webcam path.
  {
    locationId: "vail-mountain",
    locationName: "Vail Mountain conditions",
    webcamPageUrl: "https://www.vail.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
    webcams: [],
  },
  // Beaver Creek's webcams are confirmed live and named in official
  // material: Top of Centennial Lift, Red Buffalo Park, Talons Restaurant,
  // and a snow-stake cam.
  {
    locationId: "beaver-creek",
    locationName: "Beaver Creek live cams",
    webcamPageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [
      {
        id: "beaver-creek-centennial",
        name: "Top of Centennial Lift",
        description: "View from the top of the Centennial Express lift.",
        imageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        elevation: 3109,
        type: "mountain",
      },
      {
        id: "beaver-creek-red-buffalo",
        name: "Red Buffalo Park",
        description: "Alpine view from Red Buffalo Park, near the top of the resort.",
        imageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        elevation: 3487,
        type: "mountain",
      },
      {
        id: "beaver-creek-talons",
        name: "Talons Restaurant",
        description: "Mid-mountain view from outside Talons Restaurant.",
        imageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        elevation: 2652,
        type: "mountain",
      },
      {
        id: "beaver-creek-snow-stake",
        name: "Snow Stake Cam",
        description: "Official snow-stake camera for measuring new snowfall.",
        imageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.beavercreek.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        elevation: 3200,
        type: "mountain",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Aspen Snowmass) ──────────────
  // All four mountains share one confirmed-live webcam gallery (Roundshot
  // panoramic cams per mountain + base lift cams); we link the shared page
  // per mountain rather than guess individual per-camera deep links.
  {
    locationId: "snowmass",
    locationName: "Snowmass live cams",
    webcamPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
    webcams: [],
  },
  {
    locationId: "aspen-mountain",
    locationName: "Aspen Mountain live cams",
    webcamPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
    webcams: [],
  },
  {
    locationId: "aspen-highlands",
    locationName: "Aspen Highlands live cams",
    webcamPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
    webcams: [],
  },
  {
    locationId: "buttermilk",
    locationName: "Buttermilk live cams",
    webcamPageUrl: "https://www.aspensnowmass.com/four-mountains/mountain-cams",
    webcams: [],
  },

  // ─── Resort live-cam pages: Colorado (Steamboat) ─────────────────
  // Confirmed live at steamboat.com/the-mountain/live-cams: Steamboat
  // Square, Gondola, Thunderhead, Christie Peak Express & Wild Blue
  // Gondola, Four Points, Champagne Powder Snow Cam.
  {
    locationId: "steamboat-resort",
    locationName: "Steamboat live cams",
    webcamPageUrl: "https://www.steamboat.com/the-mountain/live-cams",
    webcams: [
      {
        id: "steamboat-square",
        name: "Steamboat Square Cam",
        description: "Base village view of Steamboat Square.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        type: "village",
      },
      {
        id: "steamboat-gondola",
        name: "Gondola Cam",
        description: "View of the Steamboat Gondola base.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        type: "mountain",
      },
      {
        id: "steamboat-thunderhead",
        name: "Thunderhead Cam",
        description: "Mid-mountain view from Thunderhead.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        elevation: 2767,
        type: "mountain",
      },
      {
        id: "steamboat-christie-peak-wild-blue",
        name: "Christie Peak Express & Wild Blue Gondola Cam",
        description: "View across the Christie Peak Express and Wild Blue Gondola lift lines.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        type: "mountain",
      },
      {
        id: "steamboat-four-points",
        name: "Four Points Cam",
        description: "Alpine view from Four Points Lodge.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        elevation: 2962,
        type: "mountain",
      },
      {
        id: "steamboat-champagne-powder-snow",
        name: "Champagne Powder Snow Cam",
        description: "Official snow-stake camera near the summit.",
        imageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        pageUrl: "https://www.steamboat.com/the-mountain/live-cams",
        elevation: 3164,
        type: "mountain",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Winter Park) ──────────────
  // Confirmed live at winterparkresort.com/the-mountain/mountain-cams:
  // Base Cam, Lunch Rock Cam, Snoasis Cam, Town of Winter Park Cam, Snow
  // Stake Cam, Tubing Hill Cam.
  {
    locationId: "winter-park-resort",
    locationName: "Winter Park live cams",
    webcamPageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
    webcams: [
      {
        id: "winter-park-base",
        name: "Base Cam",
        description: "View of the resort base area.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "village",
      },
      {
        id: "winter-park-lunch-rock",
        name: "Lunch Rock Cam",
        description: "Mid-mountain view from Lunch Rock.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "mountain",
      },
      {
        id: "winter-park-snoasis",
        name: "Snoasis Cam",
        description: "View from the Snoasis mid-mountain restaurant.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "mountain",
      },
      {
        id: "winter-park-town",
        name: "Town of Winter Park Cam",
        description: "View of the town of Winter Park.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "village",
      },
      {
        id: "winter-park-snow-stake",
        name: "Snow Stake Cam",
        description: "Official snow-stake camera for measuring new snowfall.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "mountain",
      },
      {
        id: "winter-park-tubing-hill",
        name: "Tubing Hill Cam",
        description: "View of the resort's tubing hill.",
        imageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        pageUrl: "https://www.winterparkresort.com/the-mountain/mountain-cams",
        type: "mountain",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Crested Butte) ────────────
  // Confirmed live at skicb.com/.../mountain-cams.aspx: Base Cam/Butte 66
  // Roadhouse, Umbrella Bar at Ten Peaks, Paradise Warming House Cam.
  {
    locationId: "crested-butte-mountain-resort",
    locationName: "Crested Butte live cams",
    webcamPageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [
      {
        id: "crested-butte-base-butte66",
        name: "Base Cam · Butte 66 Roadhouse",
        description: "Base-area view from the Butte 66 Roadhouse.",
        imageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        type: "village",
      },
      {
        id: "crested-butte-umbrella-bar",
        name: "Umbrella Bar at Ten Peaks",
        description: "Mid-mountain view from the Umbrella Bar at Ten Peaks.",
        imageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        type: "mountain",
      },
      {
        id: "crested-butte-paradise-warming-house",
        name: "Paradise Warming House Cam",
        description: "Alpine view from the Paradise Warming House.",
        imageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        pageUrl: "https://www.skicb.com/the-mountain/mountain-conditions/mountain-cams.aspx",
        type: "mountain",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Telluride) ───────────────
  // Confirmed live at tellurideskiresort.com/webcams/: Revelation Bowl Cam
  // (360°), Village Cam, See Forever Cam.
  {
    locationId: "telluride-ski-resort",
    locationName: "Telluride live cams",
    webcamPageUrl: "https://www.tellurideskiresort.com/webcams/",
    webcams: [
      {
        id: "telluride-revelation-bowl",
        name: "Revelation Bowl Cam (360°)",
        description: "360-degree alpine view from Revelation Bowl.",
        imageUrl: "https://www.tellurideskiresort.com/webcams/",
        pageUrl: "https://www.tellurideskiresort.com/webcams/",
        type: "mountain",
      },
      {
        id: "telluride-village",
        name: "Village Cam",
        description: "View of Mountain Village.",
        imageUrl: "https://www.tellurideskiresort.com/webcams/",
        pageUrl: "https://www.tellurideskiresort.com/webcams/",
        type: "village",
      },
      {
        id: "telluride-see-forever",
        name: "See Forever Cam",
        description: "Summit-area view from the See Forever run.",
        imageUrl: "https://www.tellurideskiresort.com/webcams/",
        pageUrl: "https://www.tellurideskiresort.com/webcams/",
        type: "mountain",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Durango) ───────────────
  // Confirmed working at purgatory.ski/.../weather-conditions-webcams/:
  // Purgatory Express Base Live Stream, Purgatory Express Summit,
  // Purgatory Village Plaza.
  {
    locationId: "purgatory-resort",
    locationName: "Purgatory live cams",
    webcamPageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
    webcams: [
      {
        id: "purgatory-express-base",
        name: "Purgatory Express Base Live Stream",
        description: "Live stream from the base of the Purgatory Express lift.",
        imageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        pageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        type: "mountain",
      },
      {
        id: "purgatory-express-summit",
        name: "Purgatory Express Summit",
        description: "View from the top of the Purgatory Express lift.",
        imageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        pageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        type: "mountain",
      },
      {
        id: "purgatory-village-plaza",
        name: "Purgatory Village Plaza",
        description: "Base-village plaza view.",
        imageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        pageUrl: "https://www.purgatory.ski/mountain/weather-conditions-webcams/",
        type: "village",
      },
    ],
  },

  // ─── Resort live-cam pages: Colorado (Boulder / Front Range) ──────
  {
    locationId: "eldora-mountain-resort",
    locationName: "Eldora live cams",
    webcamPageUrl: "https://www.eldora.com/the-mountain/webcams/lower-mountain-live-cam/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Utah (Cottonwood Canyons) ──────
  // Alta, Snowbird and Solitude all have confirmed, currently-live official
  // webcam pages per the research doc; kept as page-only links (no direct
  // image hotlinking) matching the Colorado pattern for Eldora/Purgatory.
  // Brighton's webcam URL was NOT independently confirmed in research —
  // linked to the resort's main site as an honest fallback rather than a
  // guessed deep link.
  {
    locationId: "alta",
    locationName: "Alta live cams",
    webcamPageUrl: "https://www.altacam.com/mountaincams/",
    webcams: [],
  },
  {
    locationId: "snowbird",
    locationName: "Snowbird live cams",
    webcamPageUrl: "https://www.snowbird.com/the-mountain/webcams/view-all-webcams/",
    webcams: [],
  },
  {
    locationId: "brighton-resort",
    locationName: "Brighton live cams",
    // Not independently verified in research — linking to the resort's main
    // site rather than a guessed webcam deep link. See Ski Utah's directory
    // (skiutah.com/resorts/webcams) as an alternate source.
    webcamPageUrl: "https://www.brightonresort.com/",
    webcams: [],
  },
  {
    locationId: "solitude-mountain-resort",
    locationName: "Solitude live cams",
    webcamPageUrl: "https://www.solitudemountain.com/mountain-and-village/webcams",
    webcams: [],
  },

  // ─── Resort live-cam pages: Utah (Park City) ──────
  {
    locationId: "park-city-mountain",
    locationName: "Park City Mountain live cams",
    webcamPageUrl: "https://www.parkcitymountain.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  {
    locationId: "deer-valley-resort",
    locationName: "Deer Valley live cams",
    webcamPageUrl: "https://www.deervalley.com/explore-the-mountain/webcams",
    webcams: [],
  },

  // ─── Resort live-cam pages: Utah (Ogden Valley) ──────
  {
    locationId: "snowbasin",
    locationName: "Snowbasin live cams",
    webcamPageUrl: "https://www.snowbasin.com/the-mountain/web-cams/",
    webcams: [],
  },
  {
    locationId: "powder-mountain",
    locationName: "Powder Mountain live cams",
    // Also includes an SR-158 road camera on the same page per research doc.
    webcamPageUrl: "https://powdermountain.com/conditions",
    webcams: [],
  },
  {
    locationId: "nordic-valley",
    locationName: "Nordic Valley live cams",
    // ⚠️ Season status/dates are unreliable this year — verify directly
    // before relying on this page for current conditions.
    webcamPageUrl: "https://www.nordicvalley.ski/nordic-valley-weather-conditions-webcams/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Utah (Provo) ──────
  {
    locationId: "sundance-mountain-resort",
    locationName: "Sundance live cams",
    webcamPageUrl: "https://www.sundanceresort.com/webcams/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Utah (Cache Valley) ──────
  {
    locationId: "beaver-mountain",
    locationName: "Beaver Mountain live cams",
    // Third-party VISION-ENVIRONNEMENT hosted cam, confirmed live in research.
    webcamPageUrl: "https://s1.vision-environnement.com/livecams/webcam.php?webcam=beaver&lang=en",
    webcams: [],
  },
  {
    locationId: "cherry-peak",
    locationName: "Cherry Peak live cams",
    // ⚠️ 2025-26 opening date unconfirmed by the resort — verify current
    // status before relying on this page.
    webcamPageUrl: "https://www.skicpr.com/ski-report",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (North Lake Tahoe) ──────
  {
    locationId: "palisades-tahoe",
    locationName: "Palisades Tahoe live cams",
    webcamPageUrl: "https://www.palisadestahoe.com/mountain-information/mountain-cams",
    webcams: [],
  },
  {
    locationId: "northstar-california",
    locationName: "Northstar California live cams",
    webcamPageUrl: "https://www.northstarcalifornia.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  {
    locationId: "sugar-bowl",
    // ⚠️ Webcam page status not independently confirmed in research —
    // verify before relying on this link.
    locationName: "Sugar Bowl live cams",
    webcamPageUrl: "https://www.sugarbowl.com/mountain-report",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (South Lake Tahoe) ──────
  {
    locationId: "heavenly",
    locationName: "Heavenly live cams",
    webcamPageUrl: "https://www.skiheavenly.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  {
    locationId: "kirkwood",
    locationName: "Kirkwood live cams",
    webcamPageUrl: "https://www.kirkwood.com/the-mountain/mountain-conditions/mountain-cams.aspx",
    webcams: [],
  },
  {
    locationId: "sierra-at-tahoe",
    // ⚠️ Officially closed for the 2025/26 season per the resort's own
    // page — do not treat any cam/conditions data linked here as live.
    locationName: "Sierra-at-Tahoe (⚠️ closed for 2025/26 season)",
    webcamPageUrl: "https://sierraattahoe.com/",
    webcams: [],
  },
  {
    locationId: "homewood-mountain-resort",
    // ⚠️ Reopened for 2025-26 after a full 2024-25 closure — webcam page
    // status not independently confirmed in research.
    locationName: "Homewood Mountain Resort live cams",
    webcamPageUrl: "https://skihomewood.com/mountain-info/",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (Mammoth Lakes) ──────
  {
    locationId: "mammoth-mountain",
    locationName: "Mammoth Mountain live cams",
    webcamPageUrl: "https://www.mammothmountain.com/on-the-mountain/webcams",
    webcams: [],
  },
  {
    locationId: "june-mountain",
    // ⚠️ Webcam page status not independently confirmed in research.
    locationName: "June Mountain live cams",
    webcamPageUrl: "https://www.junemountain.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (Big Bear) ──────
  {
    locationId: "bear-mountain",
    locationName: "Bear Mountain live cams",
    webcamPageUrl: "https://www.bigbearmountainresort.com/mountain-conditions/mountain-cams",
    webcams: [],
  },
  {
    locationId: "snow-summit",
    locationName: "Snow Summit live cams",
    webcamPageUrl: "https://www.bigbearmountainresort.com/mountain-conditions/mountain-cams",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (Bear Valley) ──────
  {
    locationId: "bear-valley-mountain-resort",
    // ⚠️ 2025-26 opening date uncertain in source reporting — verify
    // current status before relying on this page.
    locationName: "Bear Valley Mountain Resort live cams",
    webcamPageUrl: "https://www.bearvalley.com/mountain-report",
    webcams: [],
  },

  // ─── Resort live-cam pages: California (Mt. Shasta) ──────
  {
    locationId: "mt-shasta-ski-park",
    // ⚠️ 2025-26 season closed early (Mar 2, 2026) for lack of snow, and
    // base/summit elevation is unverified — verify current status.
    locationName: "Mt. Shasta Ski Park live cams",
    webcamPageUrl: "https://www.skipark.com/winter/conditions",
    webcams: [],
  },
  // ─── Resort live-cam pages: Vermont (Killington/Pico) ──────
  {
    locationId: "killington-resort",
    locationName: "Killington live cams",
    webcamPageUrl: "https://www.killington.com/mountain/conditions-weather",
    webcams: [],
  },
  {
    locationId: "pico-mountain",
    // 2025-26 closing date not confirmed by the resort — verify current
    // status before relying on this page.
    locationName: "Pico Mountain live cams",
    webcamPageUrl: "https://www.picomountain.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Vermont (Stowe/Smugglers' Notch) ──────
  {
    locationId: "stowe-mountain-resort",
    locationName: "Stowe Mountain Resort live cams",
    webcamPageUrl: "https://www.stowe.com/the-mountain/mountain-report.aspx",
    webcams: [],
  },
  {
    locationId: "smugglers-notch",
    // ⚠️ Independent for 2025-26 pending a Feb 2026 acquisition and a
    // 2026-27 joint pass with Burke Mountain — not yet in effect. No
    // confirmed live webcam page found in research; falls back to the
    // main site link rather than guessing a page URL.
    locationName: "Smugglers' Notch (independent for 2025-26) — webcam status unconfirmed",
    webcamPageUrl: "https://www.smuggs.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Vermont (Mad River Valley) ──────
  {
    locationId: "sugarbush",
    // 2025-26 closing date not confirmed by the resort — verify current
    // status before relying on this page.
    locationName: "Sugarbush live cams",
    webcamPageUrl: "https://www.sugarbush.com/mountain/conditions",
    webcams: [],
  },
  {
    locationId: "mad-river-glen",
    // ⚠️ Ski-only for 2025-26 — no snowboarding.
    locationName: "Mad River Glen (⚠️ ski-only, no snowboarding) live cams",
    webcamPageUrl: "https://www.madriverglen.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Vermont (Southern Vermont) ──────
  {
    locationId: "stratton-mountain-resort",
    locationName: "Stratton live cams",
    webcamPageUrl: "https://www.stratton.com/the-mountain/mountain-report",
    webcams: [],
  },
  {
    locationId: "mount-snow",
    // 2025-26 closing date not confirmed by the resort — verify current
    // status before relying on this page.
    locationName: "Mount Snow live cams",
    webcamPageUrl: "https://www.mountsnow.com/",
    webcams: [],
  },
  {
    locationId: "bromley-mountain",
    // 2025-26 closing date not confirmed by the resort — verify current
    // status before relying on this page.
    locationName: "Bromley Mountain live cams",
    webcamPageUrl: "https://www.bromley.com/",
    webcams: [],
  },
  {
    locationId: "magic-mountain",
    // ⚠️ Did NOT open for the 2025-26 season — same treatment as
    // Sierra-at-Tahoe in the California pass.
    locationName: "Magic Mountain (⚠️ closed for 2025/26 season)",
    webcamPageUrl: "https://www.magicmtn.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Vermont (Okemo) ──────
  {
    locationId: "okemo-mountain-resort",
    locationName: "Okemo Mountain Resort live cams",
    webcamPageUrl: "https://www.okemo.com/the-mountain/mountain-report.aspx",
    webcams: [],
  },

  // ─── Resort live-cam pages: Vermont (Jay Peak/Northeast Kingdom) ──────
  {
    locationId: "jay-peak",
    locationName: "Jay Peak live cams",
    webcamPageUrl: "https://jaypeakresort.com/mountain/conditions",
    webcams: [],
  },
  {
    locationId: "burke-mountain",
    // ⚠️ Newly linked to Smugglers' Notch via shared Bear Den Partners
    // ownership (Feb 2026); 2025-26 closing date not confirmed.
    locationName: "Burke Mountain live cams",
    webcamPageUrl: "https://www.skiburke.com/",
    webcams: [],
  },

  // ─── Roadside cams: Colorado ───────────────────────────────
  // CDOT's cotrip.org runs a large public highway-camera network, but does
  // not expose a stable deep link per camera that survives a season. Same
  // honest tile pattern as CA/JP/NZ: one link per region into the official
  // camera map, and never a fabricated image.
  {
    locationId: "summit-county-roads",
    locationName: "Roads to Summit County · I-70 corridor",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "vail-valley-roads",
    locationName: "Roads to Vail Valley · I-70 corridor",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "aspen-snowmass-roads",
    locationName: "Roads to Aspen Snowmass · Colorado 82",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "steamboat-roads",
    locationName: "Roads to Steamboat · US-40",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "winter-park-roads",
    locationName: "Roads to Winter Park · US-40 & Berthoud Pass",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "crested-butte-roads",
    locationName: "Roads to Crested Butte · Colorado 135",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "telluride-roads",
    locationName: "Roads to Telluride · Colorado 145",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "durango-roads",
    locationName: "Roads to Durango & Purgatory · US-550",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },
  {
    locationId: "boulder-front-range-roads",
    locationName: "Roads to Eldora · Boulder Canyon",
    webcamPageUrl: "https://www.cotrip.org/",
    webcams: [],
  },

  // ─── Roadside cams: Utah ────────────────────────────────────────
  // UDOT's udottraffic.utah.gov runs a public highway-camera network, and
  // Cottonwood Canyons has its own dedicated page; neither exposes a stable
  // deep link per camera that survives a season, so these are page-only
  // links to the official traffic map — same honest tile pattern as CO/CA.
  {
    locationId: "cottonwood-canyons-roads",
    locationName: "Roads to Cottonwood Canyons · SR-210 & SR-190",
    webcamPageUrl: "https://cottonwoodcanyons.udot.utah.gov/",
    webcams: [],
  },
  {
    locationId: "park-city-roads",
    locationName: "Roads to Park City · I-80 & US-40",
    webcamPageUrl: "https://www.udottraffic.utah.gov/",
    webcams: [],
  },
  {
    locationId: "ogden-valley-roads",
    locationName: "Roads to Ogden Valley · SR-226 & UT-158",
    webcamPageUrl: "https://www.udottraffic.utah.gov/",
    webcams: [],
  },
  {
    locationId: "provo-roads",
    locationName: "Roads to Provo Canyon · US-189 & UT-92",
    webcamPageUrl: "https://www.udottraffic.utah.gov/",
    webcams: [],
  },
  {
    locationId: "cache-valley-roads",
    locationName: "Roads to Cache Valley · US-89 Logan Canyon",
    webcamPageUrl: "https://www.udottraffic.utah.gov/",
    webcams: [],
  },

  // ─── Roadside cams: California ─────────────────────────────────
  // Caltrans QuickMap (quickmap.dot.ca.gov) runs a public highway-camera
  // and chain-control network, but does not expose a stable deep link per
  // camera that survives a season — same honest page-only-link pattern as
  // CO/UT.
  {
    locationId: "north-lake-tahoe-roads",
    locationName: "Roads to North Lake Tahoe · I-80 Donner Summit",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },
  {
    locationId: "south-lake-tahoe-roads",
    locationName: "Roads to South Lake Tahoe · US-50",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },
  {
    locationId: "mammoth-lakes-roads",
    locationName: "Roads to Mammoth Lakes · US-395 & SR-203",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },
  {
    locationId: "big-bear-roads",
    locationName: "Roads to Big Bear · Highway 18 & 38",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },
  {
    locationId: "bear-valley-roads",
    locationName: "Roads to Bear Valley · Highway 4 Ebbetts Pass",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },
  {
    locationId: "mt-shasta-roads",
    locationName: "Roads to Mt. Shasta · I-5 & SR-89",
    webcamPageUrl: "https://quickmap.dot.ca.gov/",
    webcams: [],
  },

  // ─── Roadside cams: Vermont ─────────────────────────────────────
  // VTrans' 511vt.com (and the shared newengland511.org platform) runs a
  // public highway-camera network, but does not expose a stable deep link
  // per camera that survives a season — same honest page-only-link
  // pattern as CO/UT/CA.
  {
    locationId: "killington-pico-roads",
    locationName: "Roads to Killington/Pico · US-4",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },
  {
    locationId: "stowe-smugglers-notch-roads",
    locationName: "Roads to Stowe/Smugglers' Notch · VT-108",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },
  {
    locationId: "mad-river-valley-roads",
    locationName: "Roads to Mad River Valley · VT-100 & VT-17",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },
  {
    locationId: "southern-vermont-roads",
    locationName: "Roads to Southern Vermont · VT-30, VT-100 & VT-11",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },
  {
    locationId: "okemo-roads",
    locationName: "Roads to Okemo · VT-103",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },
  {
    locationId: "jay-peak-nek-roads",
    locationName: "Roads to Jay Peak/Northeast Kingdom · VT-105, VT-242 & VT-114",
    webcamPageUrl: "https://511vt.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Wyoming (Jackson Hole) ──────
  {
    locationId: "jackson-hole-mtn-resort",
    // ⚠️ No confirmed dedicated webcam URL found in research — page-only
    // link to the resort's own conditions page, no fabricated feed.
    locationName: "Jackson Hole Mountain Resort live cams",
    webcamPageUrl: "https://www.jacksonhole.com/mountain-report",
    webcams: [],
  },
  {
    locationId: "snow-king-mountain",
    locationName: "Snow King Mountain live cams",
    webcamPageUrl: "https://snowkingmountain.com/mountain/webcams/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Wyoming (Grand Targhee) ──────
  {
    locationId: "grand-targhee-resort",
    locationName: "Grand Targhee Resort live cams",
    webcamPageUrl: "https://grandtarghee.com/mountain-report/",
    webcams: [],
  },

  // ─── Roadside cams: Wyoming ─────────────────────────────────────
  // WYDOT's wyoroad.info runs a public highway-camera network (including
  // Teton Pass, WY-22), but does not expose a stable deep link per camera
  // that survives a season — same honest page-only-link pattern as
  // CO/UT/CA/VT.
  {
    locationId: "jackson-hole-roads",
    locationName: "Roads to Jackson Hole · US-26/89/191 & Teton Pass (WY-22)",
    webcamPageUrl: "https://wyoroad.info/",
    webcams: [],
  },
  {
    locationId: "grand-targhee-roads",
    locationName: "Roads to Grand Targhee · Teton Pass (WY-22) & ID-33",
    webcamPageUrl: "https://wyoroad.info/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Montana (Big Sky) ──────
  {
    locationId: "big-sky-resort",
    locationName: "Big Sky Resort live cams",
    webcamPageUrl: "https://www.bigskyresort.com/current-conditions/webcams",
    webcams: [],
  },

  // ─── Resort live-cam pages: Montana (Bozeman / Bridger Bowl) ──────
  {
    locationId: "bridger-bowl",
    // ⚠️ Closed early for the 2025-26 season on Mar 22 2026 (low snow) —
    // page-only link kept live, no fabricated feed for the off-season.
    locationName: "Bridger Bowl live cams",
    webcamPageUrl: "https://bridgerbowl.com/weather/webcams",
    webcams: [],
  },

  // ─── Resort live-cam pages: Montana (Whitefish) ──────
  {
    locationId: "whitefish-mountain-resort",
    // ⚠️ No confirmed dedicated webcam URL found in research — page-only
    // link to the resort's own Mountain Stats page, no fabricated feed.
    locationName: "Whitefish Mountain Resort live cams",
    webcamPageUrl: "https://skiwhitefish.com/mountain-stats/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Montana (Red Lodge) ──────
  {
    locationId: "red-lodge-mountain",
    locationName: "Red Lodge Mountain live cams",
    webcamPageUrl: "https://www.redlodgemountain.com/webcam/",
    webcams: [],
  },

  // ─── Roadside cams: Montana ────────────────────────────────────
  // MDT's 511mt.net / RWIS network runs public highway cameras, but does
  // not expose a stable deep link per camera that survives a season —
  // same honest page-only-link pattern as CO/UT/CA/VT/WY.
  {
    locationId: "big-sky-roads",
    locationName: "Roads to Big Sky · US-191",
    webcamPageUrl: "https://www.511mt.net/",
    webcams: [],
  },
  {
    locationId: "bozeman-bridger-bowl-roads",
    locationName: "Roads to Bridger Bowl · Bridger Canyon Rd (MT-86)",
    webcamPageUrl: "https://www.511mt.net/",
    webcams: [],
  },
  {
    locationId: "whitefish-roads",
    locationName: "Roads to Whitefish Mountain Resort · Big Mountain Rd",
    webcamPageUrl: "https://www.511mt.net/",
    webcams: [],
  },
  {
    locationId: "red-lodge-roads",
    locationName: "Roads to Red Lodge Mountain · US-212 & Ski Run Rd",
    webcamPageUrl: "https://www.511mt.net/",
    webcams: [],
  },

  // ─── Resort live-cam pages: New Mexico (Taos) ──────
  {
    locationId: "taos-ski-valley",
    // Confirmed live per research (Arroyo Seco/NM-150 Cam, Base Cam,
    // Kachina Basin Cam, Highline Cam) · one feed (Kachina Peak Cam) showed
    // "image unavailable" at research time — page-only link, no fabricated
    // per-camera deep links.
    locationName: "Taos Ski Valley live cams",
    webcamPageUrl: "https://www.skitaos.com/mountain",
    webcams: [],
  },

  // ─── Resort live-cam pages: New Mexico (Angel Fire) ──────
  {
    locationId: "angel-fire-resort",
    // Confirmed live per research (Base Area, Chile Unload, Putting Green,
    // Summit cams) — page-only link, no fabricated per-camera deep links.
    locationName: "Angel Fire Resort live cams",
    webcamPageUrl: "https://www.angelfireresort.com/weather/",
    webcams: [],
  },

  // ─── Resort live-cam pages: New Mexico (Santa Fe) ──────
  {
    locationId: "ski-santa-fe",
    // Confirmed live per research ("Images refresh every minute") —
    // page-only link, no fabricated per-camera deep links.
    locationName: "Ski Santa Fe live cams",
    webcamPageUrl: "https://www.skisantafe.com/conditions/webcams",
    webcams: [],
  },

  // ─── Resort live-cam pages: New Mexico (Albuquerque / Sandia Peak) ──────
  {
    locationId: "sandia-peak",
    // ⚠️ No confirmed live webcam URL found in research — page-only link
    // to the resort's own snow-report page, no fabricated feed.
    locationName: "Sandia Peak Ski Area live cams",
    webcamPageUrl: "https://www.sandia.ski/snow-report",
    webcams: [],
  },

  // ─── Roadside cams: New Mexico ────────────────────────────────
  // NMDOT's nmroads.com runs public highway traffic cameras, but does not
  // expose a stable deep link per camera that survives a season — same
  // honest page-only-link pattern as CO/UT/CA/VT/WY/MT.
  {
    locationId: "taos-roads",
    locationName: "Roads to Taos Ski Valley · NM-150",
    webcamPageUrl: "https://www.nmroads.com/mapIndex.html",
    webcams: [],
  },
  {
    locationId: "angel-fire-roads",
    locationName: "Roads to Angel Fire · US-64",
    webcamPageUrl: "https://www.nmroads.com/mapIndex.html",
    webcams: [],
  },
  {
    locationId: "santa-fe-roads",
    locationName: "Roads to Ski Santa Fe · NM-475 (Hyde Park Rd)",
    webcamPageUrl: "https://www.nmroads.com/mapIndex.html",
    webcams: [],
  },
  {
    locationId: "albuquerque-sandia-roads",
    locationName: "Roads to Sandia Peak · NM-536 (Sandia Crest Scenic Byway)",
    webcamPageUrl: "https://www.nmroads.com/mapIndex.html",
    webcams: [],
  },

  // ─── Michigan resort and road pages · no fabricated deep camera feeds ───
  { locationId: "boyne-mountain", locationName: "Boyne Mountain live cams", webcamPageUrl: "https://www.boynemountain.com/mountain-report", webcams: [] },
  { locationId: "boyne-highlands", locationName: "The Highlands live cams", webcamPageUrl: "https://www.highlandsharborsprings.com/mountain-report", webcams: [] }, // separate official live-cam URL unconfirmed
  { locationId: "nubs-nob", locationName: "Nub's Nob webcams", webcamPageUrl: "https://www.nubsnob.com/cam/", webcams: [] }, // page confirmed; live status unverified
  { locationId: "mt-bohemia", locationName: "Mt. Bohemia webcams", webcamPageUrl: "https://www.mtbohemia.com/current-conditions/", webcams: [] }, // no confirmed official webcam
  { locationId: "harbor-springs-roads", locationName: "Roads to Harbor Springs resorts · Mi Drive", webcamPageUrl: "https://www.michigan.gov/drive", webcams: [] },
  { locationId: "keweenaw-peninsula-roads", locationName: "Roads to Mt. Bohemia · Mi Drive", webcamPageUrl: "https://www.michigan.gov/drive", webcams: [] },
  // Pennsylvania · page-only links; no unverified camera feed is fabricated.
  { locationId:"camelback-mountain",locationName:"Camelback live cameras",webcamPageUrl:"https://www.camelbackresort.com/resort-information/live-cameras",webcams:[] },
  { locationId:"blue-mountain-pa",locationName:"Blue Mountain PA cameras",webcamPageUrl:"https://www.skibluemt.com/mountain-cams/",webcams:[] },
  { locationId:"shawnee-mountain",locationName:"Shawnee Mountain cameras",webcamPageUrl:"https://shawneemt.com/hours-of-operation-trail-map/",webcams:[] }, // no official live webcam confirmed
  { locationId:"seven-springs-mountain",locationName:"Seven Springs cameras",webcamPageUrl:"https://www.7springs.com/the-mountain/mountain-conditions/mountain-cams.aspx",webcams:[] },
  { locationId:"blue-knob",locationName:"Blue Knob camera",webcamPageUrl:"https://blueknob.com/trail-map-conditions/",webcams:[] }, // link destination unresolved/conflicting
  { locationId:"poconos-roads",locationName:"Poconos roads · 511PA",webcamPageUrl:"https://www.511pa.com/",webcams:[] },
  { locationId:"laurel-highlands-roads",locationName:"Laurel Highlands roads · 511PA",webcamPageUrl:"https://www.511pa.com/",webcams:[] },
  // Massachusetts · page-only sources, no invented feeds.
  {locationId:"jiminy-peak",locationName:"Jiminy Peak webcams",webcamPageUrl:"https://www.jiminypeak.com/webcams/",webcams:[]},
  {locationId:"ski-butternut",locationName:"Ski Butternut livestream",webcamPageUrl:"https://skibutternut.com/livestream",webcams:[]},
  {locationId:"berkshire-east",locationName:"Berkshire East webcams",webcamPageUrl:"https://berkshireeast.com/winter/mountain-conditions",webcams:[]}, // no confirmed official live webcam
  {locationId:"wachusett-mountain",locationName:"Wachusett Mountain cameras",webcamPageUrl:"https://www.wachusett.com/the-mountain/your-visit/snow-report/",webcams:[]}, // cameras referenced through report; distinct URL unconfirmed
  {locationId:"berkshires-roads",locationName:"Berkshires roads · Mass511",webcamPageUrl:"https://mass511.com/",webcams:[]},
  {locationId:"central-massachusetts-roads",locationName:"Central Massachusetts roads · Mass511",webcamPageUrl:"https://mass511.com/",webcams:[]},
  // Minnesota · Lutsen official webcam page confirmed; page-only link avoids fabricated feed URLs.
  {locationId:"lutsen-mountains",locationName:"Lutsen Mountains live cam",webcamPageUrl:"https://www.lutsen.com/mountain-info/our-webcam",webcams:[]},
  {locationId:"lutsen-north-shore-roads",locationName:"North Shore roads · 511 Minnesota",webcamPageUrl:"https://511mn.org/",webcams:[]},
  // Wisconsin · page-only links; Cascade's Flash embed is likely non-functional.
  {locationId:"granite-peak",locationName:"Granite Peak live cams",webcamPageUrl:"https://www.skigranitepeak.com/mountain-info/live-web-cams",webcams:[]}, // official page exists; live status not directly re-verified
  {locationId:"cascade-mountain",locationName:"Cascade Mountain snow cams",webcamPageUrl:"https://www.cascademountain.com/snow-cams/",webcams:[]}, // Adobe Flash embed likely broken
  {locationId:"wausau-roads",locationName:"Wausau roads · 511 Wisconsin",webcamPageUrl:"https://511wi.gov/",webcams:[]},
  {locationId:"wisconsin-dells-roads",locationName:"Wisconsin Dells roads · 511 Wisconsin",webcamPageUrl:"https://511wi.gov/",webcams:[]},

  // West Virginia · page-only official links; no unverified live-feed URLs are asserted.
  {locationId:"snowshoe-mountain",locationName:"Snowshoe Mountain cams / conditions",webcamPageUrl:"https://www.snowshoemtn.com/",webcams:[]},
  {locationId:"snowshoe-roads",locationName:"Snowshoe roads · WVDOT · WV 511",webcamPageUrl:"https://wv511.org/",webcams:[]},
  {locationId:"canaan-valley-resort",locationName:"Canaan Valley Resort cams / conditions",webcamPageUrl:"https://www.canaanresort.com/",webcams:[]},
  {locationId:"timberline-mountain",locationName:"Timberline Mountain cams / conditions",webcamPageUrl:"https://timberlinemountain.com/snow-report/",webcams:[]},
  {locationId:"canaan-valley-roads",locationName:"Canaan Valley roads · WVDOT · WV 511",webcamPageUrl:"https://wv511.org/",webcams:[]},
  // North Carolina · page-only official links; no unverified live-feed URLs are asserted.
  {locationId:"sugar-mountain",locationName:"Sugar Mountain cams / conditions",webcamPageUrl:"https://skisugar.com/sugar-mountain-stats/",webcams:[]},
  {locationId:"beech-mountain",locationName:"Beech Mountain Resort cams / conditions",webcamPageUrl:"https://www.beechmountainresort.com/hours-of-operation-winter/",webcams:[]},
  {locationId:"high-country-roads",locationName:"High Country roads · NCDOT · DriveNC",webcamPageUrl:"https://www.drivenc.gov/",webcams:[]},
  {locationId:"cataloochee-ski-area",locationName:"Cataloochee Ski Area cams / conditions",webcamPageUrl:"https://cataloochee.com/the-mountain/cataloochee-ski-area-statistics-and-facts/",webcams:[]},
  {locationId:"maggie-valley-roads",locationName:"Maggie Valley roads · NCDOT · DriveNC",webcamPageUrl:"https://www.drivenc.gov/",webcams:[]},
  // Virginia · page-only official links; no unverified live-feed URLs are asserted.
  {locationId:"wintergreen-resort",locationName:"Wintergreen Resort cams / conditions",webcamPageUrl:"https://www.wintergreenresort.com/mountain-report-cams/",webcams:[]},
  {locationId:"blue-ridge-roads",locationName:"Blue Ridge roads · VDOT · 511 Virginia",webcamPageUrl:"https://511.vdot.virginia.gov/",webcams:[]},
  {locationId:"massanutten-resort",locationName:"Massanutten Resort cams / conditions",webcamPageUrl:"https://www.massresort.com/play/snow-sports/snow-conditions/",webcams:[]},
  {locationId:"shenandoah-valley-roads",locationName:"Shenandoah Valley roads · VDOT · 511 Virginia",webcamPageUrl:"https://511.vdot.virginia.gov/",webcams:[]},
  // ─── Resort live-cam pages: Oregon (Mt. Hood) ──────
  {
    locationId: "mt-hood-meadows",
    // ⚠️ No confirmed live webcam URL found in research (JS-rendered
    // page, could not independently verify a stable feed) — page-only
    // link to the resort's own site, no fabricated feed.
    locationName: "Mt. Hood Meadows live cams",
    webcamPageUrl: "https://www.skihood.com/",
    webcams: [],
  },
  {
    locationId: "timberline-lodge",
    // ⚠️ No confirmed dedicated webcam URL found in research — page-only
    // link to the resort's own conditions page, no fabricated feed.
    locationName: "Timberline Lodge live cams",
    webcamPageUrl: "https://www.timberlinelodge.com/Conditions",
    webcams: [],
  },
  {
    locationId: "mt-hood-skibowl",
    // Confirmed live per research (West Base, Upper Bowl, East Base) —
    // page-only link, no fabricated per-camera deep links.
    locationName: "Mt. Hood Skibowl live cams",
    webcamPageUrl: "https://skibowl.com/winter-condition-and-lift-status/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Oregon (Bend / Mt. Bachelor) ──────
  {
    locationId: "mt-bachelor",
    // Confirmed official webcam hub with 8+ live feeds per research —
    // page-only link, no fabricated per-camera deep links.
    locationName: "Mt. Bachelor live cams",
    webcamPageUrl: "https://www.mtbachelor.com/mountain-report",
    webcams: [],
  },

  // ─── Roadside cams: Oregon ───────────────────────────────────────
  // ODOT's TripCheck runs public highway traffic cameras but does not
  // expose a stable deep link per camera that survives a season — same
  // honest page-only-link pattern as every prior state.
  {
    locationId: "mt-hood-roads",
    locationName: "Roads to Mt. Hood · US-26 / OR-35",
    webcamPageUrl: "https://www.tripcheck.com/",
    webcams: [],
  },
  {
    locationId: "bend-roads",
    locationName: "Roads to Mt. Bachelor · Cascade Lakes Hwy / OR-372",
    webcamPageUrl: "https://www.tripcheck.com/",
    webcams: [],
  },

  // ─── Resort live-cam pages: Washington ──────
  {
    locationId: "crystal-mountain",
    // ⚠️ Resort publishes a webcam page but no individual feed URL was
    // independently confirmed live by direct fetch in research —
    // page-only link, no fabricated feed.
    locationName: "Crystal Mountain live cams",
    webcamPageUrl: "https://www.crystalmountainresort.com/mountain-report",
    webcams: [],
  },
  {
    locationId: "snoqualmie-pass",
    // ⚠️ Webcam feeds are listed on-site but were not independently
    // re-verified as live in research — page-only link, no fabricated feed.
    locationName: "The Summit at Snoqualmie live cams",
    webcamPageUrl: "https://summitatsnoqualmie.com/mountain-report/",
    webcams: [],
  },
  {
    locationId: "stevens-pass",
    // ⚠️ Webcam feeds are listed on-site but were not independently
    // re-verified as live in research — page-only link, no fabricated feed.
    locationName: "Stevens Pass live cams",
    webcamPageUrl: "https://www.stevenspass.com/the-mountain/mountain-conditions.aspx",
    webcams: [],
  },
  {
    locationId: "mt-baker",
    // ⚠️ NO confirmed webcam found in research at all (unlike the other
    // three WA resorts, which at least have an unverified page) — mirrors
    // Whitefish's no-webcam pattern from the Montana pass. Page-only link
    // to the resort's own site, no fabricated feed.
    locationName: "Mt. Baker live cams",
    webcamPageUrl: "https://www.mtbaker.us/",
    webcams: [],
  },

  // ─── Roadside cams: Washington ───────────────────────────
  // WSDOT runs public highway/mountain-pass cameras but does not expose a
  // stable deep link per camera that survives a season — same honest
  // page-only-link pattern as every prior state.
  {
    locationId: "crystal-mountain-roads",
    locationName: "Roads to Crystal Mountain · SR-410",
    webcamPageUrl: "https://wsdot.com/travel/real-time/mountainpasses",
    webcams: [],
  },
  {
    locationId: "snoqualmie-pass-roads",
    locationName: "Roads to Snoqualmie Pass · I-90",
    webcamPageUrl: "https://wsdot.com/travel/real-time/mountainpasses",
    webcams: [],
  },
  {
    locationId: "stevens-pass-roads",
    locationName: "Roads to Stevens Pass · US-2",
    webcamPageUrl: "https://wsdot.com/travel/real-time/mountainpasses",
    webcams: [],
  },
  {
    locationId: "mt-baker-roads",
    locationName: "Roads to Mt. Baker · SR-542",
    webcamPageUrl: "https://wsdot.com/travel/real-time/mountainpasses",
    webcams: [],
  },

  // ─── Resort live-cam pages: Idaho ──────
  {
    locationId: "bald-mountain",
    // Confirmed live per research — shared Sun Valley conditions/webcam
    // page covering both Bald Mountain and Dollar Mountain.
    locationName: "Sun Valley (Bald Mountain) live cams",
    webcamPageUrl: "https://www.sunvalley.com/mountain/conditions-weather",
    webcams: [],
  },
  {
    locationId: "dollar-mountain",
    // Confirmed live per research — shared Sun Valley conditions/webcam
    // page covering both Bald Mountain and Dollar Mountain.
    locationName: "Sun Valley (Dollar Mountain) live cams",
    webcamPageUrl: "https://www.sunvalley.com/mountain/conditions-weather",
    webcams: [],
  },
  {
    locationId: "schweitzer-mountain-resort",
    // Confirmed live PanoCam per research — page-only link, no fabricated
    // per-camera deep link.
    locationName: "Schweitzer Mountain Resort live cams",
    webcamPageUrl: "https://www.schweitzer.com/mountain-report/",
    webcams: [],
  },
  {
    locationId: "bogus-basin",
    // Confirmed live combined conditions/webcam page per research.
    locationName: "Bogus Basin live cams",
    webcamPageUrl: "https://bogusbasin.org/mountain-report/",
    webcams: [],
  },
  {
    locationId: "tamarack-resort",
    // Confirmed conditions page exists per research — page-only link, no
    // fabricated per-camera deep link.
    locationName: "Tamarack Resort live cams",
    webcamPageUrl: "https://www.tamarackidaho.com/mountain-report/",
    webcams: [],
  },
  {
    locationId: "brundage-mountain",
    // Confirmed live named cams per research — page-only link, no
    // fabricated per-camera deep link.
    locationName: "Brundage Mountain live cams",
    webcamPageUrl: "https://www.brundage.com/mountain-report/",
    webcams: [],
  },

  // ─── Roadside cams: Idaho ───────────────────────────
  // Idaho 511 runs public highway cameras but does not expose a stable
  // deep link per camera that survives a season — same honest
  // page-only-link pattern as every prior state.
  {
    locationId: "sun-valley-roads",
    locationName: "Roads to Sun Valley · ID-75",
    webcamPageUrl: "https://511.idaho.gov/",
    webcams: [],
  },
  {
    locationId: "sandpoint-roads",
    locationName: "Roads to Schweitzer · Schweitzer Mountain Rd / US-95",
    webcamPageUrl: "https://511.idaho.gov/",
    webcams: [],
  },
  {
    locationId: "boise-roads",
    locationName: "Roads to Bogus Basin · Bogus Basin Rd",
    webcamPageUrl: "https://511.idaho.gov/",
    webcams: [],
  },
  {
    locationId: "donnelly-mccall-roads",
    locationName: "Roads to Tamarack / Brundage · ID-55",
    webcamPageUrl: "https://511.idaho.gov/",
    webcams: [],
  },

  // ─── Resort live-cam pages: New Hampshire ───
  { locationId: "cranmore-mountain", locationName: "Cranmore Mountain live cams", webcamPageUrl: "https://mountwashington.org/weather-cams/cranmore-mountain-mesiter-cam/", webcams: [] }, // confirmed Observatory-hosted Meister Cam, not a Cranmore first-party page
  { locationId: "wildcat-mountain", locationName: "Wildcat Mountain conditions", webcamPageUrl: "https://www.skiwildcat.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx", webcams: [] }, // ⚠️ no clearly live distinct official webcam URL confirmed
  { locationId: "attitash-mountain-resort", locationName: "Attitash Mountain Resort conditions", webcamPageUrl: "https://www.attitash.com/the-mountain/about-the-mountain/mountain-info.aspx", webcams: [] }, // ⚠️ no clearly live official webcam URL confirmed
  { locationId: "cannon-mountain", locationName: "Cannon Mountain live cams", webcamPageUrl: "https://www.cannonmt.com/webcam", webcams: [] },
  { locationId: "bretton-woods", locationName: "Bretton Woods live cam", webcamPageUrl: "https://www.brettonwoods.com/live-cam-forecast/", webcams: [] },
  { locationId: "loon-mountain", locationName: "Loon Mountain live cams", webcamPageUrl: "https://www.skiresort.info/ski-resort/loon-mountain/webcams/", webcams: [] },
  { locationId: "waterville-valley-resort", locationName: "Waterville Valley live cams", webcamPageUrl: "https://www.waterville.com/cams", webcams: [] },
  { locationId: "gunstock-mountain-resort", locationName: "Gunstock Mountain Resort live cams", webcamPageUrl: "https://www.gunstock.com/discover/webcams/", webcams: [] },
  // ─── Roadside cams: New Hampshire · NHDOT uses regional New England 511, not a standalone NH 511 site. ───
  { locationId: "white-mountains-roads", locationName: "Roads to North Conway · NH-16 / Route 302", webcamPageUrl: "https://newengland511.org/Home/Index", webcams: [] },
  { locationId: "franconia-notch-roads", locationName: "Roads to Franconia Notch · I-93 / US-3", webcamPageUrl: "https://newengland511.org/Home/Index", webcams: [] },
  { locationId: "waterville-valley-roads", locationName: "Roads to Waterville Valley · NH-49", webcamPageUrl: "https://newengland511.org/Home/Index", webcams: [] },
  { locationId: "lakes-region-roads", locationName: "Roads to Gunstock · NH-11A / NH-11", webcamPageUrl: "https://newengland511.org/Home/Index", webcams: [] },
  // ─── Resort camera/reference pages: Maine ───
  { locationId: "sugarloaf", locationName: "Sugarloaf mountain report", webcamPageUrl: "https://www.sugarloaf.com/mountain-report", webcams: [] }, // ⚠️ /mountain-report/webcams returned 404; official embeds likely live on report page
  { locationId: "sunday-river", locationName: "Sunday River mountain report", webcamPageUrl: "https://www.sundayriver.com/mountain-report", webcams: [] }, // ⚠️ dedicated webcam sub-URL returned 404; do not invent one
  { locationId: "saddleback-mountain", locationName: "Saddleback Mountain webcams", webcamPageUrl: "https://www.saddlebackmaine.com/webcams/", webcams: [] }, // official page confirmed; actual embed stream URLs/status unconfirmed
  // ─── Roadside cams: MaineDOT / 511 Maine ───
  { locationId: "carrabassett-valley-roads", locationName: "Roads to Sugarloaf · ME-16 / ME-27", webcamPageUrl: "https://511maine.gov/", webcams: [] },
  { locationId: "newry-bethel-roads", locationName: "Roads to Sunday River · ME-26 / ME-2", webcamPageUrl: "https://511maine.gov/", webcams: [] },
  { locationId: "rangeley-roads", locationName: "Roads to Saddleback · ME-4 / ME-16", webcamPageUrl: "https://511maine.gov/", webcams: [] },
  // ─── Resort camera/reference pages: New York ───
  { locationId: "whiteface-mountain", locationName: "Whiteface Mountain conditions", webcamPageUrl: "https://whiteface.com/mountain/conditions/", webcams: [] }, // ⚠️ no dedicated verifiable live webcam URL confirmed
  { locationId: "gore-mountain", locationName: "Gore Mountain Base Area Webcam", webcamPageUrl: "https://goremountain.com/the-mountain/webcam/", webcams: [] },
  { locationId: "hunter-mountain", locationName: "Hunter Mountain live cams", webcamPageUrl: "https://www.huntermtn.com/the-mountain/mountain-conditions/mountain-cams.aspx", webcams: [] },
  { locationId: "windham-mountain", locationName: "Windham Mountain Club camera", webcamPageUrl: "https://www.windhammountainclub.com/mountain-cam/", webcams: [] }, // official URL exists; live status not independently confirmed and third-party reports show offline/unavailable
  { locationId: "belleayre-mountain", locationName: "Belleayre Mountain webcams", webcamPageUrl: "https://www.belleayre.com/mountain/web-cams/", webcams: [] },
  // ─── Roadside cams: NYSDOT / 511NY ───
  { locationId: "lake-placid-roads", locationName: "Roads to Whiteface · NY-86", webcamPageUrl: "https://511ny.org/", webcams: [] },
  { locationId: "north-creek-roads", locationName: "Roads to Gore · NY-28 / NY-28N", webcamPageUrl: "https://511ny.org/", webcams: [] },
  { locationId: "hunter-roads", locationName: "Roads to Hunter · NY-23A / NY-296", webcamPageUrl: "https://511ny.org/", webcams: [] },
  { locationId: "windham-roads", locationName: "Roads to Windham · NY-23", webcamPageUrl: "https://511ny.org/", webcams: [] },
  { locationId: "highmount-roads", locationName: "Roads to Belleayre · NY-28", webcamPageUrl: "https://511ny.org/", webcams: [] },
];

router.get("/webcams", (req, res) => {
  try {
    const region = parseRegionParam(req.query["region"]);
    const locations = region
      ? WEBCAM_DATA.filter((loc) => locationMatchesRegion(loc.locationId, region))
      : WEBCAM_DATA;

    const result = GetWebcamsResponse.parse({
      locations,
      lastUpdated: new Date().toISOString(),
    });
    res.json(result);
  } catch (error) {
    if (error instanceof RegionParamError) {
      res.status(400).json({ error: "INVALID_REGION", message: error.message });
      return;
    }
    throw error;
  }
});

router.get("/webcams/:locationId", (req, res) => {
  const { locationId } = GetLocationWebcamsParams.parse(req.params);
  const location = WEBCAM_DATA.find((l) => l.locationId === locationId);

  if (!location) {
    res.status(404).json({
      error: "LOCATION_NOT_FOUND",
      message: `No webcams found for location '${locationId}'`,
    });
    return;
  }

  const result = GetLocationWebcamsResponse.parse(location);
  res.json(result);
});

/** All location ids served by `/webcams/:locationId`. Source of truth used
 *  by the boot-time location-id contract validator (lib/validate-locations). */
export const WEBCAM_LOCATION_IDS = WEBCAM_DATA.map((l) => l.locationId);

export default router;
