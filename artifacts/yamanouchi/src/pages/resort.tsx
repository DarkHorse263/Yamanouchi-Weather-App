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
} from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const VALID_IDS = new Set(["shiga-kogen", "ryuoo", "kita-shiga"]);

export default function ResortDetail() {
  const [, params] = useRoute("/resort/:id");
  const id = params?.id ?? "";
  const { t } = useLanguage();

  const enabled = VALID_IDS.has(id);
  const { data, isLoading, error } = useGetLocationWeather(id as any, {
    query: { enabled, refetchInterval: 600_000 },
  });

  if (!enabled) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="font-display font-semibold text-2xl text-foreground">
          {t("Resort not found", "スキー場が見つかりません")}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t("Try Shiga Kogen, Ryuoo, or Kita Shiga.", "志賀高原、竜王、北志賀のいずれかをお試しください。")}
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

  const { location, current, daily } = data;
  const observedAt = (data as any).lastUpdated as string | undefined;

  const stats: ConditionStat[] = [
    { label: t("Feels like", "体感"), value: `${Math.round(current.feelsLike)}°C`, icon: Thermometer },
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
      value: current.snowDepth != null ? `${current.snowDepth} cm` : "—",
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
      label: t("Emergency · 110 / 119", "緊急通報 · 110 / 119"),
      detail: t("Police 110 · Fire & ambulance 119", "警察 110番 · 消防・救急 119番"),
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
        {daily && daily.length > 0 && (
          <MountainOutlook days={daily as any} elevation={location.elevation} />
        )}
        <SafetyStrip
          links={safetyLinks}
          subhead={t("Always check official sources before heading out.", "出発前に必ず公式情報をご確認ください。")}
          disclaimer={t(
            "Conditions update every 10 minutes. Mountain weather changes fast — when in doubt, contact the resort directly.",
            "状況は10分ごとに更新されます。山の天気は急変します。判断に迷う場合はスキー場へ直接お問い合わせください。",
          )}
        />
      </div>
    </div>
  );
}
