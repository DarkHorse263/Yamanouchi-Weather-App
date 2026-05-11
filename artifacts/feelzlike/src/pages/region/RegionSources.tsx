import { Database, ExternalLink } from "lucide-react";

import { useLanguage, useRegion, LiveBadge, PageHeader } from "@workspace/feelzlike-shell";

/**
 * RegionSources - single source of truth for "where the data comes from".
 *
 * Lifted from the landing-page trust footer (Apr 2026 reset): users on a
 * region need the same attribution available at any time, not only from the
 * landing page. Region-aware: the "Live observations" + "Resort & transport"
 * sections vary by region, while the forecast ensemble + Open-Meteo
 * aggregation block is shared (same models everywhere).
 */

interface SourceLink {
  label: string;
  labelJa?: string;
  url: string;
  detail?: string;
  detailJa?: string;
}

interface SourceGroup {
  title: string;
  titleJa: string;
  blurb?: string;
  blurbJa?: string;
  items: SourceLink[];
}

const FORECAST_ENSEMBLE: SourceGroup = {
  title: "Forecast ensemble",
  titleJa: "予報モデル",
  blurb: "Aggregated via Open-Meteo so you see the consensus, not a single guess.",
  blurbJa: "Open-Meteo経由で集約 - 単一モデルの予測ではなく合意ベースの予報を表示。",
  items: [
    { label: "ECMWF IFS", detail: "Europe", url: "https://www.ecmwf.int/en/forecasts" },
    { label: "GFS", detail: "NOAA, USA", url: "https://www.nco.ncep.noaa.gov/pmb/products/gfs/" },
    { label: "ICON", detail: "DWD, Germany", url: "https://www.dwd.de/EN/research/weatherforecasting/num_modelling/01_num_weather_prediction_modells/icon_description.html" },
    { label: "BOM ACCESS-G", detail: "Australia", url: "http://www.bom.gov.au/nwp/" },
    { label: "JMA Seamless", detail: "Japan", url: "https://www.jma.go.jp/jma/en/Activities/nwp.html" },
    { label: "MET Norway Locationforecast", detail: "Norway", url: "https://api.met.no/" },
    { label: "Open-Meteo aggregator", detail: "open API", url: "https://open-meteo.com" },
  ],
};

