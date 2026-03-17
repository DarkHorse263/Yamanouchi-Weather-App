import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { Mountain, MapPin, Radar } from "lucide-react";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface ForecastDay {
  date: string;
  dayLabel: string;
  tempMin: number;
  tempMax: number;
  snowfall: number;
  rain: number;
  precipitation: number;
  weatherCode: number;
}

interface MountainOutlook {
  region: string;
  regionJa: string;
  elevation: number;
  temp: number;
  wind: number;
  weatherCode: number;
  snow24h: number;
  forecast: ForecastDay[];
}

interface TownWeather {
  location: string;
  locationJa: string;
  elevation: number;
  temp: number;
  wind: number;
  weatherCode: number;
  forecast: ForecastDay[];
}

interface WeatherOutlook {
  mountains: MountainOutlook[];
  towns: TownWeather[];
  updatedAt: string;
}

// Returns current JST timestamp rounded to 5-minute interval, formatted YYYYMMDDHHMMSS
function jmaTimestamp(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const min = Math.floor(jst.getUTCMinutes() / 5) * 5;
  jst.setUTCMinutes(min, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getUTCFullYear()}${pad(jst.getUTCMonth() + 1)}${pad(jst.getUTCDate())}${pad(jst.getUTCHours())}${pad(min)}00`;
}

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2)  return "⛅";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

function weatherLabel(code: number, ja = false): string {
  const labels: [number, string, string][] = [
    [0,  "Clear",         "快晴"],
    [2,  "Partly Cloudy", "晴れ時々曇り"],
    [3,  "Overcast",      "曇り"],
    [48, "Foggy",         "霧"],
    [55, "Drizzle",       "霧雨"],
    [67, "Rain",          "雨"],
    [77, "Snow",          "雪"],
    [82, "Showers",       "にわか雨"],
    [86, "Snow Showers",  "にわか雪"],
  ];
  for (const [max, en, jp] of labels) if (code <= max) return ja ? jp : en;
  return ja ? "嵐" : "Stormy";
}

function snowBar(snow: number, max: number) {
  const pct = Math.min(100, max > 0 ? (snow / max) * 100 : 0);
  const color = snow >= 20 ? "bg-blue-600" : snow >= 10 ? "bg-blue-500" : snow >= 5 ? "bg-blue-400" : snow > 0 ? "bg-blue-300" : "bg-slate-200";
  return { pct, color };
}

// Forces Leaflet to invalidate size when container mounts
function MapResizer() {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 150); }, [map]);
  return null;
}

type WeatherLayer = "radar" | "satellite";

// JMA (Japan Meteorological Agency) public tile URLs — no API key required
// Radar: high-resolution precipitation nowcast (hrpns)
// Satellite: full-disk infrared composite (fd/hrit)
function jmaRadarUrl(ts: string) {
  return `https://www.jma.go.jp/bosai/jmatile/data/nowc/${ts}/none/${ts}/surf/hrpns/{z}/{x}/{y}.png`;
}
function jmaSatUrl(ts: string) {
  return `https://www.jma.go.jp/bosai/jmatile/data/sat/${ts}/none/${ts}/surf/hrit/fd/{z}/{x}/{y}.png`;
}

