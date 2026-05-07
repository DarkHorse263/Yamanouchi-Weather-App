import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";
import { BellRing, Info } from "lucide-react";

/**
 * Snowy Mountains alerts page. Powder alerts (the GET /alerts data) are
 * Yamanouchi-only at the moment, so the AU page focuses on the subscription
 * surface - letting AU visitors opt in to alerts driven by the same forecast
 * data already powering the AU mountain pages.
 */
export default function Alerts() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground flex items-center gap-3">
          <BellRing className="w-8 h-8 text-primary" />
          Powder Alerts
        </h1>
        <p className="text-muted-foreground mt-2">
          Get notified when significant snow is forecast in the Snowy Mountains.
        </p>
      </div>

      <div className="rounded-2xl bg-secondary/40 border border-dashed border-border p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="text-foreground font-bold mb-1">Real-time storm tracking is coming soon to the Snowy Mountains.</p>
          <p>For now, subscribe below and we'll email you when our forecast models show your threshold being met in your selected window.</p>
        </div>
      </div>

      <AlertSubscribeForm defaultRegion="snowy-mountains" />
    </div>
  );
}
