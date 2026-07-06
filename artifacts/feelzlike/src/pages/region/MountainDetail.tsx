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
  PremiumGate,
  UpdateStamp,
  useLanguage,
  useOptionalSeason,
  useRegion,
} from "@workspace/feelzlike-shell";
import { MountainSnapshot } from "@workspace/feelzlike-dashboard";
import {
  getGetLocationWeatherQueryKey,
  useGetLocationWeather,
} from "@workspace/api-client-react";
import { ElevationBands } from "@/components/weather/ElevationBands";
import { HourlyForecast } from "@/components/HourlyForecast";
import { SnowmakingPanel } from "@/components/weather/SnowmakingPanel";
import { POWDER_THRESHOLDS_AU } from "@/types/weather";
import { PowderCalendar } from "@/components/PowderCalendar";
import { LiftWindHoldPanel } from "@/components/LiftWindHoldPanel";
import { isLiftSeasonOpen } from "@/lib/skiSeason";
import { REGION_COUNTRY } from "@/regions";
import { MountainWebcams } from "@/components/MountainWebcams";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { EnsembleForecast } from "@/components/weather/EnsembleForecast";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { midMountainElevation } from "@/lib/elevation";
import { getLiftsForMountain } from "@/data/lifts";
import { cn } from "@/lib/utils";
import { BarChart2 } from "lucide-react";
import { useState } from "react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { placeSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";
import { OfficialSiteLink } from "@/components/OfficialSiteLink";

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
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.season === "green";
  const [activeChartMetric, setActiveChartMetric] = useState<"temperature" | "snowfall" | "windSpeed">("temperature");

  // Pull mountain coords + summit elevation from the region config so the
  // elevation-banded forecast panel can request a 3-band Open-Meteo forecast,
  // and so the HEADLINE snow can be derived on-mountain (mid-mountain) rather
  // than at the village. Temp/feels-like/current stay at the village.
  const mountainCfg = region.mountains?.find((m) => m.id === locationId);
  const elevLat = mountainCfg?.lat;
  const elevLng = mountainCfg?.lng;
  const elevSummitM = mountainCfg?.elevationM;
  const elevName = mountainCfg?.name;
  const websiteUrl = mountainCfg?.websiteUrl;
  const snowElevationM = elevSummitM != null ? midMountainElevation(elevSummitM) : undefined;

  const q = useGetLocationWeather(
    locationId,
    snowElevationM != null ? { snowElevationM } : undefined,
    {
      query: {
        enabled: !!locationId,
        queryKey: getGetLocationWeatherQueryKey(
          locationId,
          snowElevationM != null ? { snowElevationM } : undefined,
        ),
      },
    },
  );

  // Back link goes to the BASE TOWN this mountain hangs off (towns-first IA),
  // not the region home. Find the first base town whose nearbyMountainIds
  // includes this mountain; fall back to region home only if no town claims it.
  const baseTown =
    region.baseTowns?.find((bt) => bt.nearbyMountainIds?.includes(locationId ?? "")) ??
    region.baseTowns?.[0] ??
    null;
  const backHref = baseTown ? `~/${region.id}/${baseTown.id}` : `~/${region.id}`;
  const backLabel = baseTown ? t(baseTown.name, baseTown.nameJa ?? baseTown.name) : t(region.name, region.name);

  if (!locationId) {
    return (
      <div className="px-4 md:px-10 py-5 md:py-8 max-w-6xl mx-auto">
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
  const metaName = elevName ?? location?.name ?? locationId;

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageMeta
        title={`${metaName} - snow report, weather & lifts`}
        description={`Live mountain weather for ${metaName} in ${region.name}: on-mountain temperature, snow depth, wind and elevation forecast.`}
        path={`/${region.id}/mountain/${locationId}`}
        jsonLd={[
          placeSchema({
            name: metaName,
            url: `https://feelzlike.com/${region.id}/mountain/${locationId}`,
            description: location?.description,
            latLng:
              elevLat != null && elevLng != null
                ? { lat: elevLat, lng: elevLng }
                : undefined,
          }),
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: region.name, url: `https://feelzlike.com/${region.id}` },
            ...(baseTown
              ? [{ name: baseTown.name, url: `https://feelzlike.com/${region.id}/${baseTown.id}` }]
              : []),
            { name: metaName, url: `https://feelzlike.com/${region.id}/mountain/${locationId}` },
          ]),
        ]}
      />
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {backLabel}
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
        <p className="mt-8 text-muted-foreground">
          {t("Loading mountain conditions…", "山の状況を読込中…")}
        </p>
      ) : q.isError || !current ? (
        <p className="mt-8 text-muted-foreground">
          {t(
            "Mountain conditions unavailable right now.",
            "現在、山の状況を取得できません。",
          )}
        </p>
      ) : (
        <>
          {/* Hero - on-mountain temp, elevation, conditions blurb. */}
          <section className="mt-6 rounded-2xl border border-border bg-white p-6 md:p-8">
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
            {websiteUrl && (
              <div className="mt-5 pt-4 border-t border-border/60">
                <OfficialSiteLink url={websiteUrl} />
              </div>
            )}
          </section>

          {/* ─── FREE ─────────────────────────────────────────────
              Order (May 2026 v4 · request from product):
                1. Conditions right now
                2. Today
                3. Next 24 hours
              The wind/elevation/lift-hold panels moved below the paywall. */}

          {/* Conditions right now · snow depth, incoming snow, wind and
              freezing level. The four numbers an off-mountain skier is
              actually deciding on. */}
          <section className="mt-6 rounded-2xl border border-border bg-white p-5">
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

          {/* Hour by hour · shared component matches Yamanouchi + AU
              resort pages so the powder window strip and grading look
              the same across all 3 regions. */}
          {hourly.length > 0 && (
            <div className="mt-4">
              <HourlyForecast
                hourly={hourly as any}
                utcOffsetSeconds={(data as any).utcOffsetSeconds ?? 0}
                t={t}
                thresholds={POWDER_THRESHOLDS_AU}
                sectionNumber=""
                skiability={{
                  seasonOpen: isLiftSeasonOpen(REGION_COUNTRY[region.id]),
                  snowDepthCm: current?.snowDepth,
                }}
              />
            </div>
          )}

          {/* Snowmaking · honest man-made-snow reality for this resort.
              Self-hides when there is no curated data, and only shows in
              winter. Same shared panel the Snowy Mountains pages use. */}
          {!isGreen && current && (
            <div className="mt-4">
              <SnowmakingPanel
                locationId={locationId}
                tempC={current.temperature}
                humidity={current.humidity}
                hourly={hourly as any}
              />
            </div>
          )}

          {/* ─── PREMIUM ──────────────────────────────────────────
              Next 6 days, elevation forecast and lift-hold likely all
              gated. Free tier sees blurred preview + lock CTA. */}

          {/* PremiumGate · Next 6 days */}
          {daily.length > 1 && (
          <div className="mt-4">
          <PremiumGate
            title="Next 6 days"
            titleJa="今後6日間"
            blurb="Plan further out · 6-day mountain outlook with snow, wind and temperatures."
            blurbJa="6日間の山岳予報 · 降雪・風速・気温の長期見通し。"
          >
            <section className="rounded-2xl border border-border bg-white p-5">
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
          </PremiumGate>
          </div>
          )}

          {/* PremiumGate · Elevation forecast · upper / mid / base snow + temp.
              Self-hides when coords or summit elevation are missing. */}
          {elevLat != null && elevLng != null && elevSummitM != null && (
            <div className="mt-4">
              <PremiumGate
                title="Elevation forecast"
                titleJa="標高別予報"
                blurb="See conditions across upper / mid / base elevations · snow and temperature for each band."
                blurbJa="山頂・中腹・ベースの標高別コンディション · 降雪と気温。"
              >
                <ElevationBands
                  lat={elevLat}
                  lng={elevLng}
                  summitElevationM={elevSummitM}
                  name={elevName}
                />
              </PremiumGate>
            </div>
          )}

          {/* FREE · 7-day powder forecast calendar. Moved here (May 2026 v6)
              to sit right after Elevation forecast so the powder outlook
              reads as a continuation of the multi-day weather story. */}
          {hourly.length > 0 && (
            <div className="mt-4">
              <PowderCalendar hourly={hourly as any} t={t} sectionNumber="" />
            </div>
          )}

          {/* PremiumGate · Mountain dials · MountainSnapshot rings only.
              The wind-driven lift-hold call was removed because the
              per-lift hold panel below delivers it with finer per-lift
              gust tolerances. Order matches Yamanouchi + Snowy Mountains. */}
          <div className="mt-4">
            <PremiumGate
              title="Mountain dials"
              titleJa="マウンテン計器盤"
              blurb="Freezing level, gusts and incoming snow at a glance."
              blurbJa="凍結高度・突風・降雪を一目で。"
            >
              {/* MountainSnapshot needs guaranteed `elevation` and
                  `windSpeed` numbers per its prop contract; guard
                  rather than coerce so the rings only render with
                  real data. */}
              {location?.elevation != null && current.windSpeed != null && (
                <MountainSnapshot
                  resortName={location.name ?? ""}
                  elevation={location.elevation}
                  freezingLevel={current.freezingLevel ?? undefined}
                  gust={current.windGust ?? undefined}
                  windSpeed={current.windSpeed}
                  snowfallNext24h={current.snowfallNext24h ?? undefined}
                  snowfallNext48h={current.snowfallNext48h ?? undefined}
                  snowfallNext72h={current.snowfallNext72h ?? undefined}
                  snowfallOutlookElevationM={current.snowfallOutlookElevationM ?? undefined}
                  snowfallOutlookLevel={current.snowfallOutlookLevel ?? undefined}
                  modelSource={
                    current.dataSource ?? region.weatherSource?.label ?? "Open-Meteo"
                  }
                />
              )}
            </PremiumGate>
          </div>

          {/* Per-lift hold · gated at page level (not just inside the
              PremiumGate) because PremiumGate still renders a lock card
              for free users even when its child returns null. Vic
              mountains have no lift seeds today, so we skip the whole
              section rather than tease a feature that has no data. */}
          {hourly.length > 0 && location?.elevation != null && getLiftsForMountain(locationId).length > 0 && (
            <div className="mt-4">
              <PremiumGate
                title="Per-lift hold forecast"
                titleJa="リフト別ホールド予測"
                blurb="Hour-by-hour hold risk for each named lift on this mountain · uses lift-specific gust tolerances."
                blurbJa="各リフトの時間別ホールドリスク · リフト固有の耐風基準を使用。"
              >
                <LiftWindHoldPanel
                  mountainId={locationId}
                  resortElevationM={location.elevation}
                  hourly={hourly as any}
                  sectionNumber=""
                  t={t}
                  seasonOpen={isLiftSeasonOpen(REGION_COUNTRY[region.id])}
                  snowDepthCm={current.snowDepth}
                />
              </PremiumGate>
            </div>
          )}

          {/* PremiumGate · 24-hour trend chart · interactive temp/snow/wind. */}
          {hourly.length > 0 && (
            <div className="mt-4">
              <PremiumGate
                title="24-hour trend"
                titleJa="24時間推移"
                blurb="Interactive chart · switch between temperature, snowfall and wind for the next 24 hours."
                blurbJa="気温・降雪・風速を切り替えて24時間の推移を確認。"
              >
                <section className="rounded-2xl border border-border bg-white p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <div>
                      <p className="byline text-muted-foreground/70">{t("24-hour trend", "24時間推移")}</p>
                      <h2 className="font-display font-semibold text-xl mt-1 flex items-center gap-2">
                        <BarChart2 className="text-primary w-5 h-5" />
                        {t("How it's tracking", "推移")}
                      </h2>
                    </div>
                    <div className="flex bg-secondary/40 p-1 rounded-xl border border-border/60">
                      {(["temperature", "snowfall", "windSpeed"] as const).map((metric) => (
                        <button
                          key={metric}
                          onClick={() => setActiveChartMetric(metric)}
                          className={cn(
                            "px-3 md:px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                            activeChartMetric === metric
                              ? "bg-foreground text-background shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {metric.replace("Speed", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ForecastChart data={hourly as any} metric={activeChartMetric} />
                </section>
              </PremiumGate>
            </div>
          )}

          {/* PremiumGate · Ensemble forecast · multi-model consensus.
              Self-hides when /api/forecast/{id} returns no data. */}
          <div className="mt-4">
            <PremiumGate
              title="Ensemble forecast"
              titleJa="アンサンブル予報"
              blurb="Multi-model consensus · agreement across BOM, ECMWF and other models for the next 7 days."
              blurbJa="BOM・ECMWFなど複数モデルの合意度を可視化（今後7日間）。"
            >
              {/* Ensemble runs at the SAME elevation the headline snow actually
                  resolved to (mid-mountain on success, village on fail-soft
                  fallback), so the page never tells two snow stories at once. */}
              <EnsembleForecast
                locationId={locationId}
                elevationM={current?.snowfallOutlookElevationM ?? undefined}
              />
            </PremiumGate>
          </div>

          {/* PremiumGate · Personalised triggers · push when conditions hit.
              Hidden in green season - powder alerts are snow-only. */}
          {!isGreen && (
            <div className="mt-4">
              <PremiumGate
                title="Powder & weather alerts"
                titleJa="降雪・気象アラート"
                blurb="Get a push when conditions hit. Set thresholds for snowfall, wind, freezing level."
                blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
              >
                <section className="rounded-2xl border border-border bg-white p-5 md:p-6">
                  <div className="mb-4">
                    <p className="byline text-muted-foreground/70">{t("Alerts", "アラート")}</p>
                    <h2 className="font-display font-semibold text-xl mt-1">
                      {t("Personalised triggers", "パーソナライズされたトリガー")}
                    </h2>
                  </div>
                  <AlertSubscribeForm defaultRegion={region.id as any} />
                </section>
              </PremiumGate>
            </div>
          )}

          {/* Webcams · same shared component used by Yamanouchi.
              Self-hides when no webcam config exists for the mountain. */}
          <div className="mt-4">
            <MountainWebcams
              mountainId={locationId}
              sectionNumber=""
              t={t}
            />
          </div>

          <p className="byline text-muted-foreground/60 mt-8">
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
    snowfallOutlookElevationM?: number | null;
    snowfallOutlookLevel?: string | null;
    windGust?: number | null;
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
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 85 && code <= 86) return Snowflake;
  if (code >= 95) return CloudRain;
  return Cloud;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "-";
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
  const isSnow = Icon === Snowflake || Icon === CloudSnow;
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center gap-1.5 byline text-muted-foreground/70">
        <Icon className={cn("w-3 h-3", isSnow && "text-snow-accent")} strokeWidth={2} /> {label}
      </div>
      <p className={cn("mt-2 font-display font-semibold text-2xl tracking-tight", isSnow ? "text-snow-accent" : "text-foreground")}>
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
  const isSnow = Icon === Snowflake || Icon === CloudSnow;
  return (
    <div>
      <div className="flex items-center gap-1.5 byline text-muted-foreground/70">
        <Icon className={cn("w-3 h-3", isSnow && "text-snow-accent")} strokeWidth={2} /> {label}
      </div>
      <p className={cn("mt-1 font-display font-medium text-lg", isSnow ? "text-snow-accent" : "text-foreground")}>{value}</p>
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
  const isSnow = Icon === Snowflake || Icon === CloudSnow;
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="inline-flex items-center gap-1 text-muted-foreground/70">
        <Icon className={cn("w-3 h-3", isSnow && "text-snow-accent")} strokeWidth={2} /> {label}
      </span>
      <span className={cn("font-medium truncate", isSnow ? "text-snow-accent" : "text-foreground")}>{value}</span>
    </div>
  );
}

export default MountainDetail;
