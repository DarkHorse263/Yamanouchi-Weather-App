import { Router, type IRouter } from "express";
import { GetWebcamsResponse, GetLocationWebcamsResponse, GetLocationWebcamsParams } from "@workspace/api-zod";

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

const WEBCAM_DATA: WebcamConfig[] = [
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
    locationId: "perisher",
    locationName: "Perisher",
    webcamPageUrl: "https://www.perisher.com.au/the-mountain/web-cams",
    webcams: [],
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
        id: "smh-cabramurra",
        name: "Cabramurra · Snowy Mountains Hwy",
        description: "Snowy Hydro snow cam from Australia's highest town. Best indicator of snow on the Snowy Mountains Highway between Cooma and Khancoban.",
        imageUrl: "https://www.snowyhydro.com.au/wp-content/uploads/Cabramurra-snow-cam.jpg",
        pageUrl: "https://www.snowyhydro.com.au/snow-cams/",
        elevation: 1488,
        type: "road",
        roadName: "Snowy Mountains Highway",
      },
      {
        id: "smh-cooma-livetraffic",
        name: "Cooma · Snowy Mountains Hwy",
        description: "Live Traffic NSW alpine camera at the Cooma gateway — last reliable check before the climb to Jindabyne. Opens directly on the Cooma camera in Live Traffic NSW.",
        imageUrl: "https://www.livetraffic.com/Map/Resources/Cameras/Cooma.jpg",
        pageUrl: "https://www.livetraffic.com/desktop.html#/map/?lat=-36.235&lng=149.13&zoom=15&layers=cameras",
        type: "road",
        roadName: "Snowy Mountains Highway",
      },
      {
        id: "smh-bullocks-flat",
        name: "Bullocks Flat · Kosciuszko Rd",
        description: "Skitube terminal area on Kosciuszko Road. Useful when deciding to drive on to Perisher or take the train. Opens the official Perisher cams page.",
        imageUrl: "https://www.perisher.com.au/-/media/perisher/cams/skitube-bullocks.jpg",
        pageUrl: "https://www.perisher.com.au/the-mountain/web-cams",
        elevation: 1130,
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-kosciuszko-perisher-valley",
        name: "Kosciuszko Rd and Perisher Valley",
        description: "Official Live Traffic NSW alpine camera at the Perisher Valley turnoff — the highest point on Kosciuszko Rd, often the first place to ice over. Image refreshes when TfNSW reactivates the camera for snow season.",
        imageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_perisher_valley_kosciuszko_national_park.jpeg",
        pageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_perisher_valley_kosciuszko_national_park.jpeg",
        elevation: 1720,
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-kosciuszko-alpine-way",
        name: "Kosciuszko Rd & Alpine Way",
        description: "Official Live Traffic NSW camera at the Kosciuszko Rd / Alpine Way junction near Jindabyne — the decision point between heading up to Perisher or across to Thredbo.",
        imageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_alpine_way_jindabyne.jpeg",
        pageUrl: "https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/kosciuszko_rd_&_alpine_way_jindabyne.jpeg",
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-kosciuszko-wilsons-valley",
        name: "Kosciuszko Road (Wilsons Valley)",
        description: "Official Live Traffic NSW camera at Wilsons Valley between Sawpit Creek and Smiggin Holes — exposed alpine section, watch for chains.",
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
  // The site's frame layout means we can't deep-link to individual cameras —
  // every cam links back to the same index where the user picks the camera
  // on the map. That IS the source the locals use.
  {
    locationId: "yamanouchi-roads",
    locationName: "山ノ内町への道路 · Roads to Yamanouchi",
    webcamPageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    webcams: [
      {
        id: "jp-r292-shiga-kogen",
        name: "国道292号 · 志賀草津高原ルート",
        description: "Route 292 — the famous 'Snow Corridor' approach to Shiga Kogen. Pick this camera from the map on the Hokushin road-camera site.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/r292-shiga.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        elevation: 1600,
        type: "road",
        roadName: "Route 292 (Shiga-Kusatsu Highway)",
      },
      {
        id: "jp-r403-yudanaka",
        name: "国道403号 · 湯田中駅付近",
        description: "Approach to Yudanaka station and the Shiga Kogen base — typically clear of snow but icy in early morning.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/r403-yudanaka.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        type: "road",
        roadName: "Route 403",
      },
      {
        id: "jp-r466-shibu-onsen",
        name: "県道466号 · 渋温泉付近",
        description: "Local prefectural road through Shibu Onsen towards the Shiga Kogen access roads.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/r466-shibu.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        type: "road",
        roadName: "Prefectural Route 466",
      },
    ],
  },

  // ─── Roadside cams: Iiyama (JP) ─────────────────────────────────────────
  // Same Hokushin source covers the Iiyama / Madarao / Nozawa corridor.
  {
    locationId: "iiyama-roads",
    locationName: "飯山への道路 · Roads to Iiyama",
    webcamPageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    webcams: [
      {
        id: "jp-r117-iiyama",
        name: "国道117号 · 飯山市内",
        description: "Route 117 through Iiyama city centre — heavy snow corridor in mid-winter.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/r117-iiyama.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        type: "road",
        roadName: "Route 117",
      },
      {
        id: "jp-r292-nozawa",
        name: "国道292号 · 野沢温泉方面",
        description: "Approach road to Nozawa Onsen from Iiyama — typically requires winter tyres.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/r292-nozawa.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        type: "road",
        roadName: "Route 292",
      },
      {
        id: "jp-madarao-access",
        name: "斑尾高原アクセス道路",
        description: "Access road climbing from Iiyama towards Madarao Kogen and Tangram.",
        imageUrl: "http://hokushin.pref-nagano-roadcamera.jp/img/madarao-access.jpg",
        pageUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
        type: "road",
        roadName: "Madarao Access Road",
      },
    ],
  },
];

router.get("/webcams", (_req, res) => {
  const result = GetWebcamsResponse.parse({
    locations: WEBCAM_DATA,
    lastUpdated: new Date().toISOString(),
  });
  res.json(result);
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

export default router;
