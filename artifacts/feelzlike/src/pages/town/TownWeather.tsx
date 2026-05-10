import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Compass as CompassIcon,
} from "lucide-react";
import { useLanguage, useBaseTown, useRegion, LiveBadge, UpdateStamp, useOptionalSeason, PageHeader } from "@workspace/feelzlike-shell";
import { RadarMap } from "@/regions/snowy-mountains/components/RadarMap";
import { Radar as RadarIcon, ExternalLink } from "lucide-react";
import {
  useTownWeather,
  uvBand,
  windBand,
  visibilityKm,
  type TownWeatherDaily,
  type TownWeatherHourly,
} from "@/lib/town-weather";

export function TownWeather() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const q = useTownWeather(town?.lat, town?.lng);

  if (!town) {
    return (
      <div className="px-4 md:px-10 py-6 md:py-10 max-w-6xl mx-auto">
        <p className="text-muted-foreground">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-5 md:py-10 max-w-6xl mx-auto">
      <PageHeader
        byline={`${region.name} · ${t(town.name, town.nameJa)}`}
        title={t(`${town.name} weather forecast`, `${town.name}の天気予報`)}
        description={t(
          "Current, hourly and 7-day outlook for town. Live snow radar below.",
          "町の現在・時間別・7日間予報。下に降雪レーダー。",
        )}
        stamp={
          <UpdateStamp
            tone="onDark"
            lastUpdated={q.data?.current?.time ?? null}
            intervalMin={10}
            source={
              region.weatherSource
                ? t(
                    region.weatherSource.label,
                    region.weatherSource.labelJa ?? region.weatherSource.label,
                  )
                : "Open-Meteo"
            }
          />
        }
        badge={<LiveBadge tone="onDark" label={t("Live", "ライブ")} />}
      />

      {q.isLoading ? (
        <p className="mt-10 text-muted-foreground">{t("Loading weather…", "天気を読込中…")}</p>
      ) : q.isError || !q.data ? (
        <p className="mt-10 text-muted-foreground">
          {t("Weather data unavailable right now.", "現在、天気データを取得できません。")}
        </p>
      ) : (
        <>
          <Hero current={q.data.current} town={t(town.name, town.nameJa)} />
          <Conditions current={q.data.current} t={t} />
          <Today daily={q.data.daily[0]} t={t} />
          <Hourly hourly={q.data.hourly} t={t} />
          <Outlook days={q.data.daily.slice(1, 7)} t={t} />
          {region.id === "snowy-mountains" && <Radar t={t} />}
          <p className="byline text-muted-foreground/60 mt-10">
            {t(
              `Source: ${region.weatherSource?.label ?? "Open-Meteo"} · updated every 10 min`,
              `出典: ${region.weatherSource?.labelJa ?? region.weatherSource?.label ?? "Open-Meteo"} · 10分毎に更新`,
            )}
          </p>
        </>
      )}
    </div>
  );
}

function Radar({ t }: { t: (en: string, ja: string) => string }) {
  const seasonCtx = useOptionalSeason();
  const season = seasonCtx?.season ?? "winter";
  const headline = season === "winter"
    ? t("Live snow + cloud radar", "ライブ降雪・雲レーダー")
    : t("Live rain + cloud radar", "ライブ降雨・雲レーダー");
  const byline = season === "winter"
    ? t("Snow radar", "降雪レーダー")
    : t("Rain radar", "降雨レーダー");
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 flex-wrap">
        <div>
          <p className="byline text-muted-foreground/70 inline-flex items-center gap-1.5">
            <RadarIcon className="w-3 h-3" /> {byline}
          </p>
          <h2 className="font-display font-semibold text-lg text-foreground mt-1">
            {headline}
          </h2>
        </div>
        <a
          href="https://www.rainviewer.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          RainViewer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <RadarMap season={season} />
      <p className="text-xs text-muted-foreground/70 px-5 py-3 border-t border-border">
        {season === "winter"
          ? t(
              "Toggle Overall / Clouds / Snow above the map. Above ~1,400 m, precipitation falls as snow when temps are at or below 0°C. Forecast frames show the next 30 minutes.",
              "地図上のオーバーオール／雲／雪を切替。標高約1,400m以上で気温0°C以下なら降水は雪。予報フレームは今後30分の予測。",
            )
          : t(
              "Toggle Overall / Clouds / Rain above the map. Forecast frames show the next 30 minutes.",
              "地図上のオーバーオール／雲／雨を切替。予報フレームは今後30分の予測。",
            )}
      </p>
    </section>
  );
}

