import { Router, type IRouter } from "express";
import { GetWebcamsResponse, GetLocationWebcamsResponse, GetLocationWebcamsParams } from "@workspace/api-zod";

const router: IRouter = Router();

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
        direction: "South-East"
      },
      {
        id: "thredbo-cruiser",
        name: "Cruiser",
        description: "Mid-mountain view of the Cruiser area and main ski runs",
        imageUrl: `${THREDBO_S3}/Cruiser01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1700,
        direction: "North-East"
      },
      {
        id: "thredbo-eagles-nest-1",
        name: "Eagles Nest (View 1)",
        description: "View from the Eagles Nest area at the top of the mountain",
        imageUrl: `${THREDBO_S3}/EaglesNest01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1937,
        direction: "North"
      },
      {
        id: "thredbo-eagles-nest-2",
        name: "Eagles Nest (View 2)",
        description: "Second view from the Eagles Nest area overlooking the valley",
        imageUrl: `${THREDBO_S3}/EaglesNest02.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1937,
        direction: "South"
      },
      {
        id: "thredbo-coaster",
        name: "Coaster",
        description: "View from the Coaster area showing snow conditions",
        imageUrl: `${THREDBO_S3}/Coaster01.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1365,
        direction: "West"
      },
      {
        id: "thredbo-super-trail",
        name: "Super Trail",
        description: "View of the Super Trail run, one of Thredbo's iconic black runs",
        imageUrl: `${THREDBO_S3}/SuperTrail02.jpg`,
        pageUrl: "https://www.thredbo.com.au/weather/snow-cams",
        elevation: 1800,
        direction: "East"
      }
    ]
  },
  {
    locationId: "perisher",
    locationName: "Perisher",
    webcamPageUrl: "https://www.perisher.com.au/the-mountain/web-cams",
    webcams: []
  },
  {
    locationId: "charlottes-pass",
    locationName: "Charlotte's Pass",
    webcamPageUrl: "https://www.charlottespass.com.au/snow-cams/",
    webcams: []
  },
  {
    locationId: "jindabyne",
    locationName: "Jindabyne",
    webcamPageUrl: "https://www.jindabyne.org/webcam/",
    webcams: []
  }
];

router.get("/webcams", (_req, res) => {
  const result = GetWebcamsResponse.parse({
    locations: WEBCAM_DATA,
    lastUpdated: new Date().toISOString()
  });
  res.json(result);
});

router.get("/webcams/:locationId", (req, res) => {
  const { locationId } = GetLocationWebcamsParams.parse(req.params);
  const location = WEBCAM_DATA.find(l => l.locationId === locationId);

  if (!location) {
    res.status(404).json({
      error: "LOCATION_NOT_FOUND",
      message: `No webcams found for location '${locationId}'`
    });
    return;
  }

  const result = GetLocationWebcamsResponse.parse(location);
  res.json(result);
});

export default router;
