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
              // The road `condition` enum is open/closed/caution; "chains
              // required" is surfaced via the dedicated `chainsRequired`
              // flag below, while the road itself stays drivable = caution.
              existingRoad.condition = "caution";
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

// ── Chain-status seeding ───────────────────────────────────────────────
// Per-mountain-approach chain-fitting requirement, modelled after the Mt
// Hotham public format ("Am I required to fit chains? — 2WD / AWD-4WD").
// Today these are seasonal-rule defaults derived from the published rules
// of each alpine authority; live overlay (resort feeds, BoM warnings) is
// pending. We always emit them so the UI is informative year-round, with
// `dataSource` flagging which is which.

type ChainReq = "not-required" | "must-carry" | "must-fit";

function isAuSnowSeason(now: Date): boolean {
  const m = now.getMonth(); // 0-indexed
  // AU resort road chain rules apply Queen's Birthday (mid-June) to early
  // October. Match Kosciuszko Rd seasonal-closure window.
  if (m === 5) return now.getDate() >= 10;
  if (m === 6 || m === 7 || m === 8) return true;
  if (m === 9) return now.getDate() <= 10;
  return false;
}

function isJpSnowSeason(now: Date): boolean {
  const m = now.getMonth();
  return m === 11 || m <= 3; // Dec–Apr
}

function isNzSnowSeason(now: Date): boolean {
  // NZ ski-field road chain rules apply through the southern-hemisphere
  // winter · the major fields run roughly 10 Jun to 10 Oct. Same window as
  // the AU helper but kept separate so the rule text never implies the NSW
  // or Victorian alpine authorities apply in NZ.
  const m = now.getMonth();
  if (m === 5) return now.getDate() >= 10;
  if (m === 6 || m === 7 || m === 8) return true;
  if (m === 9) return now.getDate() <= 10;
  return false;
}

