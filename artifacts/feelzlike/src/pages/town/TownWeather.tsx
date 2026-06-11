import { useLanguage, useBaseTown, useRegion, LiveBadge, UpdateStamp, useOptionalSeason, PageHeader } from "@workspace/feelzlike-shell";
import { RadarMap, type RadarRegionKey } from "@/regions/snowy-mountains/components/RadarMap";
import { Radar as RadarIcon, ExternalLink } from "lucide-react";
import { useTownWeather } from "@/lib/town-weather";
import {
  StaleNotice,
  WeatherHero,
  WeatherConditions,
  WeatherToday,
  WeatherHourly,
  WeatherOutlook,
} from "@/components/weather/WeatherSections";

export function TownWeather() {
  const { region } = useRegion();
  const { t } = useLanguage();
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
        <p className="text-muted-foreground">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
      <PageHeader
        byline={`${region.name} · ${t(town.name, town.nameJa)}`}
        title={t(`${town.name} weather forecast`, `${town.name}の天気予報`)}
        description={t(
          pageSeason === "winter"
            ? "Current, hourly and 7-day outlook for town. Live snow radar below."
            : "Current, hourly and 7-day outlook for town. Live rain radar below.",
          pageSeason === "winter"
            ? "町の現在・時間別・7日間予報。下に降雪レーダー。"
            : "町の現在・時間別・7日間予報。下に降雨レーダー。",
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
        badge={<LiveBadge tone="onDark" label={t("Live", "ライブ")} />}
      />

      {q.isLoading ? (
        <p className="mt-8 text-muted-foreground">{t("Loading weather…", "天気を読込中…")}</p>
      ) : q.isError || !q.data ? (
        <p className="mt-8 text-muted-foreground">
          {t("Weather data unavailable right now.", "現在、天気データを取得できません。")}
        </p>
      ) : (
        <>
          {q.data._stale && <StaleNotice meta={q.data._stale} t={t} />}
          <WeatherHero current={q.data.current} town={t(town.name, town.nameJa)} />
          <WeatherConditions current={q.data.current} t={t} />
          <WeatherToday daily={q.data.daily[0]} t={t} />
          <WeatherHourly hourly={q.data.hourly} t={t} />
          <WeatherOutlook days={q.data.daily.slice(1, 7)} t={t} />
          <Radar t={t} />
          <p className="byline text-muted-foreground/60 mt-8">
            {t(
              `Source: ${region.weatherSource?.label ?? "Open-Meteo"} · updated every 10 min`,
              `出典: ${region.weatherSource?.labelJa ?? region.weatherSource?.label ?? "Open-Meteo"} · 10分毎に更新`,
            )}
          </p>
        </>
      )}
    </div>
  );
}

function Radar({ t }: { t: (en: string, ja: string) => string }) {
  const { region } = useRegion();
  const seasonCtx = useOptionalSeason();
  const season = seasonCtx?.season ?? "winter";
  const headline = season === "winter"
    ? t("Live snow radar", "ライブ降雪レーダー")
    : t("Live rain radar", "ライブ降雨レーダー");
  const byline = season === "winter"
    ? t("Snow radar", "降雪レーダー")
    : t("Rain radar", "降雨レーダー");
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
      <RadarMap season={season} region={region.id as RadarRegionKey} />
      <p className="text-xs text-muted-foreground/70 px-5 py-3 border-t border-border">
        {t(
          "Precip radar is on by default · forecast frames show the next 30 minutes. Toggle snowfall, wind, temperature or rain risk, then click any point to read its values.",
          "降水レーダーは初期状態でオン · 予報フレームは今後30分の予測。降雪・風・気温・雨リスクを切替え、地図上の任意の地点をタップすると値を表示します。",
        )}
      </p>
    </section>
  );
}
