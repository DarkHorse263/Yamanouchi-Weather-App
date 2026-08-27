import type { ComponentType } from "react";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Snowflake,
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
import {
  uvBand,
  windBand,
  visibilityKm,
  type TownWeatherCurrent,
  type TownWeatherDaily,
  type TownWeatherHourly,
  type TownWeatherStaleMeta,
  type TownObservedSnow,
} from "@/lib/town-weather";
import { useUnits } from "@/components/auth/UserPrefsProvider";

// Presentational weather sections shared by the town forecast page
// (src/pages/town/TownWeather.tsx) and the visitor "near you" page
// (src/pages/NearYouWeather.tsx). Every component here is context-free: it
// takes plain data + a `t(en, ja)` translator prop, so it renders identically
// whether or not a LanguageProvider / RegionProvider wraps the tree. (useUnits
// is safe here: it falls back to metric defaults when no UserPrefsProvider
// wraps the tree, so these stay renderable in isolation.) The
// page-level radar and headers stay with their pages because those DO depend
// on region/season context.

type Translate = (en: string, ja: string) => string;

export function StaleNotice({
  meta,
  t,
}: {
  meta: TownWeatherStaleMeta;
  t: Translate;
}) {
  // Round to a friendly unit. <2min → "moments ago", <60min → "Xm ago",
  // otherwise "Xh ago". Keeps the badge terse, matches brand voice.
  const ageLabel = (() => {
    const s = meta.ageSeconds;
    if (s === null) return t("recently", "最近");
    if (s < 120) return t("moments ago", "ほんの少し前");
    if (s < 3600) return t(`${Math.round(s / 60)}m ago`, `${Math.round(s / 60)}分前`);
    return t(`${Math.round(s / 3600)}h ago`, `${Math.round(s / 3600)}時間前`);
  })();
  return (
    <div
      role="status"
      className="mt-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 flex items-start gap-3"
    >
      <Cloud className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" strokeWidth={2} />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold text-amber-900">
          {t("Showing cached weather", "キャッシュ表示中")}
        </p>
        <p className="text-amber-800/90 mt-0.5">
          {t(
            `Live weather feed is having trouble · last good update ${ageLabel}.`,
            `ライブ天気の取得に失敗しました · 最終取得は${ageLabel}。`,
          )}
        </p>
      </div>
    </div>
  );
}

export function WeatherHero({
  current,
  town,
  placeLabel = "In town",
}: {
  current: TownWeatherCurrent;
  town: string;
  placeLabel?: string;
}) {
  const Icon = pickIcon(current.weatherCode, current.isDay);
  const u = useUnits();
  return (
    <section className="mt-6 rounded-2xl border border-border bg-white p-6 md:p-8">
      <div className="flex items-start gap-6 flex-wrap">
        <div className="flex items-center gap-5">
          <Icon className={`w-16 h-16 ${Icon === Snowflake ? "text-snow-accent" : "text-primary"}`} strokeWidth={1.4} />
          <div>
            <p className="font-display font-semibold text-6xl md:text-7xl tracking-tight text-foreground leading-none">
              {u.temp(current.temperature) ?? "-"}
              <span className="text-3xl text-muted-foreground/70 align-top ml-1">{u.tempUnit}</span>
            </p>
            <p className="text-muted-foreground mt-2">
              {current.weatherDescription}
              {current.feelsLike !== null && (
                <>
                  {" · "}
                  <span className="text-foreground/80">
                    feelzlike {u.temp(current.feelsLike)}°
                  </span>
                </>
              )}
            </p>
            {current.observationSource && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                observed · {current.observationSource.replace(/^JMA AMeDAS · /, "")}
              </p>
            )}
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="byline text-muted-foreground/70">{placeLabel}</p>
          <p className="font-display font-medium text-xl text-foreground mt-1">{town}</p>
        </div>
      </div>
    </section>
  );
}

