import { Database, ExternalLink } from "lucide-react";

import { useLanguage, useRegion, LiveBadge, PageHeader } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

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

/**
 * Canada reference block. Deliberately titled "Official references" rather
 * than "Live observations": no ECCC / Avalanche Canada / DriveBC / 511
 * Alberta feed is wired into a feelzlike reading in this pass, so presenting
 * them alongside the AU/JP live-observation blocks would overclaim. The
 * forecast ensemble below is the only thing actually powering the numbers.
 */
const CA_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "Environment and Climate Change Canada", detail: "national forecasts & warnings", url: "https://weather.gc.ca/" },
    { label: "MSC GeoMet / api.weather.gc.ca", detail: "ECCC open data API", url: "https://api.weather.gc.ca/" },
    { label: "Avalanche Canada", detail: "daily avalanche forecasts", url: "https://avalanche.ca/forecasts" },
  ],
};

const CA_ROADS_BC: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "DriveBC", detail: "highway conditions & cameras", url: "https://www.drivebc.ca/" },
    { label: "DriveBC cameras", detail: "provincial camera map", url: "https://www.drivebc.ca/cameras" },
  ],
};

const CA_ROADS_AB: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "511 Alberta", detail: "road reports", url: "https://511.alberta.ca/" },
    { label: "511 Alberta cameras", detail: "provincial camera map", url: "https://511.alberta.ca/cctv" },
  ],
};

/**
 * Québec variant of the reference block. Avalanche Canada does not forecast
 * for Québec · Avalanche Québec covers the Chic-Chocs and the province's
 * backcountry, so the QC regions swap that item rather than reuse the
 * national one.
 */
const CA_QC_OFFICIAL_REFERENCES: SourceGroup = {
  title: "Official references",
  titleJa: "公式参照先",
  blurb:
    "Link-outs, not wired feeds · conditions shown on feelzlike come from the forecast ensemble below, so check these before you drive or tour.",
  blurbJa:
    "リンクのみで、データ連携はしていません。feelzlikeの数値は下記の予報モデルによるものです。走行・ツアー前に必ず公式情報をご確認ください。",
  items: [
    { label: "Environment and Climate Change Canada", detail: "national forecasts & warnings", url: "https://weather.gc.ca/" },
    { label: "MSC GeoMet / api.weather.gc.ca", detail: "ECCC open data API", url: "https://api.weather.gc.ca/" },
    { label: "Avalanche Québec", detail: "backcountry bulletins", url: "https://www.avalanchequebec.ca/bulletin-davalanche/" },
  ],
};

const CA_ROADS_QC: SourceGroup = {
  title: "Roads & transport",
  titleJa: "道路・交通",
  items: [
    { label: "Québec 511", detail: "road conditions & cameras", url: "https://www.quebec511.info/" },
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
        { label: "Jindabyne Image \u00a9 Destination NSW", detail: "Photo courtesy Destination NSW", url: "https://www.destinationnsw.com.au" },
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
        { label: "Kita-Shiga Kogen", labelJa: "北志賀高原", url: "https://ryuoo.com/winter/kitashiga/" },
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
  whistler: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Whistler Blackcomb", url: "https://www.whistlerblackcomb.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  "powder-highway": [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Revelstoke Mountain Resort", url: "https://www.revelstokemountainresort.com/" },
        { label: "Kicking Horse", url: "https://kickinghorseresort.com/" },
        { label: "Fernie Alpine Resort", url: "https://skifernie.com/" },
        { label: "Whitewater", url: "https://skiwhitewater.com/" },
        { label: "Kimberley Alpine Resort", url: "https://skikimberley.com/" },
        { label: "Panorama", url: "https://www.panoramaresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  okanagan: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Big White Ski Resort", url: "https://www.bigwhite.com/" },
        { label: "SilverStar Mountain Resort", url: "https://www.skisilverstar.com/" },
        { label: "Apex Mountain Resort", url: "https://apexresort.com/" },
        { label: "Sun Peaks Resort", url: "https://www.sunpeaksresort.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  vancouver: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_BC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Cypress Mountain", url: "https://www.cypressmountain.com/" },
        { label: "Grouse Mountain", url: "https://www.grousemountain.com/" },
        { label: "Mt Seymour", url: "https://mtseymour.ca/" },
        { label: "Mount Washington Alpine Resort", url: "https://mountwashington.ca/" },
        { label: "BC Ferries · Vancouver to the Island", detail: "sailings & fares", url: "https://www.bcferries.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "banff-lake-louise": [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Banff Sunshine Village", url: "https://www.skibanff.com/" },
        { label: "Mt. Norquay", url: "https://banffnorquay.com/" },
        { label: "Lake Louise Ski Resort", url: "https://www.skilouise.com/" },
        { label: "Parks Canada · Banff safety", detail: "park conditions & closures", url: "https://www.pc.gc.ca/en/pn-np/ab/banff/securite-safety" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  canmore: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [{ label: "Nakiska", url: "https://skinakiska.com/" }],
    },
    FORECAST_ENSEMBLE,
  ],
  jasper: [
    CA_OFFICIAL_REFERENCES,
    CA_ROADS_AB,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Marmot Basin", url: "https://www.skimarmot.com/" },
        { label: "Parks Canada · Jasper National Park", url: "https://www.pc.gc.ca/en/pn-np/ab/jasper" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-laurentians": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Tremblant", url: "https://www.tremblant.ca/" },
        { label: "Tremblant · mountain report", url: "https://www.tremblant.ca/mountain-village/mountain-report" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-charlevoix": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Mont-Sainte-Anne", url: "https://mont-sainte-anne.com/" },
        { label: "Le Massif de Charlevoix", url: "https://www.lemassif.com/" },
      ],
    },
    FORECAST_ENSEMBLE,
  ],
  "quebec-eastern-townships": [
    CA_QC_OFFICIAL_REFERENCES,
    CA_ROADS_QC,
    {
      title: "Resorts & lifts",
      titleJa: "スキー場・リフト",
      items: [
        { label: "Ski Bromont", url: "https://www.bromontmontagne.com/" },
        { label: "Mont Sutton", url: "https://montsutton.com/" },
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
      <PageMeta
        title={t(`${region.name} - data sources`, `${region.name}のデータ出典`)}
        description={t(
          `Official sources powering real-time conditions for ${region.name}: weather bureaus, resort feeds, road agencies and forecast ensembles.`,
          `${region.name}のリアルタイム情報を支える公式データ出典：気象機関・スキー場・道路管理・予報モデル。`,
        )}
        path={`/${region.id}/sources`}
      />
      <div className="px-4 md:px-10 pt-4 md:pt-8">
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

      <section className="px-4 md:px-10 pt-4 pb-8 space-y-6">
        {groups.map((group) => (
          <SourceGroupCard key={group.title} group={group} t={t} />
        ))}

        <p className="text-[11px] text-white/70 leading-relaxed max-w-2xl">
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
