import { Router, type IRouter } from "express";
import { GetLiftStatusResponse, GetLocationLiftStatusResponse, GetLocationLiftStatusParams } from "@workspace/api-zod";
import { locationMatchesRegion, parseRegionParam, RegionParamError } from "../lib/regions.js";
import { getThredboLiveLiftStatus } from "../lib/thredboLiftStatus.js";

const router: IRouter = Router();

interface ResortLiftData {
  locationId: string;
  locationName: string;
  lifts: {
    id: string;
    name: string;
    type: "chairlift" | "t-bar" | "poma" | "gondola" | "magic-carpet" | "surface";
    status: "open" | "closed" | "on-hold" | "wind-hold" | "scheduled";
    openingTime?: string;
    closingTime?: string;
    verticalRise?: number;
    capacity?: string;
    difficulty?: string;
  }[];
  runsOpen?: number;
  totalRuns?: number;
  snowCondition?: string;
  seasonStatus: "pre-season" | "open" | "late-season" | "closed";
  operatingHours?: string;
  liftStatusUrl: string;
  /** True ONLY when `lifts` came from the resort's own live feed, fetched
   *  fresh. Clients gate all open/closed UI on this flag. */
  liveStatusVerified?: boolean;
}

function getSeasonStatus(): "pre-season" | "open" | "late-season" | "closed" {
  const now = new Date();
  const month = now.getMonth() + 1;

  if (month >= 6 && month <= 8) return "open";
  if (month === 9) return "late-season";
  if (month === 5) return "pre-season";
  return "closed";
}

