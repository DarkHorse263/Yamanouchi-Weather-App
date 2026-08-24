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

// ── NSW live alpine hazards · Transport for NSW Live Traffic ───────────
// TfNSW publishes open, keyless GeoJSON hazard layers - the same system
// that powers livetraffic.com and the RTMC SMS alerts. The alpine layer
// carries the seasonal-closure and snow-condition entries for the Snowy
// Mountains; the incident layer picks up one-offs like crashes and the
// peak-day carpark alerts ("Carpark at approx. 75% · Kosciuszko Road will
// be closed to traffic"). Licence: Transport for NSW open data.
const NSW_HAZARD_LAYERS = [
  "https://data.livetraffic.com/traffic/hazards/alpine-open.json",
  "https://data.livetraffic.com/traffic/hazards/incident-open.json",
];
const NSW_TTL_MS = 3 * 60_000;
// Serve-stale cap: past this age a cached snapshot is treated as an outage
// (null) rather than replaying days-old hazards as if they were current.
const NSW_STALE_MAX_MS = 90 * 60_000;

interface NswHazard {
  id: string;
  mainStreet: string;
  suburb: string;
  subCategory: string;
  advice: string;
  detailText: string;
  lastUpdated: string | null;
  isMajor: boolean;
}

interface AuRoad {
  id: string;
  roadName: string;
  segment: string;
  condition: "open" | "closed" | "caution";
  description: string;
  chainsRequired: boolean;
  lastUpdated: string;
  source: string;
  detailUrl: string;
  affectedResorts: string[];
}

let nswCache: { at: number; hazards: NswHazard[] } | null = null;

function stripLiveTrafficHtml(html: string): string {
  return html
    .replace(/<li>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchNswAlpineHazards(): Promise<NswHazard[] | null> {
  const now = Date.now();
  if (nswCache && now - nswCache.at < NSW_TTL_MS) return nswCache.hazards;
  try {
    const layers = await Promise.all(
      NSW_HAZARD_LAYERS.map(async (url) => {
        const resp = await fetch(url, { headers: { Accept: "application/json" } });
        if (!resp.ok) throw new Error(`livetraffic HTTP ${resp.status}`);
        return (await resp.json()) as {
          features?: Array<{
            id?: number | string;
            properties?: {
              headline?: string | null;
              subCategoryA?: string | null;
              adviceA?: string | null;
              adviceB?: string | null;
              otherAdvice?: string | null;
              lastUpdated?: number | null;
              isMajor?: boolean | null;
              roads?: Array<{
                mainStreet?: string | null;
                suburb?: string | null;
                region?: string | null;
              }>;
            };
          }>;
        };
      }),
    );
    const hazards: NswHazard[] = [];
    for (const layer of layers) {
      for (const f of layer.features ?? []) {
        const p = f.properties;
        const road = p?.roads?.[0];
        if ((road?.region ?? "") !== "Snowy Mountains") continue;
        // The feed's subCategoryA is sometimes the literal string "null".
        const subCategoryRaw = (p?.subCategoryA ?? "").trim();
        const subCategory = subCategoryRaw && subCategoryRaw !== "null" ? subCategoryRaw : "";
        // Generic advice phrases carry no road-specific signal; dropping
        // them means boilerplate-only hazards leave the curated copy alone.
        const advice = [p?.adviceA, p?.adviceB]
          .map((s) => (s ?? "").trim())
          .filter(
            (s) =>
              s &&
              !/^(plan your journey|exercise caution|drive to the conditions?|allow extra travel time|check signage)$/i.test(
                s,
              ),
          )
          .join(" · ");
        // TfNSW appends the same generic advice boilerplate to every alpine
        // entry ("Updates about the road condition throughout the Alpine
        // Season...", "Motorists should: exercise caution..."); trim it so
        // the road-specific signal (closures, ice, carpark alerts) leads.
        // If nothing specific remains, the curated card copy stands.
        const detailText = (
          stripLiveTrafficHtml(p?.otherAdvice ?? "") || (p?.headline ?? "").trim()
        )
          .split(/\s*Motorists should:.*$/i)[0]!
          .replace(
            /Updates about the road condition throughout the Alpine Season will be provided as the conditions change\.?/gi,
            "",
          )
          .replace(
            /Chains must be carried in Kosciuszko National Park in winter \(4WD\/AWDs exempt\)\.?/gi,
            "",
          )
          .replace(
            /It is recommended that all vehicles carry chains when driving in alpine areas\.?/gi,
            "",
          )
          .replace(
            /All motorists should be prepared and equipped for sudden changes in road and weather conditions in Alpine areas\.?/gi,
            "",
          )
          .replace(/\s+/g, " ")
          .replace(/^\s*·\s*/, "")
          .trim();
        hazards.push({
          id: String(f.id ?? `${road?.mainStreet ?? "road"}-${p?.lastUpdated ?? ""}`),
          mainStreet: (road?.mainStreet ?? "").trim(),
          suburb: (road?.suburb ?? "").trim(),
          subCategory,
          advice,
          detailText,
          lastUpdated: p?.lastUpdated ? new Date(p.lastUpdated).toISOString() : null,
          isMajor: Boolean(p?.isMajor),
        });
      }
    }
    nswCache = { at: now, hazards };
    return hazards;
  } catch (err) {
    // Load-shedding: serve the last good snapshot when the upstream blips,
    // but only while it's reasonably fresh - beyond the cap, degrade to the
    // honest outage path instead of replaying old hazards as current.
    if (nswCache && now - nswCache.at < NSW_STALE_MAX_MS) return nswCache.hazards;
    // Cold outage: return null so the caller can flag the outage honestly
    // instead of silently presenting the curated defaults as live.
    console.warn("[roads] NSW live hazard feed unavailable:", err);
    return null;
  }
}

const NSW_PLACE_STOPWORDS = new Set([
  "the", "and", "between", "valley", "national", "park", "road", "highway",
]);

function nswPlaceTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !NSW_PLACE_STOPWORDS.has(w)),
  );
}

function nswAffectedResorts(hazard: NswHazard): string[] {
  const text = `${hazard.mainStreet} ${hazard.suburb} ${hazard.detailText}`.toLowerCase();
  const out = new Set<string>();
  if (/perisher|smiggin|guthega|bullocks flat|link r(?:oa)?d|kosciuszko r(?:oa)?d/.test(text)) out.add("perisher");
  if (/thredbo|alpine way/.test(text)) out.add("thredbo");
  if (/charlotte/.test(text)) out.add("charlottes-pass");
  if (/selwyn|cabramurra|kings cross|kiandra|tooma|snow ridge/.test(text)) out.add("selwyn");
  return [...out];
}

function nswCondition(hazard: NswHazard): "open" | "closed" | "caution" {
  // The structured sub-category is the authoritative closure signal. The
  // only free-text phrasing honoured is TfNSW's explicit "closed to
  // traffic" wording (used when the Perisher carpark fills), so a passing
  // mention of a closed lane never paints a whole road as CLOSED.
  if (hazard.subCategory.toLowerCase().includes("closed")) return "closed";
  const text = hazard.detailText.toLowerCase();
  if (/\bis (?:now )?closed to (?:all |uphill |downhill )?traffic\b/.test(text)) return "closed";
  return "caution";
}

function nswIsCarparkAlert(hazard: NswHazard): boolean {
  const text = `${hazard.subCategory} ${hazard.detailText}`.toLowerCase();
  return /car\s?park|parking/.test(text) && /capacity|full|closed|nearing|overflow/.test(text);
}

function nswMentionsChainsFitted(hazard: NswHazard): boolean {
  // "Chains must be carried" is boilerplate on every winter hazard and is
  // already covered by the seasonal chain-status cards, so only explicit
  // fit/required wording raises the per-road chains flag.
  return /snow chains are required|chains must be fitted|fit (?:snow )?chains/i.test(
    `${hazard.advice} ${hazard.detailText}`,
  );
}

function nswDescription(hazard: NswHazard): string {
  const parts: string[] = [];
  if (nswIsCarparkAlert(hazard)) parts.push("carpark alert");
  if (hazard.subCategory) parts.push(hazard.subCategory);
  const body = hazard.detailText || hazard.advice;
  if (body) parts.push(body.length > 500 ? `${body.slice(0, 500)}…` : body);
  return parts.join(" · ");
}

async function fetchRoadConditions() {
  const roads: AuRoad[] = [
    {
      id: "kosciuszko-road",
      roadName: "Kosciuszko Road",
      segment: "Jindabyne to Perisher Valley",
      condition: "open",
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
      condition: "open",
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
      condition: "open",
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
      condition: "open",
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
      condition: "caution",
      description: "Alternative scenic route via the Snowy River. Unsealed sections, not recommended for 2WD vehicles during wet conditions.",
      chainsRequired: false,
      lastUpdated: new Date().toISOString(),
      source: "Transport for NSW - Live Traffic",
      detailUrl: "https://www.livetraffic.com/desktop.html",
      affectedResorts: []
    }
  ];

  // Live overlay from the open TfNSW Live Traffic hazard feeds - the same
  // system behind the RTMC SMS alerts. Matched hazards enrich the curated
  // corridor cards; unmatched Snowy Mountains hazards (peak-day carpark
  // alerts filed as incidents, or roads we don't curate like Link Road)
  // are appended as their own live cards.
  const hazards = await fetchNswAlpineHazards();
  if (hazards === null) {
    for (const road of roads) {
      road.description +=
        " Live feed temporarily unavailable · check livetraffic.com before you travel.";
    }
    return roads;
  }

  const severityRank = { open: 0, caution: 1, closed: 2 } as const;
  const extras: AuRoad[] = [];
  // Tracks the hazard severity that last set each card's description, so a
  // later minor hazard on the same street can't overwrite a closure's text.
  const descSeverity = new Map<AuRoad, number>();
  for (const hazard of hazards) {
    const hazardStreet = hazard.mainStreet.toLowerCase();
    const hazardPlaces = nswPlaceTokens(hazard.suburb);
    const sameStreetHazards = hazards.filter(
      (h) => h.mainStreet.toLowerCase() === hazardStreet,
    ).length;
    let best: AuRoad | null = null;
    let bestScore = 0;
    for (const road of roads) {
      const roadName = road.roadName.toLowerCase();
      if (
        !hazardStreet ||
        !(roadName.includes(hazardStreet) || hazardStreet.includes(roadName))
      ) {
        continue;
      }
      const segPlaces = nswPlaceTokens(road.segment);
      let score = 1;
      for (const tok of hazardPlaces) if (segPlaces.has(tok)) score += 1;
      // Streets carrying several concurrent hazards (Kosciuszko Road) need
      // at least one shared place name, so the Perisher-Charlotte Pass
      // closure never lands on the Jindabyne-Perisher card.
      if (sameStreetHazards > 1 && score === 1) continue;
      if (score > bestScore) {
        bestScore = score;
        best = road;
      }
    }
    const condition = nswCondition(hazard);
    const description = nswDescription(hazard);
    const chains = nswMentionsChainsFitted(hazard);
    if (best) {
      if (severityRank[condition] > severityRank[best.condition]) {
        best.condition = condition;
      }
      if (description && severityRank[condition] >= (descSeverity.get(best) ?? -1)) {
        best.description = description;
        descSeverity.set(best, severityRank[condition]);
      }
      if (chains) best.chainsRequired = true;
      if (hazard.lastUpdated) best.lastUpdated = hazard.lastUpdated;
    } else {
      extras.push({
        id: `tfnsw-${hazard.id}`,
        roadName: hazard.mainStreet || "Snowy Mountains roads",
        segment: hazard.suburb || "Snowy Mountains",
        condition,
        description:
          description ||
          "Active alpine-season entry · updates from Transport for NSW appear here as conditions change.",
        chainsRequired: chains,
        lastUpdated: hazard.lastUpdated ?? new Date().toISOString(),
        source: "Transport for NSW - Live Traffic",
        detailUrl: "https://www.livetraffic.com/maps?lat=-36.45&lng=148.45&zoom=10",
        affectedResorts: nswAffectedResorts(hazard),
      });
    }
  }
  // Closures and carpark alerts lead the appended cards.
  const isCarparkCard = (r: AuRoad) => r.description.startsWith("carpark alert");
  extras.sort((a, b) => {
    const bySeverity = severityRank[b.condition] - severityRank[a.condition];
    if (bySeverity !== 0) return bySeverity;
    return Number(isCarparkCard(b)) - Number(isCarparkCard(a));
  });
  roads.push(...extras.slice(0, 8));

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

function isCaSnowSeason(now: Date): boolean {
  // Canadian Rockies / Coast Mountains resort season runs roughly mid-Nov to
  // mid-May (Sunshine and Whistler push into late May). Kept separate from the
  // JP northern-winter helper so the rule text never implies a Japanese
  // authority applies in BC, Alberta or Québec. The Québec hills run a
  // shorter season (late Nov to mid Apr) that sits inside this window.
  const m = now.getMonth();
  if (m === 10) return now.getDate() >= 15;
  if (m === 11 || m <= 3) return true;
  if (m === 4) return now.getDate() <= 15;
  return false;
}

function isUsSnowSeason(now: Date): boolean {
  // Colorado's earliest-opening resorts (Keystone, Arapahoe Basin) can open
  // in the last week of October and its latest-closing (Copper Mountain,
  // Arapahoe Basin) run into the first week of May, wider than the
  // Canadian-resort window below. Widened to 15 Oct-10 May so the season
  // rule doesn't understate an honestly-open resort at either edge; this is
  // a judgment call flagged in the PR description since it diverges from a
  // literal copy of the CA window.
  const m = now.getMonth();
  if (m === 9) return now.getDate() >= 15;
  if (m === 10 || m === 11 || m <= 3) return true;
  if (m === 4) return now.getDate() <= 10;
  return false;
}

/**
 * Utah's Class 3 ("UT-3") traction law is narrower than Colorado's SB25-069:
 * it only applies to specific canyon roads UDOT designates by sign, most
 * notably SR-210 (Little Cottonwood Canyon, to Alta/Snowbird) and SR-190
 * (Big Cottonwood Canyon, to Brighton/Solitude), and only requires an
 * approved traction device or tyres on ALL vehicles - it does not carve
 * out an AWD/4WD tyre-only exemption the way Colorado's law does. UDOT's
 * authority window for Class 3 signage is 1 Oct-30 Apr, with the actual
 * requirement posted/lifted by variable message sign only when conditions
 * warrant, not automatically in force for the whole window. Minimum
 * qualifying tyres are 5/32" tread depth and an M+S or 3-peak mountain
 * snowflake (3PMSF) rating; chains satisfy the rule on any vehicle. This is
 * a real, sign-activated law (Utah Code / UDOT rule), so it is reported as
 * potentially "must-carry" only when the Cottonwood Canyons honesty note
 * says so - but because there is no live feed for whether the sign is
 * currently posted, the note states the rule and defers to UDOT's own
 * cottonwoodcanyons.udot.utah.gov page for today's status rather than
 * asserting `must-carry` outright the way Colorado's law (which runs on a
 * fixed calendar window) allows. `chains2wd`/`chainsAwd` are therefore kept
 * at "not-required" defaults with the real, conditional rule spelled out in
 * the note - a deliberate divergence from the Colorado pattern, flagged
 * here and in the PR/commit description. All other Utah regions in this
 * pass (Park City, Ogden Valley, Provo, Cache Valley) have no equivalent
 * UDOT Class 3 canyon-road designation, so they get a lighter, generic
 * UDOT advisory instead of a named traction law.
 */
const UT_SOURCE = {
  sourceLabel: "UDOT · udottraffic.utah.gov",
  sourceUrl: "https://www.udottraffic.utah.gov/",
};
const UT_COTTONWOOD_SOURCE = {
  sourceLabel: "UDOT · Cottonwood Canyons",
  sourceUrl: "https://cottonwoodcanyons.udot.utah.gov/",
};

function utChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
  cottonwoodClass3: boolean;
}): Record<string, unknown> {
  const cottonwoodRule =
    "UDOT can post a Class 3 traction-device requirement on this canyon road (SR-210/SR-190) any time within its 1 Oct-30 Apr authority window: when posted, ALL vehicles (not just 2WD) need an approved traction device fitted, or tyres rated M+S/3-peak mountain snowflake with 5/32\"+ tread. This is sign-activated, not a fixed calendar rule, so check cottonwoodcanyons.udot.utah.gov or the roadside signs for today's status before you drive.";
  const generalRule =
    "Utah has no statewide chain law, but UDOT strongly recommends winter/traction tyres or carrying chains on mountain approaches in snow, and can post seasonal traction-device requirements on specific canyon roads when conditions warrant.";
  const rule = opts.cottonwoodClass3 ? cottonwoodRule : generalRule;
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no seasonal traction requirement on this route.",
    issuedAt: opts.issuedAt,
    ...(opts.cottonwoodClass3 ? UT_COTTONWOOD_SOURCE : UT_SOURCE),
    dataSource: "seasonal-rule",
  };
}

/**
 * Canada chain entries. Deliberately `chains2wd`/`chainsAwd: "not-required"`
 * year-round: none of BC, Alberta or Québec mandates chains on passenger
 * vehicles the way NSW and the NZ ski-field bylaws do. BC's actual legal
 * requirement is winter tyres (M+S or 3PMSF, >=3.5 mm tread) on designated
 * highways from 1 Oct to 30 Apr; Québec's is 3PMSF winter tyres from 1 Dec to
 * 15 Mar on vehicles registered in the province; Alberta legislates nothing
 * and only recommends them. Saying "must-carry" here would invent a law, so
 * the requirement stays "not-required" and the real rule lives in the note.
 */
const CA_BC_SOURCE = {
  sourceLabel: "DriveBC · winter driving",
  sourceUrl:
    "https://www2.gov.bc.ca/gov/content/transportation/driving-and-cycling/traveller-information/seasonal/winter-driving",
};
const CA_AB_SOURCE = {
  sourceLabel: "511 Alberta · road reports",
  sourceUrl: "https://511.alberta.ca/",
};
const CA_QC_SOURCE = {
  sourceLabel: "Québec 511 · road conditions",
  sourceUrl: "https://www.quebec511.info/",
};

const CA_PROVINCE_SOURCE = {
  BC: CA_BC_SOURCE,
  AB: CA_AB_SOURCE,
  QC: CA_QC_SOURCE,
} as const;

const CA_PROVINCE_RULE = {
  BC: "Winter tyres (M+S or 3-peak mountain snowflake, 3.5 mm+ tread) are required by law on this route from 1 Oct to 30 Apr. Chains are not mandated for passenger vehicles but are worth carrying.",
  AB: "Alberta does not legislate winter tyres, but they are strongly recommended on mountain highways and most rental agreements expect them.",
  QC: "Québec law requires 3-peak mountain snowflake winter tyres from 1 Dec to 15 Mar on passenger vehicles registered in the province. Out-of-province and rental vehicles are exempt, but the same tyres are strongly recommended. Chains are not mandated.",
} as const;

function caChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  province: "BC" | "AB" | "QC";
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  const rule = CA_PROVINCE_RULE[opts.province];
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no winter tyre or chain requirement on this route.",
    issuedAt: opts.issuedAt,
    ...CA_PROVINCE_SOURCE[opts.province],
    dataSource: "seasonal-rule",
  };
}

/**
 * Colorado chain entry source. Unlike the Canada helper above, Colorado's
 * chain rule is stated assertively (`chains2wd: "must-carry"`) rather than
 * "not-required", because it reflects a real, current, sourced state law -
 * Colorado's Traction Law (active every year 1 Sept-31 May on the I-70
 * Mountain Corridor between Dotsero and Morrison, extendable to any state
 * highway when conditions warrant) plus the 2WD "must carry" clause added
 * by SB25-069, which requires 2WD vehicles to carry chains or an
 * alternative traction device regardless of tyre type. AWD/4WD vehicles
 * comply either with qualifying winter tyres (3/16" tread, 3-peak
 * mountain snowflake / M+S / all-weather) or by carrying chains/ATD, so
 * `chainsAwd` is also reported as "must-carry" (the schema has no
 * conditional/tyre-or-chains state) with the tyre-only opt-out spelled out
 * in the note text so the AWD/4WD nuance isn't lost. This is a deliberate
 * divergence from the Canada pattern, flagged in the PR description.
 */
