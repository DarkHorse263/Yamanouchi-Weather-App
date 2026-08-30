import { useGetPowderAlerts } from "@workspace/api-client-react";
import { useLanguage, PremiumGate, useOptionalSeason } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";
import { Card, Badge, LoadingScreen, ErrorScreen } from "../components/ui-elements";
import { BellRing, CloudLightning, Info, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { AlertSubscribeForm } from "@/components/AlertSubscribeForm";

function safeTime(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function safeDate(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function Alerts() {
  const { t } = useLanguage();
  const seasonCtx = useOptionalSeason();
  const isGreen = seasonCtx?.season === "green";
  const { data, isLoading, error } = useGetPowderAlerts(
    { region: "yamanouchi" },
    { query: { refetchInterval: 600000, enabled: !isGreen } as never },
  );

  if (isGreen) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 md:p-10 text-center">
          <Sun className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-emerald-900">
            {t("Powder alerts return for snow season", "パウダーアラートは冬季に再開します")}
          </h1>
          <p className="text-sm md:text-base text-emerald-800/80 mt-3 leading-relaxed">
            {t(
              "Snowfall thresholds aren't tracked over the green season. Switch the season pill back to winter once the forecast shows snow on the way.",
              "グリーンシーズン中は降雪量を追跡していません。雪の予報が出始めたらシーズン切替を冬に戻してください。",
            )}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!data) return null;

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'powder_day': return 'glass border-l-2 border-l-primary text-foreground';
      case 'warning': return 'glass border-l-2 border-l-rose-400 text-foreground';
      case 'watch': return 'glass border-l-2 border-l-amber-400 text-foreground';
      default: return 'glass border-l-2 border-l-sky-400 text-foreground';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <PageMeta
        title={t("Yamanouchi powder alerts", "山ノ内パウダーアラート")}
        description={t(
          "Live powder alerts and snow forecasts for Yamanouchi and Shiga Kogen. Subscribe to get notified when significant snowfall is forecast.",
          "山ノ内・志賀高原のパウダーアラートと降雪予報。まとまった降雪の予報時に通知を受け取れます。",
        )}
        path="/yamanouchi/alerts"
      />
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <BellRing className="w-8 h-8 text-white" />
          {t("Powder Alerts", "パウダーアラート")}
        </h1>
        <p className="text-white/70 mt-2">{t("Get notified when significant snow is forecast.", "まとまった降雪が予報されたら通知します。")}</p>
      </div>

      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-white">{t("Active Alerts", "現在のアラート")}</h2>
        
        {data.alerts.length === 0 ? (
          <Card className="bg-white text-center py-9">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">{t("No active alerts", "現在アラートはありません")}</h3>
            <p className="text-muted-foreground">{t("Conditions are stable.", "コンディションは安定しています。")}</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {data.alerts.map((alert, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.1, 0.35) }}
                key={alert.id}
              >
                <div className={`rounded-2xl p-5 border shadow-lg ${getAlertColor(alert.alertLevel)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-xs font-black tracking-wider px-2 py-1 bg-white/20 rounded-md">
                        {alert.alertLevel.replace('_', ' ')}
                      </span>
                      <span className="font-bold opacity-90">{alert.resort}</span>
                    </div>
                    <span className="text-xs font-bold opacity-75">
                      {safeTime(alert.issuedAt)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">
                    {t(alert.message, alert.messageJa)}
                  </h3>
                  
                  {alert.expectedSnow && (
                    <div className="inline-flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg mt-2">
                      <span className="text-sm font-bold uppercase opacity-80">Expected:</span>
                      <span className="font-black text-lg">{alert.expectedSnow} cm</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-white/20">
        <PremiumGate
          title="Powder & weather alerts"
          titleJa="降雪・気象アラート"
          blurb="Get a push when conditions hit. Set thresholds for snowfall, wind and freezing level."
          blurbJa="条件達成時にプッシュ通知。降雪・風速・凍結高度を設定。"
        >
          <AlertSubscribeForm defaultRegion="yamanouchi" />
        </PremiumGate>
      </div>

      <div className="space-y-5 pt-6 border-t border-white/20">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CloudLightning className="w-6 h-6 text-white/80" />
          {t("Storm Tracker", "ストームトラッカー")}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {data.stormTracker.map((storm) => (
            <Card key={storm.id} className="relative overflow-hidden">
              <div className={`absolute top-0 inset-x-0 h-1.5 ${storm.status === 'active' ? 'bg-red-500' : storm.status === 'incoming' ? 'bg-blue-500' : 'bg-slate-300'}`} />
              
              <div className="flex justify-between items-start mb-2">
                <Badge variant={storm.status === 'active' ? 'destructive' : storm.status === 'incoming' ? 'primary' : 'outline'}>
                  {storm.status}
                </Badge>
                {storm.startDate && (
                  <span className="text-xs font-bold text-muted-foreground">
                    {safeDate(storm.startDate)}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-bold mb-1">{t(storm.region, null)}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {t(storm.description, storm.descriptionJa)}
              </p>
              
              <div className="flex gap-4 border-t border-border pt-3">
                {storm.totalSnow && (
                  <div>
                    <span className="text-xs font-bold uppercase text-muted-foreground block">Total</span>
                    <span className="text-lg font-black text-foreground">{storm.totalSnow} cm</span>
                  </div>
                )}
                {storm.peakSnow24h && (
                  <div>
                    <span className="text-xs font-bold uppercase text-muted-foreground block">Peak 24h</span>
                    <span className="text-lg font-black text-primary">{storm.peakSnow24h} cm</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