// ⚠️ LANDMINE: this is a STATIC lift catalogue - every lift is hardcoded
// "closed" even mid-season (getSeasonStatus() returns "open" Jun-Aug while
// nothing below ever flips). It is safe ONLY because the client display-gates
// open/closed badges behind LIVE_LIFT_STATUS_RESORTS + the response's
// liveStatusVerified flag. Thredbo (Aug 2026) is the first resort with a real
// live feed: getResortDataWithLive() REPLACES its rows from the official XML
// feed and flips liveStatusVerified true. NEVER add another resort to the
// client set without wiring a real live feed here first: flipping the gate
// against this catalogue would assert "0 of N lifts open" mid-winter - a
// false closure worse than showing nothing. A live feed must fail-soft to
// "unverified" (flag false), never fall back to these hardcoded rows as live.
const RESORT_LIFTS: ResortLiftData[] = [
  {
    locationId: "thredbo",
    locationName: "Thredbo",
    lifts: [
      {
        id: "thredbo-kosciuszko-express",
        name: "Kosciuszko Express",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 560,
        capacity: "6-seater high-speed detachable",
        difficulty: "all-levels"
      },
      {
        id: "thredbo-gunbarrel-express",
        name: "Gunbarrel Express",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 372,
        capacity: "4-seater high-speed quad",
        difficulty: "intermediate"
      },
      {
        id: "thredbo-cruiser",
        name: "Cruiser",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 280,
        capacity: "4-seater quad",
        difficulty: "intermediate"
      },
      {
        id: "thredbo-snowgums",
        name: "Snowgums",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 150,
        capacity: "Triple chair",
        difficulty: "beginner"
      },
      {
        id: "thredbo-friday-flat",
        name: "Friday Flat Learners",
        type: "magic-carpet",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 30,
        capacity: "Magic carpet conveyor",
        difficulty: "beginner"
      },
      {
        id: "thredbo-merritts",
        name: "Merritts Gondola",
        type: "gondola",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 370,
        capacity: "8-person enclosed gondola",
        difficulty: "all-levels"
      },
      {
        id: "thredbo-village-8",
        name: "Village 8 Express",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 420,
        capacity: "8-seater high-speed detachable",
        difficulty: "all-levels"
      },
      {
        id: "thredbo-high-noon",
        name: "High Noon",
        type: "t-bar",
        status: "closed",
        openingTime: "09:30",
        closingTime: "15:30",
        verticalRise: 200,
        capacity: "T-bar surface lift",
        difficulty: "advanced"
      },
      {
        id: "thredbo-karel-t-bar",
        name: "Karel's T-Bar",
        type: "t-bar",
        status: "closed",
        openingTime: "09:30",
        closingTime: "15:30",
        verticalRise: 180,
        capacity: "T-bar surface lift",
        difficulty: "advanced"
      },
      {
        id: "thredbo-anton",
        name: "Anton's T-Bar",
        type: "t-bar",
        status: "closed",
        openingTime: "09:30",
        closingTime: "15:30",
        verticalRise: 120,
        capacity: "T-bar surface lift",
        difficulty: "intermediate"
      }
    ],
    runsOpen: 0,
    totalRuns: 50,
    snowCondition: "Check thredbo.com.au for latest snow report",
    seasonStatus: getSeasonStatus(),
    operatingHours: "Lifts operate 8:30 AM - 5:00 PM during ski season",
    liftStatusUrl: "https://www.thredbo.com.au/the-mountain/#lifts-trails"
  },
  {
    locationId: "perisher",
    locationName: "Perisher",
    lifts: [
      {
        id: "perisher-village-8-express",
        name: "Village 8 Express",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 235,
        capacity: "8-seater high-speed detachable",
        difficulty: "all-levels"
      },
      {
        id: "perisher-front-valley-quad",
        name: "Front Valley Quad",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 148,
        capacity: "4-seater quad",
        difficulty: "beginner"
      },
      {
        id: "perisher-mt-perisher-double",
        name: "Mt Perisher Double",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 245,
        capacity: "Double chair",
        difficulty: "intermediate"
      },
      {
        id: "perisher-interceptor",
        name: "Interceptor",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 190,
        capacity: "Triple chair",
        difficulty: "advanced"
      },
      {
        id: "perisher-blue-cow-terminal",
        name: "Blue Cow Terminal",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "17:00",
        verticalRise: 300,
        capacity: "4-seater quad",
        difficulty: "intermediate"
      },
      {
        id: "perisher-summit-quad",
        name: "Summit Quad",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 170,
        capacity: "4-seater quad",
        difficulty: "intermediate"
      },
      {
        id: "perisher-skitube",
        name: "Skitube Alpine Railway",
        type: "gondola",
        status: "closed",
        openingTime: "07:30",
        closingTime: "18:00",
        verticalRise: 550,
        capacity: "Underground rack railway",
        difficulty: "all-levels"
      },
      {
        id: "perisher-happy-valley",
        name: "Happy Valley Magic Carpet",
        type: "magic-carpet",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 20,
        capacity: "Magic carpet conveyor",
        difficulty: "beginner"
      },
      {
        id: "perisher-smiggins-triple",
        name: "Smiggins Triple",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 160,
        capacity: "Triple chair",
        difficulty: "intermediate"
      },
      {
        id: "perisher-guthega-quad",
        name: "Guthega Quad",
        type: "chairlift",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:30",
        verticalRise: 200,
        capacity: "4-seater quad",
        difficulty: "advanced"
      },
      {
        id: "perisher-pleasant-valley",
        name: "Pleasant Valley T-Bar",
        type: "t-bar",
        status: "closed",
        openingTime: "09:30",
        closingTime: "16:00",
        verticalRise: 100,
        capacity: "T-bar",
        difficulty: "intermediate"
      }
    ],
    runsOpen: 0,
    totalRuns: 100,
    snowCondition: "Check perisher.com.au for latest snow report",
    seasonStatus: getSeasonStatus(),
    operatingHours: "Lifts operate 8:30 AM - 5:00 PM during ski season. Skitube 7:30 AM - 6:00 PM.",
    liftStatusUrl: "https://www.perisher.com.au/reports-cams/reports/snow-report"
  },
  {
    locationId: "charlottes-pass",
    locationName: "Charlotte's Pass",
    lifts: [
      {
        id: "charlottes-basin-t-bar",
        name: "Basin T-Bar",
        type: "t-bar",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 140,
        capacity: "T-bar",
        difficulty: "intermediate"
      },
      {
        id: "charlottes-kangaroo-ridge",
        name: "Kangaroo Ridge Poma",
        type: "poma",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 100,
        capacity: "Poma lift",
        difficulty: "beginner"
      },
      {
        id: "charlottes-beginner-carpet",
        name: "Beginner Magic Carpet",
        type: "magic-carpet",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        verticalRise: 15,
        capacity: "Magic carpet conveyor",
        difficulty: "beginner"
      },
      {
        id: "charlottes-stillwell-t-bar",
        name: "Stillwell T-Bar",
        type: "t-bar",
        status: "closed",
        openingTime: "09:30",
        closingTime: "15:30",
        verticalRise: 80,
        capacity: "T-bar",
        difficulty: "intermediate"
      },
      {
        id: "charlottes-ridge-poma",
        name: "Ridge Poma",
        type: "poma",
        status: "closed",
        openingTime: "09:30",
        closingTime: "15:30",
        verticalRise: 60,
        capacity: "Poma lift",
        difficulty: "beginner"
      }
    ],
    runsOpen: 0,
    totalRuns: 15,
    snowCondition: "Check charlottespass.com.au for latest snow report. Charlotte's Pass is Australia's highest resort and typically has the most natural snow.",
    seasonStatus: getSeasonStatus(),
    operatingHours: "Lifts operate 9:00 AM - 4:00 PM during ski season",
    liftStatusUrl: "https://www.charlottespass.com.au/the-mountain/"
  },
  {
    locationId: "selwyn",
    locationName: "Selwyn",
    lifts: [
      {
        id: "selwyn-wombat-quad",
        name: "Wombat Quad",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "16:30",
        capacity: "4-seater fixed grip",
        difficulty: "all-levels"
      },
      {
        id: "selwyn-possum-quad",
        name: "Possum Quad",
        type: "chairlift",
        status: "closed",
        openingTime: "08:30",
        closingTime: "16:30",
        capacity: "4-seater fixed grip",
        difficulty: "intermediate"
      },
      {
        id: "selwyn-beginners-carpet",
        name: "Beginners Magic Carpet",
        type: "magic-carpet",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        capacity: "Conveyor",
        difficulty: "beginner"
      },
      {
        id: "selwyn-easy-rider-carpet",
        name: "Easy Rider Magic Carpet",
        type: "magic-carpet",
        status: "closed",
        openingTime: "09:00",
        closingTime: "16:00",
        capacity: "Conveyor",
        difficulty: "beginner"
      }
    ],
    totalRuns: 12,
    snowCondition: "Check selwynsnow.com.au for the latest snow report. Selwyn was rebuilt after the 2020 bushfires and reopened in June 2022.",
    seasonStatus: getSeasonStatus(),
    operatingHours: "Lifts operate 8:30 AM - 4:30 PM during ski season",
    liftStatusUrl: "https://www.selwynsnow.com.au/"
  }
];

