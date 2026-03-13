import { useGetResorts } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { Snowflake, Ruler, ThermometerSnowflake, Wind, CalendarDays, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

function safeTime(raw: string | null | undefined): string {
  if (!raw) return "Live";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Live";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Live";
  }
}

export default function Resorts() {
  const { t } = useLanguage();
  const { data: resorts, isLoading, error } = useGetResorts({ query: { refetchInterval: 1800000 } });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!resorts) return null;

  // Group by region
  const grouped = resorts.reduce((acc, resort) => {
    const region = resort.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(resort);
    return acc;
  }, {} as Record<string, typeof resorts>);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Ski Resorts", "スキー場")}</h1>
        <p className="text-muted-foreground mt-2">{t("Live conditions across all Yamanouchi areas", "山ノ内町全エリアの最新コンディション")}</p>
      </div>

      {/* Hourly update timeline */}
      <HourlyTimeline lastUpdatedAt={resorts[0]?.sourceUpdatedAt} />

      {Object.entries(grouped).map(([region, regionResorts], regionIdx) => (
        <div key={region} className="space-y-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-border pb-2">
            {t(region, regionResorts[0]?.regionJa)}
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {regionResorts.length}
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {regionResorts.map((resort, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (regionIdx * 0.1) + (idx * 0.05) }}
                key={resort.id}
              >
                <Card className="h-full flex flex-col hover:border-primary/40 transition-colors duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-mountain-dark leading-tight">
                      {t(resort.name, resort.nameJa)}
                    </h3>
                    {resort.rank === 1 && (
                      <span className="text-xl shrink-0">🥇</span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Snowflake className="w-3.5 h-3.5 text-blue-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-blue-700">{resort.snow24h ?? 0}</div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase">24h</div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Ruler className="w-3.5 h-3.5 text-indigo-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-indigo-700">{resort.baseDepth ?? 0}</div>
                      <div className="text-[9px] font-bold text-indigo-500 uppercase">Base</div>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-red-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-red-700">{resort.temp ?? '-'}</div>
                      <div className="text-[9px] font-bold text-red-500 uppercase">Temp</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl text-center flex flex-col justify-center">
                      <Wind className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
                      <div className="text-sm font-black text-emerald-700">{resort.wind ?? '-'}</div>
                      <div className="text-[9px] font-bold text-emerald-500 uppercase">Wind</div>
                    </div>
                  </div>

                  {resort.snowTomorrow !== null && resort.snowTomorrow > 0 && (
                    <div className="mt-auto bg-orange-50 border border-orange-200 rounded-lg p-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-orange-700 font-bold">
                        <CalendarDays className="w-4 h-4" />
                        {t("Tomorrow", "明日")}
                      </div>
                      <div className="font-black text-orange-600">
                        +{resort.snowTomorrow} cm
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border space-y-2">
                    {resort.websiteUrl && (
                      <a
                        href={resort.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t("Official Website", "公式サイト")}
                      </a>
                    )}
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      <span>{resort.weatherStation || 'JMA Station'}</span>
                      <span>{safeTime(resort.sourceUpdatedAt)}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
