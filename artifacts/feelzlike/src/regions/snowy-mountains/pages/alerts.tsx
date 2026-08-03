import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { BellRing, Info, Sun } from "lucide-react";
import { PremiumGate, useOptionalSeason } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";

/**
 * Snowy Mountains alerts page. Powder alerts (the GET /alerts data) are
 * Yamanouchi-only at the moment, so the AU page focuses on the subscription
 * surface - letting AU visitors opt in to alerts driven by the same forecast
 * data already powering the AU mountain pages.
 *
 * Season-aware: hidden behind a "back in winter" placeholder during the
 * green season so the page matches the rest of the snow-only surfaces in
 * the app (resorts, snow forecast, etc.).
 *
 * The whole subscribe surface is wrapped in PremiumGate so the lock glyph
 * users see in the sidebar (DEFAULT_MOUNTAIN_NAV) matches the page state -
 * QA flagged the previous mismatch (lock in nav, free form on the page).
 */
export default function Alerts() {
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.season === "green";

  if (isGreen) return <GreenSeasonNotice />;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <PageMeta
        title="Snowy Mountains powder alerts"
        description="Subscribe to powder and weather alerts for the Snowy Mountains. Get notified by email when significant snow is forecast."
        path="/snowy-mountains/alerts"
      />
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <BellRing className="w-8 h-8 text-white" />
          Powder Alerts
        </h1>
        <p className="text-white/70 mt-2">
          Get notified when significant snow is forecast.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-start gap-3 shadow-[0_12px_40px_-12px_rgba(0,40,150,0.5)]">
        <Info className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
        <div className="text-sm text-slate-600">
          <p className="text-slate-900 font-bold mb-1">Real-time storm tracking is coming soon to the Snowy Mountains.</p>
          <p>For now, subscribe below and we'll email you when our forecast models show your threshold being met in your selected window.</p>
        </div>
      </div>

      <PremiumGate
        title="Powder & weather alerts"
        titleJa="降雪・気象アラート"
        blurb="Get a push when conditions hit. Set thresholds for snowfall, wind and freezing level."
        blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
      >
        <AlertSubscribeForm defaultRegion="snowy-mountains" />
      </PremiumGate>
    </div>
  );
}

function GreenSeasonNotice() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 md:p-10 text-center">
        <Sun className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-emerald-900">
          Powder alerts return for snow season
        </h1>
        <p className="text-sm md:text-base text-emerald-800/80 mt-3 leading-relaxed">
          Snowfall thresholds aren't tracked over the green season. Switch the season pill back to winter once the forecast shows snow on the way.
        </p>
      </div>
    </div>
  );
}