function Hero({
  current,
  town,
}: {
  current: import("@/lib/town-weather").TownWeatherCurrent;
  town: string;
}) {
  const Icon = pickIcon(current.weatherCode, current.isDay);
  return (
    <section className="mt-8 rounded-2xl border border-border bg-white p-6 md:p-8">
      <div className="flex items-start gap-6 flex-wrap">
        <div className="flex items-center gap-5">
          <Icon className="w-16 h-16 text-primary" strokeWidth={1.4} />
          <div>
            <p className="font-display font-semibold text-6xl md:text-7xl tracking-tight text-foreground leading-none">
              {current.temperature !== null ? Math.round(current.temperature) : "-"}
              <span className="text-3xl text-muted-foreground/70 align-top ml-1">°C</span>
            </p>
            <p className="text-muted-foreground mt-2">
              {current.weatherDescription}
              {current.feelsLike !== null && (
                <>
                  {" · "}
                  <span className="text-foreground/80">
                    feelzlike {Math.round(current.feelsLike)}°
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="byline text-muted-foreground/70">In town</p>
          <p className="font-display font-medium text-xl text-foreground mt-1">{town}</p>
        </div>
      </div>
    </section>
  );
}

function Conditions({
  current,
  t,
}: {
  current: import("@/lib/town-weather").TownWeatherCurrent;
  t: (en: string, ja: string) => string;
}) {
  const uv = uvBand(current.uvIndex);
  const wind = windBand(current.windSpeed);
  return (
    <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Stat
        icon={Wind}
        label={t("Wind", "風")}
        value={current.windSpeed !== null ? `${Math.round(current.windSpeed)}` : "-"}
        unit="km/h"
        hint={
          current.windDirectionCompass
            ? `${current.windDirectionCompass} · ${wind.label}`
            : wind.label
        }
        tone={wind.tone}
      />
      <Stat
        icon={CompassIcon}
        label={t("Gusts", "突風")}
        value={current.windGust !== null ? `${Math.round(current.windGust)}` : "-"}
        unit="km/h"
        hint={t("Max 10-min", "最大10分")}
      />
      <Stat
        icon={Droplets}
        label={t("Humidity", "湿度")}
        value={current.humidity !== null ? `${Math.round(current.humidity)}` : "-"}
        unit="%"
        hint={current.dewpoint !== null ? `Dew ${Math.round(current.dewpoint)}°` : ""}
      />
      <Stat
        icon={Gauge}
        label={t("Pressure", "気圧")}
        value={current.pressure !== null ? `${Math.round(current.pressure)}` : "-"}
        unit="hPa"
        hint=""
      />
      <Stat
        icon={Eye}
        label={t("Visibility", "視程")}
        value={visibilityKm(current.visibility).split(" ")[0] ?? "-"}
        unit="km"
        hint=""
      />
      <Stat
        icon={Sun}
        label={t("UV", "UV")}
        value={current.uvIndex !== null ? current.uvIndex.toFixed(1) : "-"}
        unit=""
        hint={uv.label}
        tone={uv.tone}
      />
    </section>
  );
}

function Today({
  daily,
  t,
}: {
  daily: TownWeatherDaily | undefined;
  t: (en: string, ja: string) => string;
}) {
  if (!daily) return null;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <p className="byline text-muted-foreground/70">{t("Today", "今日")}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <KV label={t("High", "最高")} value={daily.tempMax !== null ? `${Math.round(daily.tempMax)}°` : "-"} icon={Thermometer} />
        <KV label={t("Low", "最低")} value={daily.tempMin !== null ? `${Math.round(daily.tempMin)}°` : "-"} icon={Thermometer} />
        <KV label={t("Sunrise", "日の出")} value={fmtTime(daily.sunrise)} icon={Sunrise} />
        <KV label={t("Sunset", "日の入")} value={fmtTime(daily.sunset)} icon={Sunset} />
        <KV
          label={t("Rain chance", "降水確率")}
          value={daily.precipitationProbabilityMax !== null ? `${daily.precipitationProbabilityMax}%` : "-"}
          icon={CloudRain}
        />
        <KV
          label={t("Snow", "降雪")}
          value={daily.snowfallSum !== null && daily.snowfallSum > 0 ? `${daily.snowfallSum.toFixed(1)} cm` : "0 cm"}
          icon={CloudSnow}
        />
      </div>
    </section>
  );
}

function Hourly({
  hourly,
  t,
}: {
  hourly: TownWeatherHourly[];
  t: (en: string, ja: string) => string;
}) {
  if (hourly.length === 0) return null;
  // Find min/max temps for chart scaling
  const temps = hourly.map((h) => h.temperature ?? 0);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = Math.max(1, maxT - minT);

  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="byline text-muted-foreground/70">{t("Next 24 hours", "24時間予報")}</p>
        <p className="text-[11px] text-muted-foreground/60">
          {Math.round(minT)}° to {Math.round(maxT)}°
        </p>
      </div>
      <div className="mt-4 -mx-2 overflow-x-auto">
        <div className="flex gap-1 min-w-full px-2">
          {hourly.map((h, i) => {
            const Icon = pickIcon(h.weatherCode, true);
            const tNorm = h.temperature !== null ? (h.temperature - minT) / range : 0;
            const pop = h.precipitationProbability ?? 0;
            return (
              <div key={h.time} className="flex flex-col items-center min-w-[44px] flex-1">
                <p className="text-[10px] text-muted-foreground/70 mb-1">
                  {fmtHour(h.time, i)}
                </p>
                <Icon className="w-4 h-4 text-primary/80" strokeWidth={1.5} />
                <p className="text-xs font-medium text-foreground mt-1">
                  {h.temperature !== null ? Math.round(h.temperature) : "-"}°
                </p>
                <div className="h-12 w-full flex items-end mt-1">
                  <div
                    className="w-full rounded-t bg-primary/20"
                    style={{ height: `${20 + tNorm * 70}%` }}
                  />
                </div>
                {pop > 10 && (
                  <p className="text-[10px] text-blue-600 mt-1">{Math.round(pop)}%</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Outlook({
  days,
  t,
}: {
  days: TownWeatherDaily[];
  t: (en: string, ja: string) => string;
}) {
  if (days.length === 0) return null;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <p className="byline text-muted-foreground/70">{t("Next 6 days", "今後6日間")}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {days.map((d) => {
          const Icon = pickIcon(d.weatherCode, true);
          return (
            <div
              key={d.date}
              className="rounded-xl border border-border/70 bg-white p-3 flex flex-col items-center text-center"
            >
              <p className="text-sm font-semibold text-foreground leading-tight">
                {fmtDay(d.date)}
              </p>
              <Icon
                className="w-8 h-8 text-primary/80 mt-3"
                strokeWidth={1.5}
              />
              <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 min-h-[2.2em]">
                {d.weatherDescription}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-foreground">
                  {d.tempMax !== null ? Math.round(d.tempMax) : "-"}°
                </span>
                <span className="text-muted-foreground/70 ml-2">
                  {d.tempMin !== null ? Math.round(d.tempMin) : "-"}°
                </span>
              </p>

              <div className="mt-3 pt-3 border-t border-border/50 w-full space-y-1.5">
                <DayStat
                  icon={Wind}
                  label={t("Wind", "風")}
                  value={
                    d.windSpeedMax !== null
                      ? `${Math.round(d.windSpeedMax)} km/h`
                      : "-"
                  }
                />
                <DayStat
                  icon={Sunrise}
                  label={t("Sunrise", "日の出")}
                  value={fmtTime(d.sunrise)}
                />
                <DayStat
                  icon={Sunset}
                  label={t("Sunset", "日の入")}
                  value={fmtTime(d.sunset)}
                />
                <DayStat
                  icon={CloudRain}
                  label={t("Rain", "雨")}
                  value={
                    d.precipitationProbabilityMax !== null
                      ? `${d.precipitationProbabilityMax}%`
                      : "-"
                  }
                />
                <DayStat
                  icon={CloudSnow}
                  label={t("Snow", "雪")}
                  value={
                    d.snowfallSum !== null && d.snowfallSum > 0
                      ? `${d.snowfallSum.toFixed(1)} cm`
                      : "0 cm"
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DayStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1 text-muted-foreground/70">
        <Icon className="w-3 h-3" strokeWidth={2} /> {label}
      </span>
      <span className="font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  unit: string;
  hint: string;
  tone?: "ok" | "caution" | "warn";
}) {
  const valueClass =
    tone === "warn"
      ? "text-red-600"
      : tone === "caution"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5 byline text-muted-foreground/70">
        <Icon className="w-3 h-3" strokeWidth={2} /> {label}
      </div>
      <p className={`mt-2 font-display font-semibold text-2xl tracking-tight ${valueClass}`}>
        {value}
        <span className="text-sm text-muted-foreground/70 ml-1">{unit}</span>
      </p>
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">{hint}</p>}
    </div>
  );
}

function KV({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 byline text-muted-foreground/70">
        <Icon className="w-3 h-3" strokeWidth={2} /> {label}
      </div>
      <p className="mt-1 font-display font-medium text-lg text-foreground">{value}</p>
    </div>
  );
}

function pickIcon(code: number | null, isDay: boolean): React.ComponentType<{ className?: string; strokeWidth?: number }> {
  if (code === null) return Cloud;
  if (code === 0 || code === 1) return isDay ? Sun : Cloud;
  if (code === 2 || code === 3 || code === 45 || code === 48) return Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudRain;
  return Cloud;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "-";
  // Open-Meteo returns naive local time like "2026-05-03T05:42"
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "-";
  return `${m[1]}:${m[2]}`;
}

function fmtHour(iso: string, idx: number): string {
  if (idx === 0) return "Now";
  const m = iso.match(/T(\d{2}):/);
  return m ? `${m[1]}h` : "";
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
