import { Router, type IRouter } from "express";
import { GetRoadConditionsResponse } from "@workspace/api-zod";
import { parseRegionParam, RegionParamError } from "../lib/regions.js";

const router: IRouter = Router();

const CHAIN_FITTING_BAYS = [
  {
    name: "Sawpit Creek Chain Bay",
    location: "Kosciuszko Road, approximately 20km from Jindabyne",
    road: "Kosciuszko Road",
    description: "Main chain fitting bay on the way to Perisher. Rangers often on duty during winter to assist with chain fitting."
  },
  {
    name: "Thredbo Turn-off Chain Bay",
    location: "Alpine Way, at the Thredbo turn-off junction",
    road: "Alpine Way",
    description: "Chain bay at the junction where Alpine Way meets the Thredbo access road."
  },
  {
    name: "Waste Point Chain Bay",
    location: "Alpine Way, near Waste Point",
    road: "Alpine Way",
    description: "Additional chain fitting area on the Alpine Way between Jindabyne and Thredbo."
  },
  {
    name: "Bullocks Flat Chain Bay",
    location: "Kosciuszko Road, near Bullocks Flat Skitube terminal",
    road: "Kosciuszko Road",
    description: "Chain bay near the Skitube terminal. Skitube provides an alternative to driving to Perisher when road conditions are poor."
  }
];

async function fetchRoadConditions() {
  const roads = [
    {
      id: "kosciuszko-road",
      roadName: "Kosciuszko Road",
      segment: "Jindabyne to Perisher Valley",
      condition: "open" as const,
      description: "Main access road from Jindabyne to Perisher Valley via Bullocks Flat Skitube terminal. Check conditions before travel during winter.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html#702055",
      affectedResorts: ["perisher"]
    },
    {
      id: "alpine-way",
      roadName: "Alpine Way",
      segment: "Jindabyne to Thredbo",
      condition: "open" as const,
      description: "Scenic route from Jindabyne to Thredbo Alpine Village via the Alpine Way. Chains may be required during and after snowfall.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html#702056",
      affectedResorts: ["thredbo"]
    },
    (() => {
      // Perisher → Charlotte's Pass is closed by NPWS each winter from the
      // Queen's Birthday long weekend (mid-June) until early October. Outside
      // that window it is open to normal road traffic.
      const now = new Date();
      const month = now.getMonth(); // 0 = Jan
      const day = now.getDate();
      const isSnowSeasonClosure =
        (month === 5 && day >= 10) || // 10 Jun onwards
        month === 6 || month === 7 || month === 8 || // Jul–Sep
        (month === 9 && day <= 10); // up to 10 Oct
      return {
        id: "kosciuszko-road-charlottes",
        roadName: "Kosciuszko Road",
        segment: "Perisher to Charlotte's Pass",
        condition: (isSnowSeasonClosure ? "closed" : "open") as "closed" | "open",
        description: isSnowSeasonClosure
          ? "Closed for the snow season (mid-June to early October). Charlotte's Pass is accessible only by oversnow transport (snowcat) from Perisher during this period."
          : "Open outside the snow season. Sealed alpine road from Perisher to Charlotte's Pass village - drive with care, rapid weather changes possible.",
        chainsRequired: false,
        lastUpdated: new Date().toISOString(),
        source: "NSW NPWS / Transport for NSW",
        detailUrl: "https://www.livetraffic.com/desktop.html#702055",
        affectedResorts: ["charlottes-pass"],
      };
    })(),
    {
      id: "snowy-mountains-highway",
      roadName: "Snowy Mountains Highway",
      segment: "Cooma to Adaminaby",
      condition: "open" as const,
      description: "Major highway connecting Cooma to the Snowy Mountains region. Generally well maintained but check conditions during severe weather.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html",
      affectedResorts: []
    },
    {
      id: "monaro-highway",
      roadName: "Monaro Highway",
      segment: "Canberra to Cooma",
      condition: "open" as const,
      description: "Main highway from Canberra to Cooma. Generally clear but black ice possible in early morning during winter.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html",
      affectedResorts: []
    },
    {
      id: "barry-way",
      roadName: "Barry Way",
      segment: "Jindabyne to Khancoban (via Snowy River)",
      condition: "caution" as const,
      description: "Alternative scenic route via the Snowy River. Unsealed sections, not recommended for 2WD vehicles during wet conditions.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html",
      affectedResorts: []
    }
  ];

  try {
    const response = await fetch("https://api.transport.nsw.gov.au/v1/live/hazards/alpine/open", {
      headers: {
        "Accept": "application/json"
      }
    });

    if (response.ok) {
      const data = await response.json() as any;
      if (data && Array.isArray(data.features)) {
        for (const feature of data.features) {
          const props = feature.properties;
          if (!props) continue;

          const roadName = props.mainCategory || props.roads?.[0]?.mainStreet || "Alpine Road";
          const existingRoad = roads.find(r =>
            r.roadName.toLowerCase().includes(roadName.toLowerCase()) ||
            roadName.toLowerCase().includes(r.roadName.toLowerCase())
          );

          if (existingRoad && props.headline) {
            existingRoad.description = props.headline;
            if (props.adviceA) {
              existingRoad.description += `. ${props.adviceA}`;
            }
            existingRoad.lastUpdated = props.lastUpdated || new Date().toISOString();

            if (props.headline.toLowerCase().includes("closed")) {
              existingRoad.condition = "closed";
            } else if (props.headline.toLowerCase().includes("chain")) {
              existingRoad.condition = "chains-required";
              existingRoad.chainsRequired = true;
            } else if (props.headline.toLowerCase().includes("caution") || props.headline.toLowerCase().includes("reduce")) {
              existingRoad.condition = "caution";
            }
          }
        }
      }
    }
  } catch {
  }

  return roads;
}

router.get("/road-conditions", async (req, res) => {
  try {
    const region = parseRegionParam(req.query["region"]);

    // Roads dataset is currently Snowy Mountains only. When other regions
    // ask for road conditions, return an empty roads list rather than 404
    // so the client can render a "no data yet" state cleanly.
    const isAU = region === undefined || region === "snowy-mountains";
    const roads = isAU ? await fetchRoadConditions() : [];
    const chainFittingBays = isAU ? CHAIN_FITTING_BAYS : [];

    const result = GetRoadConditionsResponse.parse({
      roads,
      generalAdvice: isAU
        ? "Always carry chains when travelling to the Snowy Mountains during winter (June-October). Check conditions before departure at livetraffic.com. National Parks entry fees apply for Kosciuszko National Park. Vehicle entry is $29/day or $190/year (2024 rates). During heavy snowfall, roads may close at short notice."
        : "Live road condition data is not yet available for this region.",
      liveTrafficUrl: isAU
        ? "https://www.livetraffic.com/maps?lat=-36.45&lng=148.45&zoom=10&layers=cameras"
        : "",
      lastUpdated: new Date().toISOString(),
      chainFittingBays,
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

export default router;