function WeatherMap({ layer }: { layer: WeatherLayer }) {
  const [ts, setTs] = useState(jmaTimestamp);

  // Refresh timestamp every 5 minutes so tiles stay current
  useEffect(() => {
    const id = setInterval(() => setTs(jmaTimestamp()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const overlayUrl = layer === "radar" ? jmaRadarUrl(ts) : jmaSatUrl(ts);

  return (
    <MapContainer
      center={[36.795, 138.490]}
      zoom={8}
      minZoom={5}
      maxZoom={14}
      className="w-full h-full z-0"
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <MapResizer />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <TileLayer
        key={`${layer}-${ts}`}
        url={overlayUrl}
        attribution='&copy; <a href="https://www.jma.go.jp/">JMA</a>'
        opacity={0.75}
        errorTileUrl=""
      />
    </MapContainer>
  );
}

const WEATHER_LAYERS: { key: WeatherLayer; label: string; labelJa: string; desc: string; descJa: string }[] = [
  {
    key:     "radar",
    label:   "Live Radar",
    labelJa: "降水レーダー",
    desc:    "JMA high-resolution precipitation nowcast — rain & snow falling right now",
    descJa:  "気象庁高解像度降水ナウキャスト — 現在の降水状況",
  },
  {
    key:     "satellite",
    label:   "Satellite",
    labelJa: "気象衛星",
    desc:    "JMA infrared satellite — track incoming storm clouds & weather fronts",
    descJa:  "気象庁赤外線衛星 — 接近する雲・前線の確認",
  },
];

function MountainCard({ m, t, idx }: { m: MountainOutlook; t: (en: string, ja: string) => string; idx: number }) {
  const maxSnow = Math.max(...m.forecast.map(f => f.snowfall), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-slate-300" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">{t(m.region, m.regionJa)}</p>
            <p className="text-slate-400 text-[10px]">{m.elevation}m elevation</p>
          </div>
        </div>
        <span className="text-2xl">{weatherEmoji(m.weatherCode)}</span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">{t("Temp", "気温")}</p>
          <p className="text-lg font-black text-red-600">{m.temp}°C</p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">{t("Wind", "風速")}</p>
          <p className="text-lg font-black text-slate-700">{m.wind}<span className="text-xs font-medium ml-0.5">km/h</span></p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">{t("Last 24h", "24h降雪")}</p>
          <p className="text-lg font-black text-blue-600">{m.snow24h}<span className="text-xs font-medium ml-0.5">cm</span></p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
          {t("7-Day Forecast", "7日間予報")}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {m.forecast.map((day) => {
            const { pct, color } = snowBar(day.snowfall, maxSnow);
            return (
              <div key={day.date} className="flex-shrink-0 w-[68px] snap-start text-center">
                <p className="text-[10px] font-bold text-muted-foreground mb-1 truncate">{day.dayLabel}</p>
                <p className="text-base mb-1">{weatherEmoji(day.weatherCode)}</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                  <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                </div>
                {day.snowfall > 0 && (
                  <p className="text-sm font-black text-blue-700 leading-tight">❄️ {day.snowfall}cm</p>
                )}
                {day.rain > 0 && (
                  <p className="text-[10px] font-bold text-sky-500 leading-tight">🌧 {day.rain}mm</p>
                )}
                {day.snowfall === 0 && day.rain === 0 && (
                  <p className="text-sm font-black text-slate-400 leading-tight">—</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">{day.tempMin}° / {day.tempMax}°</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function TownCard({ tw, t, idx }: { tw: TownWeather; t: (en: string, ja: string) => string; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + idx * 0.08 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-100" />
          <div>
            <p className="font-bold text-white text-sm leading-tight">{t(tw.location, tw.locationJa)}</p>
            <p className="text-sky-200 text-[10px]">{tw.elevation}m · {t("Base area", "麓エリア")}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl">{weatherEmoji(tw.weatherCode)}</span>
          <p className="text-white font-black text-lg leading-none">{tw.temp}°C</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {t(weatherLabel(tw.weatherCode), weatherLabel(tw.weatherCode, true))} · {t("Wind", "風速")} {tw.wind} km/h
        </p>
      </div>

      <div className="px-4 pb-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
          {t("7-Day Forecast", "7日間予報")}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {tw.forecast.map((day) => (
            <div key={day.date} className="flex-shrink-0 w-[72px] snap-start bg-slate-50 rounded-xl p-2 text-center">
              <p className="text-[10px] font-bold text-muted-foreground truncate">{day.dayLabel}</p>
              <p className="text-base my-0.5">{weatherEmoji(day.weatherCode)}</p>
              <p className="text-xs font-bold text-slate-800 leading-tight">{day.tempMin}° / {day.tempMax}°</p>
              {day.snowfall > 0 && (
                <p className="text-[10px] font-bold text-blue-600 mt-0.5">❄️ {day.snowfall}cm</p>
              )}
              {day.rain > 0 && day.snowfall === 0 && (
                <p className="text-[10px] font-bold text-sky-500 mt-0.5">🌧 {day.rain}mm</p>
              )}
              {day.precipitation === 0 && (
                <p className="text-[10px] text-slate-400 mt-0.5">{t("Dry", "乾燥")}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Outlook() {
  const { t } = useLanguage();
  const [activeLayer, setActiveLayer] = useState<WeatherLayer>("radar");

  const { data, isLoading, error } = useQuery<WeatherOutlook>({
    queryKey: ["weather-outlook"],
    queryFn: async () => {
      const res = await fetch("/api/weather-outlook");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 600000,
  });

  if (isLoading) return <LoadingScreen />;
  if (error || !data) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const updated = new Date(data.updatedAt);
  const timeStr = updated.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo",
  });

  const currentLayer = WEATHER_LAYERS.find(l => l.key === activeLayer)!;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">

      <div className="mb-5">
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">
          {t("Weather Outlook", "天気予報")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("7-day JMA forecast · Mountains & base area", "7日間 気象庁予報 · 山岳・麓エリア")}
        </p>
        <p className="text-xs font-bold text-primary mt-1.5 uppercase tracking-wide">
          {t(`Updated ${timeStr} JST`, `更新 ${timeStr} JST`)}
        </p>
      </div>

      {/* WEATHER MAP */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
              {t(currentLayer.label, currentLayer.labelJa)}
            </h2>
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {WEATHER_LAYERS.map(layer => (
              <button
                key={layer.key}
                onClick={() => setActiveLayer(layer.key)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  activeLayer === layer.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(layer.label, layer.labelJa)}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 320 }}>
          <WeatherMap layer={activeLayer} />
        </div>

        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
          {t(currentLayer.desc, currentLayer.descJa)}
          {" · "}{t("OpenStreetMap · JMA", "OpenStreetMap · 気象庁")}
        </p>
      </motion.section>

      {/* MOUNTAIN SNOW FORECAST */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-slate-600" />
          <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
            {t("Mountain Snow Forecast", "山岳降雪予報")}
          </h2>
        </div>
        <div className="space-y-4">
          {data.mountains.map((m, idx) => (
            <MountainCard key={m.region} m={m} t={t} idx={idx} />
          ))}
        </div>
      </section>

      {/* TOWN & BASE AREA */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-sky-500" />
          <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
            {t("Town & Base Area", "山ノ内町・麓エリア")}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t(
            "General weather for Yamanouchi Town and Nakano — ideal for travel, dining, and non-ski planning.",
            "山ノ内町・中野市の一般的な天気情報です。移動・食事・観光などにご活用ください。"
          )}
        </p>
        <div className="space-y-4">
          {data.towns.map((tw, idx) => (
            <TownCard key={tw.location} tw={tw} t={t} idx={idx} />
          ))}
        </div>
      </section>

      {/* DISCLAIMER */}
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/60">{t("Data Source", "データソース")}: </span>
          {t(
            "Forecasts from Japan Meteorological Agency (JMA) via Open-Meteo. Radar & satellite from RainViewer. Map tiles from OpenStreetMap via CARTO. Updated every 10 minutes. JMA model accuracy is highest within 5 days — treat days 6–7 as indicative only.",
            "予報データはOpen-Meteo経由の気象庁（JMA）数値予報モデルを使用。レーダー・衛星画像はRainViewer提供。地図タイルはCARTO経由のOpenStreetMap。10分ごとに更新。JMAモデルの精度は5日以内が最も高く、6〜7日目は参考値としてご利用ください。"
          )}
        </p>
      </div>
    </div>
  );
}
