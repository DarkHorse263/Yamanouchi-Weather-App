import { Router, type IRouter } from "express";
import { getSupabase } from "../lib/supabase.js";
import { getLiveWeather, getWeatherForRegion } from "../lib/weather-service.js";
import {
  GetDashboardResponse,
  GetResortsResponse,
  GetMapDataResponse,
  GetSnowOutlookResponse,
  GetPowderAlertsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Fallback resort data (used when Supabase is not yet connected)
const FALLBACK_RESORTS = [
  { id: "shiga-kumanoyu", name: "Shiga Kogen Kumanoyu Ski Area", nameJa: "志賀高原熊の湯スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 189, temp: -2.4, wind: 4.3, snowTomorrow: 0, snowScore: 85, rank: 1, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8100, lng: 138.5050, elevation: 1830, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-giant", name: "Shiga Kogen Giant Ski Area", nameJa: "志賀高原ジャイアントスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 177, temp: -1.9, wind: 4.0, snowTomorrow: 0, snowScore: 72, rank: 2, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7983, lng: 138.5236, elevation: 1800, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-okushiga", name: "Okushiga Kogen Ski Area", nameJa: "奥志賀高原スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 190, temp: -2.8, wind: 5.5, snowTomorrow: 0, snowScore: 80, rank: 3, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8150, lng: 138.5020, elevation: 1860, websiteUrl: "https://okushiga.jp" },
  { id: "shiga-yakedake", name: "Shiga Kogen Yakedake Ski Area", nameJa: "志賀高原焼額山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 185, temp: -2.5, wind: 5.0, snowTomorrow: 0, snowScore: 76, rank: 4, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8050, lng: 138.5000, elevation: 1840, websiteUrl: "https://www.princehotels.com/en/ski/shiga_kogen/resort.html" },
  { id: "shiga-terakoya", name: "Shiga Kogen Terakoya Ski Area", nameJa: "志賀高原寺子屋スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 180, temp: -2.3, wind: 4.0, snowTomorrow: 0, snowScore: 74, rank: 5, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8000, lng: 138.5050, elevation: 1820, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-takamagahara", name: "Shiga Kogen Takamagahara Ski Area", nameJa: "志賀高原高天ヶ原スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 175, temp: -2.2, wind: 4.3, snowTomorrow: 0, snowScore: 73, rank: 6, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7940, lng: 138.5180, elevation: 1810, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-hasuike", name: "Shiga Kogen Hasuike Ski Area", nameJa: "志賀高原蓮池スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 160, temp: -1.5, wind: 5.2, snowTomorrow: 0, snowScore: 68, rank: 7, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7850, lng: 138.5150, elevation: 1750, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-ichinose-diamond", name: "Shiga Kogen Ichinose Diamond Ski Area", nameJa: "志賀高原一の瀬ダイヤモンドスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 170, temp: -2.1, wind: 4.1, snowTomorrow: 0, snowScore: 71, rank: 8, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7970, lng: 138.5210, elevation: 1795, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-ichinose-family", name: "Shiga Kogen Ichinose Family Ski Area", nameJa: "志賀高原一の瀬ファミリースキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 165, temp: -2.0, wind: 3.8, snowTomorrow: 0, snowScore: 70, rank: 9, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7960, lng: 138.5200, elevation: 1790, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-maruyama", name: "Shiga Kogen Maruyama Ski Area", nameJa: "志賀高原丸山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 172, temp: -2.0, wind: 4.1, snowTomorrow: 0, snowScore: 72, rank: 10, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7995, lng: 138.5080, elevation: 1800, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-sunvalley", name: "Shiga Kogen Sun Valley Ski Area", nameJa: "志賀高原サンバレースキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 155, temp: -1.7, wind: 4.8, snowTomorrow: 0, snowScore: 65, rank: 11, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7920, lng: 138.5100, elevation: 1760, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-yoryu", name: "Shiga Kogen Yoryu Ski Area", nameJa: "志賀高原よろず山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 163, temp: -1.7, wind: 3.7, snowTomorrow: 0, snowScore: 68, rank: 12, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7910, lng: 138.5190, elevation: 1775, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-higashi", name: "Shiga Kogen Higashi-Tateyama Ski Area", nameJa: "志賀高原東館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 168, temp: -1.9, wind: 4.2, snowTomorrow: 0, snowScore: 69, rank: 13, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7900, lng: 138.5170, elevation: 1780, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-nishi", name: "Shiga Kogen Nishi-Tateyama Ski Area", nameJa: "志賀高原西館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 162, temp: -1.8, wind: 4.5, snowTomorrow: 0, snowScore: 67, rank: 14, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7880, lng: 138.5160, elevation: 1770, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-tannenbaum", name: "Shiga Kogen Tannenbaum Ski Area", nameJa: "志賀高原タンネの森スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 158, temp: -1.6, wind: 3.9, snowTomorrow: 0, snowScore: 66, rank: 15, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7870, lng: 138.5140, elevation: 1760, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-jii", name: "Shiga Kogen Jii-no-ike Ski Area", nameJa: "志賀高原爺ケ岳スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 156, temp: -1.5, wind: 3.6, snowTomorrow: 0, snowScore: 65, rank: 16, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7865, lng: 138.5130, elevation: 1755, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "shiga-yakebitai", name: "Shiga Kogen Yakebitai Ski Area", nameJa: "志賀高原焼額山第2スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 183, temp: -2.4, wind: 4.9, snowTomorrow: 0, snowScore: 75, rank: 17, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8040, lng: 138.5010, elevation: 1835, websiteUrl: "https://www.princehotels.com/en/ski/shiga_kogen/resort.html" },
  { id: "shiga-okushiga-villa", name: "Shiga Kogen Okushiga Villa Ski Area", nameJa: "志賀高原奥志賀ヴィラスキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 188, temp: -2.7, wind: 5.3, snowTomorrow: 0, snowScore: 79, rank: 18, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.8140, lng: 138.5030, elevation: 1855, websiteUrl: "https://www.okushiga.jp" },
  { id: "shiga-nishi-tateyama", name: "Shiga Kogen Nishi Tateyama", nameJa: "志賀高原西館山スキー場", region: "Shiga Kogen", regionJa: "志賀高原", snow24h: 0, baseDepth: 160, temp: -1.8, wind: 4.0, snowTomorrow: 0, snowScore: 67, rank: 19, weatherStation: "Shiga Kogen Primary", sourceUpdatedAt: null, lat: 36.7875, lng: 138.5155, elevation: 1768, websiteUrl: "https://www.shigakogen-ski.or.jp/english/index.php" },
  { id: "ryuoo", name: "Ryuoo Ski Park", nameJa: "竜王スキーパーク", region: "Ryuoo", regionJa: "竜王", snow24h: 0, baseDepth: 120, temp: -0.8, wind: 2.5, snowTomorrow: 0, snowScore: 55, rank: 20, weatherStation: "Ryuoo", sourceUpdatedAt: null, lat: 36.6780, lng: 138.2700, elevation: 1100, websiteUrl: "https://www.ryuoo.com/en/" },
  { id: "yomase", name: "Yomase Onsen Ski Area", nameJa: "夜間瀬温泉スキー場", region: "Yomase", regionJa: "夜間瀬", snow24h: 0, baseDepth: 100, temp: -0.5, wind: 2.0, snowTomorrow: 0, snowScore: 48, rank: 21, weatherStation: "Yomase", sourceUpdatedAt: null, lat: 36.7200, lng: 138.3500, elevation: 900, websiteUrl: "https://www.kitashiga.co.jp/" },
];

// Map a Supabase yamanouchi_resorts_today row to our Resort schema
// Column names come from the Swift models (snake_case): resort_id, name, cluster, snow_24h_cm,
// snow_depth_cm, temp_now_c, wind_kmh, expected_snow_tomorrow_cm, latitude, longitude, elevation_m,
// station_name, last_updated_at, source
function mapResortRow(r: Record<string, unknown>, idx: number) {
  const fallback = FALLBACK_RESORTS[idx] || FALLBACK_RESORTS[0];
  const resortName = String(r.name || fallback.name);
  const matched = FALLBACK_RESORTS.find(f => f.name === resortName) || fallback;
  return {
    id: String(r.resort_id || r.id || fallback.id),
    name: resortName,
    nameJa: matched.nameJa ?? null,
    region: String(r.cluster || r.region || fallback.region),
    regionJa: matched.regionJa ?? null,
    snow24h: r.snow_24h_cm !== undefined && r.snow_24h_cm !== null ? Number(r.snow_24h_cm) : null,
    baseDepth: r.snow_depth_cm !== undefined && r.snow_depth_cm !== null ? Number(r.snow_depth_cm) : null,
    temp: r.temp_now_c !== undefined && r.temp_now_c !== null ? Number(r.temp_now_c) : null,
    wind: r.wind_kmh !== undefined && r.wind_kmh !== null ? Number(r.wind_kmh) : null,
    snowTomorrow: r.expected_snow_tomorrow_cm !== undefined && r.expected_snow_tomorrow_cm !== null ? Number(r.expected_snow_tomorrow_cm) : null,
    snowScore: null,
    rank: idx + 1,
    weatherStation: r.station_name ? String(r.station_name) : null,
    sourceUpdatedAt: r.last_updated_at ? String(r.last_updated_at) : null,
    lat: r.latitude !== undefined && r.latitude !== null ? Number(r.latitude) : (fallback.lat ?? null),
    lng: r.longitude !== undefined && r.longitude !== null ? Number(r.longitude) : (fallback.lng ?? null),
    elevation: r.elevation_m !== undefined && r.elevation_m !== null ? Number(r.elevation_m) : null,
    websiteUrl: matched.websiteUrl ?? null,
  };
}

/** Normalize cluster/region names from Supabase to canonical form (e.g. "Shiga Kogen region" → "Shiga Kogen") */
function normalizeRegion(raw: string): string {
  return raw.replace(/\s+region$/i, "").trim();
}

/** Apply live Open-Meteo/JMA weather data to a list of resorts — only overrides if Supabase data is missing */
async function applyLiveWeather<T extends { region: string; temp: number | null; wind: number | null; snow24h: number | null; snowTomorrow: number | null }>(
  resorts: T[],
  force = false
): Promise<T[]> {
  try {
    const live = await getLiveWeather();
    return resorts.map(r => {
      const normalized = normalizeRegion(r.region);
      const w = getWeatherForRegion(normalized, live);
      if (!w) return { ...r, region: normalized };
      // Only override fields that are missing from the source data (unless forced)
      const needsTemp   = force || r.temp === null || r.temp === undefined;
      const needsWind   = force || r.wind === null || r.wind === undefined;
      const needsSnow   = force || r.snow24h === null || r.snow24h === undefined;
      const needsTomrow = force || r.snowTomorrow === null || r.snowTomorrow === undefined;
      return {
        ...r,
        region: normalized,
        temp:         needsTemp   ? w.temp         : r.temp,
        wind:         needsWind   ? w.wind         : r.wind,
        snow24h:      needsSnow   ? w.snow24h      : r.snow24h,
        snowTomorrow: needsTomrow ? w.snowTomorrow : r.snowTomorrow,
      };
    });
  } catch (err) {
    console.warn("Live weather fetch failed, using source values:", err);
    return resorts.map(r => ({ ...r, region: normalizeRegion(r.region) }));
  }
}

function buildDashboardFromResorts(resorts: ReturnType<typeof mapResortRow>[]) {
  const temps = resorts.filter(r => r.temp !== null).map(r => r.temp as number);
  const winds = resorts.filter(r => r.wind !== null).map(r => r.wind as number);
  const snows = resorts.filter(r => r.snow24h !== null).map(r => r.snow24h as number);
  const bases = resorts.filter(r => r.baseDepth !== null).map(r => r.baseDepth as number);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const maxArr = (arr: number[]) => arr.length ? Math.max(...arr) : null;

  const now = new Date();
  const nextUpdate = new Date(now);
  nextUpdate.setMinutes(Math.ceil((now.getMinutes() + 1) / 60) * 60, 0, 0);

  const bestResort = [...resorts].sort((a, b) => (b.baseDepth ?? 0) - (a.baseDepth ?? 0))[0] || resorts[0];

  const regionGroups = [
    { name: "Shiga Kogen", nameJa: "志賀高原" },
    { name: "Ryuoo", nameJa: "竜王" },
    { name: "Yomase", nameJa: "夜間瀬" },
  ].map(({ name, nameJa }) => {
    const rs = resorts.filter(r => r.region === name);
    return {
      name, nameJa,
      resortCount: rs.length,
      avgTemp: avg(rs.map(r => r.temp as number).filter(v => v !== null)),
      topSnow: maxArr(rs.map(r => r.snow24h as number).filter(v => v !== null)),
      bestBase: maxArr(rs.map(r => r.baseDepth as number).filter(v => v !== null)),
    };
  });

  return {
    updatedAt: now.toISOString(),
    liveTime: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    nextUpdate: nextUpdate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    totalSkiAreas: resorts.length,
    avgTemp: avg(temps) !== null ? Math.round((avg(temps) as number) * 10) / 10 : null,
    avgWind: avg(winds) !== null ? Math.round((avg(winds) as number) * 10) / 10 : null,
    topSnow24h: maxArr(snows),
    bestBase: maxArr(bases),
    bestResort,
    regions: regionGroups,
  };
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  if (!supabase) {
    const base = FALLBACK_RESORTS.map((r) => ({ ...r })) as ReturnType<typeof mapResortRow>[];
    const mapped = await applyLiveWeather(base);
    const dashboard = buildDashboardFromResorts(mapped);
    res.json(GetDashboardResponse.parse(dashboard));
    return;
  }

  try {
    const { data } = await supabase.from("yamanouchi_resorts_today").select("*");

    const supabaseResorts = await applyLiveWeather(
      (data || []).map(mapResortRow) as ReturnType<typeof mapResortRow>[]
    );

    // Supplement with fallback data for any regions missing from Supabase
    const presentRegions = new Set(supabaseResorts.map(r => r.region));
    const supplemental = await applyLiveWeather(
      FALLBACK_RESORTS
        .filter(r => !presentRegions.has(normalizeRegion(r.region)))
        .map(r => ({ ...r })) as ReturnType<typeof mapResortRow>[],
      true // force live weather on fallback entries
    );

    const resorts = [...supabaseResorts, ...supplemental];
    const dashboard = buildDashboardFromResorts(resorts);
    res.json(GetDashboardResponse.parse(dashboard));
  } catch (err) {
    console.error("Dashboard error:", err);
    const base = FALLBACK_RESORTS.map((r) => ({ ...r })) as ReturnType<typeof mapResortRow>[];
    const mapped = await applyLiveWeather(base, true);
    const dashboard = buildDashboardFromResorts(mapped);
    res.json(GetDashboardResponse.parse(dashboard));
  }
});

router.get("/resorts", async (_req, res): Promise<void> => {
  const supabase = getSupabase();

  if (!supabase) {
    const base = FALLBACK_RESORTS.map((r) => ({ ...r })) as ReturnType<typeof mapResortRow>[];
    const resorts = await applyLiveWeather(base);
    res.json(GetResortsResponse.parse(resorts));
    return;
  }

  try {
    const { data, error } = await supabase
      .from("yamanouchi_resorts_today")
      .select("*");

    if (error) throw error;

    const supabaseResorts = await applyLiveWeather((data || []).map(mapResortRow));
    const presentRegions = new Set(supabaseResorts.map(r => r.region));
    const supplemental = await applyLiveWeather(
      FALLBACK_RESORTS
        .filter(r => !presentRegions.has(normalizeRegion(r.region)))
        .map(r => ({ ...r })) as ReturnType<typeof mapResortRow>[],
      true
    );
    res.json(GetResortsResponse.parse([...supabaseResorts, ...supplemental]));
  } catch (err) {
    console.error("Resorts error:", err);
    const base = FALLBACK_RESORTS.map((r) => ({ ...r })) as ReturnType<typeof mapResortRow>[];
    res.json(GetResortsResponse.parse(await applyLiveWeather(base, true)));
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
  let resorts: ReturnType<typeof mapResortRow>[] = FALLBACK_RESORTS.map((r) => ({ ...r })) as ReturnType<typeof mapResortRow>[];

  if (supabase) {
    try {
      const { data } = await supabase.from("yamanouchi_resorts_today").select("*");
      if (data && data.length > 0) {
        resorts = data.map(mapResortRow);
      }
    } catch (err) {
      console.error("Map error:", err);
    }
  }

  const markers = resorts
    .filter(r => r.lat !== null && r.lat !== undefined && r.lng !== null && r.lng !== undefined)
    .map(r => {
      const snow = r.snow24h ?? 0;
      const snowLevel = snow > 15 ? "heavy" : snow > 5 ? "moderate" : snow > 0 ? "light" : "none";
      return {
        id: r.id,
        name: r.name,
        nameJa: r.nameJa ?? null,
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

  let fallbackOutlook = [
    { region: "Shiga Kogen", regionJa: "志賀高原", rank: 1, signal: "Conditions at Shiga Kogen", snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
    { region: "Ryuoo",       regionJa: "竜王",   rank: 2, signal: "Conditions at Ryuoo",        snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
    { region: "Yomase",      regionJa: "夜間瀬", rank: 3, signal: "Conditions at Yomase",       snow24h: 0, snow48h: 0, snow72h: 0, level: "None" as const, updatedAt: new Date().toISOString() },
  ];

  try {
    const live = await getLiveWeather();
    fallbackOutlook = fallbackOutlook.map(o => {
      const w = getWeatherForRegion(o.region, live);
      if (!w) return o;
      const total = w.snow24h + w.snowTomorrow;
      let level: typeof o.level = "None";
      if (total >= 40) level = "Extreme";
      else if (total >= 20) level = "High";
      else if (total >= 10) level = "Moderate";
      else if (total > 0) level = "Low";
      const signal = w.snow24h > 0
        ? `${w.snow24h}cm fresh · ${w.temp}°C · ${w.wind}km/h`
        : `${w.temp}°C · ${w.wind}km/h · No fresh snow`;
      return { ...o, snow24h: w.snow24h, snow48h: w.snowTomorrow, snow72h: w.snowTomorrow, level, signal };
    });
  } catch (_) { /* keep defaults */ }

  if (!supabase) {
    res.json(GetSnowOutlookResponse.parse(fallbackOutlook));
    return;
  }

  try {
    // yamanouchi_storms_today columns (from Swift): cluster, snow_24h_cm, snow_48h_cm, snow_72h_cm, storm_level, headline, storm_rank
    const { data, error } = await supabase
      .from("yamanouchi_storms_today")
      .select("*")
      .order("storm_rank", { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      res.json(GetSnowOutlookResponse.parse(fallbackOutlook));
      return;
    }

    const outlook = data.map((r: Record<string, unknown>, idx: number) => {
      const snow24h = r.snow_24h_cm !== undefined && r.snow_24h_cm !== null ? Number(r.snow_24h_cm) : 0;
      const snow48h = r.snow_48h_cm !== undefined && r.snow_48h_cm !== null ? Number(r.snow_48h_cm) : 0;
      const snow72h = r.snow_72h_cm !== undefined && r.snow_72h_cm !== null ? Number(r.snow_72h_cm) : 0;
      const stormLevel = String(r.storm_level || "");
      let level: "None" | "Low" | "Moderate" | "High" | "Extreme" = "None";
      if (stormLevel.toLowerCase().includes("strong") || stormLevel.toLowerCase().includes("extreme")) level = "Extreme";
      else if (stormLevel.toLowerCase().includes("high")) level = "High";
      else if (stormLevel.toLowerCase().includes("moderate")) level = "Moderate";
      else if (stormLevel.toLowerCase().includes("light") || stormLevel.toLowerCase().includes("low")) level = "Low";
      else {
        const total = snow24h + snow48h + snow72h;
        if (total >= 40) level = "Extreme";
        else if (total >= 20) level = "High";
        else if (total >= 10) level = "Moderate";
        else if (total > 0) level = "Low";
      }

      return {
        region: String(r.cluster || r.region || `Region ${idx + 1}`),
        regionJa: "志賀高原",
        rank: r.storm_rank !== undefined && r.storm_rank !== null ? Number(r.storm_rank) : (idx + 1),
        signal: String(r.headline || `${level} snow signal across the area`),
        snow24h,
        snow48h,
        snow72h,
        level,
        updatedAt: new Date().toISOString(),
      };
    });

    res.json(GetSnowOutlookResponse.parse(outlook));
  } catch (err) {
    console.error("Outlook error:", err);
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
    // powder_alerts_today columns (from Swift): id, report_date, resort_id, name, cluster, alert_type,
    // headline, message, powder_index, powder_probability, expected_snow_cm, created_at
    const [alertsRes, stormRes] = await Promise.all([
      supabase.from("powder_alerts_today").select("*").order("created_at", { ascending: false }),
      supabase.from("yamanouchi_storms_today").select("*").order("storm_rank", { ascending: true }),
    ]);

    const alerts = (alertsRes.data || []).map((a: Record<string, unknown>, idx: number) => {
      const alertType = String(a.alert_type || a.headline || "watch").toLowerCase();
      let alertLevel: "watch" | "warning" | "powder_day" = "watch";
      if (alertType.includes("powder_day") || alertType.includes("powder day")) alertLevel = "powder_day";
      else if (alertType.includes("warning")) alertLevel = "warning";

      return {
        id: String(a.id || `alert-${idx}`),
        resort: String(a.name || a.resort_id || "Yamanouchi"),
        region: String(a.cluster || "Shiga Kogen"),
        expectedSnow: a.expected_snow_cm !== undefined && a.expected_snow_cm !== null ? Number(a.expected_snow_cm) : null,
        alertLevel,
        message: String(a.headline || a.message || "Powder alert issued"),
        messageJa: null,
        issuedAt: String(a.created_at || new Date().toISOString()),
        expiresAt: null,
      };
    });

    const stormTracker = (stormRes.data || []).map((s: Record<string, unknown>, idx: number) => {
      const status = "active" as const;
      return {
        id: String(s.cluster || `storm-${idx}`),
        region: String(s.cluster || "Shiga Kogen"),
        totalSnow: s.snow_72h_cm !== undefined && s.snow_72h_cm !== null ? Number(s.snow_72h_cm) : null,
        peakSnow24h: s.snow_24h_cm !== undefined && s.snow_24h_cm !== null ? Number(s.snow_24h_cm) : null,
        startDate: s.outlook_date ? String(s.outlook_date) : null,
        status,
        description: String(s.headline || `Storm signal for ${s.cluster || "region"}`),
        descriptionJa: null,
      };
    });

    res.json(GetPowderAlertsResponse.parse({ alerts, stormTracker, updatedAt: new Date().toISOString() }));
  } catch (err) {
    console.error("Alerts error:", err);
    res.json(GetPowderAlertsResponse.parse(fallbackAlerts));
  }
});

export default router;
