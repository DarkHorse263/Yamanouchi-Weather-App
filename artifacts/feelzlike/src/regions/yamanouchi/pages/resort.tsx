import { useRoute } from "wouter";
import { useGetLocationWeather } from "@workspace/api-client-react";
import {
  ResortHero,
  MountainSnapshot,
  LiveConditions,
  MountainOutlook,
  SafetyStrip,
  type ConditionStat,
  type SafetyLink,
} from "@workspace/feelzlike-dashboard";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage, useRegion } from "@workspace/feelzlike-shell";
import { HourlyForecast } from "@/components/HourlyForecast";
import { PowderCalendar } from "@/components/PowderCalendar";
import { MountainWebcams } from "@/components/MountainWebcams";
import { LiftWindHoldPanel } from "@/components/LiftWindHoldPanel";
import { PowderFactorBadge } from "@/components/PowderFactorBadge";

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

  // Source of truth for "is this a real mountain in this region" is the
  // region config - so any mountain added to yamanouchi.ts works automatically.
  const mountain = (region.mountains ?? []).find((m) => m.id === id);
  const enabled = !!mountain;
  const { data, isLoading, error } = useGetLocationWeather(id as WeatherId, {
    query: { enabled, refetchInterval: 600_000 },
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

  return (
    <div className="bg-background">
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

      <div className="max-w-7xl mx-auto px-5 md:px-10 pb-16 space-y-6 md:space-y-8 -mt-2">
        <MountainSnapshot
          resortName={location.name}
          elevation={location.elevation}
          freezingLevel={current.freezingLevel}
          gust={current.windGust}
          windSpeed={current.windSpeed}
          snowfallNext24h={current.snowfallNext24h}
          snowfallNext48h={current.snowfallNext48h}
          snowfallNext72h={current.snowfallNext72h}
          modelSource="Open-Meteo · JMA · ECMWF"
        />
        <LiveConditions stats={stats} />
        {hourly && hourly.length > 0 && (
          <PowderFactorBadge hourly={hourly} t={t} sectionNumber="03b" />
        )}
        {hourly && hourly.length > 0 && (
          <HourlyForecast
            hourly={hourly}
            utcOffsetSeconds={(data as any).utcOffsetSeconds ?? 0}
            t={t}
            sectionNumber="04"
          />
        )}
        {hourly && hourly.length > 0 && (
          <PowderCalendar hourly={hourly} t={t} sectionNumber="05" />
        )}
        <MountainWebcams
          mountainId={id}
          sectionNumber="06"
          t={t}
          fallbackPageUrl={profile.webcamUrl}
        />
        {hourly && hourly.length > 0 && (
          <LiftWindHoldPanel
            mountainId={id}
            resortElevationM={location.elevation}
            hourly={hourly as any}
            sectionNumber="07"
            t={t}
          />
        )}
        {daily && daily.length > 0 && (
          <MountainOutlook days={daily as any} elevation={location.elevation} />
        )}
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
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="byline text-muted-foreground">
            06 · {t("Official sources", "公式情報")}
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