function buildChainStatuses(regionId: string | undefined): Array<Record<string, unknown>> {
  const now = new Date();
  const issuedAt = now.toISOString();

  if (regionId === "snowy-mountains" || regionId === undefined) {
    const inSeason = isAuSnowSeason(now);
    // NSW NPWS rule: in snow season, 2WDs into Kosciuszko NP must carry
    // chains; AWD/4WD must carry. Fitting only when directed by rangers.
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "perisher-kosciuszko-rd",
        regionId: "snowy-mountains",
        mountainId: "perisher",
        mountainName: "Perisher",
        approach: "Kosciuszko Road from Jindabyne",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Snow season: all vehicles must carry diamond-pattern chains. Rangers direct fitting at Sawpit Creek when conditions require."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "NSW NPWS · Kosciuszko alpine rules",
        sourceUrl: "https://www.nationalparks.nsw.gov.au/things-to-do/alpine-driving",
        dataSource: "seasonal-rule",
      },
      {
        id: "thredbo-alpine-way",
        regionId: "snowy-mountains",
        mountainId: "thredbo",
        mountainName: "Thredbo",
        approach: "Alpine Way from Jindabyne",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Snow season: chains compulsory in vehicle. Bullocks Flat & Thredbo turn-off bays available."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "NSW NPWS · Kosciuszko alpine rules",
        sourceUrl: "https://www.nationalparks.nsw.gov.au/things-to-do/alpine-driving",
        dataSource: "seasonal-rule",
      },
    ];
  }

  if (regionId === "victorias-high-country") {
    const inSeason = isAuSnowSeason(now);
    // Victorian Alpine Resorts: in declared snow season, all vehicles
    // (including AWD/4WD) must carry chains; fitting is enforced at
    // resort entry when directed.
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    const liveLabel = "Mt Hotham Resort · road status (pending live wire)";
    return [
      {
        id: "hotham-harrietville",
        regionId: "victorias-high-country",
        mountainId: "mt-hotham",
        mountainName: "Mt Hotham",
        approach: "Harrietville Approach (Great Alpine Rd, north)",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Declared snow season. Carry diamond-pattern chains; fit when directed at Diamantina or resort entry."
          : "Out of declared snow season · chains not required.",
        issuedAt,
        sourceLabel: liveLabel,
        sourceUrl: "https://www.mthotham.com.au/the-mountain/road-conditions/",
        dataSource: "seasonal-rule",
      },
      {
        id: "hotham-omeo",
        regionId: "victorias-high-country",
        mountainId: "mt-hotham",
        mountainName: "Mt Hotham",
        approach: "Omeo Approach (Great Alpine Rd, south)",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Declared snow season. Carry chains. Dinner Plain to Hotham Village section enforced first."
          : "Out of declared snow season · chains not required.",
        issuedAt,
        sourceLabel: liveLabel,
        sourceUrl: "https://www.mthotham.com.au/the-mountain/road-conditions/",
        dataSource: "seasonal-rule",
      },
      {
        id: "falls-creek-bogong",
        regionId: "victorias-high-country",
        mountainId: "falls-creek",
        mountainName: "Falls Creek",
        approach: "Bogong High Plains Rd from Mount Beauty",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Declared snow season. Carry chains; fitting bay at Howmans Gap."
          : "Out of declared snow season · chains not required.",
        issuedAt,
        sourceLabel: "Falls Creek Resort · road status (pending live wire)",
        sourceUrl: "https://www.fallscreek.com.au/getting-here/",
        dataSource: "seasonal-rule",
      },
      {
        id: "buller-mirimbah",
        regionId: "victorias-high-country",
        mountainId: "mt-buller",
        mountainName: "Mt Buller",
        approach: "Mt Buller Rd from Mirimbah",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Declared snow season. Carry chains; entry gate at Mirimbah enforces."
          : "Out of declared snow season · chains not required.",
        issuedAt,
        sourceLabel: "Mt Buller Resort · road status (pending live wire)",
        sourceUrl: "https://www.mtbuller.com.au/Winter/explore/getting-here/road-report/",
        dataSource: "seasonal-rule",
      },
    ];
  }

  if (regionId === "tasmania") {
    // Tasmanian snow season is short and weather-dependent · roughly
    // mid-June to early September. Reuse the AU snow-season helper
    // (winter months in southern hemisphere) for chain rules on the
    // Ben Lomond access road · Jacobs Ladder is the exposed pitch.
    const inSeason = isAuSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-fit" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "ben-lomond-access-road",
        regionId: "tasmania",
        mountainId: "ben-lomond",
        mountainName: "Ben Lomond",
        approach: "Ben Lomond access road · Jacobs Ladder switchbacks from Upper Blessington",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Tasmania snow season · chains required for 2WD on Jacobs Ladder when snow is on the road. Road closes at short notice in storms."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "Transport Tasmania · live traffic (live feed pending)",
        sourceUrl: "https://www.transport.tas.gov.au/",
        dataSource: "pending",
      },
    ];
  }

  if (regionId === "yamanouchi") {
    const inSeason = isJpSnowSeason(now);
    return [
      {
        id: "shiga-route-292",
        regionId: "yamanouchi",
        mountainId: "shiga-kogen",
        mountainName: "Shiga Kogen",
        approach: "Route 292 from Yudanaka",
        status: "open",
        chains2wd: (inSeason ? "must-fit" : "not-required") as ChainReq,
        chainsAwd: (inSeason ? "must-carry" : "not-required") as ChainReq,
        note: inSeason
          ? "Winter tyres mandatory in Nagano. Chains required for 2WD vehicles on the Shiga loop above Kanbayashi when snow is on the road."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "Nagano Prefecture road bureau · winter rules (live feed pending)",
        sourceUrl: "https://www.pref.nagano.lg.jp/douro/",
        dataSource: "pending",
      },
    ];
  }

  if (regionId === "nozawa-onsen") {
    const inSeason = isJpSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-fit" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "nozawa-route-117",
        regionId: "nozawa-onsen",
        mountainId: "nozawa-onsen",
        mountainName: "Nozawa Onsen",
        approach: "Route 117 + Route 408 from Iiyama Shinkansen station",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Winter tyres mandatory in Nagano. Chains required for 2WD vehicles on the final climb into the onsen village when snow is on the road."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "Nagano Prefecture road bureau · winter rules (live feed pending)",
        sourceUrl: "https://www.pref.nagano.lg.jp/douro/",
        dataSource: "pending",
      },
    ];
  }

  if (regionId === "iiyama") {
    const inSeason = isJpSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-fit" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "iiyama-route-292-madarao",
        regionId: "iiyama",
        mountainId: "madarao",
        mountainName: "Madarao Kogen",
        approach: "Route 292 from Iiyama, then Madarao Kogen access road",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Winter tyres mandatory in Nagano. Chains required for 2WD on the Madarao access road · plateau road exposed to wind-drift."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "Nagano Prefecture road bureau · winter rules (live feed pending)",
        sourceUrl: "https://www.pref.nagano.lg.jp/douro/",
        dataSource: "pending",
      },
      {
        id: "iiyama-route-117-togari-kijimadaira",
        regionId: "iiyama",
        mountainId: "togari-onsen",
        mountainName: "Togari Onsen + Kijimadaira",
        approach: "Route 117 north from Iiyama (Togari, Kijimadaira, Kijima Snow Park)",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Winter tyres mandatory in Nagano. Chains required for 2WD on the village approach roads after fresh snow."
          : "Outside snow season · no chain requirement.",
        issuedAt,
        sourceLabel: "Nagano Prefecture road bureau · winter rules (live feed pending)",
        sourceUrl: "https://www.pref.nagano.lg.jp/douro/",
        dataSource: "pending",
      },
    ];
  }

  if (regionId === "queenstown") {
    const inSeason = isNzSnowSeason(now);
    // NZ rule: carry chains in ski season, fit when snow is settling, a
    // "chains required" sign is shown, or directed. QLDC (Queenstown Lakes)
    // can fine vehicles without chains in snow/ice under its bylaw.
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "coronet-peak-access-road",
        regionId: "queenstown",
        mountainId: "coronet-peak",
        mountainName: "Coronet Peak",
        approach: "Coronet Peak access road from Queenstown (via Gorge Rd / Arthurs Point)",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. Fit when snow is settling, a 'chains required' sign is shown, or directed. QLDC can fine vehicles travelling without chains in snow or ice."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "QLDC · winter road reports",
        sourceUrl: "https://www.qldc.govt.nz/services/transport-and-parking/winter-road-reports",
        dataSource: "seasonal-rule",
      },
      {
        id: "the-remarkables-access-road",
        regionId: "queenstown",
        mountainId: "the-remarkables",
        mountainName: "The Remarkables",
        approach: "The Remarkables access road from SH6 / Frankton",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. The access road is steep and unsealed; fit chains when snow is settling or directed. The pre-booked ski bus avoids driving it."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "QLDC · winter road reports",
        sourceUrl: "https://www.qldc.govt.nz/services/transport-and-parking/winter-road-reports",
        dataSource: "seasonal-rule",
      },
    ];
  }

  if (regionId === "wanaka") {
    const inSeason = isNzSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "cardrona-access-road",
        regionId: "wanaka",
        mountainId: "cardrona",
        mountainName: "Cardrona",
        approach: "Cardrona Valley Road + Cardrona access road from Wanaka",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. The Crown Range and Cardrona Valley Road are exposed alpine roads; fit chains when snow is settling or directed."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "QLDC · winter road reports",
        sourceUrl: "https://www.qldc.govt.nz/services/transport-and-parking/winter-road-reports",
        dataSource: "seasonal-rule",
      },
      {
        id: "treble-cone-access-road",
        regionId: "wanaka",
        mountainId: "treble-cone",
        mountainName: "Treble Cone",
        approach: "Wanaka-Mt Aspiring Road + Treble Cone access road",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. The Treble Cone access road is steep and unsealed; 4WD or fitted chains are often needed when snow is on the road."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "QLDC · winter road reports",
        sourceUrl: "https://www.qldc.govt.nz/services/transport-and-parking/winter-road-reports",
        dataSource: "seasonal-rule",
      },
    ];
  }

  if (regionId === "mt-hutt") {
    const inSeason = isNzSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "mt-hutt-access-road",
        regionId: "mt-hutt",
        mountainId: "mt-hutt",
        mountainName: "Mt Hutt",
        approach: "Mt Hutt skifield road from Methven",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. The 13 km access road is graded and restricted daily by the ski area; 2WD chains or 4WD when icy. Check the Mt Hutt road report before driving up."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "Mt Hutt · getting here",
        sourceUrl: "https://www.mthutt.co.nz/getting-here/",
        dataSource: "seasonal-rule",
      },
    ];
  }

  if (regionId === "ruapehu") {
    const inSeason = isNzSnowSeason(now);
    const chains2wd: ChainReq = inSeason ? "must-carry" : "not-required";
    const chainsAwd: ChainReq = inSeason ? "must-carry" : "not-required";
    return [
      {
        id: "whakapapa-bruce-road",
        regionId: "ruapehu",
        mountainId: "whakapapa",
        mountainName: "Whakapapa",
        approach: "Bruce Road to Whakapapa from SH48 / National Park",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. Bruce Road is monitored daily; restrictions range from 2WD chains to 4WD-only to closed in storms, most common Jun-Aug."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "Whakapapa · daily mountain report",
        sourceUrl: "https://www.whakapapa.com/report",
        dataSource: "seasonal-rule",
      },
      {
        id: "turoa-ohakune-mountain-road",
        regionId: "ruapehu",
        mountainId: "turoa",
        mountainName: "Turoa",
        approach: "Ohakune Mountain Road to Turoa from Ohakune",
        status: "open",
        chains2wd, chainsAwd,
        note: inSeason
          ? "Ski season: carry chains. The 17 km Ohakune Mountain Road is monitored daily by Pure Turoa; 2WD chains, 4WD-only, or closed in severe weather."
          : "Outside ski season · no chain requirement.",
        issuedAt,
        sourceLabel: "Pure Turoa · getting here",
        sourceUrl: "https://www.pureturoa.nz/discover/getting-here-and-around",
        dataSource: "seasonal-rule",
      },
    ];
  }

  return [];
}