function getResortData(): ResortLiftData[] {
  const seasonStatus = getSeasonStatus();

  return RESORT_LIFTS.map(resort => ({
    ...resort,
    seasonStatus,
    liveStatusVerified: false,
    lifts: resort.lifts.map(lift => ({
      ...lift,
      status: seasonStatus === "open" ? lift.status : "closed" as const
    }))
  }));
}

/**
 * Overlay Thredbo's OFFICIAL live per-lift feed onto the static catalogue.
 * Live rows fully REPLACE the hardcoded reference rows (names/count come from
 * the resort, not our seed list) and flip `liveStatusVerified` true. Feed
 * down / stale / unparseable -> catalogue rows unchanged with the flag false,
 * so clients fall back to the honest "no live status" mode - live claims are
 * never faked and never stale.
 */
async function getResortDataWithLive(): Promise<ResortLiftData[]> {
  const resorts = getResortData();
  const live = await getThredboLiveLiftStatus();
  if (!live) return resorts;
  return resorts.map((resort) => {
    if (resort.locationId !== "thredbo") return resort;
    return {
      ...resort,
      lifts: live.lifts,
      // The live feed carries no runs data - drop the hardcoded 0/50 rather
      // than pair real lift counts with fabricated run counts.
      runsOpen: undefined,
      totalRuns: undefined,
      liveStatusVerified: true,
    };
  });
}

router.get("/lift-status", async (req, res) => {
  try {
    const region = parseRegionParam(req.query["region"]);
    const allResorts = await getResortDataWithLive();
    const resorts = region
      ? allResorts.filter((r) => locationMatchesRegion(r.locationId, region))
      : allResorts;

    // Surface why a region has no resorts so debuggers + clients can render a
    // sensible empty state. Header keeps the JSON shape stable / OpenAPI-clean.
    if (region && resorts.length === 0) {
      res.setHeader(
        "X-Empty-Reason",
        `Lift status data is not yet available for region '${region}'.`,
      );
    }

    const now = new Date().toISOString();
    const result = GetLiftStatusResponse.parse({
      resorts: resorts.map(r => ({
        ...r,
        liftsOpen: r.lifts.filter(l => l.status === "open").length,
        totalLifts: r.lifts.length,
        lastUpdated: now
      })),
      lastUpdated: now
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

router.get("/lift-status/:locationId", async (req, res) => {
  // Don't run the strict OpenAPI enum-validator on the path param itself.
  // It throws a ZodError for any non-Snowy resort id (mt-buller, ryuoo, …),
  // which bubbles out of the handler as a 500 with an HTML stack trace
  // (info disclosure). We always want a clean JSON 404 for unknown ids
  // until lift coverage is expanded to other regions.
  const locationId = String(req.params.locationId ?? "");
  const resorts = await getResortDataWithLive();
  const resort = resorts.find(r => r.locationId === locationId);

  if (!resort) {
    const supported = resorts.map(r => r.locationId).join(", ");
    res.status(404).json({
      error: "LOCATION_NOT_FOUND",
      message: `No lift data for '${locationId}'. Currently supported: ${supported}`
    });
    return;
  }

  const result = GetLocationLiftStatusResponse.parse({
    ...resort,
    liftsOpen: resort.lifts.filter(l => l.status === "open").length,
    totalLifts: resort.lifts.length,
    lastUpdated: new Date().toISOString()
  });
  res.json(result);
});

export default router;
