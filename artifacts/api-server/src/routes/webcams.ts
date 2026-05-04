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
  // Note: TfNSW Live Traffic does NOT operate cameras inside Kosciuszko NP,
  // so coverage stops at Cooma/Berridale. Inside the park we rely on
  // Snowy Hydro (Cabramurra) and resort village cams.
  {
    locationId: "snowy-mountains-roads",
    locationName: "Roads to the snowfields",
    webcamPageUrl: "https://www.livetraffic.com/maps?lat=-36.45&lng=148.45&zoom=10&layers=cameras",
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
        description: "Live Traffic NSW alpine camera at the Cooma gateway — last reliable check before the climb to Jindabyne.",
        imageUrl: "https://www.livetraffic.com/Map/Resources/Cameras/cooma.jpg",
        pageUrl: "https://www.livetraffic.com/maps?lat=-36.235&lng=149.13&zoom=12&layers=cameras",
        type: "road",
        roadName: "Snowy Mountains Highway",
      },
      {
        id: "smh-bullocks-flat",
        name: "Bullocks Flat · Kosciuszko Rd",
        description: "Skitube terminal area on Kosciuszko Road. Useful when deciding to drive to Perisher or take the train.",
        imageUrl: "https://www.perisher.com.au/-/media/perisher/cams/skitube-bullocks.jpg",
        pageUrl: "https://www.perisher.com.au/the-mountain/web-cams",
        elevation: 1130,
        type: "road",
        roadName: "Kosciuszko Road",
      },
      {
        id: "smh-thredbo-village",
        name: "Thredbo Village · Alpine Way",
        description: "Village arrival on the Alpine Way — shows actual road surface and chain conditions at the resort entrance.",
        imageUrl: `${THREDBO_S3}/Coaster01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1365,
        type: "road",
        roadName: "Alpine Way",
      },
    ],
  },

  // ─── Roadside cams: Yamanouchi / Shiga Kogen (JP) ────────────────────────
  {
    locationId: "yamanouchi-roads",
    locationName: "山ノ内町への道路 · Roads to Yamanouchi",
    webcamPageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
    webcams: [
      {
        id: "jp-r292-shiga-kogen",
        name: "国道292号 · 志賀草津高原ルート",
        description: "MLIT live CCTV on Route 292 — the famous 'Snow Corridor' approach to Shiga Kogen.",
        imageUrl: "https://www.thr.mlit.go.jp/road/cctv/292/shiga.jpg",
        pageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
        elevation: 1600,
        type: "road",
        roadName: "Route 292 (Shiga-Kusatsu Highway)",
      },
      {
        id: "jp-r403-yudanaka",
        name: "国道403号 · 湯田中駅付近",
        description: "Approach to Yudanaka station and the Shiga Kogen base — typically clear of snow but icy in early morning.",
        imageUrl: "https://www.hrr.mlit.go.jp/road/cctv/403/yudanaka.jpg",
        pageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
        type: "road",
        roadName: "Route 403",
      },
      {
        id: "jp-joshinetsu-shinanomachi",
        name: "上信越自動車道 · 信濃町IC",
        description: "NEXCO East Joshin'etsu Expressway camera near Shinanomachi IC — main approach from Tokyo.",
        imageUrl: "https://www.drivetraffic.jp/cctv/joshinetsu/shinano.jpg",
        pageUrl: "https://www.drivetraffic.jp/",
        type: "road",
        roadName: "Joshin'etsu Expressway",
      },
    ],
  },

  // ─── Roadside cams: Iiyama (JP) ─────────────────────────────────────────
  {
    locationId: "iiyama-roads",
    locationName: "飯山への道路 · Roads to Iiyama",
    webcamPageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
    webcams: [
      {
        id: "jp-r117-iiyama",
        name: "国道117号 · 飯山市内",
        description: "MLIT camera on Route 117 through Iiyama — heavy snow corridor in mid-winter.",
        imageUrl: "https://www.hrr.mlit.go.jp/road/cctv/117/iiyama.jpg",
        pageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
        type: "road",
        roadName: "Route 117",
      },
      {
        id: "jp-joshinetsu-iiyama-ic",
        name: "上信越自動車道 · 豊田飯山IC",
        description: "NEXCO East camera near Toyota-Iiyama IC — the main exit for Madarao and Tangram.",
        imageUrl: "https://www.drivetraffic.jp/cctv/joshinetsu/iiyama.jpg",
        pageUrl: "https://www.drivetraffic.jp/",
        type: "road",
        roadName: "Joshin'etsu Expressway",
      },
      {
        id: "jp-r292-nozawa",
        name: "国道292号 · 野沢温泉方面",
        description: "Approach road to Nozawa Onsen from Iiyama — typically requires winter tyres.",
        imageUrl: "https://www.hrr.mlit.go.jp/road/cctv/292/nozawa.jpg",
        pageUrl: "https://www.hrr.mlit.go.jp/road/menu/road_info_camera.html",
        type: "road",
        roadName: "Route 292",
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