// ── NZ live road events · Waka Kotahi (NZTA) ───────────────────────────
// Waka Kotahi publishes an open, keyless ArcGIS feature service of active
// state-highway "road events" (closures, hazards, road works, weather).
// It covers the STATE-HIGHWAY approach corridors that feed each NZ resort
// region - NOT the final ski-field access road (those are council / ski-area
// roads with no public live feed), which stay on the seasonal chain rule in
// buildChainStatuses() above. So NZ road pages show live approach conditions
// alongside an honestly-labelled seasonal access-road chain rule.
const NZTA_ROAD_EVENTS_URL =
  "https://services.arcgis.com/CXBb7LAjgIIdcsPt/arcgis/rest/services/NZTA_Highway_Information/FeatureServer/0/query";
const NZTA_TTL_MS = 3 * 60_000;

interface NztaEvent {
  eventId?: number | string | null;
  eventType?: string | null;
  eventDescription?: string | null;
  impact?: string | null;
  status?: string | null;
  eventIsland?: string | null;
  locationArea?: string | null;
  eventComments?: string | null;
  eventModified?: number | null;
}

let nztaCache: { at: number; events: NztaEvent[] } | null = null;

async function fetchNztaActiveEvents(): Promise<NztaEvent[]> {
  const now = Date.now();
  if (nztaCache && now - nztaCache.at < NZTA_TTL_MS) return nztaCache.events;
  const params = new URLSearchParams({
    f: "json",
    where: "status='Active'",
    outFields:
      "eventId,eventType,eventDescription,impact,status,eventIsland,locationArea,eventComments,eventModified",
    returnGeometry: "false",
    resultRecordCount: "2000",
    orderByFields: "eventModified DESC",
  });
  try {
    const resp = await fetch(`${NZTA_ROAD_EVENTS_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
    });
    if (!resp.ok) throw new Error(`NZTA HTTP ${resp.status}`);
    const data = (await resp.json()) as {
      features?: Array<{ attributes?: NztaEvent }>;
      error?: unknown;
    };
    if (data.error || !Array.isArray(data.features)) {
      throw new Error("NZTA unexpected response");
    }
    const events = data.features
      .map((f) => f.attributes)
      .filter((a): a is NztaEvent => Boolean(a));
    nztaCache = { at: now, events };
    return events;
  } catch (err) {
    // Load-shedding: serve the last good snapshot when the upstream blips.
    if (nztaCache) return nztaCache.events;
    // No snapshot yet: surface the outage (propagates to a 500 and the client's
    // honest "couldn't load road conditions" state) rather than returning an
    // empty list, which the UI would otherwise render as a positive "all clear
    // · good news" - misleading during a feed outage.
    throw err;
  }
}

interface NzCorridor {
  island: "North Island" | "South Island";
  keywords: string[];
  mountainIds: string[];
  journeysUrl: string;
}

// State-highway approach corridors per NZ region. Matched conservatively by
// island + place/route keywords in the NZTA `locationArea` string so a far-off
// SH6 event isn't mis-attributed to a resort it doesn't actually serve.
const NZ_CORRIDORS: Record<string, NzCorridor> = {
  queenstown: {
    island: "South Island",
    keywords: [
      "queenstown", "frankton", "kawarau", "devils staircase", "kingston",
      "arrowtown", "gibbston", "crown range", "sh 6a", "shotover",
    ],
    mountainIds: ["coronet-peak", "the-remarkables"],
    journeysUrl: "https://www.journeys.nzta.govt.nz/regions/otago",
  },
  wanaka: {
    island: "South Island",
    keywords: [
      "wanaka", "hawea", "luggate", "cardrona", "crown range", "lindis",
      "tarras", "albert town", "makarora", "haast",
    ],
    mountainIds: ["cardrona", "treble-cone"],
    journeysUrl: "https://www.journeys.nzta.govt.nz/regions/otago",
  },
  "mt-hutt": {
    island: "South Island",
    keywords: [
      "methven", "rakaia", "mount hutt", "mt hutt", "sh 77", "sh 72",
      "inland scenic", "darfield", "windwhistle",
    ],
    mountainIds: ["mt-hutt"],
    journeysUrl: "https://www.journeys.nzta.govt.nz/regions/canterbury",
  },
  ruapehu: {
    island: "North Island",
    keywords: [
      "desert road", "waiouru", "rangipo", "national park", "ohakune",
      "sh 47", "sh 48", "sh 49", "raetihi", "tongariro", "turangi",
    ],
    mountainIds: ["whakapapa", "turoa"],
    journeysUrl: "https://www.journeys.nzta.govt.nz/regions/manawatu-whanganui",
  },
};

function mapNztaCondition(ev: NztaEvent): "open" | "closed" | "caution" {
  // NZTA's structured `impact` is the authoritative signal ("Road Closed" vs
  // "Caution"/"Delays"). Deliberately NOT scraping free-text comments for
  // "closed" - a "left lane is closed" advisory must not paint the whole road
  // as CLOSED. Everything short of a full closure is surfaced as caution.
  const impact = (ev.impact ?? "").toLowerCase();
  if (impact.includes("closed")) return "closed";
  return "caution";
}

function nztaMentionsChains(ev: NztaEvent): boolean {
  const text = `${ev.eventComments ?? ""} ${ev.eventDescription ?? ""} ${ev.eventType ?? ""}`.toLowerCase();
  return text.includes("chain");
}

function buildNzRoads(regionId: string, events: NztaEvent[]): Array<Record<string, unknown>> {
  const cfg = NZ_CORRIDORS[regionId];
  if (!cfg) return [];
  const matched = events.filter((ev) => {
    if ((ev.eventIsland ?? "") !== cfg.island) return false;
    const area = (ev.locationArea ?? "").toLowerCase();
    if (!area) return false;
    return cfg.keywords.some((k) => area.includes(k));
  });
  // Closures first, then most recently modified, so the most consequential
  // advisory leads the list.
  matched.sort((a, b) => {
    const sev = (e: NztaEvent) => (mapNztaCondition(e) === "closed" ? 0 : 1);
    const bySeverity = sev(a) - sev(b);
    if (bySeverity !== 0) return bySeverity;
    return (b.eventModified ?? 0) - (a.eventModified ?? 0);
  });
  const seen = new Set<string>();
  const roads: Array<Record<string, unknown>> = [];
  for (const ev of matched) {
    const id = `nzta-${ev.eventId ?? `${ev.locationArea ?? "event"}-${ev.eventModified ?? ""}`}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const area = ev.locationArea ?? "State highway";
    const shMatch = area.match(/^SH\s?\d+[A-Za-z]?/);
    const roadName = shMatch
      ? shMatch[0].toUpperCase().replace(/^SH\s?/, "SH ")
      : (ev.eventType ?? "State highway");
    const description =
      (ev.eventComments ?? ev.eventDescription ?? "").trim() ||
      [ev.eventType, ev.impact].filter(Boolean).join(" · ");
    roads.push({
      id,
      roadName,
      segment: area,
      condition: mapNztaCondition(ev),
      description,
      chainsRequired: nztaMentionsChains(ev),
      lastUpdated: ev.eventModified
        ? new Date(ev.eventModified).toISOString()
        : new Date().toISOString(),
      source: "Waka Kotahi (NZTA) · live",
      detailUrl: cfg.journeysUrl,
      affectedResorts: cfg.mountainIds,
    });
    if (roads.length >= 15) break;
  }
  return roads;
}

router.get("/road-conditions", async (req, res) => {
  try {
    const region = parseRegionParam(req.query["region"]);

    // Road conditions come from three honest tiers:
    //  · AU (Snowy Mountains) - curated roads + live NSW alpine hazards.
    //  · NZ (Otago / Canterbury / Central Plateau) - live Waka Kotahi (NZTA)
    //    state-highway "road events" on the approach corridors.
    //  · Everywhere else - no public live feed wired yet, so roads is empty
    //    and the client renders an explicit "not available" state.
    const isAU = region === undefined || region === "snowy-mountains";
    const isNZ =
      region !== undefined &&
      Object.prototype.hasOwnProperty.call(NZ_CORRIDORS, region);

    let roads: Array<Record<string, unknown>> = [];
    let generalAdvice: string;
    let liveTrafficUrl: string;

    if (isAU) {
      roads = await fetchRoadConditions();
      generalAdvice =
        "Always carry chains when travelling to the Snowy Mountains during winter (June-October). Check conditions before departure at livetraffic.com. National Parks entry fees apply for Kosciuszko National Park. Vehicle entry is $29/day or $190/year (2024 rates). During heavy snowfall, roads may close at short notice.";
      liveTrafficUrl =
        "https://www.livetraffic.com/maps?lat=-36.45&lng=148.45&zoom=10&layers=cameras";
    } else if (isNZ) {
      const events = await fetchNztaActiveEvents();
      roads = buildNzRoads(region as string, events);
      generalAdvice =
        "Live advisories below cover the state-highway approach to the region, from Waka Kotahi (NZTA). The final ski-field access road is a council or ski-area road with no public live feed - use the seasonal chain rule below and check the ski area's own daily road report before heading up. In the NZ ski season (roughly June-October) carry chains and fit them when snow is settling or where directed.";
      liveTrafficUrl = "https://www.journeys.nzta.govt.nz/highway-conditions";
    } else {
      generalAdvice =
        "Live road condition data is not yet available for this region.";
      liveTrafficUrl = "";
    }

    const chainFittingBays = isAU ? CHAIN_FITTING_BAYS : [];
    const chainStatuses = buildChainStatuses(region);

    const result = GetRoadConditionsResponse.parse({
      roads,
      generalAdvice,
      liveTrafficUrl,
      lastUpdated: new Date().toISOString(),
      chainFittingBays,
      chainStatuses,
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