export function WeatherConditions({
  current,
  t,
}: {
  current: TownWeatherCurrent;
  t: Translate;
}) {
  const u = useUnits();
  const uv = uvBand(current.uvIndex);
  const wind = windBand(current.windSpeed);
  return (
    <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Stat
        icon={Wind}
        label={t("Wind", "風")}
        value={current.windSpeed !== null ? `${u.wind(current.windSpeed)}` : "-"}
        unit={u.windUnit}
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
        value={current.windGust !== null ? `${u.wind(current.windGust)}` : "-"}
        unit={u.windUnit}
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

export function WeatherToday({
  daily,
  t,
}: {
  daily: TownWeatherDaily | undefined;
  t: Translate;
}) {
  const u = useUnits();
  if (!daily) return null;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="byline text-muted-foreground/70">{t("Today", "今日")}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <KV label={t("High", "最高")} value={daily.tempMax !== null ? `${u.temp(daily.tempMax)}°` : "-"} icon={Thermometer} />
        <KV label={t("Low", "最低")} value={daily.tempMin !== null ? `${u.temp(daily.tempMin)}°` : "-"} icon={Thermometer} />
        <KV label={t("Sunrise", "日の出")} value={fmtTime(daily.sunrise)} icon={Sunrise} />
        <KV label={t("Sunset", "日の入")} value={fmtTime(daily.sunset)} icon={Sunset} />
        <KV
          label={t("Rain chance", "降水確率")}
          value={daily.precipitationProbabilityMax !== null ? `${daily.precipitationProbabilityMax}%` : "-"}
          icon={CloudRain}
        />
        <KV
          label={t("Snow", "降雪")}
          value={daily.snowfallSum !== null && daily.snowfallSum > 0 ? u.snow(daily.snowfallSum, 1) : `0 ${u.snowUnit}`}
          icon={CloudSnow}
        />
      </div>
    </section>
  );
}

/**
 * Real measured snow depth from the nearest JMA AMeDAS snow sensor. Renders
 * only when the API includes an observedSnow block (JP, snow season) - out of
 * season JMA drops the snow fields entirely and this card simply disappears.
 * A reported 0cm is a real reading and shows as 0cm.
 */
export function ObservedSnowCard({
  obs,
  t,
}: {
  obs: TownObservedSnow;
  t: Translate;
}) {
  const u = useUnits();
  const stationLine = [
    `JMA AMeDAS · ${obs.stationName}`,
    obs.stationElevationM !== null ? `${u.elev(obs.stationElevationM)}${u.elevUnit}` : null,
    `${obs.distanceKm} km ${t("away", "先")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="byline text-slate-700">
          {t("Observed snow · measured", "積雪観測 · 実測値")}
        </p>
        <p className="text-xs text-slate-700">
          {t(`at ${fmtTime(obs.observedAt)}`, `${fmtTime(obs.observedAt)}時点`)}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KV
          label={t("Snow depth", "積雪深")}
          value={u.snow(obs.depthCm)}
          icon={Snowflake}
        />
        <KV
          label={t("Last 24h", "24時間降雪")}
          value={obs.snowfall24hCm !== null ? u.snow(obs.snowfall24hCm) : "-"}
          icon={CloudSnow}
        />
      </div>
      <p className="text-xs text-slate-700 mt-3">{stationLine}</p>
    </section>
  );
}

export function WeatherHourly({
  hourly,
  t,
  nowCode,
  nowIsDay,
}: {
  hourly: TownWeatherHourly[];
  t: Translate;
  /** Current-conditions weather code · when set, the "Now" cell uses it so the
      strip can't contradict the hero (model hour-0 often lags the live current). */
  nowCode?: number | null;
  /** Current isDay flag · keeps the "Now" icon's day/night variant in step with the hero. */
  nowIsDay?: boolean;
}) {
  const u = useUnits();
  if (hourly.length === 0) return null;
  // Find min/max temps for chart scaling
  const temps = hourly.map((h) => h.temperature ?? 0);
  const minT = Math.min(...temps);
  const maxT = Math.max(...temps);
  const range = Math.max(1, maxT - minT);

  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="byline text-slate-700">{t("Next 24 hours", "24時間予報")}</p>
        <p className="text-xs text-slate-700">
          {u.temp(minT)}° to {u.temp(maxT)}°
        </p>
      </div>
      <div className="mt-4 -mx-2 overflow-x-auto">
        <div className="flex gap-1 min-w-full px-2">
          {hourly.map((h, i) => {
            const isNow = i === 0;
            const cellCode = isNow && nowCode != null ? nowCode : h.weatherCode;
            // Pass precip signals for marginal-drizzle suppression on forecast
            // hours only — the "Now" cell is authoritative current conditions and
            // must never be filtered (pass undefined so pickIcon skips the check).
            const Icon = pickIcon(
              cellCode,
              isNow && nowIsDay !== undefined ? nowIsDay : true,
              isNow ? undefined : h.precipitationProbability,
              isNow ? undefined : h.precipitation,
            );
            const tNorm = h.temperature !== null ? (h.temperature - minT) / range : 0;
            const pop = h.precipitationProbability ?? 0;
            return (
              <div key={h.time} className="flex flex-col items-center min-w-[44px] flex-1">
                <p className="text-xs text-slate-700 mb-1">
                  {fmtHour(h.time, i)}
                </p>
                <Icon className={`w-4 h-4 ${Icon === Snowflake ? "text-snow-accent" : "text-primary/80"}`} strokeWidth={1.5} />
                <p className="text-xs font-medium text-foreground mt-1">
                  {u.temp(h.temperature) ?? "-"}°
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

export function WeatherOutlook({
  days,
  t,
}: {
  days: TownWeatherDaily[];
  t: Translate;
}) {
  const u = useUnits();
  if (days.length === 0) return null;
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white p-5">
      <p className="byline text-slate-700">{t("Next 6 days", "今後6日間")}</p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {days.map((d) => {
          const Icon = pickIcon(
            d.weatherCode,
            true,
            d.precipitationProbabilityMax,
            d.rainSum,
            MARGINAL_DAILY_PRECIP_THRESHOLD,
          );
          return (
            <div
              key={d.date}
              className="rounded-xl border border-border/70 bg-white p-3 flex flex-col items-center text-center"
            >
              <p className="text-sm font-semibold text-foreground leading-tight">
                {fmtDay(d.date)}
              </p>
              <Icon
                className={`w-8 h-8 mt-3 ${Icon === Snowflake ? "text-snow-accent" : "text-primary/80"}`}
                strokeWidth={1.5}
              />
              <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 min-h-[2.2em]">
                {d.weatherDescription}
              </p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-foreground">
                  {u.temp(d.tempMax) ?? "-"}°
                </span>
                <span className="text-slate-700 ml-2">
                  {u.temp(d.tempMin) ?? "-"}°
                </span>
              </p>

              <div className="mt-3 pt-3 border-t border-border/50 w-full space-y-1.5">
                <DayStat
                  icon={Wind}
                  label={t("Wind", "風")}
                  value={
                    d.windSpeedMax !== null
                      ? `${u.wind(d.windSpeedMax)} ${u.windUnit}`
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
                      ? u.snow(d.snowfallSum, 1)
                      : `0 ${u.snowUnit}`
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
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  const isSnow = Icon === Snowflake || Icon === CloudSnow;
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1 text-slate-700">
        <Icon className={`w-3 h-3 ${isSnow ? "text-snow-accent" : ""}`} strokeWidth={2} /> {label}
      </span>
      <span className={`font-medium truncate ${isSnow ? "text-snow-accent" : "text-foreground"}`}>{value}</span>
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
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
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
      <div className="flex items-center gap-1.5 byline text-slate-700">
        <Icon className="w-3 h-3" strokeWidth={2} /> {label}
      </div>
      <p className={`mt-2 font-display font-semibold text-2xl tracking-tight ${valueClass}`}>
        {value}
        <span className="text-sm text-slate-700 ml-1">{unit}</span>
      </p>
      {hint && <p className="text-xs text-slate-700 mt-1 line-clamp-1">{hint}</p>}
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
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  const isSnow = Icon === Snowflake || Icon === CloudSnow;
  return (
    <div>
      <div className="flex items-center gap-1.5 byline text-slate-700">
        <Icon className={`w-3 h-3 ${isSnow ? "text-snow-accent" : ""}`} strokeWidth={2} /> {label}
      </div>
      <p className={`mt-1 font-display font-medium text-lg ${isSnow ? "text-snow-accent" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

/**
 * Marginal-drizzle check: when a "slight/light" rain or drizzle code appears
 * alongside a very low precipitation probability AND a trace-level precipitation
 * amount, the model is hedging rather than forecasting real rain. Show a plain
 * Cloud so the strip doesn't read as "it will rain" when the sky is effectively
 * dry. Snow codes are never suppressed. The "Now" cell (current conditions)
 * should always pass undefined so current observations are never filtered.
 *
 * Codes considered marginal-suppressible (slight/light variants only):
 *   51 Light drizzle · 53 Moderate drizzle · 61 Slight rain · 80 Slight showers
 *
 * Thresholds (confirmed with owner, Aug 2026):
 *   precipProbability < 25 % AND precipMm < 0.3 mm  (hourly)
 *                             AND precipMm < 0.5 mm  (daily total — use MARGINAL_DAILY_PRECIP_THRESHOLD)
 */
const MARGINAL_DRIZZLE_CODES = new Set([51, 53, 61, 80]);
const MARGINAL_POP_THRESHOLD = 25; // %
const MARGINAL_PRECIP_THRESHOLD = 0.3; // mm (per-hour)
const MARGINAL_DAILY_PRECIP_THRESHOLD = 0.5; // mm (daily total — a full day with <0.5 mm is effectively dry)

export function pickIcon(
  code: number | null,
  isDay: boolean,
  precipProbability?: number | null,
  precipMm?: number | null,
  /** Override the precipitation amount threshold. Pass MARGINAL_DAILY_PRECIP_THRESHOLD
   *  when suppressing daily outlook cards (daily totals are naturally larger than per-hour). */
  precipThresholdMm: number = MARGINAL_PRECIP_THRESHOLD,
): ComponentType<{ className?: string; strokeWidth?: number }> {
  if (code === null) return Cloud;
  if (code === 0 || code === 1) return isDay ? Sun : Cloud;
  if (code === 2 || code === 3 || code === 45 || code === 48) return Cloud;
  if (code >= 51 && code <= 67) {
    // Suppress marginal codes when both precip signals are below threshold
    if (
      MARGINAL_DRIZZLE_CODES.has(code) &&
      precipProbability != null && precipProbability < MARGINAL_POP_THRESHOLD &&
      precipMm != null && precipMm < precipThresholdMm
    ) {
      return Cloud;
    }
    return CloudRain;
  }
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) {
    // Slight showers (80) can be marginal too — check here for the rain-shower branch
    if (
      code === 80 &&
      precipProbability != null && precipProbability < MARGINAL_POP_THRESHOLD &&
      precipMm != null && precipMm < precipThresholdMm
    ) {
      return Cloud;
    }
    return CloudRain;
  }
  if (code >= 85 && code <= 86) return Snowflake;
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
