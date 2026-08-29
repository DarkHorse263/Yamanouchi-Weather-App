import { useLanguage, useBaseTown, useRegion, LiveBadge, UpdateStamp, useOptionalSeason, PageHeader, cn } from "@workspace/feelzlike-shell";
import { RadarMap, type RadarRegionKey } from "@/regions/snowy-mountains/components/RadarMap";
import { Radar as RadarIcon, ExternalLink } from "lucide-react";
import { useTownWeather } from "@/lib/town-weather";
import { PageMeta } from "@/lib/seo/PageMeta";
import {
  StaleNotice,
  WeatherHero,
  WeatherConditions,
  WeatherToday,
  WeatherHourly,
  WeatherOutlook,
  ObservedSnowCard,
} from "@/components/weather/WeatherSections";
import { AlertPromoBanner } from "@/components/AlertPromoBanner";
import { UnitsToggle } from "@/components/UnitsToggle";
import DayNarrative from "@/components/weather/DayNarrative";

export function TownWeather() {
  const { region } = useRegion();
  const { t, language } = useLanguage();
  const { town } = useBaseTown();
  const q = useTownWeather(town?.lat, town?.lng);
  // Confidence pills were removed in favour of the single DailyPick callout
  // at the top of the region/town · we no longer need the ensemble query
  // here. Keep the lib in place; nothing on this page consumes its output.
  // Season-aware page subtitle: avoid promising "snow radar" in green season
  // (e.g. AU resorts in May). Falls back to winter when no SeasonProvider
  // wraps the page, which preserves original copy in winter-only contexts.
  const pageSeason = useOptionalSeason()?.season ?? "winter";

  if (!town) {
    return (
      <div className="px-4 md:px-10 py-5 md:py-8 max-w-6xl mx-auto">
        <p className="text-white/80">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  return (
    <div className={cn("min-h-[100dvh] pb-8 transition-colors duration-500", pageSeason === "green" ? "bg-[#059669]" : "bg-[#0055FF]")}>
      <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
        <PageMeta
          title={t(`${town.name} weather forecast`, `${town.name}の天気予報`)}
          description={t(
            pageSeason === "winter"
              ? `Current conditions, hourly and 7-day snow forecast for ${town.name} in ${region.name}. Live radar included.`
              : `Current conditions, hourly and 7-day forecast for ${town.name} in ${region.name}. Live radar included.`,
            pageSeason === "winter"
              ? `${region.name}・${town.name}の現在・時間別・7日間降雪予報。ライブレーダー付き。`
              : `${region.name}・${town.name}の現在・時間別・7日間天気予報。ライブレーダー付き。`,
          )}
          path={`/${region.id}/${town.id}/weather`}
        />
        <PageHeader
          byline={`${region.name} · ${t(town.name, town.nameJa)}`}
          title={t(`${town.name} weather forecast`, `${town.name}の天気予報`)}
          description={t(
            "Current, hourly and 7-day outlook for town. Live radar below.",
            "町の現在・時間別・7日間予報。下にライブレーダー。",
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
          badge={
            // Only claim "live" when we actually have a timestamped reading.
            q.data?.current?.time
              ? <LiveBadge tone="onDark" label={t("Live", "ライブ")} />
              : undefined
          }
        />

        <div className="mt-4 flex justify-end">
          <div className="bg-white/95 backdrop-blur-md rounded-full shadow-sm">
            <UnitsToggle />
          </div>
        </div>

        {q.isLoading ? (
          <p className="mt-8 text-white/80 font-medium">{t("Loading weather…", "天気を読込中…")}</p>
        ) : q.isError || !q.data ? (
          <p className="mt-8 text-white/80 font-medium">
            {t("Weather data unavailable right now.", "現在、天気データを取得できません。")}
          </p>
        ) : (
          <>
            {q.data._stale && <StaleNotice meta={q.data._stale} t={t} />}
            <WeatherHero current={q.data.current} town={t(town.name, town.nameJa)} />
            <DayNarrative
              hourly={q.data.hourly}
              current={q.data.current}
              utcOffsetSeconds={q.data.utcOffsetSeconds ?? 0}
              lang={language}
            />
            <WeatherConditions current={q.data.current} t={t} />
            <WeatherToday daily={q.data.daily[0]} t={t} />
            <AlertPromoBanner />
            {q.data.observedSnow && <ObservedSnowCard obs={q.data.observedSnow} t={t} />}
            <WeatherHourly hourly={q.data.hourly} t={t} nowCode={q.data.current.weatherCode} nowIsDay={q.data.current.isDay} />
            <WeatherOutlook days={q.data.daily.slice(1, 7)} t={t} />
            <Radar t={t} center={{ lat: town.lat, lng: town.lng }} />
            <p className="byline text-white/60 mt-8">
              {t(
                `Source: ${region.weatherSource?.label ?? "Open-Meteo"} · weather updates every 10 min · snow depth and cams update when resorts publish new data`,
                `出典: ${region.weatherSource?.labelJa ?? region.weatherSource?.label ?? "Open-Meteo"} · 天気は10分毎に更新 · 積雪とライブカメラはリゾートの公開時に更新`,
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Radar({
  t,
  center,
}: {
  t: (en: string, ja: string) => string;
  /**
   * The viewed town's coordinates. Without this, RadarMap falls back to the
   * REGION_DEFAULTS centre (a whole-region framing point that can sit many
   * km from any town), and the BOM/JMA views draw their "you are here" dot
   * at that fallback — e.g. Jindabyne's dot appeared ~18 km west of town.
   */
  center: { lat: number; lng: number };
}) {
  const { region } = useRegion();
  const seasonCtx = useOptionalSeason();
  const season = seasonCtx?.season ?? "winter";
  // Neutral label · "live radar" reads honestly everywhere, including
  // green-season regions where it never snows. Season still drives the map.
  const headline = t("Live radar", "ライブレーダー");
  const byline = t("Radar", "レーダー");
  return (
    <section className="mt-4 rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 flex-wrap">
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
      <RadarMap center={center} season={season} region={region.id as RadarRegionKey} />
      <p className="text-xs text-muted-foreground/70 px-5 py-3 border-t border-border">
        {t(
          "Precip radar is on by default · forecast frames show the next 30 minutes. Toggle snowfall, wind, temperature or rain risk, then click any point to read its values.",
          "降水レーダーは初期状態でオン · 予報フレームは今後30分の予測。降雪・風・気温・雨リスクを切替え、地図上の任意の地点をタップすると値を表示します。",
        )}
      </p>
    </section>
  );
}
