import { useRoute, Link } from "wouter";
import { useGetLocationWeather } from "@workspace/api-client-react";
import {
  ResortHero,
  LiveConditions,
  MountainOutlook,
  MountainSnapshot,
  SafetyStrip,
  type ConditionStat,
  type SafetyLink,
} from "@workspace/feelzlike-dashboard";
import { PremiumGate } from "@workspace/feelzlike-shell";
import { ElevationBands } from "@/components/weather/ElevationBands";
import {
  Thermometer,
  Navigation,
  Wind,
  Droplets,
  Snowflake,
  Gauge,
  CloudRain,
  Eye,
  AlertTriangle,
  PhoneCall,
  Map,
  ExternalLink,
  Cable,
  Camera,
  Globe,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, useRegion } from "@workspace/feelzlike-shell";
import { useState } from "react";
import { PageMeta } from "@/lib/seo/PageMeta";
import { placeSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";
import { HourlyForecast } from "@/components/HourlyForecast";
import { PowderCalendar } from "@/components/PowderCalendar";
import { MountainWebcams } from "@/components/MountainWebcams";
import { LiftWindHoldPanel } from "@/components/LiftWindHoldPanel";
import { isLiftSeasonOpen } from "@/lib/skiSeason";
import { REGION_COUNTRY } from "@/regions";
import { getLiftsForMountain } from "@/data/lifts";
import { ForecastChart } from "@/components/weather/ForecastChart";
import { EnsembleForecast } from "@/components/weather/EnsembleForecast";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { cn } from "@/lib/utils";
import { BarChart2 } from "lucide-react";

type WeatherId = Parameters<typeof useGetLocationWeather>[0];

interface ResortProfile {
  /** Optional override; falls back to mountain.websiteUrl from region config */
  websiteUrl?: string;
  liftStatusUrl?: string;
  webcamUrl?: string;
}

/**
 * Curated overrides for resort-specific deep-links (lift status pages, webcam
 * indexes). The website URL is sourced from `region.mountains[].websiteUrl`
 * by default - only override here if the resort uses a different page.
 *
 * After the Option B 22-mountain refactor, all 18 Shiga Kogen sub-areas share
 * the same authority lift-status + webcam pages, so we derive those defaults
 * from `parentId === "shiga-kogen"` instead of listing every slug.
 */
const SHIGA_KOGEN_DEFAULTS: ResortProfile = {
  liftStatusUrl: "https://www.shigakogen-ski.or.jp/",
  webcamUrl: "https://www.shigakogen.gr.jp/english/livecamera/",
};

/**
 * Lift operating windows for the Yamanouchi resorts. Most Shiga Kogen
 * sub-areas run the same daytime window; X-JAM Takaifuji and Ryuoo add
 * night skiing. We fall back to the generic Shiga Kogen window when a
 * sub-area is not listed explicitly.
 */
const JP_LIFT_HOURS_DEFAULT = {
  hours: "First lifts 8:30 · last lifts 16:30",
  hoursJa: "始発リフト8:30 · 最終16:30",
};
const JP_LIFT_HOURS: Record<string, { hours: string; hoursJa: string; note?: string; noteJa?: string }> = {
  ryuoo: {
    hours: "First lifts 8:00 · last lifts 16:30",
    hoursJa: "始発リフト8:00 · 最終16:30",
    note: "Night skiing select dates · until 21:00",
    noteJa: "ナイター営業日あり · 21:00まで",
  },
  "xjam-takaifuji": {
    hours: "First lifts 8:00 · last lifts 17:00",
    hoursJa: "始発リフト8:00 · 最終17:00",
    note: "Night skiing daily · until 21:30",
    noteJa: "毎日ナイター営業 · 21:30まで",
  },
  "yomase-onsen": {
    hours: "First lifts 8:30 · last lifts 16:30",
    hoursJa: "始発リフト8:30 · 最終16:30",
    note: "Night skiing select dates · until 21:00",
    noteJa: "ナイター営業日あり · 21:00まで",
  },
  "kita-shiga-komaruyama": {
    hours: "First lifts 8:30 · last lifts 16:30",
    hoursJa: "始発リフト8:30 · 最終16:30",
  },
};

const PROFILES: Record<string, ResortProfile> = {
  "ryuoo": {
    liftStatusUrl: "https://www.ryuoo.com/en/winter/lift/",
    webcamUrl: "https://www.ryuoo.com/en/winter/livecamera/",
  },
  "xjam-takaifuji": {
    liftStatusUrl: "https://kitashiga.net/winter/",
    webcamUrl: "https://kitashiga.net/livecam/",
  },
  "yomase-onsen": {
    liftStatusUrl: "https://kitashiga.net/winter/",
    webcamUrl: "https://kitashiga.net/livecam/",
  },
  "kita-shiga-komaruyama": {
    liftStatusUrl: "https://kitashiga.net/winter/",
    webcamUrl: "https://kitashiga.net/livecam/",
  },
};

export default function ResortDetail() {
  const [, mParams] = useRoute("/mountain/:id");
  const [, rParams] = useRoute("/resort/:id");
  const params = mParams ?? rParams;
  const id = params?.id ?? "";
  const { t } = useLanguage();
  const { region } = useRegion();
  const [activeChartMetric, setActiveChartMetric] = useState<"temperature" | "snowfall" | "windSpeed">("temperature");

  // Source of truth for "is this a real mountain in this region" is the
  // region config - so any mountain added to yamanouchi.ts works automatically.
  const mountain = (region.mountains ?? []).find((m) => m.id === id);
  const enabled = !!mountain;
  const { data, isLoading, error } = useGetLocationWeather(id as WeatherId, {
    query: { enabled, refetchInterval: 600_000 } as never,
  });

  if (!enabled) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="font-display font-semibold text-2xl text-foreground">
          {t("Resort not found", "スキー場が見つかりません")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t(
            "We don't have a profile for this mountain yet.",
            "このスキー場のプロフィールはまだありません。",
          )}
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="byline text-muted-foreground">
          {t("Reading live conditions…", "ライブ状況を取得中…")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="text-destructive font-semibold">
          {t("Could not load weather data.", "天気データを取得できませんでした。")}
        </p>
      </div>
    );
  }

  const { location, current, daily, hourly } = data;
  const observedAt = (data as any).lastUpdated as string | undefined;
  const isShigaSubArea = mountain?.parentId === "shiga-kogen";
  const profile: ResortProfile = {
    websiteUrl: mountain?.websiteUrl,
    ...(isShigaSubArea ? SHIGA_KOGEN_DEFAULTS : {}),
    ...(PROFILES[id] ?? {}),
  };

  const stats: ConditionStat[] = [
    { label: t("feelzlike", "体感"), value: `${Math.round(current.feelsLike)}°C`, icon: Thermometer },
    {
      label: t("Wind", "風"),
      value: `${current.windSpeed} km/h${current.windDirectionCompass ? ` ${current.windDirectionCompass}` : ""}`,
      icon: Navigation,
    },
    ...(current.windGust
      ? [{ label: t("Gusts", "突風"), value: `${current.windGust} km/h`, icon: Wind }]
      : []),
    { label: t("Humidity", "湿度"), value: `${current.humidity}%`, icon: Droplets },
    {
      label: t("Snow depth", "積雪"),
      value: current.snowDepth != null ? `${current.snowDepth} cm` : "-",
      icon: Snowflake,
    },
    ...(current.dewpoint !== undefined
      ? [{ label: t("Dew point", "露点"), value: `${Math.round(current.dewpoint)}°C`, icon: Droplets }]
      : []),
    ...(current.pressure !== undefined
      ? [{ label: t("Pressure", "気圧"), value: `${Math.round(current.pressure)} hPa`, icon: Gauge }]
      : []),
    ...(current.visibility && current.visibility !== 10000
      ? [{ label: t("Visibility", "視程"), value: `${(current.visibility / 1000).toFixed(0)} km`, icon: Eye }]
      : []),
    ...(current.freezingLevel !== undefined
      ? [{ label: t("Freezing level", "凍結高度"), value: `${current.freezingLevel} m`, icon: Snowflake }]
      : []),
    ...(daily?.[0]?.precipitationSum != null
      ? [{ label: t("Today rain", "本日降水"), value: `${daily[0].precipitationSum.toFixed(1)} mm`, icon: CloudRain }]
      : []),
  ];

  const safetyLinks: SafetyLink[] = [
    {
      label: t("JMA weather warnings", "気象警報・注意報"),
      detail: t("Japan Meteorological Agency · official alerts", "気象庁公式警報・注意報"),
      href: "https://www.jma.go.jp/bosai/warning/#area_type=offices&area_code=200000",
      icon: AlertTriangle,
    },
    {
      label: t("Police · 110", "警察 · 110番"),
      detail: t("Tap to call police directly", "タップで警察へ発信"),
      href: "tel:110",
      icon: PhoneCall,
    },
    {
      label: t("Fire & ambulance · 119", "消防・救急 · 119番"),
      detail: t("Tap to call fire / ambulance directly", "タップで消防・救急へ発信"),
      href: "tel:119",
      icon: PhoneCall,
    },
    {
      label: t("Nagano road conditions", "長野県道路状況"),
      detail: t("Nagano Prefecture live road & chain regulation map", "長野県ライブ道路・チェーン規制マップ"),
      href: "https://www.pref.nagano.lg.jp/douroka/",
      icon: Map,
    },
  ];

  // Back to base town · towns-first IA, fixes mountain dead-end.
  const baseTown =
    region.baseTowns?.find((bt) => bt.nearbyMountainIds?.includes(id)) ??
    region.baseTowns?.[0] ??
    null;

  return (
    <div className="bg-background">
      <PageMeta
        title={`${location.name} - snow report, weather & lifts`}
        description={`Live conditions at ${location.name} in ${region.name}: feelzlike temperature, snow depth, wind, a 6-day elevation forecast and lift-hold outlook.`}
        path={`/${region.id}/mountain/${id}`}
        jsonLd={[
          placeSchema({
            name: location.name,
            url: `https://feelzlike.com/${region.id}/mountain/${id}`,
            description: location.description,
            latLng:
              mountain?.lat != null && mountain?.lng != null
                ? { lat: mountain.lat, lng: mountain.lng }
                : undefined,
          }),
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: region.name, url: `https://feelzlike.com/${region.id}` },
            ...(baseTown
              ? [{ name: baseTown.name, url: `https://feelzlike.com/${region.id}/${baseTown.id}` }]
              : []),
            { name: location.name, url: `https://feelzlike.com/${region.id}/mountain/${id}` },
          ]),
        ]}
      />
      {baseTown && (
        <div className="max-w-7xl mx-auto px-5 md:px-10 pt-5 md:pt-7">
          <Link
            href={`~/${region.id}/${baseTown.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-sky-700/80 hover:text-sky-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t(baseTown.name, baseTown.nameJa ?? baseTown.name)}
          </Link>
        </div>
      )}
      <ResortHero
        name={location.name}
        description={location.description}
        elevation={location.elevation}
        temperatureC={current.temperature}
        feelsLikeC={current.feelsLike}
        weatherDescription={current.weatherDescription}
        sourceLabel={`${t("Source", "出典")} · Open-Meteo + JMA models`}
        observedAt={observedAt}
        scrollCue={t("Live conditions below", "ライブ状況は下へ")}
      />

      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-16 space-y-5 md:space-y-6 -mt-2">
        {/* Operating hours strip · matches AU resort hero. Sits above
            Conditions Right Now so visitors see first / last lifts before
            scrolling. */}
        {(() => {
          const lh = JP_LIFT_HOURS[id] ?? JP_LIFT_HOURS_DEFAULT;
          return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 -mb-2">
              <span className="byline text-muted-foreground/80 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
                <Cable className="w-3 h-3 text-primary" />
                <span className="text-foreground">
                  {t(("hours" in lh ? lh.hours : JP_LIFT_HOURS_DEFAULT.hours), ("hoursJa" in lh ? lh.hoursJa : JP_LIFT_HOURS_DEFAULT.hoursJa))}
                </span>
                {"note" in lh && lh.note && (
                  <span className="text-muted-foreground/70">· {t(lh.note, lh.noteJa ?? lh.note)}</span>
                )}
              </span>
            </div>
          );
        })()}

        {/* ─── FREE ─────────────────────────────────────────────
            Order matches AU resort pages (May 2026 v5):
              1. Conditions right now
              2. Hourly forecast (next 24h)
              3. Powder factor (Yamanouchi extra)
              4. Powder forecast (Yamanouchi extra)
            Premium 6-day, elevation forecast, lift hold likely and
            per-lift hold sit behind the paywall further down. Webcams,
            official links and the safety strip sit at the bottom · same
            position as AU. */}
        <LiveConditions stats={stats} />
        {hourly && hourly.length > 0 && (
          <HourlyForecast
            hourly={hourly}
            utcOffsetSeconds={(data as any).utcOffsetSeconds ?? 0}
            t={t}
            sectionNumber=""
          />
        )}

        {/* ─── PREMIUM ──────────────────────────────────────────
            Next 6 days, elevation forecast and lift-hold likely all
            gated. Free tier sees blurred preview + lock CTA. */}

        {/* PremiumGate · Next 6 days */}
        {daily && daily.length > 0 && (
          <PremiumGate
            title="Next 6 days"
            titleJa="今後6日間"
            blurb="Plan further out · 6-day mountain outlook with snow, wind and temperatures."
            blurbJa="6日間の山岳予報 · 降雪・風速・気温の長期見通し。"
          >
            <MountainOutlook days={daily as any} elevation={location.elevation} />
          </PremiumGate>
        )}

        {/* PremiumGate · Elevation forecast · upper / mid / base snow + temp.
            Self-hides inside ElevationBands when coords are missing. */}
        {mountain?.lat != null && mountain?.lng != null && mountain?.elevationM != null && (
          <PremiumGate
            title="Elevation forecast"
            titleJa="標高別予報"
            blurb="See conditions across upper / mid / base elevations · snow and temperature for each band."
            blurbJa="山頂・中腹・ベースの標高別コンディション · 降雪と気温。"
          >
            <ElevationBands
              lat={mountain.lat}
              lng={mountain.lng}
              summitElevationM={mountain.elevationM}
              name={location.name}
            />
          </PremiumGate>
        )}

        {/* FREE · 7-day powder forecast calendar. Moved here (May 2026 v6)
            to sit right after Elevation forecast so the powder outlook
            reads as a continuation of the multi-day weather story. */}
        {hourly && hourly.length > 0 && (
          <PowderCalendar hourly={hourly} t={t} sectionNumber="" />
        )}

        {/* Mountain dials only · the wind-driven lift-hold call was
            removed here because the per-lift "will the lifts spin?"
            panel below already delivers it with finer per-lift tolerances. */}
        <PremiumGate
          title="Mountain dials"
          titleJa="マウンテン計器盤"
          blurb="Freezing level, gusts and incoming snow at a glance."
          blurbJa="凍結高度・突風・降雪を一目で。"
        >
          <div className="space-y-4">
            {location.elevation != null && current.windSpeed != null && (
              <MountainSnapshot
                resortName={location.name}
                elevation={location.elevation}
                freezingLevel={current.freezingLevel ?? undefined}
                gust={current.windGust ?? undefined}
                windSpeed={current.windSpeed}
                snowfallNext24h={current.snowfallNext24h ?? undefined}
                snowfallNext48h={current.snowfallNext48h ?? undefined}
                snowfallNext72h={current.snowfallNext72h ?? undefined}
                modelSource="Open-Meteo · JMA · ECMWF"
              />
            )}
          </div>
        </PremiumGate>

        {/* The mountain-specific lift wind-hold panel (per-lift gust
            tolerances) stays gated as part of the deep operational view.
            Page-level gated by getLiftsForMountain so free users don't
            see a lock for empty data (matches VIC). */}
        {hourly && hourly.length > 0 && getLiftsForMountain(id).length > 0 && (
          <PremiumGate
            title="Per-lift hold forecast"
            titleJa="リフト別ホールド予測"
            blurb="Hour-by-hour hold risk for each named lift on this mountain · uses lift-specific gust tolerances."
            blurbJa="各リフトの時間別ホールドリスク · リフト固有の耐風基準を使用。"
          >
            <LiftWindHoldPanel
              mountainId={id}
              resortElevationM={location.elevation}
              hourly={hourly as any}
              sectionNumber=""
              t={t}
              seasonOpen={isLiftSeasonOpen(REGION_COUNTRY[region.id])}
              snowDepthCm={current.snowDepth}
            />
          </PremiumGate>
        )}

        {/* PREMIUM · 24-hour trend chart · interactive temp/snow/wind.
            Added May 2026 v5 to match the AU resort paywall sequence. */}
        {hourly && hourly.length > 0 && (
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
                <div className="flex bg-secondary/40 p-1 rounded-xl border border-white/5">
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

        {/* PREMIUM · Ensemble forecast · multi-model consensus. Self-
            hides when /api/forecast/{id} doesn't return data. */}
        <PremiumGate
          title="Ensemble forecast"
          titleJa="アンサンブル予報"
          blurb="Multi-model consensus · agreement across JMA, ECMWF and other models for the next 7 days."
          blurbJa="JMA・ECMWFなど複数モデルの合意度を可視化（今後7日間）。"
        >
          <EnsembleForecast locationId={id} />
        </PremiumGate>

        {/* PREMIUM · Personalised triggers · push when conditions hit. */}
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
            <AlertSubscribeForm defaultRegion="yamanouchi" />
          </div>
        </PremiumGate>

        {/* Webcams · positioned after the gated detailed conditions to
            match AU resort pages. */}
        <MountainWebcams
          mountainId={id}
          sectionNumber=""
          t={t}
          fallbackPageUrl={profile.webcamUrl}
        />

        <OfficialLinks profile={profile} resortName={location.name} t={t} />
        <SafetyStrip
          links={safetyLinks}
          subhead={t("Always check official sources before heading out.", "出発前に必ず公式情報をご確認ください。")}
          disclaimer={t(
            "Conditions update every 10 minutes. Mountain weather changes fast - when in doubt, contact the resort directly.",
            "状況は10分ごとに更新されます。山の天気は急変します。判断に迷う場合はスキー場へ直接お問い合わせください。",
          )}
        />
      </div>
    </div>
  );
}

function OfficialLinks({
  profile,
  resortName,
  t,
}: {
  profile: ResortProfile;
  resortName: string;
  t: (en: string, ja: string) => string;
}) {
  // Only render link tiles for URLs we actually have - never fake them.
  const links = [
    profile.websiteUrl && {
      label: t("Official website", "公式サイト"),
      detail: t("Trail map, hours, tickets", "コース案内・営業時間・チケット"),
      href: profile.websiteUrl,
      icon: Globe,
    },
    profile.liftStatusUrl && {
      label: t("Lift status", "リフト運行状況"),
      detail: t("Live lift operating status", "リフトのライブ運行状況"),
      href: profile.liftStatusUrl,
      icon: Cable,
    },
    profile.webcamUrl && {
      label: t("Live webcams", "ライブカメラ"),
      detail: t("On-mountain camera feeds", "山頂・コースのライブ映像"),
      href: profile.webcamUrl,
      icon: Camera,
    },
  ].filter((x): x is { label: string; detail: string; href: string; icon: typeof Globe } => !!x);

  if (links.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36 }}
      className="glass rounded-3xl p-6 md:p-8"
    >
      <div className="flex items-end justify-between mb-5 gap-3">
        <div>
          <p className="byline text-muted-foreground">
            {t("Official sources", "公式情報")}
          </p>
          <h2 className="font-display font-semibold text-xl md:text-2xl mt-1 text-foreground">
            {t("Lifts & cameras", "リフト・カメラ")}
          </h2>
        </div>
        <p className="byline text-muted-foreground/70 hidden md:block">{resortName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="group flex items-start gap-3 p-4 rounded-2xl border border-slate-200/70 hover:border-slate-400/60 hover:bg-slate-50/60 transition-colors"
          >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 flex-none group-hover:bg-slate-200 transition-colors">
              <link.icon className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5 leading-tight">
                {link.label}
                <ExternalLink
                  className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
                  strokeWidth={1.75}
                />
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-1 leading-snug">{link.detail}</p>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  );
}
