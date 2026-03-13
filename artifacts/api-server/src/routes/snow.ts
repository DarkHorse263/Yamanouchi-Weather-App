import { Router, type IRouter } from "express";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase.js";
import {
  GetDashboardResponse,
  GetResortsResponse,
  GetMapDataResponse,
  GetSnowOutlookResponse,
  GetPowderAlertsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const FALLBACK_RESORTS = [
  { id: "shiga-giant", name: "Shiga Kogen Giant Ski Area", nameJa: "志賀高原ジャイアントスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 177, temp: -1.9, wind: 4.0, snowTomorrow: 0, snowScore: 72, rank: 1, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7983, lng: 138.5236, elevation: 1800, websiteUrl: "https://www.shigakogen.co.jp" },
  { id: "shiga-kumanoyu", name: "Shiga Kogen Kumanoyu Ski Area", nameJa: "志賀高原熊の湯スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 189, temp: -2.4, wind: 3.5, snowTomorrow: 0, snowScore: 85, rank: 2, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8100, lng: 138.5050, elevation: 1830, websiteUrl: null },
  { id: "shiga-hasuike", name: "Shiga Kogen Hasuike Ski Area", nameJa: "志賀高原蓮池スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 160, temp: -1.5, wind: 5.2, snowTomorrow: 0, snowScore: 68, rank: 3, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7850, lng: 138.5150, elevation: 1750, websiteUrl: null },
  { id: "shiga-sunvalley", name: "Shiga Kogen Sun Valley Ski Area", nameJa: "志賀高原サンバレースキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 155, temp: -1.7, wind: 4.8, snowTomorrow: 0, snowScore: 65, rank: 4, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7920, lng: 138.5100, elevation: 1760, websiteUrl: null },
  { id: "shiga-ichinose-family", name: "Shiga Kogen Ichinose Family Ski Area", nameJa: "志賀高原一の瀬ファミリースキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 165, temp: -2.0, wind: 3.8, snowTomorrow: 0, snowScore: 70, rank: 5, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7960, lng: 138.5200, elevation: 1790, websiteUrl: null },
  { id: "shiga-ichinose-diamond", name: "Shiga Kogen Ichinose Diamond Ski Area", nameJa: "志賀高原一の瀬ダイヤモンドスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 170, temp: -2.1, wind: 4.1, snowTomorrow: 0, snowScore: 71, rank: 6, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7970, lng: 138.5210, elevation: 1795, websiteUrl: null },
  { id: "shiga-takamagahara", name: "Shiga Kogen Takamagahara Ski Area", nameJa: "志賀高原高天ヶ原スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 175, temp: -2.2, wind: 4.3, snowTomorrow: 0, snowScore: 73, rank: 7, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7940, lng: 138.5180, elevation: 1810, websiteUrl: null },
  { id: "shiga-terakoya", name: "Shiga Kogen Terakoya Ski Area", nameJa: "志賀高原寺子屋スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 180, temp: -2.3, wind: 4.0, snowTomorrow: 0, snowScore: 74, rank: 8, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8000, lng: 138.5050, elevation: 1820, websiteUrl: null },
  { id: "shiga-yakedake", name: "Shiga Kogen Yakedake Ski Area", nameJa: "志賀高原焼額山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 185, temp: -2.5, wind: 5.0, snowTomorrow: 0, snowScore: 76, rank: 9, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8050, lng: 138.5000, elevation: 1840, websiteUrl: null },
  { id: "shiga-nishi", name: "Shiga Kogen Nishi-Tateyama Ski Area", nameJa: "志賀高原西館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 162, temp: -1.8, wind: 4.5, snowTomorrow: 0, snowScore: 67, rank: 10, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7880, lng: 138.5160, elevation: 1770, websiteUrl: null },
  { id: "shiga-higashi", name: "Shiga Kogen Higashi-Tateyama Ski Area", nameJa: "志賀高原東館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 168, temp: -1.9, wind: 4.2, snowTomorrow: 0, snowScore: 69, rank: 11, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7900, lng: 138.5170, elevation: 1780, websiteUrl: null },
  { id: "shiga-tannenbaum", name: "Shiga Kogen Tannenbaum Ski Area", nameJa: "志賀高原タンネの森スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 158, temp: -1.6, wind: 3.9, snowTomorrow: 0, snowScore: 66, rank: 12, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7870, lng: 138.5140, elevation: 1760, websiteUrl: null },
  { id: "shiga-maruyama", name: "Shiga Kogen Maruyama Ski Area", nameJa: "志賀高原丸山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 172, temp: -2.0, wind: 4.1, snowTomorrow: 0, snowScore: 72, rank: 13, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7995, lng: 138.5080, elevation: 1800, websiteUrl: null },
  { id: "shiga-yoryu", name: "Shiga Kogen Yoryu Ski Area", nameJa: "志賀高原よろず山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 163, temp: -1.7, wind: 3.7, snowTomorrow: 0, snowScore: 68, rank: 14, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7910, lng: 138.5190, elevation: 1775, websiteUrl: null },
  { id: "shiga-jii", name: "Shiga Kogen Jii-no-ike Ski Area", nameJa: "志賀高原爺ケ岳スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 156, temp: -1.5, wind: 3.6, snowTomorrow: 0, snowScore: 65, rank: 15, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7865, lng: 138.5130, elevation: 1755, websiteUrl: null },
  { id: "shiga-okushiga", name: "Okushiga Kogen Ski Area", nameJa: "奥志賀高原スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 190, temp: -2.8, wind: 5.5, snowTomorrow: 0, snowScore: 80, rank: 16, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8150, lng: 138.5020, elevation: 1860, websiteUrl: "https://okushiga.jp" },
  { id: "shiga-nishi-tateyama", name: "Shiga Kogen Nishi Tateyama", nameJa: "志賀高原西館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 160, temp: -1.8, wind: 4.0, snowTomorrow: 0, snowScore: 67, rank: 17, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.7875, lng: 138.5155, elevation: 1768, websiteUrl: null },
  { id: "shiga-yakebitai", name: "Shiga Kogen Yakebitai Ski Area", nameJa: "志賀高原焼額山第2スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 183, temp: -2.4, wind: 4.9, snowTomorrow: 0, snowScore: 75, rank: 18, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8040, lng: 138.5010, elevation: 1835, websiteUrl: null },
  { id: "shiga-okushiga-villa", name: "Shiga Kogen Okushiga Villa Ski Area", nameJa: "志賀高原奥志賀ヴィラスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 188, temp: -2.7, wind: 5.3, snowTomorrow: 0, snowScore: 79, rank: 19, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: new Date().toISOString(), lat: 36.8140, lng: 138.5030, elevation: 1855, websiteUrl: null },
  { id: "ryuoo", name: "Ryuoo Ski Park", nameJa: "竜王スキーパーク", region: "Ryuoo", regionJa: "竜王", snow24h: 0, baseDepth: 120, temp: -0.8, wind: 2.5, snowTomorrow: 0, snowScore: 55, rank: 20, weatherStation: "Ryuoo", sourceUpdatedAt: new Date().toISOString(), lat: 36.6780, lng: 138.2700, elevation: 1100, websiteUrl: "https://www.ryuoo.com" },
  { id: "yomase", name: "Yomase Onsen Ski Area", nameJa: "夜間瀬温泉スキー場", region: "Yomase", regionJa: "夜間瀬", snow24h: 0, baseDepth: 100, temp: -0.5, wind: 2.0, snowTomorrow: 0, snowScore: 48, rank: 21, weatherStation: "Yomase", sourceUpdatedAt: new Date().toISOString(), lat: 36.7200, lng: 138.3500, elevation: 900, websiteUrl: null },
];

function buildDashboardFromResorts(resorts: typeof FALLBACK_RESORTS) {
  const temps = resorts.filter(r => r.temp !== null).map(r => r.temp as number);
  const winds = resorts.filter(r => r.wind !== null).map(r => r.wind as number);
  const snows = resorts.filter(r => r.snow24h !== null).map(r => r.snow24h as number);
  const bases = resorts.filter(r => r.baseDepth !== null).map(r => r.baseDepth as number);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const max = (arr: number[]) => arr.length ? Math.max(...arr) : null;

  const now = new Date();
  const nextUpdate = new Date(now);
  nextUpdate.setMinutes(Math.ceil(now.getMinutes() / 60) * 60, 0, 0);

  const bestResort = [...resorts].sort((a, b) => (b.snowScore ?? 0) - (a.snowScore ?? 0))[0];

  const regions = [
    { name: "Shiga Kogen", nameJa: "志賀高原", resorts: resorts.filter(r => r.region === "Shiga Kogen") },
    { name: "Ryuoo", nameJa: "竜王", resorts: resorts.filter(r => r.region === "Ryuoo") },
    { name: "Yomase", nameJa: "夜間瀬", resorts: resorts.filter(r => r.region === "Yomase") },
  ].map(({ name, nameJa, resorts: rs }) => ({
    name, nameJa,
    resortCount: rs.length,
    avgTemp: avg(rs.map(r => r.temp as number).filter(Boolean)),
    topSnow: max(rs.map(r => r.snow24h as number).filter(Boolean)),
    bestBase: max(rs.map(r => r.baseDepth as number).filter(Boolean)),
  }));

  return {
    updatedAt: now.toISOString(),
    liveTime: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    nextUpdate: nextUpdate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    totalSkiAreas: resorts.length,
    avgTemp: avg(temps) !== null ? Math.round((avg(temps) as number) * 10) / 10 : null,
    avgWind: avg(winds) !== null ? Math.round((avg(winds) as number) * 10) / 10 : null,
    topSnow24h: max(snows),
    bestBase: max(bases),
    bestResort,
    regions,
  };
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  if (!supabase) {
    const dashboard = buildDashboardFromResorts(FALLBACK_RESORTS);
    res.json(GetDashboardResponse.parse(dashboard));
    return;
  }

  try {
    const { data: resortData } = await supabase
      .from("yamanouchi_resorts_today")
      .select("*");

    const { data: featuredData } = await supabase
      .from("yamanouchi_featured_resorts_today")
      .select("*")
      .limit(1)
      .maybeSingle();

    const resorts = (resortData || FALLBACK_RESORTS).map((r: Record<string, unknown>, idx: number) => ({
      id: String(r.id || r.resort_id || `resort-${idx}`),
      name: String(r.name || r.resort_name || "Unknown Resort"),
      nameJa: r.name_ja ? String(r.name_ja) : null,
      region: String(r.region || r.cluster || "Shiga Kogen"),
      regionJa: r.region_ja ? String(r.region_ja) : null,
      snow24h: r.snow_24h !== undefined ? Number(r.snow_24h) : (r.snow24h !== undefined ? Number(r.snow24h) : null),
      baseDepth: r.base_depth !== undefined ? Number(r.base_depth) : (r.base !== undefined ? Number(r.base) : null),
      temp: r.temperature !== undefined ? Number(r.temperature) : (r.temp !== undefined ? Number(r.temp) : null),
      wind: r.wind_speed !== undefined ? Number(r.wind_speed) : (r.wind !== undefined ? Number(r.wind) : null),
      snowTomorrow: r.snow_tomorrow !== undefined ? Number(r.snow_tomorrow) : null,
      snowScore: r.snow_score !== undefined ? Number(r.snow_score) : (r.score !== undefined ? Number(r.score) : null),
      rank: r.rank !== undefined ? Number(r.rank) : (idx + 1),
      weatherStation: r.station ? String(r.station) : null,
      sourceUpdatedAt: r.updated_at ? String(r.updated_at) : null,
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
      elevation: r.elevation ? Number(r.elevation) : null,
      websiteUrl: r.website_url ? String(r.website_url) : null,
    }));

    const dashboard = buildDashboardFromResorts(resorts as typeof FALLBACK_RESORTS);

    if (featuredData) {
      const featured = featuredData as Record<string, unknown>;
      dashboard.bestResort = {
        id: String(featured.id || featured.resort_id || "featured"),
        name: String(featured.name || featured.resort_name || "Best Resort"),
        nameJa: featured.name_ja ? String(featured.name_ja) : null,
        region: String(featured.region || featured.cluster || "Shiga Kogen"),
        regionJa: featured.region_ja ? String(featured.region_ja) : null,
        snow24h: featured.snow_24h !== undefined ? Number(featured.snow_24h) : null,
        baseDepth: featured.base_depth !== undefined ? Number(featured.base_depth) : null,
        temp: featured.temperature !== undefined ? Number(featured.temperature) : null,
        wind: featured.wind_speed !== undefined ? Number(featured.wind_speed) : null,
        snowTomorrow: null,
        snowScore: featured.snow_score !== undefined ? Number(featured.snow_score) : null,
        rank: 1,
        weatherStation: null,
        sourceUpdatedAt: null,
        lat: null,
        lng: null,
        elevation: null,
        websiteUrl: null,
      } as typeof FALLBACK_RESORTS[0];
    }

    res.json(GetDashboardResponse.parse(dashboard));
  } catch {
    const dashboard = buildDashboardFromResorts(FALLBACK_RESORTS);
    res.json(GetDashboardResponse.parse(dashboard));
  }
});

router.get("/resorts", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  if (!supabase) {
    res.json(GetResortsResponse.parse(FALLBACK_RESORTS));
    return;
  }

  try {
    const { data } = await supabase
      .from("yamanouchi_resorts_today")
      .select("*")
      .order("rank", { ascending: true });

    const resorts = (data || FALLBACK_RESORTS).map((r: Record<string, unknown>, idx: number) => ({
      id: String(r.id || r.resort_id || `resort-${idx}`),
      name: String(r.name || r.resort_name || "Unknown Resort"),
      nameJa: r.name_ja ? String(r.name_ja) : null,
      region: String(r.region || r.cluster || "Shiga Kogen"),
      regionJa: r.region_ja ? String(r.region_ja) : null,
      snow24h: r.snow_24h !== undefined ? Number(r.snow_24h) : null,
      baseDepth: r.base_depth !== undefined ? Number(r.base_depth) : null,
      temp: r.temperature !== undefined ? Number(r.temperature) : null,
      wind: r.wind_speed !== undefined ? Number(r.wind_speed) : null,
      snowTomorrow: r.snow_tomorrow !== undefined ? Number(r.snow_tomorrow) : null,
      snowScore: r.snow_score !== undefined ? Number(r.snow_score) : null,
      rank: Number(r.rank || idx + 1),
      weatherStation: r.station ? String(r.station) : null,
      sourceUpdatedAt: r.updated_at ? String(r.updated_at) : null,
      lat: r.lat ? Number(r.lat) : null,
      lng: r.lng ? Number(r.lng) : null,
      elevation: r.elevation ? Number(r.elevation) : null,
      websiteUrl: r.website_url ? String(r.website_url) : null,
    }));

    res.json(GetResortsResponse.parse(resorts));
  } catch {
    res.json(GetResortsResponse.parse(FALLBACK_RESORTS));
  }
});

router.get("/resorts/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const resort = FALLBACK_RESORTS.find(r => r.id === rawId);
  if (!resort) {
    res.status(404).json({ error: "Resort not found" });
    return;
  }
  res.json(resort);
});

router.get("/map", async (_req, res): Promise<void> => {
  const supabase = getSupabase();
  let resorts = FALLBACK_RESORTS;

  if (supabase) {
    try {
      const { data } = await supabase
        .from("yamanouchi_resorts_today")
        .select("*");
      if (data) resorts = data.map((r: Record<string, unknown>, idx: number) => ({
        ...FALLBACK_RESORTS[idx] || FALLBACK_RESORTS[0],
        id: String(r.id || r.resort_id || `resort-${idx}`),
        name: String(r.name || r.resort_name || "Resort"),
        nameJa: r.name_ja ? String(r.name_ja) : null,
        region: String(r.region || r.cluster || "Shiga Kogen"),
        snow24h: r.snow_24h !== undefined ? Number(r.snow_24h) : 0,
        baseDepth: r.base_depth !== undefined ? Number(r.base_depth) : null,
        rank: Number(r.rank || idx + 1),
      })) as typeof FALLBACK_RESORTS;
    } catch { /* use fallback */ }
  }

  const markers = resorts
    .filter(r => r.lat && r.lng)
    .map(r => {
      const snow = r.snow24h ?? 0;
      const snowLevel = snow > 15 ? "heavy" : snow > 5 ? "moderate" : snow > 0 ? "light" : "none";
      return {
        id: r.id,
        name: r.name,
        nameJa: r.nameJa,
        region: r.region,
        lat: r.lat as number,
        lng: r.lng as number,
        snow24h: r.snow24h,
        baseDepth: r.baseDepth,
        rank: r.rank,
        snowLevel,
      };
    });

  res.json(GetMapDataResponse.parse(markers));
});

router.get("/outlook", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  const fallbackOutlook = [
    { region: "Shiga Kogen", regionJa: "志賀高原", rank: 1, signal: "Moderate snow signal across the area", snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
    { region: "Ryuoo", regionJa: "竜王", rank: 2, signal: "Light snow signal across the area", snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
    { region: "Yomase", regionJa: "夜間瀬", rank: 3, signal: "Light snow signal across the area", snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
  ];

  if (!supabase) {
    res.json(GetSnowOutlookResponse.parse(fallbackOutlook));
    return;
  }

  try {
    const { data } = await supabase
      .from("yamanouchi_storms_today")
      .select("*");

    if (!data || data.length === 0) {
      res.json(GetSnowOutlookResponse.parse(fallbackOutlook));
      return;
    }

    const outlook = data.map((r: Record<string, unknown>, idx: number) => {
      const snow24h = Number(r.snow_24h || r.snow24h || 0);
      const snow48h = Number(r.snow_48h || r.snow48h || 0);
      const snow72h = Number(r.snow_72h || r.snow72h || 0);
      const maxSnow = Math.max(snow24h, snow48h, snow72h);
      const level = maxSnow > 30 ? "Extreme" : maxSnow > 20 ? "High" : maxSnow > 10 ? "Moderate" : maxSnow > 0 ? "Low" : "None";

      return {
        region: String(r.region || r.cluster || "Shiga Kogen"),
        regionJa: r.region_ja ? String(r.region_ja) : "志賀高原",
        rank: Number(r.rank || idx + 1),
        signal: String(r.signal || r.description || `${level} snow signal across the area`),
        snow24h,
        snow48h,
        snow72h,
        level: level as "None" | "Low" | "Moderate" | "High" | "Extreme",
        updatedAt: String(r.updated_at || new Date().toISOString()),
      };
    });

    res.json(GetSnowOutlookResponse.parse(outlook));
  } catch {
    res.json(GetSnowOutlookResponse.parse(fallbackOutlook));
  }
});

router.get("/alerts", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  const fallbackAlerts = {
    alerts: [],
    stormTracker: [],
    updatedAt: new Date().toISOString(),
  };

  if (!supabase) {
    res.json(GetPowderAlertsResponse.parse(fallbackAlerts));
    return;
  }

  try {
    const [alertsRes, stormRes] = await Promise.all([
      supabase.from("powder_alerts_today").select("*"),
      supabase.from("storm_tracker_today").select("*"),
    ]);

    const alerts = (alertsRes.data || []).map((a: Record<string, unknown>, idx: number) => ({
      id: String(a.id || `alert-${idx}`),
      resort: String(a.resort || a.resort_name || "Yamanouchi"),
      region: String(a.region || a.cluster || "Shiga Kogen"),
      expectedSnow: a.expected_snow !== undefined ? Number(a.expected_snow) : null,
      alertLevel: (String(a.level || a.alert_level || "watch")) as "watch" | "warning" | "powder_day",
      message: String(a.message || a.description || "Powder alert issued"),
      messageJa: a.message_ja ? String(a.message_ja) : null,
      issuedAt: String(a.issued_at || a.created_at || new Date().toISOString()),
      expiresAt: a.expires_at ? String(a.expires_at) : null,
    }));

    const stormTracker = (stormRes.data || []).map((s: Record<string, unknown>, idx: number) => ({
      id: String(s.id || `storm-${idx}`),
      region: String(s.region || s.cluster || "Shiga Kogen"),
      totalSnow: s.total_snow !== undefined ? Number(s.total_snow) : null,
      peakSnow24h: s.peak_snow_24h !== undefined ? Number(s.peak_snow_24h) : null,
      startDate: s.start_date ? String(s.start_date) : null,
      status: (String(s.status || "active")) as "active" | "incoming" | "ended",
      description: String(s.description || s.summary || "Storm event"),
      descriptionJa: s.description_ja ? String(s.description_ja) : null,
    }));

    res.json(GetPowderAlertsResponse.parse({ alerts, stormTracker, updatedAt: new Date().toISOString() }));
  } catch {
    res.json(GetPowderAlertsResponse.parse(fallbackAlerts));
  }
});

export default router;
