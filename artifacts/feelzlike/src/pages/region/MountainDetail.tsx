import { useRoute, Link } from "wouter";
import {
  ArrowLeft,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudSun,
  Mountain as MountainIcon,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  LiveBadge,
  PageHeader,
  UpdateStamp,
  useLanguage,
  useRegion,
} from "@workspace/feelzlike-shell";
import {
  getGetLocationWeatherQueryKey,
  useGetLocationWeather,
} from "@workspace/api-client-react";
import { ElevationBands } from "@/components/weather/ElevationBands";
import { LiftHoldLikely } from "@/components/weather/LiftHoldLikely";

/**
 * Region-agnostic mountain weather page.
 *
 * Used as the RegionLayout fallback for `/mountain/:id` (and `/resort/:id`)
 * when a region hasn't shipped a custom MountainDetail page. Renders the
 * same mountain-weather payload (`/api/weather/:id`) that the TownHome
 * "Weather in mountains" panel pulls from, so tapping a mountain row from
 * any town surfaces a real conditions page instead of the placeholder
 * "Coming together / Shell ready" stub.
 *
 * Currently powers Victoria's High Country (6 mountains across 7 base
 * towns). Snowy Mountains and Yamanouchi keep their richer custom
 * MountainDetail pages registered via REGION_ROUTERS.
 */
