import { useLanguage } from "@/hooks/use-language";
import { motion } from "framer-motion";
import { Mountain, MapPin, Radar } from "lucide-react";
import { useState } from "react";
import { WEATHER_OUTLOOK } from "@/data/seed-data";

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
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

interface MountainOutlook {
  region: string; regionJa: string; elevation: number; temp: number; wind: number; weatherCode: number; snow24h: number;
  forecast: { date: string; dayLabel: string; tempMin: number; tempMax: number; snowfall: number; rain: number; precipitation: number; weatherCode: number; }[];
}

interface TownWeather {
  location: string; locationJa: string; elevation: number; temp: number; wind: number; weatherCode: number;
  forecast: { date: string; dayLabel: string; tempMin: number; tempMax: number; snowfall: number; rain: number; precipitation: number; weatherCode: number; }[];
}

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
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">{t("7-Day Forecast", "7日間予報")}</p>
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
                {day.snowfall > 0 && <p className="text-sm font-black text-blue-700 leading-tight">❄️ {day.snowfall}cm</p>}
                {day.rain > 0 && <p className="text-[10px] font-bold text-sky-500 leading-tight">🌧 {day.rain}mm</p>}
                {day.snowfall === 0 && day.rain === 0 && <p className="text-sm font-black text-slate-400 leading-tight">—</p>}
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
            <p className="text-sky-200 text-[10px]">{tw.elevation}m</p>
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
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">{t("7-Day Forecast", "7日間予報")}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {tw.forecast.map((day) => (
            <div key={day.date} className="flex-shrink-0 w-[72px] snap-start bg-slate-50 rounded-xl p-2 text-center">
              <p className="text-[10px] font-bold text-muted-foreground truncate">{day.dayLabel}</p>
              <p className="text-base my-0.5">{weatherEmoji(day.weatherCode)}</p>
              <p className="text-xs font-bold text-slate-800 leading-tight">{day.tempMin}° / {day.tempMax}°</p>
              {day.snowfall > 0 && <p className="text-[10px] font-bold text-blue-600 mt-0.5">❄️ {day.snowfall}cm</p>}
              {day.rain > 0 && day.snowfall === 0 && <p className="text-[10px] font-bold text-sky-500 mt-0.5">🌧 {day.rain}mm</p>}
              {day.precipitation === 0 && <p className="text-[10px] text-slate-400 mt-0.5">{t("Dry", "乾燥")}</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const BASE_WINDY = "https://embed.windy.com/embed2.html?lat=36.23&lon=138.18&detailLat=36.23&detailLon=138.18&zoom=8&level=surface&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1";

const WINDY_LAYERS = [
  { key: "radar",     label: "Weather Radar",  labelJa: "気象レーダー",  url: `${BASE_WINDY}&overlay=radar` },
  { key: "snowcover", label: "Snow Cover",     labelJa: "積雪状況",      url: `${BASE_WINDY}&overlay=snowcover` },
];

export default function Outlook() {
  const { t } = useLanguage();
  const [radarLayer, setRadarLayer] = useState(WINDY_LAYERS[0]);

  const data = WEATHER_OUTLOOK;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-5">
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          {t("Weather Outlook", "天気予報")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("7-day forecast for Nagano Prefecture mountains & towns", "長野県山岳・町の7日間予報")}
        </p>
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
              {t(radarLayer.label, radarLayer.labelJa)}
            </h2>
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {WINDY_LAYERS.map(layer => (
              <button
                key={layer.key}
                onClick={() => setRadarLayer(layer)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  radarLayer.key === layer.key ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(layer.label, layer.labelJa)}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 320 }}>
          <iframe
            key={radarLayer.key}
            src={radarLayer.url}
            title={`${radarLayer.label} — Nagano Prefecture`}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
          {t("Powered by Windy · JMA data", "Windy提供 · 気象庁データ")}
        </p>
      </motion.section>

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

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-sky-500" />
          <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
            {t("Town & Base Areas", "町・麓エリア")}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t(
            "General weather for towns across Nagano Prefecture — ideal for travel, dining, and non-ski planning.",
            "長野県各町の一般的な天気情報です。移動・食事・観光などにご活用ください。"
          )}
        </p>
        <div className="space-y-4">
          {data.towns.map((tw, idx) => (
            <TownCard key={tw.location} tw={tw} t={t} idx={idx} />
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/60">{t("Data Source", "データソース")}: </span>
          {t(
            "Demo data for pitch purposes. In production, forecasts would come from JMA numerical models via Open-Meteo. Radar from Windy / JMA.",
            "ピッチ用デモデータです。本番では、予報データはOpen-Meteo経由のJMA数値予報モデルから取得します。レーダーはWindy / 気象庁提供。"
          )}
        </p>
      </div>
    </div>
  );
}
