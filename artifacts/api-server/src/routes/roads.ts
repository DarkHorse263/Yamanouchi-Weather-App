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
        region === "whistler" || region === "powder-highway"
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