const REGION_SOURCES: Record<string, SourceGroup[]> = {
  "snowy-mountains": [
    {
      title: "Live observations",
      titleJa: "気象観測",
      items: [
        { label: "Bureau of Meteorology", labelJa: "オーストラリア気象局", detail: "Australia", url: "http://www.bom.gov.au" },
      ],
    },
    {
      title: "Roads & transport",
      titleJa: "道路・交通",
      items: [
        { label: "Transport for NSW - Live Traffic", labelJa: "ライブトラフィックNSW", url: "https://www.livetraffic.com" },
        { label: "Cooma Coaches", url: "https://www.coomacoaches.com.au" },
        { label: "NSW TrainLink", url: "https://transportnsw.info/regional" },
      ],
    },
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Thredbo", url: "https://www.thredbo.com.au" },
        { label: "Perisher", url: "https://www.perisher.com.au" },
        { label: "Charlotte's Pass", url: "https://www.charlottepass.com.au" },
        { label: "Selwyn Snow Resort", url: "https://www.selwynsnow.com.au" },
      ],
    },
    {
      title: "Mapping & imagery",
      titleJa: "地図・画像",
      items: [
        { label: "OpenWeatherMap weather tiles", url: "https://openweathermap.org" },
        { label: "BOM radar - NSW alpine", url: "http://www.bom.gov.au/products/IDR713.loop.shtml" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  yamanouchi: [
    {
      title: "Live observations",
      titleJa: "気象観測",
      items: [
        { label: "Japan Meteorological Agency", labelJa: "気象庁", detail: "Japan", url: "https://www.jma.go.jp/jma/indexe.html" },
      ],
    },
    {
      title: "Roads & transport",
      titleJa: "道路・交通",
      items: [
        { label: "Japan Road Traffic Information Center (JARTIC)", labelJa: "日本道路交通情報センター", url: "https://www.jartic.or.jp/" },
        { label: "Nagano Dentetsu (Nagaden)", labelJa: "長野電鉄", url: "https://www.nagaden-net.co.jp/" },
        { label: "Nagano Snow Shuttle", labelJa: "長野スノーシャトル", url: "https://www.naganosnowshuttle.com/" },
      ],
    },
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Shiga Kogen Ski Resorts", labelJa: "志賀高原スキー場", url: "https://www.shigakogen-ski.or.jp/" },
        { label: "Ryuoo Ski Park", labelJa: "竜王スキーパーク", url: "https://www.ryuoo.com/" },
        { label: "Kita-Shiga Kogen", labelJa: "北志賀高原", url: "https://www.kitashiga.co.jp/" },
      ],
    },
    {
      title: "Mapping & imagery",
      titleJa: "地図・画像",
      items: [
        { label: "OpenWeatherMap weather tiles", url: "https://openweathermap.org" },
        { label: "JMA radar - Nagano", labelJa: "気象庁レーダー（長野）", url: "https://www.jma.go.jp/bosai/nowc/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
};

export function RegionSources() {
  const { region } = useRegion();
  const { t } = useLanguage();

  const groups = REGION_SOURCES[region.id] ?? [FORECAST_ENSEMBLE];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="px-4 md:px-10 pt-5 md:pt-10">
        <PageHeader
          byline={region.name}
          title={t("Where the data comes from", "データの出典")}
          description={t(
            `Real-time conditions for ${region.name} sourced direct from official services. Forecasts blend several global ensemble models so you see the consensus, not a single guess.`,
            `${region.name}のリアルタイム情報は公式機関から直接取得しています。予報は複数のグローバル予報モデルを組み合わせ、合意ベースの予測を表示します。`,
          )}
          badge={<LiveBadge tone="onDark" label={t("Attribution", "出典")} />}
        />
      </div>

      <section className="px-4 md:px-10 pt-5 pb-10 space-y-8">
        {groups.map((group) => (
          <SourceGroupCard key={group.title} group={group} t={t} />
        ))}

        <p className="text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl">
          {t(
            "Feelzlike combines but does not replace any of the above sources. For official warnings always consult the issuing authority. We attribute every data point - if you spot something missing, let us know.",
            "Feelzlikeは上記の出典を統合表示するものであり、置き換えるものではありません。公式の警報・警告は必ず発表元を直接ご確認ください。",
          )}
        </p>
      </section>
    </div>
  );
}

function SourceGroupCard({
  group,
  t,
}: {
  group: SourceGroup;
  t: (en: string, ja: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 md:p-7">
      <div className="flex items-start gap-3 mb-1">
        <Database className="w-4 h-4 text-blue-700 mt-1 shrink-0" aria-hidden />
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg">
            {t(group.title, group.titleJa)}
          </h2>
          {group.blurb || group.blurbJa ? (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t(group.blurb ?? "", group.blurbJa ?? group.blurb ?? "")}
            </p>
          ) : null}
        </div>
      </div>
      <ul className="grid sm:grid-cols-2 gap-2 mt-4">
        {group.items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white px-4 py-2.5 transition-all hover:shadow-sm hover:-translate-y-0.5 hover:border-blue-300"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground truncate">
                  {t(item.label, item.labelJa ?? item.label)}
                </span>
                {item.detail || item.detailJa ? (
                  <span className="block text-[11px] text-muted-foreground/70 truncate">
                    {t(item.detail ?? "", item.detailJa ?? item.detail ?? "")}
                  </span>
                ) : null}
              </span>
              <ExternalLink
                className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-blue-700 shrink-0"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
