import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { BellRing, Info } from "lucide-react";
import { PageMeta } from "@/lib/seo/PageMeta";

/**
 * Snowy Mountains alerts page. Powder alerts (the GET /alerts data) are
 * Yamanouchi-only at the moment, so the AU page focuses on the subscription
 * surface - letting AU visitors opt in to alerts driven by the same forecast
 * data already powering the AU mountain pages.
 *
 * Available year-round so visitors can set an alert before winter begins.
 */
export default function Alerts() {
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

      <AlertSubscribeForm defaultRegion="snowy-mountains" />
    </div>
  );
}
