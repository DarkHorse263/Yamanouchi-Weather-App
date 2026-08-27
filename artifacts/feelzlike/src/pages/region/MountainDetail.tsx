import { useRoute, Link } from "wouter";
import {
  ArrowDown,
  BarChart2,
  ArrowLeft,
  CalendarDays,
  Clock,
  Cloud,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudRain,
  CloudSnow,
  Cable,
  CloudSun,
  Droplets,
  ExternalLink,
  Eye,
  Gauge,
  Mountain as MountainIcon,
  Navigation,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import {
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
  useGetResortSnowReport,
} from "@workspace/api-client-react";
import { ElevationBands } from "@/components/weather/ElevationBands";
import { HourlyForecast } from "@/components/HourlyForecast";
import { PremiumFeaturePrompt } from "@/components/PremiumFeaturePrompt";
import { SnowmakingPanel } from "@/components/weather/SnowmakingPanel";
import { powderThresholdsForCountry } from "@/types/weather";
import { PowderCalendar } from "@/components/PowderCalendar";
import { LiftWindHoldPanel } from "@/components/LiftWindHoldPanel";
import { isLiftSeasonOpen } from "@/lib/skiSeason";
import { REGION_COUNTRY } from "@/regions";
import { MountainWebcams } from "@/components/MountainWebcams";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { baseBandElevation, midMountainElevation } from "@/lib/elevation";
import { getLiftsForMountain } from "@/data/lifts";
import { cn } from "@/lib/utils";
import { useUnits } from "@/components/auth/UserPrefsProvider";
import { UnitsToggle } from "@/components/UnitsToggle";
import { dailyRainMm } from "@/lib/precip";
import { PageMeta } from "@/lib/seo/PageMeta";
import { placeSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";
import { AlertPromoBanner } from "@/components/AlertPromoBanner";
import MountainConditionsSummary from "@/components/weather/MountainConditionsSummary";
import { snowNext24SoWhat, freezingLevelSoWhat } from "@/lib/soWhat";
import { OfficialSiteLink } from "@/components/OfficialSiteLink";
import { SnowReportLink } from "@/components/SnowReportLink";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { getMountainWebcams } from "@/data/webcams";
import { useEffect, useState } from "react";
import { getPublishedMountainCapabilities } from "@/regions/catalogue";
import {
  mountainDetailCopy,
  mountainWindSummary,
  mountainPageMetadata,
} from "@/lib/mountainPageMetadata";

/**
 * Region-agnostic mountain weather page.
 *
 * Used as the RegionLayout fallback for `/mountain/:id` (and `/resort/:id`)
 * when a region hasn't shipped a custom MountainDetail page. Renders the
 * same mountain-weather payload (`/api/weather/:id`) that the TownHome
 * "Weather in mountains" panel pulls from.
 *
 * July 2026: upgraded to the premium "Perisher-style" layout modelled on
 * regions/snowy-mountains/pages/LocationDetail.tsx - aurora hero with live
 * pill + hero webcam thumbnail, dense "conditions right now" glass panel,
 * 5-day mountain strip with snow/rain bars, matched section ordering.
 * Everything fails soft where a mountain has no cam, no reported snow and
 * no lift seeds (most non-AU mountains). Snowy Mountains and Yamanouchi
 * keep their bespoke pages registered via REGION_ROUTERS.
 */
export function MountainDetail() {
  const [, mParams] = useRoute("/mountain/:id");
  const [, rParams] = useRoute("/resort/:id");
  const params = mParams ?? rParams;
  const locationId = params?.id ?? "";
  const { region } = useRegion();
  const { t, language } = useLanguage();
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.season === "green";
  const u = useUnits();
  const [activeChartMetric, setActiveChartMetric] = useState<"temperature" | "snowfall" | "windSpeed">("temperature");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Pull mountain coords + summit elevation from the region config so the
  // elevation-banded forecast panel can request a 3-band Open-Meteo forecast,
  // and so the HEADLINE snow can be derived on-mountain (mid-mountain) rather
  // than at the village. Temp/feels-like/current stay at the village.
  const mountainCfg = region.mountains?.find((m) => m.id === locationId);
  const publicationCapabilities = getPublishedMountainCapabilities(region.id, locationId);
  const isWeatherOnly = publicationCapabilities?.contentMode === "weather-only";
  const powderAlertsAvailable = publicationCapabilities?.powderAlertsAvailable ?? true;
  const capabilityCopy = mountainDetailCopy(isWeatherOnly);
  const elevLat = mountainCfg?.lat;
  const elevLng = mountainCfg?.lng;
  const elevSummitM = mountainCfg?.elevationM;
  const elevName = mountainCfg?.name;
  const websiteUrl = mountainCfg?.websiteUrl;
  const snowReportUrl = isWeatherOnly ? undefined : mountainCfg?.snowReportUrl;
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

  // Curated cams for this mountain (client-side catalogue). The first cam
  // with a direct image powers the hero thumbnail - hotlink-protected
  // sources have no image embed and honestly show nothing in the hero.
  const cams = getMountainWebcams(locationId);
  const heroCam = cams.find((c) => c.embedType === "image" && !!c.embedUrl) ?? null;
  const [heroCamBroken, setHeroCamBroken] = useState(false);
  // A failed image must not suppress the thumbnail for the NEXT mountain in
  // the same SPA session.
  useEffect(() => {
    setHeroCamBroken(false);
  }, [heroCam?.embedUrl]);

  // Resort-REPORTED snow base (see api-server lib/resortSnowReports.ts).
  // Always-200 endpoint - `report` stays null for resorts without a feed
  // adapter and the page keeps showing the model figure.
  const { data: snowReportData } = useGetResortSnowReport(locationId, {
    query: { enabled: !!locationId && !isWeatherOnly } as never,
  });
  const resortReport = isWeatherOnly ? null : snowReportData?.report ?? null;
  // "course" = official off-resort snow-course measurement (weekly, natural
  // snow only) - captioned by source + reading DATE, and it may never assert
  // "no base" (see skiSeason.ts). Absent kind means "resort" (older cache).
  const reportSource: "reported" | "course" =
    resortReport?.kind === "course" ? "course" : "reported";
  // "Xh ago" caption for the reported figure - hour granularity is honest
  // enough for a feed resorts refresh a few times a day. Weekly course
  // readings show the reading date instead so nobody mistakes them for a
  // daily report.
  const reportedAgoLabel = (() => {
    if (!resortReport) return "";
    if (reportSource === "course") {
      const d = new Date(resortReport.updatedAt);
      if (Number.isNaN(d.getTime())) return "";
      // Pin to AEST: the reading is taken on an AU calendar day, and a
      // viewer-local format would shift it a day for overseas visitors.
      return d.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        timeZone: "Australia/Sydney",
      });
    }
    return formatAgo(resortReport.updatedAt, now);
  })();
  // In lift season, a weather-model snow depth is not good enough to headline
  // (grid-cell natural snow, blind to snowmaking - reads ~0 under running
  // lifts). No report in season -> "not reported", never a confident wrong 0.
  // Off-season the model figure returns (melt curve context, nobody misled).
  const seasonOpen = isLiftSeasonOpen(REGION_COUNTRY[region.id]);
  // Powder medals are judged against country-appropriate thresholds - an
  // AU-calibrated bar would over- or under-award powder days elsewhere.
  const powderThresholds = powderThresholdsForCountry(REGION_COUNTRY[region.id]);
  const modelDepthTrusted = isWeatherOnly || !seasonOpen;

  // Link ladder mirrors the curated-URL convention: dedicated lift page if
  // authored, else the (curl-verified) snow report page, else official site.
  // Feeds the wind panel's honest banner (single lift surface since Aug 2026).
  const liftReportUrl = isWeatherOnly
    ? undefined
    : mountainCfg?.liftStatusUrl ?? snowReportUrl ?? websiteUrl;

  // Back link goes to the BASE TOWN this mountain hangs off (towns-first IA),
  // not the region home. Find the first base town whose nearbyMountainIds
  // includes this mountain; fall back to region home only if no town claims it.
  const baseTown =
    region.baseTowns?.find((bt) => bt.nearbyMountainIds?.includes(locationId ?? "")) ??
    region.baseTowns?.[0] ??
    null;
  const backHref = baseTown ? `~/${region.id}/${baseTown.id}` : `~/${region.id}`;
  const backLabel = baseTown ? t(baseTown.name, baseTown.nameJa ?? baseTown.name) : t(region.name, region.name);

  // Seasonal page canvas · shared by loading/error states so they never
  // flash a white body between blue (winter) and green pages.
  const canvasClass = `min-h-[100dvh] ${isGreen ? "bg-[#059669]" : "bg-[#0055FF]"} pb-8 transition-colors duration-500`;

  if (!locationId) {
    return (
      <div className={canvasClass}>
        <div className="px-4 md:px-10 py-5 md:py-8 max-w-7xl mx-auto">
          <p className="text-white/80">
            {t("Mountain not specified.", "スキー場が指定されていません。")}
          </p>
        </div>
      </div>
    );
  }

  const data = q.data as MountainWeather | undefined;
  const current = data?.current;
  const daily = data?.daily ?? [];
  const hourly = data?.hourly ?? [];
  const location = data?.location;
  const metaName = elevName ?? location?.name ?? locationId;
  const pageMetadata = mountainPageMetadata({
    name: metaName,
    regionName: region.name,
    regionId: region.id,
    mountainId: locationId,
    weatherOnly: isWeatherOnly,
  });
  const observedTime = data?.lastUpdated;
  const sourceLabel =
    current?.dataSource ??
    (region.weatherSource
      ? t(region.weatherSource.label, region.weatherSource.labelJa ?? region.weatherSource.label)
      : "Open-Meteo");

  // Snow next 24h: prefer the API-supplied value; otherwise sum the first
  // 24 hourly snowfall buckets so the tile is never empty when we have
  // hourly data.
  const snow24h: number | null = (() => {
    if (current?.snowfallNext24h != null) return current.snowfallNext24h;
    if (hourly.length > 0) {
      return hourly
        .slice(0, 24)
        .reduce((sum, h) => sum + (Number((h as any).snowfall) || 0), 0);
    }
    return null;
  })();

  // Dense "conditions right now" stats · same honesty rules as the Snowy
  // Mountains page: reported base replaces the model figure, model values
  // carry a "· model" label, unknown metrics are omitted rather than 0'd.
  const stats = current
    ? [
        ...(current.feelsLike != null
          ? [{ label: t("feelzlike", "体感"), value: `${u.temp(current.feelsLike)}${u.tempUnit}`, icon: Thermometer }]
          : []),
        ...(current.windSpeed != null
          ? [{
              label: t("Wind", "風速"),
              value: `${u.wind(current.windSpeed)} ${u.windUnit}${(current as any).windDirectionCompass ? ` ${(current as any).windDirectionCompass}` : ""}`,
              icon: Navigation,
              hint: (() => {
                const s = mountainWindSummary(current.windSpeed, isWeatherOnly);
                return s ? t(s.en, s.ja) : null;
              })(),
            }]
          : []),
        ...(current.windGust != null
          ? [{ label: t("Gusts", "突風"), value: `${u.wind(current.windGust)} ${u.windUnit}`, icon: Wind }]
          : []),
        ...(current.humidity != null
          ? [{ label: t("Humidity", "湿度"), value: `${current.humidity}%`, icon: Droplets }]
          : []),
        // A resort-reported base REPLACES the model figure (never shown
        // alongside it - two competing numbers would erode trust in both).
        resortReport
          ? {
              label:
                reportSource === "course"
                  ? `${t(`Snow depth · ${resortReport.sourceName}`, "積雪 · 公式観測")}${reportedAgoLabel ? ` · ${reportedAgoLabel}` : ""}`
                  : `${t("Snow depth · resort reported", "積雪 · リゾート報告")}${reportedAgoLabel ? ` · ${reportedAgoLabel}` : ""}`,
              value:
                // Two-station / range reports carry the lower reading in
                // baseMinCm - render "16-38" so neither station is
                // overstated as THE base. baseCm alone = single figure.
                resortReport.baseMinCm != null &&
                Math.round(resortReport.baseMinCm) !== Math.round(resortReport.baseCm)
                  ? `${u.snowVal(resortReport.baseMinCm)}-${u.snowVal(resortReport.baseCm)} ${u.snowUnit}`
                  : `${u.snowVal(resortReport.baseCm)} ${u.snowUnit}`,
              icon: Snowflake,
            }
          : modelDepthTrusted
            ? {
                label: t("Snow depth · model", "積雪 · 予測値"),
                value: current.snowDepth != null ? `${u.snowVal(current.snowDepth)} ${u.snowUnit}` : "-",
                icon: Snowflake,
              }
            : { label: t("Snow depth · not reported", "積雪 · 報告なし"), value: "-", icon: Snowflake },
        // Model-estimated overnight snow: same "· model" honesty label as
        // snow depth. Omitted (not 0) when the source has no past hours.
        ...(current.snowfallPast24h != null
          ? [{ label: t("Snow last 24h · model", "過去24時間降雪 · 予測値"), value: `${u.snowVal(current.snowfallPast24h, 1)} ${u.snowUnit}`, icon: CloudSnow }]
          : []),
        ...(snow24h != null
          ? [{
              label: t("Snow next 24h", "24時間降雪"),
              value: `${u.snowVal(snow24h, 1)} ${u.snowUnit}`,
              icon: CloudSnow,
              hint: (() => {
                const s = snowNext24SoWhat(snow24h);
                return s ? t(s.en, s.ja) : null;
              })(),
            }]
          : []),
        ...(current.freezingLevel != null
          ? [{
              label: t("Freezing level", "凍結高度"),
              value: `${u.elev(current.freezingLevel)} ${u.elevUnit}`,
              icon: Thermometer,
              hint: (() => {
                const s = freezingLevelSoWhat(current.freezingLevel, location?.elevation);
                return s ? t(s.en, s.ja) : null;
              })(),
            }]
          : []),
        ...(current.pressure != null
          ? [{ label: t("Pressure", "気圧"), value: `${current.pressure} hPa`, icon: Gauge }]
          : []),
        ...(current.visibility != null && current.visibility !== 10000
          ? [{ label: t("Visibility", "視界"), value: `${(current.visibility / 1000).toFixed(0)} km`, icon: Eye }]
          : []),
      ]
    : [];

  if (q.isLoading) {
    return (
      <div className={canvasClass}>
        <div className="px-4 md:px-10 py-10 max-w-7xl mx-auto">
          <p className="text-white/80">{t("Loading mountain conditions…", "山の状況を読込中…")}</p>
        </div>
      </div>
    );
  }
  if (q.isError || !current) {
    return (
      <div className={canvasClass}>
        <div className="px-4 md:px-10 py-10 max-w-7xl mx-auto">
          <p className="text-white/80">
            {t("Mountain conditions unavailable right now.", "現在、山の状況を取得できません。")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={canvasClass}>
      <PageMeta
        title={pageMetadata.title}
        description={pageMetadata.description}
        path={pageMetadata.path}
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

      {/* ─── Aurora hero (Perisher-style) ────────────────── */}
      <section className="relative overflow-hidden isolate">
        {/* Aurora backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] rounded-full opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at center, hsla(210,90%,55%,0.28), transparent 55%), radial-gradient(ellipse at 28% 60%, hsla(265,85%,60%,0.22), transparent 60%), radial-gradient(ellipse at 75% 35%, hsla(180,90%,55%,0.22), transparent 60%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `linear-gradient(to bottom, transparent 65%, ${isGreen ? "#059669" : "#0055FF"} 100%), repeating-linear-gradient(0deg, hsla(0,0%,100%,0.04) 0px, hsla(0,0%,100%,0.04) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(90deg, hsla(0,0%,100%,0.04) 0px, hsla(0,0%,100%,0.04) 1px, transparent 1px, transparent 64px)`,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 pt-8 md:pt-16 pb-6 md:pb-9">
          {/* Back to base town · towns-first IA. */}
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 mb-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {backLabel}
          </Link>

          {/* Source byline + live pill */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
          >
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20">
              {!isWeatherOnly && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
              {t(capabilityCopy.sourceBadge.en, capabilityCopy.sourceBadge.ja)}
            </span>
            <span className="byline text-white/70">
              {t("Source", "出典")} · {sourceLabel}
            </span>
            {location?.elevation != null && (
              <span className="byline text-white/70">
                {t("Elev", "標高")} {u.elev(location.elevation)}{u.elevUnit}
              </span>
            )}
            {websiteUrl && (
              <OfficialSiteLink
                url={websiteUrl}
                className="text-[11px] text-white/70 hover:text-white"
              />
            )}
            {observedTime && (
              <span className="byline text-white/80 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                <Clock className="w-3 h-3" />
                <span>
                  {t("Updated", "更新")}{" "}
                  <span className="text-white tabular-nums">{formatAgo(observedTime, now)}</span>
                </span>
              </span>
            )}
          </motion.div>

          {/* Anonymous units toggle · reaches direct-landing SEO visitors who
              never see the home footer. Hidden for signed-in members. */}
          <div className="mt-4 flex">
            <UnitsToggle tone="onBlue" />
          </div>

          {/* Headline + temperature */}
          <div className="mt-5 md:mt-8 grid md:grid-cols-12 gap-6 md:gap-10 items-end">
            <div className="md:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display font-semibold text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] tracking-tight"
                style={{ letterSpacing: "-0.035em" }}
              >
                <span className="text-white">
                  {t(location?.name ?? metaName, mountainCfg?.nameJa ?? location?.name ?? metaName)}
                </span>
              </motion.h1>
              {(mountainCfg?.blurb || location?.description) && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="mt-4 text-white/80 text-base md:text-lg max-w-xl leading-relaxed"
                >
                  {/* Curated blurb from the region config carries the ja
                      variant; the server catalogue description is EN-only,
                      so it is only a fallback (and never shown in ja mode
                      when a curated blurb exists). */}
                  {mountainCfg?.blurb
                    ? t(mountainCfg.blurb, mountainCfg.blurbJa)
                    : location?.description}
                </motion.p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-5 relative"
            >
              <div className="relative">
                <div className="flex items-start gap-3">
                  <span
                    className="display-number text-[clamp(7rem,18vw,11rem)] text-white"
                    data-numeric
                  >
                    {u.temp(current.temperature) ?? "-"}
                  </span>
                  <span className="font-display text-white/70 text-3xl md:text-4xl mt-4">{u.tempUnit}</span>
                </div>
                <p className="byline text-white/80 mt-1">
                  {current.weatherDescription}
                  {current.feelsLike != null && <> · feelzlike {u.temp(current.feelsLike)}°</>}
                </p>
              </div>
            </motion.div>
          </div>

          {/* "up there today" · plain-english conditions paragraph (embeds
              the day narrative + snow outlook + wind read + base) · every
              clause fails soft, never blocks the page */}
          <MountainConditionsSummary
            hourly={hourly}
            current={current}
            utcOffsetSeconds={(data as any)?.utcOffsetSeconds ?? 0}
            isMountain
            lang={language}
            snowNext24Cm={snow24h}
            snowfallOutlookElevationM={current.snowfallOutlookElevationM}
            snowfallOutlookLevel={current.snowfallOutlookLevel}
            reportedBaseCm={resortReport?.baseCm}
            reportedBaseMinCm={resortReport?.baseMinCm}
            reportedBaseSource={resortReport ? reportSource : undefined}
            trustedModelBaseCm={modelDepthTrusted ? current.snowDepth : undefined}
            freezingLevelM={current.freezingLevel}
            villageElevationM={elevSummitM != null ? baseBandElevation(elevSummitM) : undefined}
            midElevationM={elevSummitM != null ? midMountainElevation(elevSummitM) : undefined}
          />

          {/* live cam thumbnail · a real look at the mountain right in the
              hero. Only renders where a direct cam image exists; hides
              itself on load failure - never a broken-image placeholder. */}
          {heroCam && !heroCamBroken && (
            <button
              type="button"
              onClick={() => {
                document
                  .getElementById("webcams-section")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mt-4 flex items-center gap-3 group text-left"
              data-testid="button-hero-cam"
            >
              <span className="relative block w-36 shrink-0 aspect-video overflow-hidden rounded-xl border border-white/15">
                <img
                  src={heroCam.embedUrl!}
                  alt={`${capabilityCopy.heroCamAltPrefix} · ${t(heroCam.name, heroCam.nameJa ?? heroCam.name)}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroCamBroken(true)}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {!isWeatherOnly && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {t(capabilityCopy.heroCamBadge.en, capabilityCopy.heroCamBadge.ja)}
                </span>
              </span>
              <span className="byline text-white/70 group-hover:text-white transition-colors">
                {t(heroCam.name, heroCam.nameJa ?? heroCam.name)} · {t("see all cams", "全カメラを見る")} ↓
              </span>
            </button>
          )}

          {/* CONDITIONS RIGHT NOW · dense glass measurements panel · the
              first thing an off-mountain skier actually wants to see. */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-6 md:mt-9 glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="byline text-muted-foreground">{t("conditions", "現在の")}</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">
                  {t("right now", "状況")}
                </h2>
              </div>
              <p className="byline text-muted-foreground/70 hidden md:block">
                {stats.length} {t("measurements", "項目")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-5 gap-x-4">
              {stats.map((s, i) => {
                const isSnow = s.icon === Snowflake || s.icon === CloudSnow;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center gap-1.5 byline text-muted-foreground/80 mb-1.5">
                      <s.icon className={cn("w-3 h-3", isSnow ? "text-snow-accent" : "text-muted-foreground/60")} />
                      {s.label}
                    </div>
                    <p
                      className={cn(
                        "font-display text-2xl md:text-3xl tracking-tight",
                        isSnow ? "text-snow-accent" : "text-foreground",
                      )}
                      data-numeric
                    >
                      {s.value}
                    </p>
                    {"hint" in s && (s as any).hint && (
                      <p className="mt-1 text-xs leading-snug text-sky-700">{(s as any).hint}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Cross-check link to the resort's own published snow report -
                either figure (model or reported) is always one tap from the
                primary source. */}
            {snowReportUrl && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <SnowReportLink
                  url={snowReportUrl}
                  className="text-slate-500 hover:text-slate-800"
                />
              </div>
            )}
          </motion.div>

          {/* Scroll cue */}
          <div className="mt-6 md:mt-8 flex items-center gap-2 text-white/60">
            <span className="byline text-white/60">
              {t(capabilityCopy.scrollCue.en, capabilityCopy.scrollCue.ja)}
            </span>
            <ArrowDown className="w-3 h-3" />
          </div>
        </div>
      </section>

      {/* ─── Body ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-20 space-y-5 md:space-y-6 -mt-2">
        {/* HOUR BY HOUR · shared component so the powder window strip and
            grading look the same across all regions. */}
        {hourly.length > 0 && (
          <>
            <HourlyForecast
              hourly={hourly as any}
              utcOffsetSeconds={(data as any).utcOffsetSeconds ?? 0}
              t={t}
              thresholds={powderThresholds}
              sectionNumber=""
              skiability={
                isWeatherOnly
                  ? undefined
                  : {
                      seasonOpen,
                      // In season a model depth is suppressed (null = unknown),
                      // never surfaced as a confident wrong ~0.
                      snowDepthCm: resortReport
                        ? resortReport.baseCm
                        : modelDepthTrusted
                          ? current?.snowDepth
                          : null,
                      snowDepthSource: resortReport ? reportSource : "model",
                    }
              }
              snowfallOutlook={{
                next24hCm: current.snowfallNext24h,
                next48hCm: current.snowfallNext48h,
                next72hCm: current.snowfallNext72h,
                elevationM: current.snowfallOutlookElevationM,
                level: current.snowfallOutlookLevel,
                source: sourceLabel,
              }}
            />
            {powderAlertsAvailable && (
              <PremiumFeaturePrompt
                id="mountain-powder-alerts"
                title={t("get powder alerts by email", "降雪アラートをメールで受け取る")}
                blurb={t(
                  "we'll push an alert the moment powder hits the forecast for this mountain.",
                  "この山の予報にパウダーが現れた瞬間にアラートをお送りします。",
                )}
                href="/premium"
              />
            )}
          </>
        )}

        {/* SNOWMAKING · honest man-made-snow reality for this resort.
            Self-hides when there is no curated data; winter only. */}
        {!isWeatherOnly && !isGreen && (
          <SnowmakingPanel
            locationId={locationId}
            tempC={current.temperature}
            humidity={current.humidity}
            hourly={hourly as any}
          />
        )}

        {/* WEATHER OUTLOOK · free 5-day mountain strip with snow/rain bars.
            Anything past day 5 is gated below in the extended outlook. */}
        {daily.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-3xl p-5 md:p-8"
          >
            <div className="flex items-end justify-between mb-4 gap-3">
              <div>
                <p className="byline text-muted-foreground">{t("Weather outlook", "週間予報")}</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                  <CalendarDays className="text-primary w-5 h-5" />
                  {t("5-day mountain forecast", "5日間の山岳予報")}
                </h2>
              </div>
              {location?.elevation != null && (
                <p className="byline text-muted-foreground/70 hidden md:block tabular-nums">
                  {u.elev(location.elevation)}{u.elevUnit} · {t("top elevation", "山頂標高")}
                </p>
              )}
            </div>

            {(() => {
              const days = daily.slice(0, 5);
              const maxSnow = Math.max(0.1, ...days.map((d) => Number(d.snowfallSum) || 0));
              const maxRain = Math.max(0.1, ...days.map((d) => dailyRainMm(d as any) ?? 0));
              return (
                <div className="grid gap-px rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 grid-cols-3 md:grid-cols-5">
                  {days.map((day, i) => {
                    const snow = Number(day.snowfallSum) || 0;
                    const rain = dailyRainMm(day as any) ?? 0;
                    const dispCode = displayDayCode(day.weatherCode, snow, rain);
                    const snowH = Math.round((snow / maxSnow) * 100);
                    const rainH = Math.round((rain / maxRain) * 100);
                    return (
                      <div key={day.date} className="bg-background/40 px-3 py-4 md:px-4 md:py-4 flex flex-col items-center text-center gap-2">
                        <p className="font-display font-medium text-base md:text-lg text-foreground tracking-tight">
                          {i === 0 ? t("Today", "今日") : format(parseISO(day.date), "EEE")}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground tabular-nums -mt-1">
                          {format(parseISO(day.date), "d MMM")}
                        </p>

                        <div className="my-1.5 text-primary/90">
                          <WeatherIcon code={dispCode} className="w-9 h-9 md:w-11 md:h-11" />
                        </div>
                        <p className="text-xs text-muted-foreground capitalize line-clamp-1 leading-snug min-h-[1.1em]">
                          {(day.weatherDescription || "").toLowerCase()}
                        </p>

                        <div className="flex items-baseline justify-center gap-2 font-display mt-1" data-numeric>
                          <span className="text-foreground text-2xl md:text-3xl font-medium">
                            {day.maxTemp != null ? `${u.temp(day.maxTemp)}°` : "-"}
                          </span>
                          <span className="text-muted-foreground text-base">
                            {day.minTemp != null ? `${u.temp(day.minTemp)}°` : "-"}
                          </span>
                        </div>

                        {/* snowfall / rainfall bars */}
                        <div className="w-full flex items-end justify-center gap-1.5 h-10 mt-2" aria-hidden>
                          <div className="flex flex-col items-center justify-end h-full">
                            <div
                              className="w-3 rounded-t-sm bg-snow-accent/80"
                              style={{ height: `${snow > 0 ? Math.max(8, snowH) : 0}%` }}
                              title={`${snow.toFixed(1)} cm snow`}
                            />
                            <Snowflake className="w-3 h-3 text-snow-accent/80 mt-1" />
                          </div>
                          <div className="flex flex-col items-center justify-end h-full">
                            <div
                              className="w-3 rounded-t-sm bg-blue-500/60"
                              style={{ height: `${rain > 0 ? Math.max(8, rainH) : 0}%` }}
                              title={`${rain.toFixed(1)} mm rain`}
                            />
                            <CloudRain className="w-3 h-3 text-blue-500/70 mt-1" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs tabular-nums text-foreground/80 mt-1">
                          <span className="font-medium text-snow-accent">
                            {snow > 0 ? `${u.snowVal(snow, snow >= 10 ? 0 : 1)}${u.snowUnit}` : "-"}
                          </span>
                          <span className="text-muted-foreground/50">/</span>
                          <span className="font-medium text-blue-700">{rain > 0 ? `${rain.toFixed(rain >= 10 ? 0 : 1)}mm` : "-"}</span>
                        </div>

                        {day.windSpeedMax != null && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                            <Wind className="w-3 h-3" />
                            <span className="tabular-nums font-medium text-foreground/90">{u.wind(day.windSpeedMax)}</span>
                            <span>{u.windUnit}</span>
                          </div>
                        )}

                        {day.sunrise && day.sunset && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 pt-2 border-t border-border/50 w-full justify-center tabular-nums">
                            <span className="inline-flex items-center gap-1"><Sunrise className="w-3 h-3" />{fmtTime(day.sunrise)}</span>
                            <span className="inline-flex items-center gap-1"><Sunset className="w-3 h-3" />{fmtTime(day.sunset)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-snow-accent/80" /> {t("Snowfall", "降雪")}</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60" /> {t("Rainfall", "降雨")}</span>
            </div>
          </motion.div>
        )}

        {/* PREMIUM · Extended outlook · the 5-day strip above is free; this
            gates whatever the region's forecast window extends to (14 days
            for AU, shorter elsewhere). Skipped entirely when the payload has
            nothing past day 5 - a lock over empty data would be a tease. */}
        {daily.length > 5 && (
          <PremiumGate
            title="Next 6 days"
            titleJa="今後6日間"
            blurb="See further out than the free 5-day window · extended outlook for trip planning."
            blurbJa="無料5日予報を超える長期予報 · 旅行計画に。"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <div className="flex items-end justify-between mb-4 gap-3">
                <div>
                  <p className="byline text-muted-foreground">{t("Weather outlook", "週間予報")}</p>
                  <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                    <CalendarDays className="text-primary w-5 h-5" />
                    {t("Extended (14-day)", "長期予報（14日間）")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
                    {t(
                      "early outlook · the further ahead, the less certain. treat snow amounts beyond a week as a guide, not a promise.",
                      "先の予報ほど不確実です。1週間先の降雪量は目安としてご覧ください。",
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {daily.slice(5, 14).map((day) => {
                  const snow = Number(day.snowfallSum) || 0;
                  return (
                    <div key={day.date} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
                      <p className="font-display text-base text-foreground">
                        {format(parseISO(day.date), "EEE d MMM")}
                      </p>
                      <div className="my-2 text-primary/90 inline-block">
                        <WeatherIcon code={displayDayCode(day.weatherCode, snow, dailyRainMm(day as any))} className="w-7 h-7" />
                      </div>
                      <div className="flex items-baseline justify-center gap-1.5 font-display" data-numeric>
                        <span className="text-foreground text-lg">{day.maxTemp != null ? `${u.temp(day.maxTemp)}°` : "-"}</span>
                        <span className="text-muted-foreground/60 text-xs">{day.minTemp != null ? `${u.temp(day.minTemp)}°` : "-"}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs tabular-nums mt-1.5">
                        <Snowflake className="w-3 h-3 text-snow-accent/80" />
                        <span className="font-medium text-snow-accent">
                          {snow > 0 ? `${u.snowVal(snow, snow >= 10 ? 0 : 1)}${u.snowUnit}` : "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </PremiumGate>
        )}

        {/* PREMIUM · Elevation forecast · upper / mid / base snow + temp.
            Self-hides when coords or summit elevation are missing. */}
        {elevLat != null && elevLng != null && elevSummitM != null && (
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
        )}

        {/* PREMIUM · 7-day powder forecast calendar · sits right after
            Elevation forecast so the powder outlook reads as a continuation
            of the multi-day weather story. Gated Aug 2026 (owner request) to
            match the rest of the plan-ahead bundle. */}
        {hourly.length > 0 && (
          <PremiumGate
            title="Powder forecast"
            titleJa="パウダー予報"
            blurb="Best powder window each day · next 5 days."
            blurbJa="毎日のベストパウダーウィンドウ · 5日先まで。"
          >
            <PowderCalendar hourly={hourly as any} t={t} thresholds={powderThresholds} sectionNumber="" />
          </PremiumGate>
        )}

        {powderAlertsAvailable && <AlertPromoBanner />}

        {/* The old reference-only "On the snow" lift card was merged into the
            per-lift wind panel below (Aug 2026) - with no live feed both
            surfaces listed the same lifts. The official-report link now lives
            in the wind panel's honest banner. */}

        {/* PREMIUM · Mountain dials · MountainSnapshot rings only. The
            wind-driven lift-hold call lives in the per-lift panel below. */}
        {!isGreen && (
          <PremiumGate
            title="Mountain dials"
            titleJa="マウンテン計器盤"
            blurb="Freezing level and gusts at a glance."
            blurbJa="凍結高度・突風を一目で。"
          >
            {/* MountainSnapshot needs guaranteed `elevation` and `windSpeed`
                numbers per its prop contract; guard rather than coerce so
                the rings only render with real data. */}
            {location?.elevation != null && current.windSpeed != null && (
              <MountainSnapshot
                resortName={location.name ?? ""}
                elevation={location.elevation}
                freezingLevel={current.freezingLevel ?? undefined}
                gust={current.windGust ?? undefined}
                windSpeed={current.windSpeed}
                formatWind={(kmh) => u.wind(kmh) ?? kmh}
                windUnitLabel={u.windUnit}
                formatElevation={(m) => u.elev(m) ?? m}
                elevationUnitLabel={u.elevUnit}
              />
            )}
          </PremiumGate>
        )}

        {/* PREMIUM · Per-lift hold · gated at page level (not just inside
            the PremiumGate) because PremiumGate still renders a lock card
            for free users even when its child returns null. Mountains with
            no lift seeds skip the whole section rather than tease a feature
            that has no data. */}
        {/* FREE · one-tap official lift report · kept OUTSIDE the premium
            gate so free visitors don't lose the report link now that the
            old free "On the snow" card is gone (merged Aug 2026). */}
        {!isWeatherOnly && !isGreen && liftReportUrl && (
          <a
            href={liftReportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl bg-white/10 border border-white/25 px-3.5 py-3 transition-colors hover:bg-white/15"
          >
            {/* Sits directly on the blue page canvas · white-on-blue idiom
                only (text-foreground/text-sky-700 here = illegible black type). */}
            <Cable className="w-4 h-4 text-sky-200 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-white">
                {t(
                  "we don't run a live lift feed for this resort yet · today's open lifts and runs are best checked on the official report.",
                  "このリゾートのライブリフト情報はまだ提供していません · 本日の運行状況は公式レポートでご確認ください。",
                )}
              </p>
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 underline underline-offset-2 group-hover:text-white">
                {t(`open ${elevName ?? location?.name ?? "resort"} lift report`, "公式リフトレポートを開く")}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </span>
            </div>
          </a>
        )}

        {!isWeatherOnly && hourly.length > 0 && location?.elevation != null && getLiftsForMountain(locationId).length > 0 && (
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
              seasonOpen={seasonOpen}
              snowDepthCm={
                resortReport
                  ? resortReport.baseCm
                  : modelDepthTrusted
                    ? current.snowDepth
                    : null
              }
              snowDepthSource={resortReport ? reportSource : "model"}
              liftReportUrl={liftReportUrl}
              resortName={elevName ?? location?.name ?? null}
            />
          </PremiumGate>
        )}

        {/* PREMIUM · 24-hour trend chart · interactive temp/snow/wind. */}
        {hourly.length > 0 && (
          <PremiumGate
            title="24-hour trend"
            titleJa="24時間推移"
            blurb="Interactive chart · switch between temperature, snowfall and wind for the next 24 hours."
            blurbJa="気温・降雪・風速を切り替えて24時間の推移を確認。"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-5 md:p-8"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-3">
                <div>
                  <p className="byline text-muted-foreground">{t("24-hour trend", "24時間推移")}</p>
                  <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 flex items-center gap-2">
                    <BarChart2 className="text-primary w-5 h-5" />
                    {t("How it's tracking", "推移")}
                  </h2>
                </div>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
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
            </motion.div>
          </PremiumGate>
        )}

        {/* PREMIUM · Personalised triggers · push when conditions hit.
            Hidden in green season - powder alerts are snow-only. */}
        {!isGreen && powderAlertsAvailable && (
          <PremiumGate
            title="Powder & weather alerts"
            titleJa="降雪・気象アラート"
            blurb="Get a push when conditions hit. Set thresholds for snowfall, wind, freezing level."
            blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
          >
            <div className="glass rounded-3xl p-5 md:p-8">
              <div className="mb-4">
                <p className="byline text-muted-foreground">{t("Alerts", "アラート")}</p>
                <h2 className="font-display font-semibold text-xl md:text-2xl mt-1">
                  {t("Personalised triggers", "パーソナライズされたトリガー")}
                </h2>
              </div>
              <AlertSubscribeForm defaultRegion={region.id} defaultMountain={locationId} />
            </div>
          </PremiumGate>
        )}

        {/* Webcams (free) · shared component, self-hides when no webcam
            config exists for the mountain. The hero cam thumbnail scrolls
            here. */}
        <div id="webcams-section" className="scroll-mt-6 glass rounded-3xl p-5 md:p-8 [&_section]:mt-0">
          <MountainWebcams
            mountainId={locationId}
            sectionNumber=""
            t={t}
            liveLabels={!isWeatherOnly}
          />
        </div>

        <p className="byline text-white/60 mt-8">
          {t(
            `Source: ${sourceLabel} · elevation-corrected for ${location?.elevation != null ? `${u.elev(location.elevation)}${u.elevUnit}` : "?"}`,
            `出典: ${sourceLabel} · 標高${location?.elevation != null ? `${u.elev(location.elevation)}${u.elevUnit}` : "?"}に補正`,
          )}
        </p>
      </div>
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
    pressure?: number | null;
    dataSource?: string;
    freezingLevel?: number | null;
    snowfallPast24h?: number | null;
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
    rainSum?: number | null;
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

function WeatherIcon({ code, isDay = true, className = "w-5 h-5" }: { code: number | null | undefined; isDay?: boolean; className?: string }) {
  if (code == null) return <Cloud className={className} />;
  if (code === 0) return <Sun className={className} />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className={className} /> : <Cloud className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} />;
  if (code >= 61 && code <= 67) return <CloudRain className={className} />;
  if (code >= 71 && code <= 77) return <Snowflake className={cn("text-snow-accent fill-snow-accent/15", className)} />;
  if (code >= 80 && code <= 82) return <CloudRain className={className} />;
  if (code >= 85 && code <= 86) return <Snowflake className={cn("text-snow-accent fill-snow-accent/15", className)} />;
  if (code >= 95) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "-";
}
export default MountainDetail;

function formatAgo(iso: string | undefined | null, now: number): string {
  if (!iso) return "-";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const diffSec = Math.max(0, Math.round((now - t) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.round(diffSec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

function displayDayCode(
  code: number | null | undefined,
  snowfallSumCm: number | null | undefined,
  rainMm: number | null | undefined,
): number | null | undefined {
  const snow = Number(snowfallSumCm) || 0;
  const rain = Number(rainMm) || 0;
  if (code == null) return code;
  const isWetOrStormy = (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  if (snow >= 1 && isWetOrStormy && snow / 0.7 > rain) return 75; // snow-led day
  // Inverse: a rain-dominant day with trivial snow can still carry a snow
  // moment-code - show the rain icon to match the server's "Rain" label.
  const isSnowCode = (code >= 71 && code <= 77) || code === 85 || code === 86;
  if (snow < 0.5 && rain >= 2 && isSnowCode) return 63; // rain-led day
  return code;
}
