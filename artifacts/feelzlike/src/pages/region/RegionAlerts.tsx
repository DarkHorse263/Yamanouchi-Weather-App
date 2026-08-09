import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { BellRing, Info, Sun } from "lucide-react";
import {
  PremiumGate,
  useOptionalSeason,
  useRegion,
  useLanguage,
} from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

/**
 * Generic region alerts page · renders /:region/alerts for every region that
 * does not ship a custom Alerts page in its region router (snowy-mountains
 * and yamanouchi keep their bespoke versions).
 *
 * Before this existed, only those two regions had a reachable /alerts page ·
 * the TownHome alerts tile on every other region linked to a URL that
 * silently redirected home. The subscription form itself has always been
 * region-agnostic (AlertSubscribeForm lists every live region), so this page
 * simply gives it a home everywhere.
 *
 * Season-aware: hidden behind a "back in winter" placeholder during the
 * green season, matching the other snow-only surfaces. Wrapped in
 * PremiumGate like the bespoke pages so the gate state stays consistent.
 */
export function RegionAlerts() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.season === "green";

  if (isGreen) return <GreenSeasonNotice t={t} />;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <PageMeta
        title={t(`${region.name} powder alerts`, `${region.name}の降雪アラート`)}
        description={t(
          `Subscribe to powder and weather alerts for ${region.name}. Get notified by email when significant snow is forecast.`,
          `${region.name}の降雪・気象アラートに登録。まとまった降雪が予想されるとメールでお知らせします。`,
        )}
        path={`/${region.id}/alerts`}
      />
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <BellRing className="w-8 h-8 text-white" />
          {t("Powder Alerts", "降雪アラート")}
        </h1>
        <p className="text-white/70 mt-2">
          {t(
            "Get notified when significant snow is forecast.",
            "まとまった降雪が予想されるとお知らせします。",
          )}
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-3 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]">
        <Info className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
        <div className="text-sm text-slate-600">
          <p className="text-slate-900 font-bold mb-1">
            {t(
              "Alerts are driven by the same forecast models powering the mountain pages.",
              "アラートは山ページと同じ予報モデルに基づいています。",
            )}
          </p>
          <p>
            {t(
              "Subscribe below and we'll email you when the forecast shows your threshold being met in your selected window.",
              "以下から登録すると、選択した期間にしきい値を超える予報が出た際にメールでお知らせします。",
            )}
          </p>
        </div>
      </div>

      <PremiumGate
        title="Powder & weather alerts"
        titleJa="降雪・気象アラート"
        blurb="Get a push when conditions hit. Set thresholds for snowfall, wind and freezing level."
        blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
      >
        <AlertSubscribeForm defaultRegion={region.id} />
      </PremiumGate>
    </div>
  );
}

function GreenSeasonNotice({ t }: { t: (en: string, ja: string) => string }) {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 md:p-10 text-center">
        <Sun className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-emerald-900">
          {t("Powder alerts return for snow season", "降雪アラートは雪シーズンに再開")}
        </h1>
        <p className="text-sm md:text-base text-emerald-800/80 mt-3 leading-relaxed">
          {t(
            "Snowfall thresholds aren't tracked over the green season. Switch the season pill back to winter once the forecast shows snow on the way.",
            "グリーンシーズン中は降雪しきい値を追跡していません。雪の予報が出たらシーズン切替を冬に戻してください。",
          )}
        </p>
      </div>
    </div>
  );
}