const JP_SRC = {
  hokkaido: {
    tyreRule: "Winter tyres are essential across Hokkaido from Nov to Apr; carry chains for 2WD and fit them when snow is settling or where directed.",
    sourceLabel: "Hokkaido Development Bureau · road information (seasonal rule)",
    sourceUrl: "https://info-road.hdb.hkd.mlit.go.jp/",
  },
  nagano: {
    tyreRule: "Winter tyres mandatory in Nagano; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Nagano Prefecture road bureau · winter rules (seasonal rule)",
    sourceUrl: "https://www.pref.nagano.lg.jp/michikanri/infra/doro/joho/hiroba/index.html",
  },
  niigata: {
    tyreRule: "Winter tyres mandatory in Niigata's snow country; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Niigata Prefecture · road live cameras (seasonal rule)",
    sourceUrl: "https://www.live-cam.pref.niigata.jp/",
  },
  yamagata: {
    tyreRule: "Winter tyres mandatory in Yamagata; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "MLIT Yamagata road office · road cameras (seasonal rule)",
    sourceUrl: "https://www.thr.mlit.go.jp/yamagata/camera-road/point.html",
  },
  iwate: {
    tyreRule: "Winter tyres mandatory in Iwate; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Iwate road information service (seasonal rule)",
    sourceUrl: "https://www.douro.com/",
  },
  aomori: {
    tyreRule: "Winter tyres mandatory in Aomori; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "MLIT Aomori road office · road information (seasonal rule)",
    sourceUrl: "https://www.thr.mlit.go.jp/aomori/road/joho/index.html",
  },
  fukushima: {
    tyreRule: "Winter tyres mandatory in Fukushima's Urabandai highlands; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Fukushima Prefecture · Inawashiro road cameras (seasonal rule)",
    sourceUrl: "https://www.pref.fukushima.lg.jp/sec/41351a/livecamera.html",
  },
  gunma: {
    tyreRule: "Winter tyres mandatory in the Gunma mountains; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Gunma Prefecture · road camera map (seasonal rule)",
    sourceUrl: "https://www.kendobousai-gunma.jp/photo/camera_index.html",
  },
  tottori: {
    tyreRule: "Winter tyres are essential on the Daisen climb; chains required for 2WD vehicles when snow is on the road.",
    sourceLabel: "Tottori Prefecture · snow-road navi (seasonal rule)",
    sourceUrl: "https://www.pref.tottori.lg.jp/206858.htm",
  },
} as const;

type JpChainEntry = {
  id: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
};

const JP_CHAIN_RULES: Record<
  string,
  { tyreRule: string; sourceLabel: string; sourceUrl: string; entries: JpChainEntry[] }
> = {
  "hakuba-valley": {
    ...JP_SRC.nagano,
    entries: [
      {
        id: "hakuba-route-148-village",
        mountainId: "happo-one",
        mountainName: "Hakuba Happo-One",
        approach: "Route 148 into Hakuba village, then resort roads to Happo, Goryu, 47 and Iwatake",
        detail: "The valley floor is regularly ploughed but the last climbs to each base area ice over after storms.",
      },
      {
        id: "hakuba-route-148-north",
        mountainId: "tsugaike-kogen",
        mountainName: "Tsugaike Kogen + Cortina",
        approach: "Route 148 north through Otari (Tsugaike, Norikura, Cortina)",
        detail: "The Otari stretch is one of Nagano's snowiest roads · expect compacted snow for weeks at a time.",
      },
      {
        id: "hakuba-omachi-south",
        mountainId: "kashimayari",
        mountainName: "Kashimayari + Jiigatake",
        approach: "Route 148 south from Omachi (Kashimayari, Jiigatake)",
        detail: "Gentler than the northern valley but the resort access roads still need chains on 2WD after fresh snow.",
      },
    ],
  },
  myoko: {
    ...JP_SRC.niigata,
    entries: [
      {
        id: "myoko-akakura-approach",
        mountainId: "akakura-onsen",
        mountainName: "Akakura (Onsen + Kanko)",
        approach: "Route 18 to Myoko-Kogen, then the climb into Akakura",
        detail: "Myoko is one of the snowiest inhabited places on earth · the village streets themselves stay white all winter.",
      },
      {
        id: "myoko-suginohara-route-39",
        mountainId: "myoko-suginohara",
        mountainName: "Myoko Suginohara",
        approach: "Route 39 up from Route 18 to the Suginohara base",
        detail: "A long steady climb that ices early in the evening · Ikenotaira is reached off the same road.",
      },
      {
        id: "myoko-lotte-arai-access",
        mountainId: "lotte-arai",
        mountainName: "Lotte Arai Resort",
        approach: "Arai access road from the Shin-Ide interchange (Route 18 side)",
        detail: "Short but exposed final climb to the resort · shuttle buses run from Joetsumyoko station if you'd rather not drive it.",
      },
    ],
  },
  niseko: {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "niseko-hirafu-route-343",
        mountainId: "grand-hirafu",
        mountainName: "Grand Hirafu + Hanazono",
        approach: "Route 5 from Kutchan, then Route 343 into Hirafu",
        detail: "Heavy traffic polishes the Hirafu-zaka climb to ice on storm days · the village loop is steep and one-way in places.",
      },
      {
        id: "niseko-annupuri-route-66",
        mountainId: "annupuri",
        mountainName: "Annupuri + Niseko Village + Moiwa",
        approach: "Route 66 from Niseko town (Annupuri, Village, Moiwa)",
        detail: "Route 66 beyond Annupuri toward Panorama Line is gated shut for the winter · the resort stretch stays open and ploughed.",
      },
    ],
  },
  "rusutsu-kiroro": {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "rusutsu-route-230",
        mountainId: "rusutsu-resort",
        mountainName: "Rusutsu Resort",
        approach: "Route 230 over Nakayama Pass from Sapporo",
        detail: "Nakayama Pass is a serious winter pass · whiteouts and compacted snow are routine, allow extra time.",
      },
      {
        id: "kiroro-route-393",
        mountainId: "kiroro-resort",
        mountainName: "Kiroro",
        approach: "Route 393 from Yoichi / Akaigawa",
        detail: "Route 393 is among the snowiest numbered routes in Japan · it closes temporarily during the biggest storms.",
      },
    ],
  },
  furano: {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "furano-route-38",
        mountainId: "furano-ski-resort",
        mountainName: "Furano Ski Resort",
        approach: "Route 38 / 237 into Furano town, then the Kitanomine and Furano zone access roads",
        detail: "The town roads are well maintained · black ice on the bridge sections is the main hazard.",
      },
      {
        id: "furano-kamui-route-12",
        mountainId: "kamui-ski-links",
        mountainName: "Kamui Ski Links",
        approach: "Route 12 west of Asahikawa, then the Kamui access road",
        detail: "A short exposed climb off the highway · icy where it leaves the ploughed main road.",
      },
    ],
  },
  asahikawa: {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "asahikawa-kamui-route-12",
        mountainId: "kamui",
        mountainName: "Kamui Ski Links",
        approach: "Route 12 west from Asahikawa, then the Kamui access road",
        detail: "A short exposed climb off the highway · icy where it leaves the ploughed main road.",
      },
      {
        id: "asahidake-road-1160",
        mountainId: "asahidake",
        mountainName: "Asahidake",
        approach: "Prefectural Road 1160 from Higashikawa up to Asahidake Onsen",
        detail: "A long forest climb to 1,100 m that is snow-covered all winter · the ropeway base is above the ploughing priority line, so 2WD needs chains after any fresh snow.",
      },
    ],
  },
  sapporo: {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "sapporo-teine-access",
        mountainId: "sapporo-teine",
        mountainName: "Sapporo Teine",
        approach: "Teine access road from Route 5 / the Teine urban exits",
        detail: "A steep suburban climb that ices hard on clear nights · the Olympia zone hairpins are the tightest section.",
      },
      {
        id: "sapporo-kokusai-route-230",
        mountainId: "sapporo-kokusai",
        mountainName: "Sapporo Kokusai",
        approach: "Route 230 through Jozankei, then the Kokusai access road",
        detail: "One of the snowiest corridors near the city · the final climb regularly needs chains on 2WD.",
      },
    ],
  },
  "tomamu-sahoro": {
    ...JP_SRC.hokkaido,
    entries: [
      {
        id: "tomamu-ic-access",
        mountainId: "tomamu-resort",
        mountainName: "Hoshino Resorts Tomamu",
        approach: "Doto Expressway to Tomamu IC, then the resort access road",
        detail: "The expressway sections close temporarily in ground blizzards · check before setting out on storm days.",
      },
      {
        id: "sahoro-karikachi-route-38",
        mountainId: "sahoro",
        mountainName: "Sahoro Resort",
        approach: "Route 38 over Karikachi Pass",
        detail: "Karikachi Pass is notorious for drifting snow and whiteouts · one of Hokkaido's most weather-affected passes.",
      },
    ],
  },
  "zao-onsen": {
    ...JP_SRC.yamagata,
    entries: [
      {
        id: "zao-route-21",
        mountainId: "zao-onsen-resort",
        mountainName: "Zao Onsen Ski Resort",
        approach: "Prefectural Road 21 (Zao Line) from Yamagata city up to Zao Onsen",
        detail: "A steady 800 m climb that is snow-packed for most of the winter. The Zao Echo Line over the range is closed Nov-Apr · Zao Onsen is reached from the Yamagata side only.",
      },
    ],
  },
  "appi-shizukuishi": {
    ...JP_SRC.iwate,
    entries: [
      {
        id: "appi-route-282",
        mountainId: "appi",
        mountainName: "Appi Kogen",
        approach: "Route 282 from Morioka / Nishine, then the Appi Kogen access road",
        detail: "The access road climbs steadily to the resort village · well ploughed but icy on shaded bends.",
      },
      {
        id: "shizukuishi-route-46",
        mountainId: "shizukuishi-resort",
        mountainName: "Shizukuishi",
        approach: "Route 46 from Morioka toward Shizukuishi, then the resort road",
        detail: "A gentler approach than Appi's · the final resort climb still needs chains on 2WD after fresh snow.",
      },
    ],
  },
  hachimantai: {
    ...JP_SRC.iwate,
    entries: [
      {
        id: "hachimantai-panorama-access",
        mountainId: "hachimantai-panorama",
        mountainName: "Hachimantai Panorama + Shimokura",
        approach: "Route 282 from Matsuo, then the resort access roads",
        detail: "The Hachimantai Aspite Line over the plateau is closed Nov-Apr · both ski areas are reached from the Matsuo side below the gate.",
      },
    ],
  },
  "hakkoda-aomori-spring": {
    ...JP_SRC.aomori,
    entries: [
      {
        id: "hakkoda-route-103",
        mountainId: "hakkoda",
        mountainName: "Hakkoda",
        approach: "Route 103 from Aomori city up to Sukayu Onsen and the ropeway",
        detail: "One of the snowiest public roads in Japan · the snow corridor walls top 8 m by March. Ploughed daily but frequently down to one lane; the section beyond Sukayu toward Towada closes for the winter.",
      },
      {
        id: "aomori-spring-ajigasawa",
        mountainId: "aomori-spring",
        mountainName: "Aomori Spring",
        approach: "Route 101 to Ajigasawa, then the resort road up the Iwaki flank",
        detail: "A coastal approach with drifting snow in strong westerlies · the final climb ices after storms.",
      },
    ],
  },
  bandai: {
    ...JP_SRC.fukushima,
    entries: [
      {
        id: "nekoma-route-459",
        mountainId: "nekoma-mountain",
        mountainName: "Nekoma Mountain",
        approach: "Route 459 from Inawashiro into Urabandai, then the Nekoma access roads",
        detail: "The Bandai-Azuma Gold Line and Lake Line scenic roads are closed Nov-Apr · Urabandai is reached via Route 459 only. The south (Alts) side is accessed separately from Bandaimachi.",
      },
      {
        id: "grandeco-access",
        mountainId: "grandeco",
        mountainName: "Grandeco",
        approach: "Route 459 to the Grandeco turnoff, then the resort access road",
        detail: "The last climb to the hotel and gondola base is a designated chain-check section after heavy snow.",
      },
    ],
  },
  minakami: {
    ...JP_SRC.gunma,
    entries: [
      {
        id: "tenjindaira-route-291",
        mountainId: "tenjindaira",
        mountainName: "Tanigawadake Tenjindaira",
        approach: "Route 291 from Minakami to the Tanigawadake Ropeway",
        detail: "Route 291 beyond the ropeway station toward the pass is permanently closed · the drive ends at the ropeway car park, which sits in a heavy-snow pocket.",
      },
      {
        id: "minakami-kogen-access",
        mountainId: "minakami-kogen",
        mountainName: "Minakami Kogen",
        approach: "Resort road off Route 291 above Minakami town",
        detail: "A steady resort climb · icy on the shaded hairpins, chains needed on 2WD after fresh snow.",
      },
    ],
  },
  yuzawa: {
    ...JP_SRC.niigata,
    entries: [
      {
        id: "yuzawa-town-resorts",
        mountainId: "gala-yuzawa",
        mountainName: "GALA, Yuzawa Kogen, Ishiuchi, Iwappara",
        approach: "Route 17 around Yuzawa town",
        detail: "The town-side resorts sit right off the ploughed highway · most visitors don't need to drive at all, GALA and Yuzawa Kogen are walkable from Echigo-Yuzawa station.",
      },
      {
        id: "kagura-mitsumata-route-17",
        mountainId: "kagura",
        mountainName: "Kagura",
        approach: "Route 17 south to the Mitsumata and Tashiro ropeway bases",
        detail: "The Mitsumata stretch of Route 17 runs through one of Honshu's heaviest snowfall belts · expect compacted snow for the whole season.",
      },
      {
        id: "naeba-mikuni-route-17",
        mountainId: "naeba",
        mountainName: "Naeba",
        approach: "Route 17 over the Mikuni Pass approach to Naeba",
        detail: "The climb past Futai toward Naeba is the icy crux · chains checks operate on peak weekends.",
      },
    ],
  },
  "kusatsu-manza": {
    ...JP_SRC.gunma,
    entries: [
      {
        id: "kusatsu-route-292-lower",
        mountainId: "kusatsu-onsen-resort",
        mountainName: "Kusatsu Onsen Ski Resort",
        approach: "Route 292 from Naganohara up to Kusatsu Onsen",
        detail: "The Shiga-Kusatsu route (Route 292) above Kusatsu is closed Nov-Apr · Kusatsu is a dead-end town in winter, approached from the Naganohara side only.",
      },
      {
        id: "manza-highway",
        mountainId: "manza-onsen-resort",
        mountainName: "Manza Onsen Ski Resort",
        approach: "Manza Highway (toll road) from Manza-Kazawaguchi",
        detail: "The toll road is the only winter access · Route 292 above Manza is gated shut. At 1,800 m the car park is among the highest you can drive to in Japan; chains on 2WD are frequently mandatory.",
      },
    ],
  },
  daisen: {
    ...JP_SRC.tottori,
    entries: [
      {
        id: "daisen-temple-road",
        mountainId: "daisen-white-resort",
        mountainName: "Daisen White Resort",
        approach: "Prefectural roads from Yonago / Daisen IC up to the Daisen-ji temple village",
        detail: "A 700 m climb from the coastal plain into maritime snowfall · the top section ices quickly when squalls roll in off the Sea of Japan.",
      },
    ],
  },
};

const CO_SOURCE = {
  sourceLabel: "CDOT · cotrip.org",
  sourceUrl: "https://www.cotrip.org/",
};

function coChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  const rule =
    "Colorado's Traction Law is in effect 1 Sept-31 May on this corridor. 2WD vehicles must carry tyre chains or an approved alternative traction device (SB25-069), regardless of tyre type. AWD/4WD vehicles comply with qualifying winter tyres (3/16\"+ tread, 3-peak mountain snowflake / M+S / all-weather) or by carrying chains/ATD. In storms CDOT can escalate to the more restrictive Passenger Vehicle Chain Law, requiring chains/ATD on every vehicle regardless of drivetrain as the final step before a road closure.";
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: (opts.inSeason ? "must-carry" : "not-required") satisfies ChainReq,
    chainsAwd: (opts.inSeason ? "must-carry" : "not-required") satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no Traction Law requirement on this route.",
    issuedAt: opts.issuedAt,
    ...CO_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * California's R1/R2/R3 chain-control system (Caltrans) is a live,
 * ranger/CHP-declared escalation ladder posted per-highway, not a fixed
 * calendar rule like Colorado's SB25-069 or a single sign-activated canyon
 * designation like Utah's Class 3:
 *   R1 - chains required except 4WD/AWD vehicles with snow tyres on all 4
 *        wheels (chains must still be carried)
 *   R2 - chains required except 4WD/AWD vehicles with snow tyres AND
 *        chains in possession for each drive axle
 *   R3 - chains required on ALL vehicles, no exceptions (rare, severe
 *        storms only)
 * There is no live feed for which R-level is currently posted on I-80
 * Donner Summit, US-50 near Tahoe, or Highway 4/89 near Bear Valley, so
 * (mirroring Utah's Cottonwood Class 3 treatment) `chains2wd`/`chainsAwd`
 * stay at "not-required" defaults and the real R1/R2/R3 ladder is spelled
 * out in the note, deferring to Caltrans QuickMap for today's status.
 * Mammoth Lakes, Big Bear and Mt. Shasta have no Caltrans R-level chain
 * corridor designation identified in research, so they get a lighter,
 * generic Caltrans winter-driving advisory instead - mirroring Utah's
 * non-Cottonwood "lighter, generic UDOT advisory" treatment for Park
 * City/Ogden Valley/Provo/Cache Valley.
 *
 * Named `usCaChainEntry` (not `caChainEntry`) to avoid colliding with the
 * existing Canada chain-entry helper of that name above.
 */
const US_CA_SOURCE = {
  sourceLabel: "Caltrans QuickMap",
  sourceUrl: "https://quickmap.dot.ca.gov/",
};

function usCaChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
  rLevelCorridor: boolean;
}): Record<string, unknown> {
  const rLevelRule =
    "Caltrans can post R1/R2/R3 chain control on this route any time in winter storms: R1 requires chains except 4WD/AWD with snow tyres on all 4 wheels (chains must still be carried); R2 requires chains except 4WD/AWD with snow tyres AND chains in possession; R3 requires chains on ALL vehicles, no exceptions. This is storm-activated, not a fixed calendar rule, so check quickmap.dot.ca.gov or the roadside signs for today's status before you drive.";
  const generalRule =
    "California has no statewide chain law, but Caltrans strongly recommends snow tyres or carrying chains on mountain approaches in winter, and can post R1/R2/R3 chain control on specific highways when storms warrant.";
  const rule = opts.rLevelCorridor ? rLevelRule : generalRule;
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no seasonal chain-control requirement on this route.",
    issuedAt: opts.issuedAt,
    ...US_CA_SOURCE,
    dataSource: "seasonal-rule",
  };
}


/**
 * Vermont has NO statewide chain law for passenger vehicles — the only
 * chain/traction requirement in research is a heavy-vehicle rule (over
 * 26,000 lbs GVWR) on VT-9 between Wilmington and Bennington, which does
 * not apply to the ordinary visitor vehicles this app serves. Studded
 * tires are legal year-round in Vermont (unlike many states that restrict
 * them to a winter window), which is noted for context, not as a
 * "requirement." This makes Vermont's honesty posture closest to Canada's
 * `caChainEntry()` (genuinely no chain law) rather than Utah's
 * conditional Class 3 Traction Law or California's storm-activated
 * R1/R2/R3 ladder — both of those reflect a real, live, sign-activated
 * rule; Vermont has neither. Named `vtChainEntry` (not reusing
 * `caChainEntry`, which is already taken by Canada) to avoid any
 * confusion with the Canada helper.
 */