export function MountainDetail() {
  const [, mParams] = useRoute("/mountain/:id");
  const [, rParams] = useRoute("/resort/:id");
  const params = mParams ?? rParams;
  const locationId = params?.id ?? "";
  const { region } = useRegion();
  const { t } = useLanguage();

  const q = useGetLocationWeather(locationId, {
    query: {
      enabled: !!locationId,
      queryKey: getGetLocationWeatherQueryKey(locationId),
    },
  });

  // Pull mountain coords + summit elevation from the region config so the
  // elevation-banded forecast panel can request a 3-band Open-Meteo forecast.
  const mountainCfg = region.mountains?.find((m) => m.id === locationId);
  const elevLat = mountainCfg?.lat;
  const elevLng = mountainCfg?.lng;
  const elevSummitM = mountainCfg?.elevationM;
  const elevName = mountainCfg?.name;

  const backHref = "~/" + region.id;

  if (!locationId) {
    return (
      <div className="px-4 md:px-10 py-6 md:py-10 max-w-6xl mx-auto">
        <p className="text-muted-foreground">
          {t("Mountain not specified.", "スキー場が指定されていません。")}
        </p>
      </div>
    );
  }

  const data = q.data as MountainWeather | undefined;
  const current = data?.current;
  const daily = data?.daily ?? [];
  const hourly = data?.hourly ?? [];
  const location = data?.location;
  const Icon = current ? pickIcon(current.weatherCode, current.isDay) : Cloud;

  return (
    <div className="px-4 md:px-10 py-5 md:py-10 max-w-6xl mx-auto">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t(region.name, region.name)}
      </Link>

      <div className="mt-3">
        <PageHeader
          byline={`${region.name} · ${region.subtitle}`}
          title={location?.name ?? t("Mountain", "スキー場")}
          description={location?.description}
          stamp={
            <UpdateStamp
              tone="onDark"
              lastUpdated={data?.lastUpdated ?? null}
              intervalMin={15}
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
      </div>

      {q.isLoading ? (
        <p className="mt-10 text-muted-foreground">
          {t("Loading mountain conditions…", "山の状況を読込中…")}
        </p>
      ) : q.isError || !current ? (
        <p className="mt-10 text-muted-foreground">
          {t(
            "Mountain conditions unavailable right now.",
            "現在、山の状況を取得できません。",
          )}
        </p>
      ) : (
        <>
          {/* Hero - on-mountain temp, elevation, conditions blurb. */}
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
                    {current.feelsLike !== null && current.feelsLike !== undefined && (
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
                <p className="byline text-muted-foreground/70 inline-flex items-center gap-1">
                  <MountainIcon className="w-3 h-3" /> {t("On mountain", "山頂付近")}
                </p>
                {location?.elevation != null && (
                  <p className="font-display font-medium text-xl text-foreground mt-1">
                    {location.elevation}m
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Lift hold likely · wind-driven prediction of whether exposed
              chairs and gondolas are at risk of holding today. Replaces the
              old four-tile snow/wind/freezing strip; the same numbers are
              shown below in the Conditions right now panel. */}
          <LiftHoldLikely windSpeedKmh={current.windSpeed ?? null} />

          {/* Elevation-banded forecast (Open-Meteo) · upper / mid / base
              snow + temp. Self-hides when coords or summit elevation are
              missing for the mountain. */}
          <ElevationBands
            lat={elevLat}
            lng={elevLng}
            summitElevationM={elevSummitM}
            name={elevName}
          />

          {/* Conditions right now · snow depth, incoming snow, wind and
              freezing level. The four numbers an off-mountain skier is
              actually deciding on. Replaces the older humidity/cloud/etc
              secondary strip which lived here. */}
          <section className="mt-4 rounded-2xl border border-border bg-white p-5">
            <p className="byline text-muted-foreground/70">
              {t("conditions right now", "現在の状況")}
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <BigStat
                icon={Snowflake}
                label={t("Snow depth", "積雪")}
                value={
                  current.snowDepth !== null && current.snowDepth !== undefined
                    ? `${Math.round(current.snowDepth)}`
                    : "-"
                }
                unit="cm"
              />
              <BigStat
                icon={CloudSnow}
                label={t("Snow next 24h", "24時間降雪")}
                value={
                  current.snowfallNext24h !== null && current.snowfallNext24h !== undefined
                    ? current.snowfallNext24h.toFixed(1)
                    : "-"
                }
                unit="cm"
              />
              <BigStat
                icon={Wind}
                label={t("Wind", "風速")}
                value={
                  current.windSpeed !== null && current.windSpeed !== undefined
                    ? `${Math.round(current.windSpeed)}`
                    : "-"
                }
                unit="km/h"
              />
              <BigStat
                icon={Thermometer}
                label={t("Freezing level", "凍結高度")}
                value={
                  current.freezingLevel !== null && current.freezingLevel !== undefined
                    ? `${Math.round(current.freezingLevel)}`
                    : "-"
                }
                unit="m"
              />
            </div>
          </section>

          {/* Today summary */}
          {daily[0] && (
            <section className="mt-4 rounded-2xl border border-border bg-white p-5">
              <p className="byline text-muted-foreground/70">{t("Today", "今日")}</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <KV
                  label={t("High", "最高")}
                  value={daily[0].maxTemp !== null && daily[0].maxTemp !== undefined ? `${Math.round(daily[0].maxTemp)}°` : "-"}
                  icon={Thermometer}
                />
                <KV
                  label={t("Low", "最低")}
                  value={daily[0].minTemp !== null && daily[0].minTemp !== undefined ? `${Math.round(daily[0].minTemp)}°` : "-"}
                  icon={Thermometer}
                />
                <KV
                  label={t("Sunrise", "日の出")}
                  value={fmtTime(daily[0].sunrise)}
                  icon={Sunrise}
                />
                <KV
                  label={t("Sunset", "日の入")}
                  value={fmtTime(daily[0].sunset)}
                  icon={Sunset}
                />
                <KV
                  label={t("Rain", "降水量")}
                  value={
                    daily[0].precipitationSum !== null && daily[0].precipitationSum !== undefined
                      ? `${daily[0].precipitationSum.toFixed(1)} mm`
                      : "0 mm"
                  }
                  icon={CloudRain}
                />
                <KV
                  label={t("Snow", "降雪")}
                  value={
                    daily[0].snowfallSum !== null && daily[0].snowfallSum !== undefined && daily[0].snowfallSum > 0
                      ? `${daily[0].snowfallSum.toFixed(1)} cm`
                      : "0 cm"
                  }
                  icon={CloudSnow}
                />
              </div>
            </section>
          )}

          {/* Next 24 hours */}
          {hourly.length > 0 && (
            <section className="mt-4 rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="byline text-muted-foreground/70">{t("Next 24 hours", "24時間予報")}</p>
              </div>
              <div className="mt-4 -mx-2 overflow-x-auto">
                <div className="flex gap-1 min-w-full px-2">
                  {hourly.slice(0, 24).map((h, i) => {
                    const HIcon = pickIcon(h.weatherCode, true);
                    return (
                      <div key={h.time} className="flex flex-col items-center min-w-[44px] flex-1">
                        <p className="text-[10px] text-muted-foreground/70 mb-1">
                          {i === 0 ? t("Now", "今") : fmtHour(h.time)}
                        </p>
                        <HIcon className="w-4 h-4 text-primary/80" strokeWidth={1.5} />
                        <p className="text-xs font-medium text-foreground mt-1">
                          {h.temperature !== null && h.temperature !== undefined
                            ? Math.round(h.temperature)
                            : "-"}
                          °
                        </p>
                        {(h.snowfall ?? 0) > 0 && (
                          <p className="text-[10px] text-sky-700 mt-1">
                            {h.snowfall!.toFixed(1)}cm
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 6-day outlook */}
          {daily.length > 1 && (
            <section className="mt-4 rounded-2xl border border-border bg-white p-5">
              <p className="byline text-muted-foreground/70">{t("Next 6 days", "今後6日間")}</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {daily.slice(1, 7).map((d) => {
                  const DIcon = pickIcon(d.weatherCode, true);
                  return (
                    <div
                      key={d.date}
                      className="rounded-xl border border-border/70 bg-white p-3 flex flex-col items-center text-center"
                    >
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {fmtDay(d.date)}
                      </p>
                      <DIcon className="w-8 h-8 text-primary/80 mt-3" strokeWidth={1.5} />
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 min-h-[2.2em]">
                        {d.weatherDescription}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-semibold text-foreground">
                          {d.maxTemp !== null && d.maxTemp !== undefined ? Math.round(d.maxTemp) : "-"}°
                        </span>
                        <span className="text-muted-foreground/70 ml-2">
                          {d.minTemp !== null && d.minTemp !== undefined ? Math.round(d.minTemp) : "-"}°
                        </span>
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/50 w-full space-y-1.5">
                        <DayStat
                          icon={Wind}
                          label={t("Wind", "風")}
                          value={
                            d.windSpeedMax !== null && d.windSpeedMax !== undefined
                              ? `${Math.round(d.windSpeedMax)} km/h`
                              : "-"
                          }
                        />
                        <DayStat
                          icon={CloudSnow}
                          label={t("Snow", "雪")}
                          value={
                            d.snowfallSum !== null && d.snowfallSum !== undefined && d.snowfallSum > 0
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
          )}

          <p className="byline text-muted-foreground/60 mt-10">
            {t(
              `Source: ${current.dataSource ?? region.weatherSource?.label ?? "Open-Meteo"} · elevation-corrected for ${location?.elevation ?? "?"}m`,
              `出典: ${current.dataSource ?? region.weatherSource?.labelJa ?? "Open-Meteo"} · 標高${location?.elevation ?? "?"}mに補正`,
            )}
          </p>
        </>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

// Loose typing - the openapi-generated type for useGetLocationWeather is
// strict but we read fields defensively so we don't crash if the server
// adds/removes optional keys ahead of a codegen run.
type MountainWeather = {
  location: {
    id: string;
    name: string;
    elevation?: number;
    latitude?: number;
    longitude?: number;
    description?: string;
  };
  current: {
    temperature: number | null;
    feelsLike?: number | null;
    humidity?: number | null;
    windSpeed?: number | null;
    windDirection?: number | null;
    weatherCode: number | null;
    weatherDescription: string;
    isDay?: boolean;
    snowDepth?: number | null;
    precipitation?: number | null;
    cloudCover?: number | null;
    visibility?: number | null;
    dataSource?: string;
    freezingLevel?: number | null;
    snowfallNext24h?: number | null;
    snowfallNext48h?: number | null;
    snowfallNext72h?: number | null;
  };
  daily: Array<{
    date: string;
    maxTemp?: number | null;
    minTemp?: number | null;
    weatherCode?: number | null;
    weatherDescription?: string;
    precipitationSum?: number | null;
    snowfallSum?: number | null;
    windSpeedMax?: number | null;
    sunrise?: string | null;
    sunset?: string | null;
  }>;
  hourly: Array<{
    time: string;
    temperature?: number | null;
    weatherCode?: number | null;
    snowfall?: number | null;
  }>;
  lastUpdated?: string;
};

function pickIcon(
  code: number | null | undefined,
  isDay: boolean | undefined,
): React.ComponentType<{ className?: string; strokeWidth?: number }> {
  if (code == null) return Cloud;
  if (code === 0) return isDay === false ? Cloud : Sun;
  if (code === 1 || code === 2) return isDay === false ? Cloud : CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return CloudSnow;
  if (code >= 95) return CloudRain;
  return Cloud;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "-";
}

function fmtHour(iso: string): string {
  const m = iso.match(/T(\d{2}):/);
  return m ? `${m[1]}h` : "";
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function BigStat({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5 byline text-muted-foreground/70">
        <Icon className="w-3 h-3" strokeWidth={2} /> {label}
      </div>
      <p className="mt-2 font-display font-semibold text-2xl tracking-tight text-foreground">
        {value}
        <span className="text-sm text-muted-foreground/70 ml-1">{unit}</span>
      </p>
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

export default MountainDetail;
