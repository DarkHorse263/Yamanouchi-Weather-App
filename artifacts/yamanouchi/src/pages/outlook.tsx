import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { motion } from "framer-motion";
import { Thermometer, Wind, Snowflake, CloudRain, Mountain, MapPin } from "lucide-react";

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

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow Showers";
  return "Stormy";
}

function weatherLabelJa(code: number): string {
  if (code === 0) return "快晴";
  if (code <= 2) return "晴れ時々曇り";
  if (code === 3) return "曇り";
  if (code <= 48) return "霧";
  if (code <= 55) return "霧雨";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "にわか雨";
  if (code <= 86) return "にわか雪";
  return "嵐";
}

function snowLevelColor(snow: number): string {
  if (snow >= 20) return "bg-blue-600";
  if (snow >= 10) return "bg-blue-500";
  if (snow >= 5) return "bg-blue-400";
  if (snow > 0) return "bg-blue-300";
  return "bg-slate-200";
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
        <div className="text-right">
          <span className="text-2xl">{weatherEmoji(m.weatherCode)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Temp</p>
          <p className="text-lg font-black text-red-600">{m.temp}°</p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Wind</p>
          <p className="text-lg font-black text-slate-700">{m.wind}<span className="text-xs font-medium ml-0.5">km/h</span></p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-0.5">Last 24h</p>
          <p className="text-lg font-black text-blue-600">{m.snow24h}<span className="text-xs font-medium ml-0.5">cm</span></p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">3-Day Snow Forecast</p>
        <div className="grid grid-cols-3 gap-2">
          {m.forecast.map((day) => (
            <div key={day.date} className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">{day.dayLabel}</p>
              <p className="text-sm mb-1.5">{weatherEmoji(day.weatherCode)}</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${snowLevelColor(day.snowfall)}`}
                  style={{ width: `${Math.min(100, (day.snowfall / maxSnow) * 100)}%` }}
                />
              </div>
              <p className="text-sm font-black text-blue-700">{day.snowfall > 0 ? `${day.snowfall}cm` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">{day.tempMin}° / {day.tempMax}°</p>
            </div>
          ))}
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
            <p className="text-sky-200 text-[10px]">{tw.elevation}m · Base area</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl">{weatherEmoji(tw.weatherCode)}</span>
          <p className="text-white font-black text-lg leading-none">{tw.temp}°C</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {t(weatherLabel(tw.weatherCode), weatherLabelJa(tw.weatherCode))} · Wind {tw.wind} km/h
        </p>
        <div className="grid grid-cols-3 gap-2">
          {tw.forecast.map((day) => (
            <div key={day.date} className="bg-slate-50 rounded-xl p-2 text-center">
              <p className="text-[10px] font-bold text-muted-foreground">{day.dayLabel}</p>
              <p className="text-base my-0.5">{weatherEmoji(day.weatherCode)}</p>
              <p className="text-xs font-bold text-slate-800">{day.tempMin}° / {day.tempMax}°</p>
              {day.snowfall > 0 && (
                <p className="text-[10px] font-bold text-blue-600 mt-0.5">❄️ {day.snowfall}cm</p>
              )}
              {day.rain > 0 && day.snowfall === 0 && (
                <p className="text-[10px] font-bold text-sky-500 mt-0.5">🌧 {day.rain}mm</p>
              )}
              {day.precipitation === 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">Dry</p>
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
  const timeStr = updated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">
          {t("Weather Outlook", "天気予報")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Mountains & base area · 3-day JMA forecast", "山岳・麓エリア · 3日間 気象庁予報")}
        </p>
        <p className="text-xs font-bold text-primary mt-1.5 uppercase tracking-wide">
          {t(`Updated ${timeStr} JST`, `更新 ${timeStr} JST`)}
        </p>
      </div>

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

      <section>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-sky-500" />
          <h2 className="text-base font-bold text-slate-700 uppercase tracking-wide">
            {t("Town & Base Area", "山ノ内町・麓エリア")}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {t(
            "General weather for Yamanouchi Town and Nakano — ideal for planning travel, dining, and non-ski activities.",
            "山ノ内町・中野市の一般的な天気情報です。移動・食事・観光など、スキー以外の計画にご活用ください。"
          )}
        </p>
        <div className="space-y-4">
          {data.towns.map((tw, idx) => (
            <TownCard key={tw.location} tw={tw} t={t} idx={idx} />
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground/60">{t("Data Source", "データソース")}: </span>
          {t(
            "Forecasts sourced from Japan Meteorological Agency (JMA) numerical weather models via Open-Meteo. Updated every 10 minutes. For accuracy always check with local authorities before travel.",
            "予報データは、Open-Meteo経由の気象庁（JMA）数値予報モデルを使用しています。10分ごとに更新。移動前は必ず地元当局の情報もご確認ください。"
          )}
        </p>
      </div>
    </div>
  );
}