const VT_SOURCE = {
  sourceLabel: "VTrans · New England 511",
  sourceUrl: "https://newengland511.org/",
};

function vtChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason
      ? `Vermont has no statewide chain law for passenger vehicles (only a heavy-vehicle rule on VT-9 between Wilmington and Bennington, which doesn't apply here). Winter/snow tyres are strongly recommended on mountain approaches; studded tires are legal year-round. ${opts.detail}`
      : "Outside the ski season · Vermont has no chain-law requirement on this route at any time of year for passenger vehicles.",
    issuedAt: opts.issuedAt,
    ...VT_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * Wyoming HAS a real, currently postable dynamic chain law - WY Statute
 * Section 31-5-956 - unlike Vermont/Montana's genuinely chain-law-free
 * posture. WYDOT posts two escalating levels via variable message sign,
 * NOT a fixed calendar rule:
 *   Level 1 - chains, OR snow tires, OR 4WD/AWD engaged
 *   Level 2 - chains, OR 4WD/AWD with M+S/all-weather-rated tires
 * Teton Pass (WY-22), the main road between Jackson/Teton Village and the
 * Teton Valley/Grand Targhee side of the range, is explicitly named by
 * WYDOT as a frequent activation corridor in winter storms. Because this
 * is sign/condition-activated rather than a fixed calendar law (unlike
 * Colorado's `coChainEntry`, which asserts "must-carry" for a real
 * in-season statute), `chains2wd`/`chainsAwd` stay at "not-required"
 * defaults and the real Level 1/Level 2 rule text lives in the note -
 * modeled closest on Utah's sign-activated `utChainEntry()` Cottonwood
 * Class 3 pattern. Applies to ALL vehicle types (not a heavy-vehicle-only
 * carve-out like Montana's MCA 61-9-436), which is the key difference from
 * the Montana/Vermont narrow pattern.
 */
const WY_SOURCE = {
  sourceLabel: "WYDOT · wyoroad.info",
  sourceUrl: "https://wyoroad.info/",
};

function wyChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
  tetonPassCorridor: boolean;
}): Record<string, unknown> {
  const tetonPassRule =
    "WYDOT can post a dynamic Level 1 (chains, OR snow tires, OR 4WD/AWD engaged) or Level 2 (chains, OR 4WD/AWD with M+S/all-weather-rated tires) chain requirement on Teton Pass (WY-22) under Wyoming Statute Section 31-5-956, applying to ALL vehicles regardless of drivetrain when posted. This is sign-activated, not a fixed calendar rule, so check wyoroad.info or the roadside variable message signs for today's status before you drive.";
  const generalRule =
    "Wyoming has no fixed-calendar statewide chain law, but WYDOT can post a dynamic Level 1/Level 2 chain requirement (Wyoming Statute Section 31-5-956) on any state highway when conditions warrant, applying to ALL vehicles when active.";
  const rule = opts.tetonPassCorridor ? tetonPassRule : generalRule;
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no seasonal chain-law activation expected on this route.",
    issuedAt: opts.issuedAt,
    ...WY_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * Montana has NO statewide passenger-vehicle chain law - the only
 * chain/traction requirement in research is a narrow heavy-vehicle rule
 * (MCA 61-9-436: towing units ≥ 26,001 lbs GVW must carry chains/traction
 * devices Oct 1-Apr 30 when required; 4WD vehicles are exempt even from
 * that), plus MDT's ability to post temporary chain requirements at ~2
 * dozen named mountain passes/hills (e.g. Homestake Pass, Bozeman Hill,
 * MacDonald Pass, Lookout Pass, Marias Pass, Lost Trail Pass) during
 * severe weather - none of which apply to ordinary visitor passenger
 * vehicles. This makes Montana's honesty posture the same narrow pattern
 * as Vermont's `vtChainEntry()` (genuinely no chain law for the vehicles
 * this app serves) rather than Wyoming's real, dynamically-postable
 * Level 1/Level 2 law that applies to ALL vehicles. Named `mtChainEntry`
 * to avoid any confusion with the Vermont/Wyoming helpers.
 */
const MT_SOURCE = {
  sourceLabel: "MDT · 511mt.net",
  sourceUrl: "https://www.511mt.net/",
};

function mtChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason
      ? `Montana has no statewide chain law for passenger vehicles (only a heavy-vehicle rule under MCA 61-9-436 for towing units ≥ 26,001 lbs GVW, which doesn't apply here; 4WD vehicles are exempt even from that). MDT can post temporary chain requirements at specific named mountain passes during severe weather - winter/snow tyres are strongly recommended on mountain approaches. ${opts.detail}`
      : "Outside the ski season · Montana has no chain-law requirement on this route at any time of year for passenger vehicles.",
    issuedAt: opts.issuedAt,
    ...MT_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * New Mexico has NO statewide chain law or mandatory winter-tire
 * requirement for passenger vehicles - NMSA 1978 Section 66-3-847
 * PERMITS but does not require tire chains "of reasonable proportions"
 * or studded snow tires when conditions warrant. There is no chain-
 * control program and no posted chain orders anywhere in the state
 * (unlike Colorado's CDOT system), so chain use is entirely at the
 * driver's discretion. This makes New Mexico's honesty posture the same
 * narrow, genuinely-no-chain-law pattern as Vermont/Montana rather than
 * Wyoming's real, dynamically-postable Level 1/Level 2 law. Named
 * `nmChainEntry` to avoid confusion with the Vermont/Wyoming/Montana
 * helpers. NM-150, the sole paved access road to Taos Ski Valley, is a
 * narrow, steep, switchback mountain road and is called out explicitly
 * wherever it is the relevant approach.
 */
const NM_SOURCE = {
  sourceLabel: "NMDOT · nmroads.com",
  sourceUrl: "https://www.nmroads.com/mapIndex.html",
};

/** Michigan has no passenger-vehicle chain law; seasonal studded-tire windows are the only material nuance. */
function miChainEntry(opts: { id: string; regionId: string; mountainId: string; mountainName: string; approach: string; detail: string; inSeason: boolean; issuedAt: string }) {
  return { id: opts.id, regionId: opts.regionId, mountainId: opts.mountainId, mountainName: opts.mountainName, approach: opts.approach, status: "not-required", label: opts.inSeason ? "No passenger chain law" : "Outside ski season", detail: `${opts.inSeason ? "Michigan has no passenger-vehicle chain or winter-tire mandate; chains are permitted when conditions require them. Studded tyres have date-based legal windows." : "Michigan has no passenger chain-law requirement."} ${opts.detail}`, issuedAt: opts.issuedAt };
}

/** Pennsylvania has no general passenger chain law; its named chain-up zones and tier system are commercial-vehicle-only. */
function paChainEntry(opts: { id:string; regionId:string; mountainId:string; mountainName:string; approach:string; detail:string; inSeason:boolean; issuedAt:string }) { return {id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"No passenger chain mandate":"Outside ski season",detail:`Pennsylvania has no general passenger chain or winter-tire mandate. Commercial winter-event restrictions and three named truck chain-up zones do not create a passenger-car mandate. ${opts.detail}`,issuedAt:opts.issuedAt}; }

/** Massachusetts has no general passenger chain or winter-tire mandate; studs are Nov 1-Apr 30 only. */
function maChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}) {return {id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"No passenger chain mandate":"Outside ski season",detail:`Massachusetts has no general passenger chain or winter-tire mandate; studded tires are permitted Nov 1-Apr 30 only. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Minnesota has no passenger chain or winter-tire mandate; residents may not use studded tires. */
function mnChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"No passenger chain mandate":"Outside ski season",detail:`Minnesota has no passenger chain or winter-tire mandate; resident studded tires are banned year-round. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Wisconsin has no passenger chain/winter-tire mandate; studs are restricted for ordinary passenger vehicles. */
function wiChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"No passenger chain mandate":"Outside ski season",detail:`Wisconsin has no passenger chain or winter-tire mandate. Chains are permitted when needed; studded tires are restricted for most passenger vehicles. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** New Jersey winter-access rule. */
function njChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`New Jersey has no standing passenger chain or winter-tire mandate; chains may be used while roads are actually slippery. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Connecticut winter-access rule. */
function ctChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`Connecticut has no standing passenger chain or winter-tire mandate; chains and studded tires are simply legal November 15–April 30. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Alaska winter-access rule. */
function akChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`Alaska has no blanket passenger chain mandate; DOT&PF can post chain requirements during severe conditions. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** South Dakota winter-access rule. */
function sdChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`South Dakota can activate traction restrictions on signed state highways during inclement weather; check SD511 before travel. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Arizona winter-access rule. */
function azChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`Arizona has no fixed chain season; ADOT can post Chains or 4WD Required restrictions during storms. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Nevada winter-access rule. */
function nvChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`Nevada has no fixed chain season; NDOT can require traction devices on signed highways during Sierra storms. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** Virginia winter-access rule. */
function vaChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`Virginia has no standing passenger chain or winter-tire mandate; localities may impose snow-route restrictions. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** North Carolina winter-access rule. */
function ncChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`North Carolina has no standing passenger chain or winter-tire mandate; resort-adjacent mountain villages may activate local restrictions. ${opts.detail}`,issuedAt:opts.issuedAt};}

/** West Virginia winter-access rule. */
function wvChainEntry(opts:{id:string;regionId:string;mountainId:string;mountainName:string;approach:string;detail:string;inSeason:boolean;issuedAt:string}){return{id:opts.id,regionId:opts.regionId,mountainId:opts.mountainId,mountainName:opts.mountainName,approach:opts.approach,status:"not-required" as const,label:opts.inSeason?"Check storm restrictions":"Outside ski season",detail:`West Virginia has no standing passenger chain or winter-tire mandate; chains are permitted for safety and any restriction is conditions-triggered and posted. ${opts.detail}`,issuedAt:opts.issuedAt};}

function nmChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason
      ? `New Mexico has no statewide chain law or mandatory winter-tire requirement for passenger vehicles (NMSA 1978 Section 66-3-847 permits, but does not require, chains or studded tires when conditions warrant; there is no chain-control program or posted chain orders anywhere in the state). Winter/snow tyres are strongly recommended on mountain approaches; studded tires are legal year-round. ${opts.detail}`
      : "Outside the ski season · New Mexico has no chain-law requirement on this route at any time of year for passenger vehicles.",
    issuedAt: opts.issuedAt,
    ...NM_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * Oregon has a BROAD, MANDATORY, STATEWIDE traction/chain law under ORS
 * 815.045/815.140/815.142/815.145 plus OAR 734-017 - unlike Vermont/
 * Montana/New Mexico's genuinely-no-chain-law posture, and unlike
 * Wyoming/California's storm-or-sign-activated systems. When ODOT posts
 * a "chains required" zone (most commonly on US-26 over Mt. Hood in
 * winter storms), traction tires or chains are mandatory for ALL
 * vehicles - not just trucks, and not just 2WD as in Colorado's SB25-069
 * carve-out. Vehicles without adequate traction tires must carry and be
 * prepared to fit chains; the requirement can escalate to "chains
 * required on all vehicles regardless of tyre type" in severe
 * conditions. Modeled closest on Colorado's `coChainEntry` (the other
 * state with a real, statutory, broad chain requirement) rather than the
 * narrow heavy-vehicle-only pattern. Named `orChainEntry` to avoid any
 * collision with existing helpers.
 */
const OR_SOURCE = {
  sourceLabel: "ODOT TripCheck · tripcheck.com",
  sourceUrl: "https://www.tripcheck.com/",
};

function orChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  const rule =
    "Oregon has a statewide mandatory traction/chain law (ORS 815.045/815.140/815.142/815.145 + OAR 734-017): when ODOT posts a \"chains required\" zone, ALL vehicles - not just trucks - must have traction tires (studded, or mud-and-snow-rated with 3/16\"+ tread) fitted, or carry chains and be prepared to fit them. Requirements can escalate to chains mandatory on every vehicle regardless of tyre type in severe storms. Check tripcheck.com or roadside signs for today's status before you drive.";
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: (opts.inSeason ? "must-carry" : "not-required") satisfies ChainReq,
    chainsAwd: (opts.inSeason ? "must-carry" : "not-required") satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · Oregon's traction/chain law is only posted in active winter storm conditions.",
    issuedAt: opts.issuedAt,
    ...OR_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * Washington has a REAL, storm-activated, escalating-tier traction
 * requirement system under RCW 47.36.250 + WAC 204-24-040/050 - more
 * escalation levels than either Wyoming's Level 1/Level 2 or
 * California's R1/R2/R3 ladder. WSDOT (or its delegate) posts one of
 * several levels on specific highway segments during unsafe conditions:
 *   1. Traction-tire advisory (recommended, not required)
 *   2. Traction tires required for passenger vehicles; chains required
 *      for vehicles over 10,000 lbs GVWR
 *   3. Chains required for vehicles over 10,000 lbs GVWR, except
 *      all-wheel-drive
 *   4. Chains required on ALL vehicles, including 4WD/AWD - the most
 *      severe level, used rarely
 * This is sign/511-activated, not a fixed calendar rule (unlike
 * Colorado/Oregon's broad statutory laws), so - mirroring Wyoming's and
 * California's treatment - `chains2wd`/`chainsAwd` stay at
 * "not-required" defaults and the real escalating-tier rule lives in the
 * note. I-90 (Snoqualmie Pass) and US-2 (Stevens Pass) are WSDOT's two
 * primary avalanche-control corridors and the routes most likely to see
 * escalation; SR-410 (Crystal Mountain) and SR-542 (Mt. Baker) are also
 * named WSDOT chain-control routes. Named `waChainEntry` to avoid any
 * collision with existing helpers.
 */
const WA_SOURCE = {
  sourceLabel: "WSDOT · wsdot.com/travel/real-time/mountainpasses",
  sourceUrl: "https://wsdot.com/travel/real-time/mountainpasses",
};

function waChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
  avalancheControlCorridor: boolean;
}): Record<string, unknown> {
  const escalationRule =
    "WSDOT can post one of several escalating traction levels on this route under RCW 47.36.250 + WAC 204-24-040/050: (1) traction-tire advisory, (2) traction tires required for passenger vehicles with chains required over 10,000 lbs GVWR, (3) chains required over 10,000 lbs GVWR except AWD, or (4) chains required on ALL vehicles including 4WD/AWD as the most severe level. This is storm/sign-activated, not a fixed calendar rule, so check wsdot.com's real-time mountain pass page or dial 511 for today's status before you drive.";
  const generalRule =
    "Washington has no fixed-calendar statewide chain law, but WSDOT can post an escalating traction-tire/chain requirement (RCW 47.36.250) on any state highway when conditions warrant, up to chains on all vehicles including 4WD/AWD in the most severe cases.";
  const rule = opts.avalancheControlCorridor ? escalationRule : generalRule;
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `${rule} ${opts.detail}` : "Outside the ski season · no seasonal traction/chain activation expected on this route.",
    issuedAt: opts.issuedAt,
    ...WA_SOURCE,
    dataSource: "seasonal-rule",
  };
}

/**
 * Idaho has a NARROW, COMMERCIAL-VEHICLE-ONLY chain law under Idaho Code
 * Section 49-948 - much closer to Montana/Vermont's narrow heavy-vehicle
 * pattern than to Oregon's broad statutory law or Washington's
 * escalating-tier system. The requirement applies only to commercial
 * vehicles over 26,000 lbs GVWR (or vehicles carrying 16+ passengers),
 * and only on three named northern mountain passes: Lookout Pass and
 * Fourth of July Pass on I-90, and Lolo Pass on US-12 - none of which
 * sit on the direct access roads to any of the four Idaho regions
 * covered in this pass (Sun Valley, Sandpoint/Schweitzer, Boise/Bogus
 * Basin, Donnelly-McCall/Tamarack+Brundage), though Schweitzer's I-90
 * approach from the east could pass near Lookout Pass on some routings -
 * worth a footnote, not a change to the "not-required" default for
 * ordinary passenger vehicles. Idaho also permits studded tires Oct 1 -
 * Apr 30 (noted for context, not as a requirement). Named `idChainEntry`
 * to avoid any collision with existing helpers.
 */
const ID_SOURCE = {
  sourceLabel: "Idaho 511 · 511.idaho.gov",
  sourceUrl: "https://511.idaho.gov/",
};

function idChainEntry(opts: {
  id: string;
  regionId: string;
  mountainId: string;
  mountainName: string;
  approach: string;
  detail: string;
  inSeason: boolean;
  issuedAt: string;
}): Record<string, unknown> {
  return {
    id: opts.id,
    regionId: opts.regionId,
    mountainId: opts.mountainId,
    mountainName: opts.mountainName,
    approach: opts.approach,
    status: "open",
    chains2wd: "not-required" satisfies ChainReq,
    chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason
      ? `Idaho's chain law (Idaho Code Section 49-948) applies only to commercial vehicles over 26,000 lbs GVWR (or 16+ passenger vehicles), and only on three named northern passes (Lookout Pass and Fourth of July Pass on I-90, Lolo Pass on US-12) - none of which sit on this route. Ordinary passenger vehicles have no chain requirement here. Winter/snow tyres are strongly recommended; studded tires are legal Oct 1 - Apr 30. ${opts.detail}`
      : "Outside the ski season · Idaho's narrow commercial-vehicle chain law does not apply to this route at any time of year for passenger vehicles.",
    issuedAt: opts.issuedAt,
    ...ID_SOURCE,
    dataSource: "seasonal-rule",
  };
}


/**
 * New Hampshire has no broad mandatory chain law for ordinary passenger
 * vehicles. The real Saf-C 1312.17 provision is a narrow vehicle
 * inspection/equipment rule: multipurpose passenger vehicles need snow tires
 * Nov 15-Apr 15 unless equipped with all-season radial tires. It is not an
 * on-road chain-up programme and is presented that way. NHDOT directs users
 * to regional newengland511.org rather than a standalone NH 511 site.
 */
const NH_SOURCE = { sourceLabel: "NHDOT · New England 511", sourceUrl: "https://newengland511.org/Home/Index" };
function nhChainEntry(opts: { id: string; regionId: string; mountainId: string; mountainName: string; approach: string; detail: string; inSeason: boolean; issuedAt: string }): Record<string, unknown> {
  return { id: opts.id, regionId: opts.regionId, mountainId: opts.mountainId, mountainName: opts.mountainName, approach: opts.approach, status: "open", chains2wd: "not-required" satisfies ChainReq, chainsAwd: "not-required" satisfies ChainReq,
    note: opts.inSeason ? `New Hampshire has no broad mandatory chain law for passenger vehicles. N.H. Admin. Code § Saf-C 1312.17 is a narrow vehicle inspection/equipment provision: multipurpose passenger vehicles need snow tires Nov 15-Apr 15 unless equipped with all-season radial tires; it is not a general roadside chain-up rule. Winter/snow tyres and AWD/4WD are strongly recommended. ${opts.detail}` : "Outside the ski season · New Hampshire has no general passenger-vehicle chain-law requirement; the narrow Saf-C 1312.17 equipment provision remains distinct from an on-road chain law.", issuedAt: opts.issuedAt, ...NH_SOURCE, dataSource: "seasonal-rule" };
}


