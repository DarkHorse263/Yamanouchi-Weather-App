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
    webcamPageUrl: "https://www.kijima-sp.jp/",
    webcams: [],
  },
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