/** Maine has no mandatory chain law: 29-A M.R.S. §2381 permits chains in slippery conditions; it does not require them. */
const ME_SOURCE = { sourceLabel: "MaineDOT · New England 511", sourceUrl: "https://newengland511.org/" };
function meChainEntry(opts: { id: string; regionId: string; mountainId: string; mountainName: string; approach: string; detail: string; inSeason: boolean; issuedAt: string }): Record<string, unknown> {
  return { id: opts.id, regionId: opts.regionId, mountainId: opts.mountainId, mountainName: opts.mountainName, approach: opts.approach, status: "open", chains2wd: "not-required" satisfies ChainReq, chainsAwd: "not-required" satisfies ChainReq, note: opts.inSeason ? `Maine has no mandatory passenger or commercial chain law. Under 29-A M.R.S. §2381, chains are permitted in snow, ice or slippery conditions, not required; winter tyres and AWD/4WD are strongly recommended. ${opts.detail}` : "Outside the ski season · Maine chains remain permitted when conditions warrant, not legally required.", issuedAt: opts.issuedAt, ...ME_SOURCE, dataSource: "seasonal-rule" };
}


/** New York has no general chain or winter-tyre mandate. V&T §145-c applies only to a specifically declared snow-emergency route. */
const NY_SOURCE = { sourceLabel: "NYSDOT · 511NY", sourceUrl: "https://511ny.org/" };
function nyChainEntry(opts: { id: string; regionId: string; mountainId: string; mountainName: string; approach: string; detail: string; inSeason: boolean; issuedAt: string }): Record<string, unknown> {
 return { id: opts.id, regionId: opts.regionId, mountainId: opts.mountainId, mountainName: opts.mountainName, approach: opts.approach, status: "open", chains2wd: "not-required" satisfies ChainReq, chainsAwd: "not-required" satisfies ChainReq, note: opts.inSeason ? `New York has no blanket passenger-vehicle chain law. V&T §145-c can require snow tires or chains only on a specifically declared snow-emergency route; no dedicated resort corridor was identified. Winter tyres and AWD/4WD are strongly recommended. ${opts.detail}` : "Outside the ski season · New York has no general passenger-vehicle chain law; the narrow declared snow-emergency-route rule is not a standing resort-road requirement.", issuedAt: opts.issuedAt, ...NY_SOURCE, dataSource: "seasonal-rule" };
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
        sourceUrl: "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/snow-driving",
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
        sourceUrl: "https://www.nationalparks.nsw.gov.au/safety/alpine-safety/snow-driving",
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
        sourceUrl: "https://www.mthotham.com.au/mountain/conditions/weather-roads",
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
        sourceUrl: "https://www.mthotham.com.au/mountain/conditions/weather-roads",
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
        sourceUrl: "https://www.mtbuller.com.au/winter/alerts",
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
        sourceUrl: "https://www.pref.nagano.lg.jp/michikanri/infra/doro/joho/hiroba/index.html",
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
        sourceUrl: "https://www.pref.nagano.lg.jp/michikanri/infra/doro/joho/hiroba/index.html",
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
        sourceUrl: "https://www.pref.nagano.lg.jp/michikanri/infra/doro/joho/hiroba/index.html",
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
        sourceUrl: "https://www.pref.nagano.lg.jp/michikanri/infra/doro/joho/hiroba/index.html",
        dataSource: "pending",
      },
    ];
  }

  // ── Japan · remaining regions (data-driven) ─────────────────────────
  // Seasonal chain-fitting rules for every JP region beyond the three
  // Nagano pioneers above. Same honesty model: these are the published
  // winter rules of each prefecture's road authority, not a live feed
  // (`dataSource: "seasonal-rule"`), and the source links point at the
  // official prefectural / MLIT road-information services verified live
  // in Aug 2026. Winter closures that change the driving story (Shiga-
  // Kusatsu Route 292, Bandai-Azuma Gold Line, Hachimantai Aspite Line,
  // Zao Echo Line) are called out in the notes so nobody plans a route
  // over a gate that is locked from Nov to Apr.
  const jpRegion = JP_CHAIN_RULES[regionId ?? ""];
  if (jpRegion) {
    const inSeason = isJpSnowSeason(now);
    return jpRegion.entries.map((e) => ({
      id: e.id,
      regionId,
      mountainId: e.mountainId,
      mountainName: e.mountainName,
      approach: e.approach,
      status: "open",
      chains2wd: (inSeason ? "must-fit" : "not-required") satisfies ChainReq,
      chainsAwd: (inSeason ? "must-carry" : "not-required") satisfies ChainReq,
      note: inSeason
        ? `${jpRegion.tyreRule} ${e.detail}`
        : "Outside snow season · no chain requirement.",
      issuedAt,
      sourceLabel: jpRegion.sourceLabel,
      sourceUrl: jpRegion.sourceUrl,
      dataSource: "seasonal-rule",
    }));
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

  if (
    regionId === "whistler" ||
    regionId === "powder-highway" ||
    regionId === "okanagan" ||
    regionId === "vancouver" ||
    regionId === "banff-lake-louise" ||
    regionId === "canmore" ||
    regionId === "jasper" ||
    regionId === "quebec-laurentians" ||
    regionId === "quebec-charlevoix" ||
    regionId === "quebec-eastern-townships"
  ) {
    const inSeason = isCaSnowSeason(now);
    const ca = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
      province: "BC" | "AB" | "QC",
    ) =>
      caChainEntry({ id, regionId, mountainId, mountainName, approach, detail, province, inSeason, issuedAt });

    if (regionId === "whistler") {
      return [
        ca("whistler-mountain-sea-to-sky", "whistler-mountain", "Whistler Mountain",
          "Sea-to-Sky Highway (Hwy 99) from Vancouver or Pemberton",
          "Hwy 99 climbs three passes and closes for avalanche control after big storms; both mountains are lift-accessed from the village, so there is no separate access road to drive.",
          "BC"),
        ca("blackcomb-mountain-sea-to-sky", "blackcomb-mountain", "Blackcomb Mountain",
          "Sea-to-Sky Highway (Hwy 99) from Vancouver or Pemberton",
          "Same approach as Whistler Mountain · park in the village and ride the Blackcomb Gondola or Excalibur up.",
          "BC"),
      ];
    }

    if (regionId === "powder-highway") {
      return [
        ca("revelstoke-camozzi-road", "revelstoke-mountain-resort", "Revelstoke Mountain Resort",
          "Trans-Canada Hwy 1 through Rogers Pass, then Camozzi Road",
          "Rogers Pass is one of the most avalanche-controlled highways in the world and closes without much notice · check DriveBC before committing to the drive.",
          "BC"),
        ca("kicking-horse-dart-road", "kicking-horse", "Kicking Horse",
          "Trans-Canada Hwy 1 to Golden, then Kicking Horse Trail / Dart Road",
          "The 13 km resort road climbs steeply out of the Columbia Valley and is often the iciest part of the trip.",
          "BC"),
        ca("fernie-ski-hill-road", "fernie-alpine", "Fernie Alpine Resort",
          "Crowsnest Hwy 3 to Fernie, then Ski Hill Road",
          "Hwy 3 over the Crowsnest Pass sees heavy snowfall and closes for avalanche control on the BC side.",
          "BC"),
        ca("whitewater-access-road", "whitewater", "Whitewater",
          "Hwy 6 south from Nelson, then the Whitewater access road",
          "The 12 km access road is unpaved, steep and unploughed overnight · the resort recommends winter tyres and a shovel.",
          "BC"),
        ca("kimberley-gerry-sorensen-way", "kimberley-alpine", "Kimberley Alpine Resort",
          "Hwy 95A to Kimberley, then Gerry Sorensen Way",
          "Short, well-maintained climb from town · the easiest resort approach on the loop.",
          "BC"),
        ca("panorama-toby-creek-road", "panorama", "Panorama",
          "Hwy 93/95 to Invermere, then Toby Creek Road",
          "The 18 km Toby Creek Road is winding with steep drop-offs and no shoulder in places.",
          "BC"),
        ca("sun-peaks-road", "sun-peaks-resort", "Sun Peaks Resort",
          "Hwy 5 (Coquihalla) or Hwy 1 to Heffley Creek, then Sun Peaks Road",
          "Sun Peaks Road climbs 1,000 m in 30 km from the Thompson Valley; the Coquihalla itself closes in storms.",
          "BC"),
      ];
    }

    if (regionId === "okanagan") {
      return [
        ca("big-white-road", "big-white", "Big White Ski Resort",
          "Hwy 33 south-east of Kelowna, then the Big White Road",
          "The 24 km Big White Road climbs steadily off Hwy 33 and is often snow-packed and fog-bound near the top · the resort recommends winter tyres and chains in the vehicle.",
          "BC"),
        ca("silverstar-road", "silverstar", "SilverStar Mountain Resort",
          "Hwy 97 to Vernon, then Silver Star Road",
          "The 22 km Silver Star Road is well-maintained but climbs 1,100 m from the valley and gets icy on the upper switchbacks.",
          "BC"),
        ca("apex-green-mountain-road", "apex-resort", "Apex Mountain Resort",
          "Hwy 97 to Penticton, then Green Mountain Road",
          "Green Mountain Road is a narrow, winding 33 km climb with no services · it is the exposed part of the trip and drifts in over the last few kilometres.",
          "BC"),
        ca("sun-peaks-road", "sun-peaks-resort", "Sun Peaks Resort",
          "Hwy 5 (Coquihalla) or Hwy 1 to Heffley Creek, then Sun Peaks Road",
          "Sun Peaks Road climbs 1,000 m in 30 km from the Thompson Valley; the Coquihalla itself closes in storms.",
          "BC"),
      ];
    }

    if (regionId === "vancouver") {
      return [
        ca("cypress-bowl-road", "cypress-mountain", "Cypress Mountain",
          "Hwy 1 (Upper Levels) to exit 8, then Cypress Bowl Road",
          "The 15 km Cypress Bowl Road is the longest and highest of the three North Shore access roads · it ices up fast and the resort turns back vehicles without winter tyres or chains on the worst days.",
          "BC"),
        ca("grouse-mountain-highway", "grouse-mountain", "Grouse Mountain",
          "Capilano Road / Nancy Greene Way from North Vancouver, then ride the Skyride",
          "You park at the base and ride the Skyride gondola up · Nancy Greene Way is a short, steep city road that still catches out summer tyres after a cold snap.",
          "BC"),
        ca("mount-seymour-road", "mount-seymour", "Mt Seymour",
          "Mount Seymour Parkway to Mount Seymour Road from North Vancouver",
          "The 13 km Mount Seymour Road is a steady climb through the park · winter tyres or chains are required past the gate and it is gated shut when full or when conditions turn.",
          "BC"),
        ca("mount-washington-road", "mount-washington", "Mount Washington Alpine Resort",
          "BC Ferries to Vancouver Island (or fly to Comox), Hwy 19 to Courtenay, then Strathcona Parkway",
          "This is an Island trip, not a Vancouver day trip · the Strathcona Parkway climbs 1,100 m in 19 km from the Comox Valley and gets deep maritime snow that the resort keeps ploughed.",
          "BC"),
      ];
    }

    if (regionId === "banff-lake-louise") {
      return [
        ca("banff-sunshine-village-road", "banff-sunshine", "Banff Sunshine Village",
          "Trans-Canada Hwy 1 west of Banff, then Sunshine Village Road",
          "Park at the base and ride the gondola · the village itself is not driveable. Hwy 1 through the park is ploughed continuously but closes for avalanche control.",
          "AB"),
        ca("mt-norquay-road", "mt-norquay", "Mt. Norquay",
          "Mt Norquay Road from the Town of Banff",
          "Six kilometres of tight switchbacks straight up from town · the steepest resort approach in the park and the first to ice up.",
          "AB"),
        ca("lake-louise-whitehorn-road", "lake-louise-resort", "Lake Louise Ski Resort",
          "Trans-Canada Hwy 1 to Lake Louise, then Whitehorn Road",
          "Short hop across the highway from the hamlet · the 57 km Hwy 1 run from Banff is the exposed part in a storm.",
          "AB"),
      ];
    }

    if (regionId === "canmore") {
      return [
        ca("nakiska-highway-40", "nakiska", "Nakiska",
          "Trans-Canada Hwy 1 to Hwy 40 (Kananaskis Trail) from Canmore",
          "Hwy 40 south of Kananaskis Village is gated and closed 1 Dec to 15 Jun for wildlife, so all Nakiska traffic comes in from the north · about 45 min from Canmore.",
          "AB"),
      ];
    }

    if (regionId === "jasper") {
      return [
        ca("marmot-basin-road", "marmot-basin", "Marmot Basin",
          "Hwy 93A south of Jasper, then Marmot Basin Road",
          "A 12 km climb to the highest base elevation of any major Canadian ski area · wildlife on the road at dawn and dusk is the usual hazard.",
          "AB"),
      ];
    }

    if (regionId === "quebec-laurentians") {
      return [
        ca("tremblant-autoroute-15", "tremblant", "Tremblant",
          "Autoroute 15 north from Montréal, then Route 117 and Montée Ryan",
          "Roughly 1 hr 45 min from Montréal on a divided highway the whole way · park at the village or the Le Géant lots and ride the gondola, there is no summit road.",
          "QC"),
      ];
    }

    if (regionId === "quebec-charlevoix") {
      return [
        ca("mont-sainte-anne-route-360", "mont-sainte-anne", "Mont-Sainte-Anne",
          "Autoroute 40 east to Beaupré, then Route 360 and the resort road",
          "About 30 min from Québec City on the Côte-de-Beaupré · the short climb off Route 360 to the base is the only steep section.",
          "QC"),
        ca("le-massif-route-138", "le-massif", "Le Massif de Charlevoix",
          "Route 138 east from Québec City, then the descent into Petite-Rivière-Saint-François",
          "Route 138 through Charlevoix is exposed and hilly, and the road down to the riverside base village drops steeply · the summit lot is reached from the highway side.",
          "QC"),
      ];
    }

    return [
      ca("bromont-autoroute-10", "bromont-resort", "Ski Bromont",
        "Autoroute 10 east from Montréal to exit 78, then Boulevard de Bromont",
        "About 45 min from Montréal and roughly 5 min from the autoroute to the base lots · the flattest resort approach in Québec.",
        "QC"),
      ca("mont-sutton-chemin-maple", "mont-sutton", "Mont Sutton",
        "Autoroute 10 to exit 68, then Route 139 to Sutton and Chemin Maple",
        "The last few kilometres up Chemin Maple from the village climb steadily and ice up early in the morning.",
        "QC"),
    ];
  }

  if (
    regionId === "summit-county" ||
    regionId === "vail-valley" ||
    regionId === "aspen-snowmass" ||
    regionId === "steamboat" ||
    regionId === "winter-park" ||
    regionId === "crested-butte" ||
    regionId === "telluride" ||
    regionId === "durango" ||
    regionId === "boulder-front-range"
  ) {
    const inSeason = isUsSnowSeason(now);
    const co = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => coChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "summit-county") {
      return [
        co("breckenridge-resort-hwy-9", "breckenridge-resort", "Breckenridge",
          "I-70 to Frisco, then Colorado 9 south to Breckenridge",
          "CO-9 climbs gently from Frisco along the Blue River · the Traction Law corridor covers I-70 itself, not CO-9, but chains/ATD should still be carried in storms."),
        co("keystone-resort-us-6", "keystone-resort", "Keystone",
          "I-70 to Silverthorne, then US-6 east to Keystone",
          "US-6 follows the Snake River through Dillon and Keystone · a flatter approach than most Summit County resorts."),
        co("copper-mountain-resort-i70", "copper-mountain-resort", "Copper Mountain",
          "I-70 westbound, exit 195 (Copper Mountain)",
          "Direct I-70 exit at the resort base · squarely inside the Traction Law's Dotsero-Morrison corridor."),
        co("arapahoe-basin-us-6", "arapahoe-basin", "Arapahoe Basin",
          "I-70 to Silverthorne, then US-6 east past Keystone toward Loveland Pass",
          "The final stretch of US-6 climbs toward Loveland Pass and is one of the highest, most exposed resort approaches in the state."),
        co("loveland-us-6", "loveland", "Loveland",
          "I-70 to exit 216, then US-6 east toward Loveland Pass",
          "Sits right at the base of Loveland Pass on the Continental Divide · usually the first CDOT corridor to see Traction Law enforcement each season."),
      ];
    }

    if (regionId === "vail-valley") {
      return [
        co("vail-mountain-i70", "vail-mountain", "Vail Mountain",
          "I-70 westbound, exits 176 (Vail) or 173 (West Vail)",
          "Sits directly on the I-70 Mountain Corridor, the primary Traction Law and Passenger Vehicle Chain Law enforcement zone in the state."),
        co("beaver-creek-i70", "beaver-creek", "Beaver Creek",
          "I-70 westbound, exit 167 (Avon), then the gated Beaver Creek access road",
          "The final climb up the gated resort access road from Avon is steep and often the first section to be restricted to 4WD/chains in a storm."),
      ];
    }

    if (regionId === "aspen-snowmass") {
      return [
        co("snowmass-hwy-82", "snowmass", "Snowmass",
          "Colorado 82 west from Glenwood Springs, then Brush Creek Road to Snowmass Village",
          "CO-82 through Glenwood Canyon and over the Roaring Fork Valley sees frequent avalanche control and rockfall closures in winter."),
        co("aspen-mountain-hwy-82", "aspen-mountain", "Aspen Mountain",
          "Colorado 82 into downtown Aspen",
          "The lift base sits right in town · the exposed stretch is the CO-82 approach up the valley, not the final few blocks."),
        co("aspen-highlands-hwy-82", "aspen-highlands", "Aspen Highlands",
          "Colorado 82 to Aspen, then Maroon Creek Road",
          "Maroon Creek Road climbs out of the valley floor and can ice up quickly after the CO-82 approach."),
        co("buttermilk-hwy-82", "buttermilk", "Buttermilk",
          "Colorado 82 to Aspen, then West Buttermilk Road",
          "The gentlest of the four approaches, just west of downtown Aspen off CO-82."),
      ];
    }

    if (regionId === "steamboat") {
      return [
        co("steamboat-resort-us-40", "steamboat-resort", "Steamboat Resort",
          "US-40 through Steamboat Springs, then Mount Werner Road/Circle to the base",
          "US-40 over Rabbit Ears Pass is one of CDOT's most storm-affected corridors in the Yampa Valley approach."),
      ];
    }

    if (regionId === "winter-park") {
      return [
        co("winter-park-resort-us-40", "winter-park-resort", "Winter Park Resort",
          "US-40 west from Denver over Berthoud Pass",
          "Berthoud Pass is unguarded by avalanche sheds and closes for control work more often than the I-70 tunnel alternative."),
      ];
    }

    if (regionId === "crested-butte") {
      return [
        co("crested-butte-mountain-resort-hwy-135", "crested-butte-mountain-resort", "Crested Butte Mountain Resort",
          "Colorado 135 north from Gunnison to Crested Butte, then Gothic Road to the base",
          "CO-135 is a two-lane mountain highway with no interstate alternative · the remoteness is part of what keeps this resort quiet."),
      ];
    }

    if (regionId === "telluride") {
      return [
        co("telluride-ski-resort-hwy-145", "telluride-ski-resort", "Telluride Ski Resort",
          "Colorado 145 into Telluride, then the free gondola or Mountain Village Boulevard",
          "CO-145 through Lizard Head Pass is high, narrow and among the more weather-exposed approaches in the San Juans."),
      ];
    }

    if (regionId === "durango") {
      return [
        co("purgatory-resort-us-550", "purgatory-resort", "Purgatory Resort",
          "US-550 north from Durango (the San Juan Skyway)",
          "US-550 is one of the routes named in Colorado's commercial \"Must Carry\" chain law (SB24-100), reflecting how frequently it sees winter chain enforcement."),
      ];
    }

    // boulder-front-range
    return [
      co("eldora-mountain-resort-hwy-119", "eldora-mountain-resort", "Eldora Mountain Resort",
        "Colorado 119 (Boulder Canyon Drive) from Boulder to Nederland, then Eldora Road",
        "Boulder Canyon is a narrow two-lane canyon road that ices up quickly in shade · Eldora Road climbs the final stretch from Nederland."),
    ];
  }

  if (
    regionId === "cottonwood-canyons" ||
    regionId === "park-city" ||
    regionId === "ogden-valley" ||
    regionId === "provo" ||
    regionId === "cache-valley"
  ) {
    const inSeason = isUsSnowSeason(now);
    const ut = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
      cottonwoodClass3: boolean,
    ) => utChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt, cottonwoodClass3 });

    if (regionId === "cottonwood-canyons") {
      return [
        ut("alta-sr-210", "alta", "Alta",
          "SR-210 (Little Cottonwood Canyon) from Sandy",
          "SR-210 is one of UDOT's two Class 3 traction-law canyons · UDOT is also pursuing a gondola/tolling project for this canyon that remains unbuilt and in litigation as of 2026, so the road itself is unchanged for now.",
          true),
        ut("snowbird-sr-210", "snowbird", "Snowbird",
          "SR-210 (Little Cottonwood Canyon) from Sandy",
          "Same Class 3 canyon as Alta · UDOT periodically closes SR-210 to uphill traffic for avalanche control after big storms.",
          true),
        ut("brighton-resort-sr-190", "brighton-resort", "Brighton",
          "SR-190 (Big Cottonwood Canyon) from Salt Lake City/Cottonwood Heights",
          "SR-190 is UDOT's other Class 3 traction-law canyon · narrower and windier than Little Cottonwood, with the same sign-activated rule.",
          true),
        ut("solitude-mountain-resort-sr-190", "solitude-mountain-resort", "Solitude",
          "SR-190 (Big Cottonwood Canyon) from Salt Lake City/Cottonwood Heights",
          "Same Class 3 canyon as Brighton · check cottonwoodcanyons.udot.utah.gov for today's uphill/downhill restrictions before driving up.",
          true),
      ];
    }

    if (regionId === "park-city") {
      return [
        ut("park-city-mountain-us-40", "park-city-mountain", "Park City Mountain",
          "I-80 to US-40, then Kearns Blvd/Park Ave into Park City",
          "No UDOT Class 3 canyon designation here · US-40 and Park City's town roads are ploughed but not chain-controlled the way the Cottonwood Canyons are.",
          false),
        ut("deer-valley-resort-us-40", "deer-valley-resort", "Deer Valley",
          "I-80 to US-40, then Marsac Ave/Deer Valley Drive into Park City",
          "Same general approach as Park City Mountain · no Class 3 traction requirement, just the general UDOT winter-driving advisory.",
          false),
      ];
    }

    if (regionId === "ogden-valley") {
      return [
        ut("snowbasin-sr-226", "snowbasin", "Snowbasin",
          "I-84 to Mountain Green, then SR-226 to the resort",
          "SR-226 climbs steadily from Mountain Green · no Class 3 designation, but UDOT still recommends winter tyres in storms.",
          false),
        ut("powder-mountain-ut-158", "powder-mountain", "Powder Mountain",
          "I-84/US-89 to Eden, then UT-158 (Powder Mountain Road)",
          "The final climb up Powder Mountain Road is steep and can ice up before the valley floor does.",
          false),
        ut("nordic-valley-nordic-valley-way", "nordic-valley", "Nordic Valley",
          "I-84/US-89 to Eden, then Nordic Valley Way",
          "Short, low-elevation access road from Eden · season dates for Nordic Valley are unconfirmed this year, so check the resort directly before you drive up.",
          false),
      ];
    }

    if (regionId === "provo") {
      return [
        ut("sundance-mountain-resort-ut-92", "sundance-mountain-resort", "Sundance Mountain Resort",
          "US-189 (Provo Canyon) to UT-92 (Alpine Loop Scenic Byway)",
          "The Alpine Loop above Sundance closes seasonally for winter (typically Nov-May) above the resort · Provo Canyon itself stays open with the general UDOT winter advisory.",
          false),
      ];
    }

    // cache-valley
    return [
      ut("beaver-mountain-us-89", "beaver-mountain", "Beaver Mountain",
        "US-89 through Logan Canyon to the resort",
        "Logan Canyon is a long, high-elevation two-lane canyon route · no Class 3 designation, but winter tyres are strongly advised.",
        false),
      ut("cherry-peak-ut-243", "cherry-peak", "Cherry Peak",
        "US-91 north from Logan, then UT-243 (Blacksmith Fork Rd) or local roads near Richmond",
        "Shorter, lower-elevation approach than Beaver Mountain · Cherry Peak's 2025-26 opening date is unconfirmed by the resort, so check directly before you drive up.",
        false),
    ];
  }

  if (
    regionId === "north-lake-tahoe" ||
    regionId === "south-lake-tahoe" ||
    regionId === "mammoth-lakes" ||
    regionId === "big-bear" ||
    regionId === "bear-valley" ||
    regionId === "mt-shasta"
  ) {
    const inSeason = isUsSnowSeason(now);
    const usCa = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
      rLevelCorridor: boolean,
    ) => usCaChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt, rLevelCorridor });

    if (regionId === "north-lake-tahoe") {
      return [
        usCa("palisades-tahoe-i-80", "palisades-tahoe", "Palisades Tahoe",
          "I-80 to Truckee/Tahoe City, then CA-89 to Olympic Valley",
          "I-80 over Donner Summit is a named Caltrans R1/R2/R3 chain-control corridor · check quickmap.dot.ca.gov before you drive up in a storm.",
          true),
        usCa("northstar-california-hwy-267", "northstar-california", "Northstar California",
          "I-80 to Truckee, then CA-267 (Brockway Summit) south to the resort",
          "CA-267 over Brockway Summit is a shorter, steeper approach than the I-80/CA-89 route into Palisades · same R1/R2/R3 system applies when posted.",
          true),
        usCa("sugar-bowl-i-80", "sugar-bowl", "Sugar Bowl",
          "I-80 to the Soda Springs/Norden exit, right at Donner Summit",
          "Sugar Bowl sits directly on the Donner Summit corridor, the most storm-exposed stretch of I-80 in the region · same R1/R2/R3 system applies when posted.",
          true),
      ];
    }

    if (regionId === "south-lake-tahoe") {
      return [
        usCa("heavenly-us-50", "heavenly", "Heavenly",
          "US-50 from Sacramento/Placerville, along the South Shore to Stateline",
          "US-50 through the Sierra is a named Caltrans R1/R2/R3 chain-control corridor · check quickmap.dot.ca.gov before you drive up in a storm.",
          true),
        usCa("kirkwood-hwy-88", "kirkwood", "Kirkwood",
          "US-50 to CA-89, then CA-88 (Carson Pass) to the resort",
          "CA-88 over Carson Pass is high, remote and can be chain-controlled independently of the US-50 corridor · same R1/R2/R3 system applies when posted.",
          true),
        usCa("sierra-at-tahoe-us-50", "sierra-at-tahoe", "Sierra-at-Tahoe",
          "US-50 from Sacramento/Placerville, below Echo Summit",
          "⚠️ Sierra-at-Tahoe is officially closed for the 2025/26 season — this entry describes the road only, not resort operating status.",
          true),
        usCa("homewood-mountain-resort-hwy-89", "homewood-mountain-resort", "Homewood Mountain Resort",
          "US-50 to CA-89 (West Shore), or I-80 to CA-89 south from Tahoe City",
          "CA-89 along the West Shore is lower and less storm-exposed than US-50 over Echo Summit, but can still see R1/R2/R3 control posted.",
          true),
      ];
    }

    if (regionId === "mammoth-lakes") {
      return [
        usCa("mammoth-mountain-us-395", "mammoth-mountain", "Mammoth Mountain",
          "US-395 to CA-203 (Minaret Rd/Lake Mary Rd) into Mammoth Lakes",
          "No Caltrans R-level chain corridor identified for this approach in research · Caltrans still recommends snow tyres or carrying chains on CA-203 in storms.",
          false),
        usCa("june-mountain-hwy-158", "june-mountain", "June Mountain",
          "US-395 to CA-158 (June Lake Loop) near June Lake",
          "CA-158 is a shorter, lower-traffic approach than CA-203 into Mammoth · general Caltrans winter-driving advisory applies.",
          false),
      ];
    }

    if (regionId === "big-bear") {
      return [
        usCa("bear-mountain-hwy-18", "bear-mountain", "Bear Mountain",
          "CA-18 (Rim of the World Scenic Byway) from San Bernardino",
          "No Caltrans R-level chain corridor identified for this approach in research · Caltrans still recommends snow tyres or carrying chains on CA-18 in storms. ⚠️ Big Bear sits outside both the Sierra and Eastern Sierra Avalanche Centers' coverage areas.",
          false),
        usCa("snow-summit-hwy-18", "snow-summit", "Snow Summit",
          "CA-18 (Rim of the World Scenic Byway) from San Bernardino, or CA-38 from Redlands",
          "Same general approach as Bear Mountain · general Caltrans winter-driving advisory applies.",
          false),
      ];
    }

    if (regionId === "bear-valley") {
      return [
        usCa("bear-valley-mountain-resort-hwy-4", "bear-valley-mountain-resort", "Bear Valley Mountain Resort",
          "CA-4 (Ebbetts Pass Scenic Byway) from Angels Camp/Arnold",
          "CA-4/89 near Ebbetts Pass is a named Caltrans R1/R2/R3 chain-control corridor · check quickmap.dot.ca.gov before you drive up in a storm.",
          true),
      ];
    }

    // mt-shasta
    return [
      usCa("mt-shasta-ski-park-i-5", "mt-shasta-ski-park", "Mt. Shasta Ski Park",
        "I-5 to the Mount Shasta exit, then CA-89 (Everitt Memorial Highway to the ski park access road)",
        "No Caltrans R-level chain corridor identified for this approach in research · Caltrans still recommends snow tyres or carrying chains in storms. ⚠️ Mt. Shasta sits outside both the Sierra and Eastern Sierra Avalanche Centers' coverage areas.",
        false),
    ];
  }


  if (
    regionId === "killington-pico" ||
    regionId === "stowe-smugglers-notch" ||
    regionId === "mad-river-valley" ||
    regionId === "southern-vermont" ||
    regionId === "okemo" ||
    regionId === "jay-peak-nek"
  ) {
    const inSeason = isUsSnowSeason(now);
    const vt = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => vtChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "killington-pico") {
      return [
        vt("killington-resort-us-4", "killington-resort", "Killington",
          "US-4 east from Rutland, then VT-100/Killington Rd to the base",
          "US-4 and Killington Rd are state-maintained and regularly plowed."),
        vt("pico-mountain-us-4", "pico-mountain", "Pico Mountain",
          "US-4 east from Rutland, just west of the Killington Rd junction",
          "Shares the US-4 approach with Killington, slightly closer to Rutland."),
      ];
    }

    if (regionId === "stowe-smugglers-notch") {
      return [
        vt("stowe-mountain-resort-vt-108", "stowe-mountain-resort", "Stowe Mountain Resort",
          "I-89 to VT-100, then VT-108 (Mountain Rd) to the base",
          "VT-108 (Mountain Rd) is state-maintained and regularly plowed."),
        vt("smugglers-notch-vt-108", "smugglers-notch", "Smugglers' Notch",
          "VT-108 north from Stowe through Smugglers' Notch, or VT-15/VT-108 from Jeffersonville",
          "⚠️ The Stowe-side approach through the Notch itself (the high, narrow pass) is gated and closed every winter regardless of chain rules — Smugglers' Notch is accessed from the Jeffersonville side via VT-108 north in winter, not through the Notch."),
      ];
    }

    if (regionId === "mad-river-valley") {
      return [
        vt("sugarbush-vt-100", "sugarbush", "Sugarbush",
          "VT-100 to Warren, then Sugarbush Access Rd",
          "VT-100 and the resort access road are state/town-maintained and regularly plowed."),
        vt("mad-river-glen-vt-17", "mad-river-glen", "Mad River Glen",
          "VT-100 to Waitsfield, then VT-17 (App Gap Rd) west to the base",
          "VT-17 climbs steeply toward Appalachian Gap; the gap itself is typically closed in winter beyond the ski area, but the resort access section is maintained."),
      ];
    }

    if (regionId === "southern-vermont") {
      return [
        vt("stratton-mountain-resort-vt-30", "stratton-mountain-resort", "Stratton",
          "VT-30 to Bondville, then Stratton Mountain Access Rd",
          "VT-30 and the resort access road are state/town-maintained and regularly plowed."),
        vt("mount-snow-vt-100", "mount-snow", "Mount Snow",
          "VT-100 north from Wilmington to West Dover",
          "VT-100 is state-maintained and regularly plowed."),
        vt("bromley-mountain-vt-11", "bromley-mountain", "Bromley Mountain",
          "VT-11 between Manchester and Peru",
          "VT-11 is state-maintained and regularly plowed."),
        vt("magic-mountain-vt-11", "magic-mountain", "Magic Mountain",
          "VT-11 to Londonderry, then VT-100 south to the resort access road",
          "⚠️ Magic Mountain did not open for the 2025-26 season — this entry describes the road only, not resort operating status."),
      ];
    }

    if (regionId === "okemo") {
      return [
        vt("okemo-mountain-resort-vt-103", "okemo-mountain-resort", "Okemo Mountain Resort",
          "VT-103 to Ludlow, then VT-100/Okemo Ridge Rd to the base",
          "VT-103 and the resort access road are state/town-maintained and regularly plowed."),
      ];
    }

    // jay-peak-nek
    return [
      vt("jay-peak-vt-242", "jay-peak", "Jay Peak",
        "VT-105 or VT-242 to the base, near the Canadian border",
        "VT-242 climbs over Jay Peak's shoulder and can see the heaviest snowfall totals in the state; it remains state-maintained and plowed."),
      vt("burke-mountain-vt-114", "burke-mountain", "Burke Mountain",
        "VT-114 to East Burke, then Mountain Rd to the base",
        "VT-114 and the resort access road are state/town-maintained and regularly plowed."),
    ];
  }


  if (regionId === "jackson-hole" || regionId === "grand-targhee") {
    const inSeason = isUsSnowSeason(now);
    const wy = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
      tetonPassCorridor: boolean,
    ) => wyChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt, tetonPassCorridor });

    if (regionId === "jackson-hole") {
      return [
        wy("jackson-hole-mtn-resort-hwy-390", "jackson-hole-mtn-resort", "Jackson Hole Mountain Resort",
          "WY-390 (Teton Village Rd) north from Jackson to Teton Village",
          "WY-390 is state-maintained and regularly plowed; not the Teton Pass corridor itself, so a Level 1/2 posting is less frequent here than on WY-22.",
          false),
        wy("snow-king-mountain-in-town", "snow-king-mountain", "Snow King Mountain",
          "In-town in Jackson, a short drive or walk from the town square",
          "In-town streets are plowed by the Town of Jackson; a Level 1/2 posting is very unlikely on this short in-town approach.",
          false),
      ];
    }

    // grand-targhee
    return [
      wy("grand-targhee-resort-teton-pass", "grand-targhee-resort", "Grand Targhee Resort",
        "From Jackson: WY-22 over Teton Pass to Idaho, then ID-33 and Ski Hill Rd through Alta, WY to the resort",
        "⚠️ Teton Pass (WY-22) is WYDOT's most frequently named activation corridor for the dynamic Level 1/Level 2 chain law — check wyoroad.info before crossing, especially in storms.",
        true),
    ];
  }

  if (
    regionId === "big-sky" ||
    regionId === "bozeman-bridger-bowl" ||
    regionId === "whitefish" ||
    regionId === "red-lodge"
  ) {
    const inSeason = isUsSnowSeason(now);
    const mt = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => mtChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "big-sky") {
      return [
        mt("big-sky-resort-us-191", "big-sky-resort", "Big Sky Resort",
          "US-191 south from Bozeman, then Lone Mountain Trail/Big Sky Spur Rd to Mountain Village",
          "US-191 through the Gallatin Canyon is state-maintained and regularly plowed."),
      ];
    }

    if (regionId === "bozeman-bridger-bowl") {
      return [
        mt("bridger-bowl-canyon-rd", "bridger-bowl", "Bridger Bowl",
          "Bridger Canyon Rd (MT-86) north from Bozeman",
          "MT-86 is state-maintained and regularly plowed; MDT can post a temporary heavy-vehicle chain requirement at Bozeman Hill during severe storms, which does not apply to passenger vehicles."),
      ];
    }

    if (regionId === "whitefish") {
      return [
        mt("whitefish-mountain-resort-big-mtn-rd", "whitefish-mountain-resort", "Whitefish Mountain Resort",
          "Big Mountain Rd north from downtown Whitefish",
          "Big Mountain Rd is city/county-maintained and regularly plowed."),
      ];
    }

    // red-lodge
    return [
      mt("red-lodge-mountain-ski-run-rd", "red-lodge-mountain", "Red Lodge Mountain",
        "US-212 from Billings, then Ski Run Rd from the town of Red Lodge",
        "⚠️ The scenic Beartooth Highway (US-212) toward Yellowstone/Cooke City is closed in winter (mid-October through late May/early June) — winter access is via US-212 from Billings and Ski Run Rd only."),
    ];
  }

  if (regionId === "harbor-springs" || regionId === "keweenaw-peninsula") {
    const inSeason = isUsSnowSeason(now);
    const mi = (id: string, mountainId: string, mountainName: string, approach: string, detail: string) => miChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });
    if (regionId === "harbor-springs") return [
      mi("boyne-mountain-mi-75", "boyne-mountain", "Boyne Mountain", "I-75/US-131 through northern Lower Michigan to Boyne Falls", "Check Mi Drive for plow tracking and local lake-effect conditions."),
      mi("boyne-highlands-mi-119", "boyne-highlands", "The Highlands", "US-31/MI-119 to Harbor Springs, then Pleasantview Rd", "Check Mi Drive before travel in localized lake-effect snow."),
      mi("nubs-nob-mi-119", "nubs-nob", "Nub's Nob", "US-31/MI-119 to Harbor Springs, then local access roads", "Check Mi Drive before travel in localized lake-effect snow."),
    ];
    return [mi("mt-bohemia-lac-la-belle-rd", "mt-bohemia", "Mt. Bohemia", "US-41 through the Keweenaw, then Lac La Belle Rd", "⚠️ Upper Peninsula roads can see intense, localized Lake Superior lake-effect snow and rapid whiteouts; check Mi Drive cameras and plow tracking before travel.")];
  }

  if (regionId === "poconos" || regionId === "laurel-highlands") { const inSeason=isUsSnowSeason(now); const pa=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>paChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt}); if(regionId==="poconos") return [pa("camelback-pa-715","camelback-mountain","Camelback","I-80 to Tannersville, then PA-715","Check 511PA for winter condition overlays."),pa("blue-mountain-pa-248","blue-mountain-pa","Blue Mountain PA","PA-248/Blue Mountain Dr near Palmerton","Check 511PA for winter condition overlays."),pa("shawnee-pa-402","shawnee-mountain","Shawnee Mountain","US-209/PA-402 near Shawnee-on-Delaware","Check 511PA for winter condition overlays.")]; return [pa("seven-springs-pa-281","seven-springs-mountain","Seven Springs","PA-281/County roads to Seven Springs","Check 511PA; commercial-only Summit Mountain US-40 chain-up zone is in the wider Laurel Highlands."),pa("blue-knob-pa-869","blue-knob","Blue Knob","PA-869 toward Claysburg/Blue Knob","Check 511PA for winter condition overlays.")]; }

  if(regionId==="berkshires"||regionId==="central-massachusetts"){const inSeason=isUsSnowSeason(now);const ma=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>maChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});if(regionId==="berkshires")return[ma("jiminy-ma-43","jiminy-peak","Jiminy Peak","US-20/MA-43 to Hancock","Check Mass511 before winter travel."),ma("butternut-ma-23","ski-butternut","Ski Butternut","MA-23 near Great Barrington","Check Mass511 before winter travel."),ma("berkshire-east-ma-2","berkshire-east","Berkshire East","MA-2/Mohawk Trail to Charlemont","Check Mass511 before winter travel.")];return[ma("wachusett-ma-31","wachusett-mountain","Wachusett Mountain","MA-31/West Mountain Rd to Princeton","Check Mass511 before winter travel.")];}

  if(regionId==="lutsen-north-shore"){const inSeason=isUsSnowSeason(now);return[mnChainEntry({id:"lutsen-us-61",regionId,mountainId:"lutsen-mountains",mountainName:"Lutsen Mountains",approach:"US/MN Highway 61 along Lake Superior’s North Shore",detail:"⚠️ Highway 61 can close suddenly in localized Lake Superior lake-effect snow and whiteouts; check 511MN before travelling.",inSeason,issuedAt})];}

  if(regionId==="wausau"||regionId==="wisconsin-dells"){const inSeason=isUsSnowSeason(now);const wi=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>wiChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="wausau"?[wi("granite-peak-wi-29","granite-peak","Granite Peak","WI-29/US-51 to Rib Mountain State Park","Check 511 Wisconsin before winter travel.")]:[wi("cascade-mountain-wi-33","cascade-mountain","Cascade Mountain","I-90/94 and WI-33 near Portage","Check 511 Wisconsin before winter travel.")];}

  if(regionId==="snowshoe"||regionId==="canaan-valley"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>wvChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="snowshoe"?[entry("snowshoe-mountain-access","snowshoe-mountain","Snowshoe Mountain","West Virginia mountain approaches","Check WV 511 before winter travel.")]:regionId==="canaan-valley"?[entry("canaan-valley-resort-access","canaan-valley-resort","Canaan Valley Resort","West Virginia mountain approaches","Check WV 511 before winter travel."),entry("timberline-mountain-access","timberline-mountain","Timberline Mountain","West Virginia mountain approaches","Check WV 511 before winter travel.")]:[];}

  if(regionId==="high-country"||regionId==="maggie-valley"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>ncChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="high-country"?[entry("sugar-mountain-access","sugar-mountain","Sugar Mountain","Western North Carolina mountain approaches","Check DriveNC; local village restrictions may apply near mountain resorts."),entry("beech-mountain-access","beech-mountain","Beech Mountain Resort","Western North Carolina mountain approaches","Check DriveNC; local village restrictions may apply near mountain resorts.")]:regionId==="maggie-valley"?[entry("cataloochee-ski-area-access","cataloochee-ski-area","Cataloochee Ski Area","Western North Carolina mountain approaches","Check DriveNC; local village restrictions may apply near mountain resorts.")]:[];}

  if(regionId==="blue-ridge"||regionId==="shenandoah-valley"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>vaChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="blue-ridge"?[entry("wintergreen-resort-access","wintergreen-resort","Wintergreen Resort","Virginia mountain approaches","Check VDOT 511 before winter travel.")]:regionId==="shenandoah-valley"?[entry("massanutten-resort-access","massanutten-resort","Massanutten Resort","Virginia mountain approaches","Check VDOT 511 before winter travel.")]:[];}

  if(regionId==="lake-tahoe-nevada"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>nvChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="lake-tahoe-nevada"?[entry("mt-rose-ski-tahoe-access","mt-rose-ski-tahoe","Mt. Rose Ski Tahoe","Sierra approaches / local Tahoe roads","⚠️ Check posted Sierra-pass traction controls and Sierra Avalanche Center before travel."),entry("diamond-peak-access","diamond-peak","Diamond Peak","Sierra approaches / local Tahoe roads","⚠️ Check posted Sierra-pass traction controls and Sierra Avalanche Center before travel.")]:[];}

  if(regionId==="flagstaff"||regionId==="white-mountains-az"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>azChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="flagstaff"?[entry("arizona-snowbowl-access","arizona-snowbowl","Arizona Snowbowl","High-country state routes","⚠️ Follow ADOT storm restrictions; Snowbowl Upper Bowl risk has no formal daily state forecast.")]:regionId==="white-mountains-az"?[entry("sunrise-park-resort-access","sunrise-park-resort","Sunrise Park Resort","High-country state routes","⚠️ Follow ADOT storm restrictions; Snowbowl Upper Bowl risk has no formal daily state forecast.")]:[];}

  if(regionId==="black-hills"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>sdChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="black-hills"?[entry("terry-peak-access","terry-peak","Terry Peak","Black Hills routes to Lead","⚠️ Black Hills are Mountain Time; check SD511 before winter travel.")]:[];}

  if(regionId==="girdwood"||regionId==="juneau"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>akChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="girdwood"?[entry("alyeska-resort-access","alyeska-resort","Alyeska Resort","Local access after arrival in Alaska","⚠️ Alyeska users should check Seward Highway avalanche closures; Eaglecrest/Juneau has no contiguous-highway access.")]:regionId==="juneau"?[entry("eaglecrest-ski-area-access","eaglecrest-ski-area","Eaglecrest Ski Area","Local access after arrival in Alaska","⚠️ Alyeska users should check Seward Highway avalanche closures; Eaglecrest/Juneau has no contiguous-highway access.")]:[];}

  if(regionId==="litchfield-hills"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>ctChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="litchfield-hills"?[entry("mohawk-mountain-access","mohawk-mountain","Mohawk Mountain","Connecticut local access roads","Check CT Roads before winter travel.")]:[];}

  if(regionId==="vernon"){const inSeason=isUsSnowSeason(now);const entry=(id:string,mountainId:string,mountainName:string,approach:string,detail:string)=>njChainEntry({id,regionId,mountainId,mountainName,approach,detail,inSeason,issuedAt});return regionId==="vernon"?[entry("mountain-creek-resort-access","mountain-creek-resort","Mountain Creek Resort","NJ Route 94 / local access roads","Check 511NJ before winter travel.")]:[];}

  if (
    regionId === "taos" ||
    regionId === "angel-fire" ||
    regionId === "santa-fe" ||
    regionId === "albuquerque-sandia"
  ) {
    const inSeason = isUsSnowSeason(now);
    const nm = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => nmChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "taos") {
      return [
        nm("taos-ski-valley-nm-150", "taos-ski-valley", "Taos Ski Valley",
          "NM-150 from Taos, the sole paved access road to the resort",
          "⚠️ NM-150 is a narrow, steep, switchback mountain road with icy driving conditions common in winter — 4WD/AWD and reduced speeds are strongly recommended even though chains are not legally required."),
      ];
    }

    if (regionId === "angel-fire") {
      return [
        nm("angel-fire-resort-us-64", "angel-fire-resort", "Angel Fire Resort",
          "US-64 into the Moreno Valley to Angel Fire",
          "US-64 is state-maintained and regularly plowed; NMDOT also posts seasonal Forest Service road closures in the surrounding Carson National Forest each winter."),
      ];
    }

    if (regionId === "santa-fe") {
      return [
        nm("ski-santa-fe-nm-475", "ski-santa-fe", "Ski Santa Fe",
          "NM-475 (Hyde Park Rd) northeast from Santa Fe",
          "NM-475 climbs to one of the highest-base-elevation resorts in the US and is state-maintained and regularly plowed."),
      ];
    }

    // albuquerque-sandia
    return [
      nm("sandia-peak-nm-536", "sandia-peak", "Sandia Peak Ski Area",
        "NM-536 (Sandia Crest Scenic Byway) from Albuquerque",
        "⚠️ Sandia Peak is a verify-status resort with an unconfirmed 2025-26 closing date — check sandia.ski directly before travelling. A separate forest-health/wildfire-mitigation project at the nearby Sandia Crest recreation area is causing partial trail/road closures from April 2026 through fall 2027; this does not affect the ski area or Tramway."),
    ];
  }

  if (regionId === "mt-hood" || regionId === "bend") {
    const inSeason = isUsSnowSeason(now);
    const or = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => orChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "mt-hood") {
      return [
        or("mt-hood-meadows-or-35", "mt-hood-meadows", "Mt. Hood Meadows",
          "OR-35 from Hood River / US-26 junction",
          "This is the primary winter storm-response corridor for the Mt. Hood area."),
        or("timberline-lodge-us-26", "timberline-lodge", "Timberline Lodge",
          "US-26 (Mt. Hood Hwy) via Government Camp, then the Timberline access road",
          "US-26 over Mt. Hood is ODOT's most frequently chain-zoned corridor in the Cascades."),
        or("mt-hood-skibowl-us-26", "mt-hood-skibowl", "Mt. Hood Skibowl",
          "US-26 (Mt. Hood Hwy) directly at Government Camp",
          "Skibowl sits right on US-26, so chain-up zones posted for the corridor apply directly at the resort entrance."),
      ];
    }

    // bend
    return [
      or("mt-bachelor-cascade-lakes-hwy", "mt-bachelor", "Mt. Bachelor",
        "Cascade Lakes Highway (OR-372) from Bend",
        "This route is lower-traffic than the Mt. Hood corridors but still subject to the same statewide traction/chain law when ODOT posts a zone."),
    ];
  }

  if (
    regionId === "crystal-mountain" ||
    regionId === "snoqualmie-pass" ||
    regionId === "stevens-pass" ||
    regionId === "mt-baker"
  ) {
    const inSeason = isUsSnowSeason(now);
    const wa = (
      id: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
      avalancheControlCorridor: boolean,
    ) => waChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt, avalancheControlCorridor });

    if (regionId === "crystal-mountain") {
      return [
        wa("crystal-mountain-sr-410", "crystal-mountain-resort", "Crystal Mountain Resort",
          "SR-410 (Chinook Pass Hwy) from Enumclaw",
          "⚠️ SR-410 suffered major flood damage in late 2025 that delayed Crystal Mountain's 2025-26 opening; this is a WSDOT-designated chain-control route in normal winters.",
          true),
      ];
    }

    if (regionId === "snoqualmie-pass") {
      return [
        wa("summit-at-snoqualmie-i-90", "the-summit-at-snoqualmie", "The Summit at Snoqualmie",
          "I-90 at Snoqualmie Pass",
          "I-90 at Snoqualmie Pass is one of WSDOT's two primary avalanche-control corridors, averaging 450+ inches of snow per winter and requiring active avalanche-control operations to stay open.",
          true),
      ];
    }

    if (regionId === "stevens-pass") {
      return [
        wa("stevens-pass-us-2", "stevens-pass-ski-area", "Stevens Pass Ski Area",
          "US-2 at Stevens Pass from Skykomish",
          "⚠️ US-2 suffered flood/storm damage that forced extended closures in late December 2025, delaying Stevens Pass's opening; the \"Old Faithful\" avalanche zone near the ski area is one of WSDOT's most active avalanche-control sites.",
          true),
      ];
    }

    // mt-baker
    return [
      wa("mt-baker-sr-542", "mt-baker-ski-area", "Mt. Baker Ski Area",
        "SR-542 (Mt. Baker Highway) from Glacier",
        "SR-542 is a designated WSDOT chain-control route (mileposts 22.91-57.26), the sole paved access road to Mt. Baker Ski Area.",
        true),
    ];
  }


  if (regionId === "white-mountains" || regionId === "franconia-notch" || regionId === "waterville-valley" || regionId === "lakes-region") {
    const inSeason = isUsSnowSeason(now);
    const nh = (id: string, mountainId: string, mountainName: string, approach: string, detail: string) => nhChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });
    if (regionId === "white-mountains") return [
      nh("cranmore-nh-16", "cranmore-mountain", "Cranmore Mountain", "NH-16 / Route 302 from North Conway", "North Conway approaches are lower-elevation but can ice quickly in storms."),
      nh("wildcat-nh-16", "wildcat-mountain", "Wildcat Mountain", "NH-16 through Pinkham Notch", "Pinkham Notch is adjacent to the MWAC forecast area; check NHDOT/New England 511 for storm closures, not an avalanche bulletin for in-bounds skiing."),
      nh("attitash-route-302", "attitash-mountain-resort", "Attitash Mountain Resort", "Route 302 from North Conway", "Route 302 through the Mount Washington Valley is the main resort approach."),
    ];
    if (regionId === "franconia-notch") return [
      nh("cannon-i93-us3", "cannon-mountain", "Cannon Mountain", "I-93 / US-3 through Franconia Notch", "Franconia Notch Parkway is the primary approach; check New England 511 before travelling."),
      nh("bretton-woods-us302", "bretton-woods", "Bretton Woods", "US-302 from Crawford Notch / Bretton Woods", "The approach crosses exposed White Mountains terrain."),
      nh("loon-i93-kanc", "loon-mountain", "Loon Mountain", "I-93 to Lincoln, then local Loon access roads", "I-93 is the primary corridor from the south."),
    ];
    if (regionId === "waterville-valley") return [nh("waterville-nh49", "waterville-valley-resort", "Waterville Valley Resort", "I-93 to NH-49", "NH-49 is the sole valley approach from I-93.")];
    return [nh("gunstock-nh11a", "gunstock-mountain-resort", "Gunstock Mountain Resort", "NH-11A / NH-11 from Gilford", "Lake Winnipesaukee approaches are lower but can still be slick in winter storms.")];
  }


  if (regionId === "carrabassett-valley" || regionId === "newry-bethel" || regionId === "rangeley") {
    const inSeason = isUsSnowSeason(now);
    const me = (id: string, mountainId: string, mountainName: string, approach: string, detail: string) => meChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });
    if (regionId === "carrabassett-valley") return [me("sugarloaf-me27", "sugarloaf", "Sugarloaf", "ME-16 / ME-27 through Carrabassett Valley", "ME-27 is the primary valley approach; verify storm conditions with MaineDOT.")];
    if (regionId === "newry-bethel") return [me("sunday-river-me2-26", "sunday-river", "Sunday River", "ME-2 / ME-26 from Bethel and Newry", "The western Maine approach can be slick during storms.")];
    return [me("saddleback-me4-16", "saddleback-mountain", "Saddleback Mountain", "ME-4 / ME-16 from Rangeley", "Rangeley approaches are remote and can close or degrade in winter weather.")];
  }


  if (regionId === "lake-placid" || regionId === "north-creek" || regionId === "hunter" || regionId === "windham" || regionId === "highmount") {
    const inSeason = isUsSnowSeason(now); const ny = (id: string, mountainId: string, mountainName: string, approach: string, detail: string) => nyChainEntry({ id, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });
    if (regionId === "lake-placid") return [ny("whiteface-ny86", "whiteface-mountain", "Whiteface Mountain", "NY-86 through Wilmington", "Adirondack approaches can deteriorate rapidly in storms; check 511NY.")];
    if (regionId === "north-creek") return [ny("gore-ny28", "gore-mountain", "Gore Mountain", "NY-28 / NY-28N via North Creek", "Check 511NY for Adirondack winter closures and cameras.")];
    if (regionId === "hunter") return [ny("hunter-ny23a", "hunter-mountain", "Hunter Mountain", "NY-23A / NY-296 through Hunter", "Catskills mountain approaches may be icy or congested during storms.")];
    if (regionId === "windham") return [ny("windham-ny23", "windham-mountain", "Windham Mountain Club", "NY-23 through Windham", "Check 511NY and verify resort public access before travelling.")];
    return [ny("belleayre-ny28", "belleayre-mountain", "Belleayre Mountain", "NY-28 via Highmount", "NY-28 is the principal Catskills approach.")];
  }

  if (
    regionId === "sun-valley" ||
    regionId === "sandpoint" ||
    regionId === "boise" ||
    regionId === "donnelly-mccall"
  ) {
    const inSeason = isUsSnowSeason(now);
    const id_ = (
      idStr: string,
      mountainId: string,
      mountainName: string,
      approach: string,
      detail: string,
    ) => idChainEntry({ id: idStr, regionId, mountainId, mountainName, approach, detail, inSeason, issuedAt });

    if (regionId === "sun-valley") {
      return [
        id_("sun-valley-bald-mountain-hwy-75", "bald-mountain", "Bald Mountain (Sun Valley Resort)",
          "ID-75 (Sun Valley Rd) from Ketchum",
          "ID-75 is state-maintained and regularly plowed; no named chain-control pass sits on this approach."),
        id_("sun-valley-dollar-mountain-hwy-75", "dollar-mountain", "Dollar Mountain (Sun Valley Resort)",
          "ID-75 (Sun Valley Rd) from Ketchum",
          "ID-75 is state-maintained and regularly plowed; no named chain-control pass sits on this approach."),
      ];
    }

    if (regionId === "sandpoint") {
      return [
        id_("schweitzer-mountain-rd", "schweitzer-mountain-resort", "Schweitzer Mountain Resort",
          "Schweitzer Mountain Rd from Sandpoint (off US-95)",
          "⚠️ Travelling to Sandpoint via I-90 from the east could route drivers near Lookout Pass, one of Idaho's three named commercial-vehicle chain-control passes - this does not affect ordinary passenger vehicles taking the direct US-95 approach from Sandpoint itself."),
      ];
    }

    if (regionId === "boise") {
      return [
        id_("bogus-basin-rd", "bogus-basin", "Bogus Basin",
          "Bogus Basin Rd from Boise",
          "⚠️ Bogus Basin closed early for the 2025-26 season on Mar 22 2026 due to unseasonably warm temperatures and a lack of new snow - check bogusbasin.org directly before travelling."),
      ];
    }

    // donnelly-mccall
    return [
      id_("tamarack-resort-hwy-55", "tamarack-resort", "Tamarack Resort",
        "ID-55 then Tamarack Resort access road from Donnelly",
        "⚠️ Tamarack Resort's ownership/financial status carries a genuine, unresolved conflict in sources (2025 Idaho Business Review reporting of stable, debt-free MMG ownership vs. a March 2025 SAM report of a fresh Chapter 11 filing tied to a long-standing Credit Suisse debt) - this does not appear to have affected on-the-ground 2025-26 operations, but is flagged rather than asserted either way."),
      id_("brundage-mountain-hwy-55", "brundage-mountain", "Brundage Mountain Resort",
        "ID-55 then Goose Lake Rd from McCall",
        "ID-55 and Goose Lake Rd are state/county-maintained and regularly plowed; no named chain-control pass sits on this approach."),
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
    //  · CA (BC + Alberta) - no feed wired yet. DriveBC Open511 and 511
    //    Alberta both publish one, but nothing is integrated in this pass, so
    //    `roads` stays empty and the advice points at the official maps.
    //  · Everywhere else - no public live feed wired yet, so roads is empty
    //    and the client renders an explicit "not available" state.
    const isAU = region === undefined || region === "snowy-mountains";
    const isNZ =
      region !== undefined &&
      Object.prototype.hasOwnProperty.call(NZ_CORRIDORS, region);
    const isCA =
      region === "whistler" ||
      region === "powder-highway" ||
      region === "okanagan" ||
      region === "vancouver" ||
      region === "banff-lake-louise" ||
      region === "canmore" ||
      region === "jasper" ||
      region === "quebec-laurentians" ||
      region === "quebec-charlevoix" ||
      region === "quebec-eastern-townships";
    //  · US (Colorado) - no feed wired yet. CDOT publishes cotrip.org, but
    //    nothing is integrated in this pass, so `roads` stays empty and the
    //    advice points at cotrip.org for roads and CAIC for avalanche.
    const isUS =
      region === "summit-county" ||
      region === "vail-valley" ||
      region === "aspen-snowmass" ||
      region === "steamboat" ||
      region === "winter-park" ||
      region === "crested-butte" ||
      region === "telluride" ||
      region === "durango" ||
      region === "boulder-front-range";
    //  · US (Utah) - no feed wired yet. UDOT publishes udottraffic.utah.gov
    //    and a dedicated cottonwoodcanyons.udot.utah.gov page, but nothing is
    //    integrated in this pass, so `roads` stays empty and the advice
    //    points at UDOT for roads and the Utah Avalanche Center for
    //    backcountry conditions.
    const isUT =
      region === "cottonwood-canyons" ||
      region === "park-city" ||
      region === "ogden-valley" ||
      region === "provo" ||
      region === "cache-valley";
    //  · US (California) - no feed wired yet. Caltrans publishes
    //    quickmap.dot.ca.gov, which also carries live R1/R2/R3 chain-control
    //    postings, but nothing is integrated in this pass, so `roads` stays
    //    empty and the advice points at QuickMap for roads and the Sierra /
    //    Eastern Sierra Avalanche Centers for backcountry conditions - with
    //    an explicit note that Big Bear and Mt. Shasta have no dedicated
    //    avalanche-forecasting authority.
    const isUsCa =
      region === "north-lake-tahoe" ||
      region === "south-lake-tahoe" ||
      region === "mammoth-lakes" ||
      region === "big-bear" ||
      region === "bear-valley" ||
      region === "mt-shasta";
    //  · US (Vermont) - no feed wired yet. VTrans publishes New England 511, but
    //    nothing is integrated in this pass, so `roads` stays empty and the
    //    advice points at New England 511 for roads. Vermont has NO statewide
    //    chain law for passenger vehicles (unlike CO/UT/CA) and NO dedicated
    //    avalanche-forecasting authority anywhere in the state - both
    //    stated explicitly below rather than silently omitted or borrowed
    //    from a neighbouring state's authority.
    const isUsVt =
      region === "killington-pico" ||
      region === "stowe-smugglers-notch" ||
      region === "mad-river-valley" ||
      region === "southern-vermont" ||
      region === "okemo" ||
      region === "jay-peak-nek";
    //  · US (Wyoming) - no feed wired yet. WYDOT publishes wyoroad.info, but
    //    nothing is integrated in this pass. Wyoming DOES have a real,
    //    dynamic Level 1/Level 2 chain law (WY Statute Section 31-5-956),
    //    unlike Vermont/Montana - stated explicitly below rather than
    //    downgraded to a generic "no chain law" advisory. Bridger-Teton
    //    Avalanche Center covers both WY regions under its "Tetons" zone.
    const isUsWy = region === "jackson-hole" || region === "grand-targhee";
    //  - US (Montana) - no feed wired yet. MDT publishes 511mt.net.
    //    Montana has NO statewide passenger-vehicle chain law (only a
    //    narrow heavy-vehicle carve-out under MCA 61-9-436) - same narrow
    //    posture as Vermont. GNFAC covers Big Sky/Bozeman-Bridger Bowl,
    //    Flathead Avalanche Center covers Whitefish; Red Lodge/Beartooth
    //    has NO dedicated avalanche-forecast coverage - a genuine gap,
    //    stated explicitly rather than pointing at an authority that
    //    doesn't actually cover it.
    const isUsMt =
      region === "big-sky" ||
      region === "bozeman-bridger-bowl" ||
      region === "whitefish" ||
      region === "red-lodge";
    //  - US (New Mexico) - no feed wired yet. NMDOT publishes nmroads.com.
    //    New Mexico has NO statewide chain law (NMSA 1978 Section
    //    66-3-847 permits but does not require chains/studded tires) -
    //    same narrow posture as Vermont/Montana. The Taos Avalanche
    //    Center covers only the Taos region; Angel Fire, Santa Fe and
    //    Albuquerque/Sandia Peak have NO dedicated avalanche-forecast
    //    coverage - a genuine gap, stated explicitly rather than
    //    pointing at an authority that doesn't actually cover them.
    // US (Michigan) · Mi Drive has the official state road map. No passenger chain law; no avalanche authority because this is genuinely non-avalanche terrain.
    const isUsMi = region === "harbor-springs" || region === "keweenaw-peninsula";
    const isUsPa = region === "poconos" || region === "laurel-highlands";
    const isUsMa = region === "berkshires" || region === "central-massachusetts";
    const isUsMn = region === "lutsen-north-shore";
    const isUsWi = region === "wausau" || region === "wisconsin-dells";
    const isUsNj = region === "vernon";
    const isUsCt = region === "litchfield-hills";
    const isUsAk = region === "girdwood" || region === "juneau";
    const isUsSd = region === "black-hills";
    const isUsAz = region === "flagstaff" || region === "white-mountains-az";
    const isUsNv = region === "lake-tahoe-nevada";
    const isUsVa = region === "blue-ridge" || region === "shenandoah-valley";
    const isUsNc = region === "high-country" || region === "maggie-valley";
    const isUsWv = region === "snowshoe" || region === "canaan-valley";
    const isUsNm =
      region === "taos" ||
      region === "angel-fire" ||
      region === "santa-fe" ||
      region === "albuquerque-sandia";
    //  - US (Oregon) - no feed wired yet. ODOT publishes tripcheck.com.
    //    Oregon has a BROAD, MANDATORY, STATEWIDE traction/chain law (ORS
    //    815.045/815.140/815.142/815.145 + OAR 734-017) applying to ALL
    //    vehicles, not just trucks or 2WD - the opposite honesty posture
    //    from Vermont/Montana/New Mexico's genuinely-no-chain-law states.
    //    Avalanche coverage is split: NWAC covers Mt. Hood, while Bend/Mt.
    //    Bachelor is covered by the smaller, volunteer-run Central Oregon
    //    Avalanche Center (COAC) - a "different/lesser-resourced
    //    authority" flag, not a coverage gap.
    const isUsOr = region === "mt-hood" || region === "bend";
    //  - US (Washington) - no feed wired yet. WSDOT publishes
    //    wsdot.com/travel/real-time/mountainpasses. Washington has a REAL,
    //    storm-activated, escalating-tier traction requirement (RCW
    //    47.36.250 + WAC 204-24-040/050) with MORE escalation levels than
    //    Wyoming's Level 1/2 or California's R1/R2/R3 - up to chains on
    //    ALL vehicles including 4WD/AWD at the most severe level. NWAC
    //    covers all four Washington regions.
    const isUsWa =
      region === "crystal-mountain" ||
      region === "snoqualmie-pass" ||
      region === "stevens-pass" ||
      region === "mt-baker";
    //  - US (Idaho) - no feed wired yet. Idaho Transportation Department
    //    publishes 511.idaho.gov. Idaho has a NARROW, COMMERCIAL-VEHICLE-
    //    ONLY chain law (Idaho Code Section 49-948) on three named
    //    northern passes (Lookout Pass/Fourth of July Pass on I-90, Lolo
    //    Pass on US-12) that do not sit on any of these four regions'
    //    direct access roads - same narrow posture as Vermont/Montana/New
    //    Mexico for ordinary passenger vehicles. Avalanche coverage is
    //    split three ways: Sawtooth Avalanche Center (Sun Valley), Idaho
    //    Panhandle Avalanche Center (Sandpoint/Schweitzer), Payette
    //    Avalanche Center (Donnelly-McCall) - and Boise/Bogus Basin has NO
    //    avalanche zone actually centered on it (nearest SAC zones are
    //    56+ miles away) - a genuine coverage gap, stated explicitly.
    const isUsId =
      region === "sun-valley" ||
      region === "sandpoint" ||
      region === "boise" ||
      region === "donnelly-mccall";

    // New Hampshire · no live feed wired. NHDOT directs users to the regional
    // New England 511 site (there is no separate NH-branded 511 website).
    // MWAC issues real daily forecasts for Tuckerman/Huntington Ravines and
    // the Presidential Range near Wildcat/Pinkham Notch; unlike Vermont this
    // is genuine forecast coverage, but it is backcountry-only.
    const isUsNh = region === "white-mountains" || region === "franconia-notch" || region === "waterville-valley" || region === "lakes-region";
    // Maine has no avalanche authority at all, and 511 Maine is the state road authority.
    const isUsMe = region === "carrabassett-valley" || region === "newry-bethel" || region === "rangeley";
    // New York has no dedicated avalanche center; DEC notices are irregular High Peaks backcountry advisories only.
    const isUsNy = region === "lake-placid" || region === "north-creek" || region === "hunter" || region === "windham" || region === "highmount";

    let roads: unknown[] = [];
    let generalAdvice: string;
    let liveTrafficUrl: string;

    if (isAU) {
      roads = await fetchRoadConditions();
      generalAdvice =
        "Always carry chains when travelling to the Snowy Mountains during winter (June-October). Check conditions before departure at livetraffic.com. National Parks entry fees apply for Kosciuszko National Park. Vehicle entry is $29/day or $190/year (2024 rates). During heavy snowfall, roads may close at short notice. On peak winter days Transport for NSW closes Kosciuszko Road to uphill traffic when the Perisher carpark fills · those alerts appear here as they're issued.";
      liveTrafficUrl =
        "https://www.livetraffic.com/maps?lat=-36.45&lng=148.45&zoom=10&layers=cameras";
    } else if (isNZ) {
      const events = await fetchNztaActiveEvents();
      roads = buildNzRoads(region as string, events);
      generalAdvice =
        "Live advisories below cover the state-highway approach to the region, from Waka Kotahi (NZTA). The final ski-field access road is a council or ski-area road with no public live feed - use the seasonal chain rule below and check the ski area's own daily road report before heading up. In the NZ ski season (roughly June-October) carry chains and fit them when snow is settling or where directed.";
      liveTrafficUrl = "https://www.journeys.nzta.govt.nz/highway-conditions";
    } else if (isCA) {
      // No live Canadian road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear".
      generalAdvice =
        region === "whistler" || region === "powder-highway" || region === "okanagan" || region === "vancouver"
          ? "We do not yet pull live road data for British Columbia · check DriveBC (drivebc.ca) for closures, avalanche control and highway cameras before you drive. Winter tyres marked M+S or 3-peak mountain snowflake are required by law on these routes from 1 October to 30 April. For anything off-piste or side-country, read the day's Avalanche Canada bulletin at avalanche.ca."
          : region === "quebec-laurentians" ||
              region === "quebec-charlevoix" ||
              region === "quebec-eastern-townships"
            ? "We do not yet pull live road data for Québec · check Québec 511 (quebec511.info) for closures and highway cameras before you drive. Québec law requires 3-peak mountain snowflake winter tyres from 1 December to 15 March on vehicles registered in the province; out-of-province and rental vehicles are exempt but should still be shod for winter. For anything off-piste or side-country, read the day's Avalanche Québec bulletin at avalanchequebec.ca."
            : "We do not yet pull live road data for Alberta · check 511 Alberta (511.alberta.ca) for closures and highway cameras before you drive, and Parks Canada for conditions inside the national parks. Alberta does not legislate winter tyres but they are strongly recommended on every mountain highway here. For anything off-piste or side-country, read the day's Avalanche Canada bulletin at avalanche.ca.";
      liveTrafficUrl = "";
    } else if (isUS) {
      // No live Colorado road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear". State the real
      // Traction Law and Passenger Vehicle Chain Law from the research doc
      // rather than inventing details CDOT hasn't published.
      generalAdvice =
        "We do not yet pull live road data for Colorado · check CDOT's cotrip.org for closures, avalanche control and highway cameras before you drive, especially on the I-70 Mountain Corridor. Colorado's Traction Law is in effect every year from 1 September to 31 May on I-70 between Dotsero and Morrison (and can be activated on any other state highway when conditions warrant): AWD/4WD vehicles need winter-rated tyres (3/16\"+ tread, 3-peak mountain snowflake / M+S / all-weather) or chains/an alternative traction device on at least 2 drive tyres, while 2WD vehicles must carry chains or an ATD regardless of tyre type (SB25-069). In storms CDOT can escalate to the Passenger Vehicle Chain Law, requiring chains/ATD on every vehicle regardless of drivetrain as the last step before a road closure. For anything off-piste or backcountry, read the day's forecast from the Colorado Avalanche Information Center at avalanche.state.co.us.";
      liveTrafficUrl = "https://www.cotrip.org/";
    } else if (isUT) {
      // No live Utah road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear". State UDOT's
      // real, sign-activated Class 3 traction law for the Cottonwood
      // Canyons rather than inventing a fixed calendar rule UDOT hasn't
      // published; other Utah regions get a lighter, generic advisory
      // since they have no equivalent canyon-road designation.
      generalAdvice =
        region === "cottonwood-canyons"
          ? "We do not yet pull live road data for Utah · check UDOT's dedicated cottonwoodcanyons.udot.utah.gov page for closures, avalanche control and today's traction requirement before you drive SR-210 (Little Cottonwood, to Alta/Snowbird) or SR-190 (Big Cottonwood, to Brighton/Solitude). UDOT can post a Class 3 traction-device requirement on these canyon roads any time within its 1 October-30 April authority window: when posted, ALL vehicles need an approved traction device, or tyres rated M+S/3-peak mountain snowflake with 5/32\"+ tread — this is sign-activated, not automatically in force for the whole window. A separate gondola/tolling project for Little Cottonwood Canyon remains unbuilt and in litigation as of 2026 and does not change today's driving rules. For backcountry conditions, read the day's forecast from the Utah Avalanche Center's Salt Lake forecast at utahavalanchecenter.org."
          : "We do not yet pull live road data for Utah · check UDOT's udottraffic.utah.gov for closures and highway cameras before you drive. Utah has no statewide chain law, but UDOT strongly recommends winter/traction tyres in snow and can post seasonal traction-device requirements on specific canyon roads when conditions warrant. For backcountry conditions, read the day's forecast from the Utah Avalanche Center at utahavalanchecenter.org.";
      liveTrafficUrl = "https://www.udottraffic.utah.gov/";
    } else if (isUsCa) {
      // No live California road feed is wired yet · say so plainly rather
      // than shipping an empty list that reads like "all clear". State
      // Caltrans' real, storm-activated R1/R2/R3 chain-control ladder for
      // the named corridors (I-80 Donner Summit, US-50 near Tahoe, CA-4/89
      // near Bear Valley) rather than inventing a fixed calendar rule
      // Caltrans hasn't published; Mammoth Lakes, Big Bear and Mt. Shasta
      // get a lighter, generic advisory since no R-level corridor was
      // identified for their approaches in research.
      const rLevelRegion =
        region === "north-lake-tahoe" || region === "south-lake-tahoe" || region === "bear-valley";
      const noAvalancheCoverage = region === "big-bear" || region === "mt-shasta";
      generalAdvice = rLevelRegion
        ? "We do not yet pull live road data for California · check Caltrans QuickMap (quickmap.dot.ca.gov) for closures, chain control and highway cameras before you drive, especially over Donner Summit (I-80), Echo Summit (US-50) or Ebbetts Pass (CA-4/89). Caltrans can post R1/R2/R3 chain control on these routes any time in winter storms: R1 requires chains except 4WD/AWD with snow tyres on all 4 wheels (chains must still be carried); R2 requires chains except 4WD/AWD with snow tyres AND chains in possession; R3 requires chains on ALL vehicles, no exceptions — this is storm-activated, not a fixed calendar rule. For backcountry conditions in the Tahoe area, read the day's forecast from the Sierra Avalanche Center at sierraavalanchecenter.org."
        : noAvalancheCoverage
          ? "We do not yet pull live road data for California · check Caltrans QuickMap (quickmap.dot.ca.gov) for closures and highway cameras before you drive. California has no statewide chain law, but Caltrans strongly recommends snow tyres or carrying chains on mountain approaches in winter and can post R1/R2/R3 chain control on specific highways when storms warrant. ⚠️ This region has no dedicated backcountry avalanche-forecasting authority — neither the Sierra Avalanche Center nor the Eastern Sierra Avalanche Center covers it, so no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply."
          : "We do not yet pull live road data for California · check Caltrans QuickMap (quickmap.dot.ca.gov) for closures and highway cameras before you drive. California has no statewide chain law, but Caltrans strongly recommends snow tyres or carrying chains on mountain approaches in winter and can post R1/R2/R3 chain control on specific highways when storms warrant. For backcountry conditions around Mammoth and June Mountain, read the day's forecast from the Eastern Sierra Avalanche Center at esavalanche.org.";
      liveTrafficUrl = "https://quickmap.dot.ca.gov/";
    } else if (isUsVt) {
      // No live Vermont road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear". Vermont has NO
      // statewide chain law for passenger vehicles - only a heavy-vehicle
      // rule on VT-9 between Wilmington and Bennington, which does not
      // apply to visitor vehicles - so this is NOT a "not-required, but
      // check for a posted rule" case like Utah/California; it's a
      // genuine, permanent absence of a chain law, closer to the Canada
      // provinces. No Vermont region has a dedicated backcountry
      // avalanche-forecasting authority (the terrain does not carry
      // significant avalanche danger, and the Mount Washington Avalanche
      // Center's forecasts are for New Hampshire's Presidential Range, not
      // Vermont) - stated explicitly rather than pointing at an
      // out-of-state authority that doesn't actually cover these regions.
      generalAdvice =
        "We do not yet pull live road data for Vermont · check VTrans' New England 511 for closures, plow-truck tracking (plowtrucks.vtrans.vermont.gov) and highway cameras before you drive. Vermont has no statewide chain law for passenger vehicles (only a heavy-vehicle rule on VT-9 between Wilmington and Bennington that doesn't apply to visitor cars); winter/snow tyres are strongly recommended on mountain approaches, and studded tires are legal year-round. ⚠️ No Vermont ski region has a dedicated backcountry avalanche-forecasting authority - the state's terrain does not carry significant avalanche danger, so no avalanche-bulletin link is offered here rather than pointing at an out-of-state center (e.g. Mount Washington Avalanche Center, which covers New Hampshire) that doesn't actually cover Vermont.";
      liveTrafficUrl = "https://newengland511.org/";
    } else if (isUsWy) {
      // No live Wyoming road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear". Wyoming HAS a
      // real, dynamic Level 1/Level 2 chain law (WY Statute Section
      // 31-5-956), posted by variable message sign rather than a fixed
      // calendar - most frequently activated on Teton Pass (WY-22), the
      // main road to Grand Targhee. State that explicitly rather than
      // downgrading Wyoming to Vermont/Montana's "no chain law" posture.
      generalAdvice =
        "We do not yet pull live road data for Wyoming · check WYDOT's wyoroad.info for closures, chain-law status and highway cameras before you drive, especially over Teton Pass (WY-22). Wyoming has no fixed-calendar statewide chain law, but WYDOT can post a dynamic Level 1 (chains, snow tires, or 4WD/AWD engaged) or Level 2 (chains, or 4WD/AWD with M+S/all-weather tires) chain requirement on any state highway when conditions warrant, applying to ALL vehicles when active — this is sign-activated, not automatically in force for a set window, per Wyoming Statute Section 31-5-956. For backcountry conditions, read the day's forecast from the Bridger-Teton Avalanche Center's Tetons zone at bridgertetonavalanchecenter.org.";
      liveTrafficUrl = "https://wyoroad.info/";
    } else if (isUsMt) {
      // No live Montana road feed is wired yet · say so plainly rather than
      // shipping an empty list that reads like "all clear". Montana has NO
      // statewide chain law for passenger vehicles — only a narrow
      // heavy-vehicle rule under MCA 61-9-436 (towing units ≥ 26,001 lbs
      // GVW, Oct 1–Apr 30) that does not apply to visitor vehicles — so
      // this is a genuine, permanent absence of a chain law, same posture
      // as Vermont, not a "not-required, but check for a posted rule" case
      // like Utah/California/Wyoming. Avalanche-authority coverage is
      // split: GNFAC covers Big Sky and Bozeman-Bridger Bowl, Flathead
      // Avalanche Center covers Whitefish, and Red Lodge/Beartooth has NO
      // dedicated avalanche-forecasting authority — stated explicitly
      // rather than pointing at GNFAC or Flathead, neither of which
      // actually extends there.
      const gnfacRegion = region === "big-sky" || region === "bozeman-bridger-bowl";
      const flatheadRegion = region === "whitefish";
      generalAdvice = gnfacRegion
        ? "We do not yet pull live road data for Montana · check MDT's 511mt.net for closures, chain requirements and highway cameras before you drive. Montana has no statewide chain law for passenger vehicles (only a heavy-vehicle rule under MCA 61-9-436 for towing units ≥ 26,001 lbs GVW, which doesn't apply to visitor cars); winter/snow tyres are strongly recommended on mountain approaches, and MDT can post temporary chain requirements at specific named mountain passes during severe storms. For backcountry conditions, read the day's forecast from the Gallatin National Forest Avalanche Center at mtavalanche.com."
        : flatheadRegion
          ? "We do not yet pull live road data for Montana · check MDT's 511mt.net for closures, chain requirements and highway cameras before you drive. Montana has no statewide chain law for passenger vehicles (only a heavy-vehicle rule under MCA 61-9-436 for towing units ≥ 26,001 lbs GVW, which doesn't apply to visitor cars); winter/snow tyres are strongly recommended on mountain approaches, and MDT can post temporary chain requirements at specific named mountain passes during severe storms. For backcountry conditions, read the day's forecast from the Flathead Avalanche Center at flatheadavalanche.org."
          : "We do not yet pull live road data for Montana · check MDT's 511mt.net for closures, chain requirements and highway cameras before you drive, especially on US-212 and around the Beartooth Highway (closed in winter, roughly mid-October through late May/early June). Montana has no statewide chain law for passenger vehicles (only a heavy-vehicle rule under MCA 61-9-436 for towing units ≥ 26,001 lbs GVW, which doesn't apply to visitor cars); winter/snow tyres are strongly recommended on this approach. ⚠️ This region has no dedicated backcountry avalanche-forecasting authority — the Gallatin National Forest Avalanche Center's coverage does not extend to Red Lodge/Beartooth, so no avalanche-bulletin link is offered here rather than pointing at one that doesn't apply.";
      liveTrafficUrl = "https://www.511mt.net/";
    } else if (isUsMi) {
      generalAdvice = region === "keweenaw-peninsula"
        ? "We do not yet pull live road data for Michigan · check MDOT's Mi Drive (michigan.gov/drive) for closures, cameras and plow tracking before driving to Mt. Bohemia. ⚠️ Keweenaw/Upper Peninsula roads are exposed to intense localized Lake Superior lake-effect snow and sudden whiteouts. Michigan has no passenger-vehicle chain or winter-tire mandate; seasonal studded-tire date restrictions apply. No avalanche authority is needed here: this low-relief ski terrain has no meaningful avalanche risk."
        : "We do not yet pull live road data for Michigan · check MDOT's Mi Drive (michigan.gov/drive) for closures, cameras and plow tracking before driving. Michigan has no passenger-vehicle chain or winter-tire mandate; seasonal studded-tire date restrictions apply. No avalanche authority is needed here: this low-relief ski terrain has no meaningful avalanche risk.";
      liveTrafficUrl = "https://www.michigan.gov/drive";
    } else if (isUsPa) {
      generalAdvice = "We do not yet pull live road data for Pennsylvania · check PennDOT's 511PA (511pa.com) for closures, cameras and winter road conditions. Pennsylvania has no general passenger-vehicle chain or winter-tire mandate. Its storm-activated vehicle restrictions and three named chain-up zones are commercial-vehicle measures; the Summit Mountain US-40 zone is in the broader Laurel Highlands. No avalanche authority is needed here: these low-relief groomed ski areas have no meaningful avalanche hazard.";
      liveTrafficUrl = "https://www.511pa.com/";
    } else if (isUsMa) {
      generalAdvice = "We do not yet pull live road data for Massachusetts · check MassDOT's Mass511 (mass511.com) for closures, cameras and winter travel alerts. Massachusetts has no general passenger-vehicle chain or winter-tire mandate; studded tires are allowed only Nov 1-Apr 30. No avalanche authority is needed here: these low-relief groomed ski areas have no meaningful avalanche hazard.";
      liveTrafficUrl = "https://mass511.com/";
    } else if (isUsMn) {
      generalAdvice = "We do not yet pull live road data for Minnesota · check MnDOT's 511 Minnesota (511mn.org) for North Shore road conditions, cameras and closures. ⚠️ Highway 61 can see sudden Lake Superior lake-effect snow whiteouts and full closures. Minnesota has no passenger chain or winter-tire mandate; resident studded tires are banned year-round. No avalanche authority is needed here: North Shore ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://511mn.org/";
    } else if (isUsWi) {
      generalAdvice = "We do not yet pull live road data for Wisconsin · check WisDOT's 511 Wisconsin (511wi.gov) for closures, cameras and winter road conditions. Wisconsin has no passenger chain or winter-tire mandate; chains are permitted when conditions require them and studded tires are restricted for most passenger vehicles. No avalanche authority is needed here: Wisconsin ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://511wi.gov/";
    } else if (isUsWv) {
      generalAdvice = "We do not yet pull live road data for West Virginia · check WVDOT's WV 511 (wv511.org) for closures, cameras and winter conditions. There is no standing statewide passenger chain mandate; any restriction is conditions-triggered and posted. No avalanche authority is needed here: the state’s groomed Appalachian ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://wv511.org/";
    } else if (isUsNc) {
      generalAdvice = "We do not yet pull live road data for North Carolina · check NCDOT's DriveNC (drivenc.gov) for closures, cameras and winter conditions. North Carolina has no standing statewide passenger chain mandate, though resort-adjacent mountain villages may impose local activated restrictions. No avalanche authority is needed here: the state’s groomed Southern Appalachian ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://www.drivenc.gov/";
    } else if (isUsVa) {
      generalAdvice = "We do not yet pull live road data for Virginia · check VDOT's 511 Virginia (511.vdot.virginia.gov) for closures, cameras and winter conditions. Virginia has no standing statewide passenger chain mandate; localities may impose snow-route restrictions. No avalanche authority is needed here: the state’s groomed terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://511.vdot.virginia.gov/";
    } else if (isUsNv) {
      generalAdvice = "We do not yet pull live road data for Nevada · check NDOT's Nevada 511 (nvroads.com) for closures, cameras and Sierra-pass chain controls. There is no fixed chain season, but NDOT can require traction devices on signed highways during storms. Sierra Avalanche Center covers the Nevada side of Tahoe, including Diamond Peak; consult its forecast for avalanche terrain.";
      liveTrafficUrl = "https://www.nvroads.com/roadconditions";
    } else if (isUsAz) {
      generalAdvice = "We do not yet pull live road data for Arizona · check ADOT's AZ511 (az511.gov) for closures and storm-triggered Chains or 4WD Required restrictions. Arizona has no formal avalanche center, but Snowbowl’s Upper Bowl has real informal avalanche-terrain risk; follow local patrol and closure guidance.";
      liveTrafficUrl = "https://az511.gov/";
    } else if (isUsSd) {
      generalAdvice = "We do not yet pull live road data for South Dakota · check SDDOT's SD511 (sd511.org; it supersedes SafeTravelUSA) for closures and winter restrictions. South Dakota can activate traction restrictions on signed highways in storms, especially in the Black Hills. No avalanche authority is needed here: Black Hills ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://sd511.org/";
    } else if (isUsAk) {
      generalAdvice = "We do not yet pull live road data for Alaska · check Alaska DOT&PF's Alaska 511 (511.alaska.gov) for closures and winter conditions. The Seward Highway has a documented avalanche-closure history and is Alyeska’s key Anchorage access route; consult CNFAIC for Turnagain Pass/Girdwood avalanche forecasts. Eaglecrest/Juneau has no road connection to the contiguous highway system, so ferry or air access is required rather than a driving route.";
      liveTrafficUrl = "https://511.alaska.gov/";
    } else if (isUsCt) {
      generalAdvice = "We do not yet pull live road data for Connecticut · check ConnDOT's CT Roads (ctroads.org) for closures, cameras and winter conditions. Connecticut has no standing passenger chain or winter-tire mandate; ctroads.org—not CT511.com—is the current consumer-facing road tool. No avalanche authority is needed here: the state’s low-elevation ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://ctroads.org/";
    } else if (isUsNj) {
      generalAdvice = "We do not yet pull live road data for New Jersey · check NJDOT's 511NJ (511nj.org) for closures, cameras and winter conditions. New Jersey has no standing passenger chain or winter-tire mandate; chains may be used when roads are actually slippery. No avalanche authority is needed here: the state’s low-elevation ski terrain has no meaningful avalanche hazard.";
      liveTrafficUrl = "https://511nj.org/";
    } else if (isUsNm) {
      // No live New Mexico road feed is wired yet - say so plainly rather
      // than shipping an empty list that reads like "all clear". New
      // Mexico has NO statewide chain law for passenger vehicles - NMSA
      // 1978 Section 66-3-847 permits but does not require chains or
      // studded tires - so this is a genuine, permanent absence of a
      // chain law, same posture as Vermont/Montana. The Taos Avalanche
      // Center covers only the Taos region (the mountains surrounding
      // Taos); Angel Fire, Santa Fe and Albuquerque/Sandia Peak have NO
      // dedicated avalanche-forecasting authority - stated explicitly
      // rather than pointing at the Taos Avalanche Center, which does
      // not actually extend there.
      const taosRegionCoverage = region === "taos";
      generalAdvice = taosRegionCoverage
        ? "We do not yet pull live road data for New Mexico \u00b7 check NMDOT's nmroads.com (or dial 511) for closures and highway cameras before you drive, especially on NM-150, the narrow, steep, switchback sole access road to Taos Ski Valley. New Mexico has no statewide chain law for passenger vehicles (NMSA 1978 Section 66-3-847 permits but does not require chains or studded snow tires); winter/snow tyres and 4WD/AWD are strongly recommended on NM-150. For backcountry conditions, read the day's forecast from the Taos Avalanche Center at taosavalanchecenter.org."
        : "We do not yet pull live road data for New Mexico \u00b7 check NMDOT's nmroads.com (or dial 511) for closures and highway cameras before you drive. New Mexico has no statewide chain law for passenger vehicles (NMSA 1978 Section 66-3-847 permits but does not require chains or studded snow tires); winter/snow tyres are strongly recommended on mountain approaches. \u26a0\ufe0f This region has no dedicated backcountry avalanche-forecasting authority \u2014 the Taos Avalanche Center's coverage does not extend here, so no avalanche-bulletin link is offered rather than pointing at one that doesn't apply.";
      liveTrafficUrl = "https://www.nmroads.com/mapIndex.html";
    } else if (isUsOr) {
      // No live Oregon road feed is wired yet - say so plainly rather than
      // shipping an empty list that reads like "all clear". Oregon has a
      // BROAD, MANDATORY, STATEWIDE traction/chain law (ORS 815.045/
      // 815.140/815.142/815.145 + OAR 734-017) applying to ALL vehicles
      // when ODOT posts a chain-up zone - the opposite posture from
      // Vermont/Montana/New Mexico's genuinely-no-chain-law states, and
      // broader than Colorado's 2WD-only "must-carry" clause. Bend/Mt.
      // Bachelor is covered by the smaller, volunteer-run Central Oregon
      // Avalanche Center (COAC) rather than NWAC - flagged as a
      // different/lesser-resourced authority, not a coverage gap.
      const coacRegion = region === "bend";
      generalAdvice = coacRegion
        ? "We do not yet pull live road data for Oregon \u00b7 check ODOT's TripCheck (tripcheck.com) for closures, chain-up zones and highway cameras before you drive, especially on Cascade Lakes Highway (OR-372). Oregon has a statewide mandatory traction/chain law (ORS 815.045/815.140/815.142/815.145 + OAR 734-017): when ODOT posts a \"chains required\" zone, ALL vehicles - not just trucks - must have traction tires fitted or carry chains, with escalation to chains-on-every-vehicle possible in severe storms. \u26a0\ufe0f Avalanche forecasting here comes from the smaller, volunteer-run Central Oregon Avalanche Center (COAC) at coavalanche.org, not the better-resourced NWAC that covers Mt. Hood."
        : "We do not yet pull live road data for Oregon \u00b7 check ODOT's TripCheck (tripcheck.com) for closures, chain-up zones and highway cameras before you drive, especially on US-26 over Mt. Hood. Oregon has a statewide mandatory traction/chain law (ORS 815.045/815.140/815.142/815.145 + OAR 734-017): when ODOT posts a \"chains required\" zone, ALL vehicles - not just trucks - must have traction tires fitted or carry chains, with escalation to chains-on-every-vehicle possible in severe storms. For backcountry conditions, read the day's forecast from the Northwest Avalanche Center at nwac.us.";
      liveTrafficUrl = "https://www.tripcheck.com/";
    } else if (isUsWa) {
      // No live Washington road feed is wired yet - say so plainly rather
      // than shipping an empty list that reads like "all clear". Washington
      // has a REAL, storm-activated, escalating-tier traction requirement
      // (RCW 47.36.250 + WAC 204-24-040/050), most active on I-90
      // (Snoqualmie Pass) and US-2 (Stevens Pass), WSDOT's two primary
      // avalanche-control corridors. NWAC covers all four Washington
      // regions in this pass.
      generalAdvice =
        "We do not yet pull live road data for Washington \u00b7 check WSDOT's real-time mountain pass page (wsdot.com/travel/real-time/mountainpasses) or dial 511 for closures, chain requirements and highway cameras before you drive, especially over Snoqualmie Pass (I-90) and Stevens Pass (US-2), WSDOT's two primary avalanche-control corridors. WSDOT can post an escalating traction-tire/chain requirement (RCW 47.36.250) on any state highway when conditions warrant, up to chains on ALL vehicles including 4WD/AWD in the most severe cases - this is storm-activated, not a fixed calendar rule. For backcountry conditions, read the day's forecast from the Northwest Avalanche Center at nwac.us.";
      liveTrafficUrl = "https://wsdot.com/travel/real-time/mountainpasses";

    } else if (isUsNh) {
      generalAdvice = region === "white-mountains"
        ? "We do not yet pull live road data for New Hampshire · check NHDOT's real-time travel page or regional New England 511 (newengland511.org) for closures and cameras before you drive. New Hampshire has no broad mandatory chain law for passenger vehicles. N.H. Admin. Code § Saf-C 1312.17 is a narrow snow-tire vehicle-inspection/equipment provision (Nov 15-Apr 15 unless all-season radials), not a general roadside chain-up rule; winter tyres and AWD/4WD are strongly recommended. For Tuckerman/Huntington Ravines and Presidential Range backcountry near Wildcat/Pinkham Notch, read the real daily Mount Washington Avalanche Center forecast at mountwashingtonavalanchecenter.org; it does not describe ordinary in-bounds resort terrain."
        : "We do not yet pull live road data for New Hampshire · check NHDOT's real-time travel page or regional New England 511 (newengland511.org) for closures and cameras before you drive. New Hampshire has no broad mandatory chain law for passenger vehicles. N.H. Admin. Code § Saf-C 1312.17 is a narrow snow-tire vehicle-inspection/equipment provision (Nov 15-Apr 15 unless all-season radials), not a general roadside chain-up rule; winter tyres and AWD/4WD are strongly recommended. Mount Washington Avalanche Center's daily forecasts cover the Presidential Range/Tuckerman backcountry near Wildcat, not the in-bounds terrain in this region."
      liveTrafficUrl = "https://newengland511.org/Home/Index";
    } else if (isUsMe) {
      generalAdvice = "We do not yet pull live Maine road data · check MaineDOT / New England 511 for closures, cameras and storm conditions before travelling. Maine has no mandatory chain law: 29-A M.R.S. §2381 permits chains when roads are snow-covered or slippery, but never requires them; winter tyres and AWD/4WD are strongly recommended. Maine has no dedicated avalanche forecast or observation authority, so no avalanche bulletin is linked for these lift-served resort areas.";
      liveTrafficUrl = "https://newengland511.org/";
    } else if (isUsNy) {
      generalAdvice = "We do not yet pull live New York road data · check NYSDOT / 511NY (511ny.org) for closures, cameras and storm conditions before travelling. New York has no general chain or winter-tire mandate; V&T §145-c can apply only on a specifically declared snow-emergency route, not as a standing ski-road rule. Winter tyres and AWD/4WD are strongly recommended. No dedicated daily avalanche authority covers New York resort terrain; DEC issues only irregular Adirondack High Peaks backcountry advisories, not an in-bounds resort bulletin.";
      liveTrafficUrl = "https://511ny.org/";
    } else if (isUsId) {
      // No live Idaho road feed is wired yet - say so plainly rather than
      // shipping an empty list that reads like "all clear". Idaho has a
      // NARROW, commercial-vehicle-only chain law (Idaho Code Section
      // 49-948) on three named northern passes that do not sit on any of
      // these four regions' direct access roads - a genuine, permanent
      // absence of a chain-law requirement for ordinary passenger vehicles
      // here, same posture as Vermont/Montana/New Mexico. Avalanche
      // coverage is split three ways (Sawtooth/Sun Valley, Idaho
      // Panhandle/Sandpoint, Payette/Donnelly-McCall); Boise/Bogus Basin
      // has NO avalanche zone actually centered on it - stated explicitly
      // as a coverage gap rather than pointing at Sawtooth's nominal
      // regional authority, whose nearest real zones are 56+ miles away.
      const sacRegion = region === "sun-valley";
      const ipacRegion = region === "sandpoint";
      const pacRegion = region === "donnelly-mccall";
      generalAdvice = sacRegion
        ? "We do not yet pull live road data for Idaho \u00b7 check Idaho 511 (511.idaho.gov) for closures and highway cameras before you drive. Idaho's chain law (Idaho Code Section 49-948) applies only to commercial vehicles on three named northern passes, none of which sit on this route - ordinary passenger vehicles have no chain requirement here. Winter/snow tyres are strongly recommended; studded tires are legal Oct 1-Apr 30. For backcountry conditions, read the day's forecast from the Sawtooth Avalanche Center at sawtoothavalanche.com."
        : ipacRegion
          ? "We do not yet pull live road data for Idaho \u00b7 check Idaho 511 (511.idaho.gov) for closures and highway cameras before you drive. Idaho's chain law (Idaho Code Section 49-948) applies only to commercial vehicles on three named northern passes; ordinary passenger vehicles taking the direct US-95 approach from Sandpoint have no chain requirement. Winter/snow tyres are strongly recommended; studded tires are legal Oct 1-Apr 30. For backcountry conditions, read the day's forecast from the Idaho Panhandle Avalanche Center at idahopanhandleavalanche.org."
          : pacRegion
            ? "We do not yet pull live road data for Idaho \u00b7 check Idaho 511 (511.idaho.gov) for closures and highway cameras before you drive. Idaho's chain law (Idaho Code Section 49-948) applies only to commercial vehicles on three named northern passes, none of which sit on this route - ordinary passenger vehicles have no chain requirement here. Winter/snow tyres are strongly recommended; studded tires are legal Oct 1-Apr 30. For backcountry conditions, read the day's forecast from the Payette Avalanche Center covering the McCall/Donnelly area."
            : "We do not yet pull live road data for Idaho \u00b7 check Idaho 511 (511.idaho.gov) for closures and highway cameras before you drive. Idaho's chain law (Idaho Code Section 49-948) applies only to commercial vehicles on three named northern passes, none of which sit on this route - ordinary passenger vehicles have no chain requirement here. Winter/snow tyres are strongly recommended; studded tires are legal Oct 1-Apr 30. \u26a0\ufe0f This region has no avalanche-forecast zone actually centered on it - the nearest Sawtooth Avalanche Center zones (Sawtooth & Western Smoky Mtns, Banner Summit) are 56+ miles away, so no close-by avalanche-bulletin link is offered here rather than pointing at one that doesn't really cover the Boise Front.";
      liveTrafficUrl = "https://511.idaho.gov/";
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
