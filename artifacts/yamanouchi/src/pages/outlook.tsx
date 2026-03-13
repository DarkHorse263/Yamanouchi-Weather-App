import { useGetSnowOutlook } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, Badge, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Outlook() {
  const { t } = useLanguage();
  const { data: outlooks, isLoading, error } = useGetSnowOutlook({ query: { refetchInterval: 600000 } });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!outlooks) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-mountain-dark">{t("Snow Outlook", "降雪予報")}</h1>
        <p className="text-muted-foreground mt-2">{t("72-hour forecast ranked by region", "地域別72時間降雪予報")}</p>
        {outlooks[0] && (
          <p className="text-xs font-bold text-primary mt-2 uppercase tracking-wide">
            Updated {format(new Date(outlooks[0].updatedAt), "MMM d, HH:mm")}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {outlooks.map((region, idx) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={region.region}
          >
            <Card className="overflow-hidden p-0 border-2 transition-all hover:border-primary/50">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-secondary font-black text-xl text-mountain-dark border-2 border-white shadow-sm shrink-0">
                    #{region.rank}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t(region.region, region.regionJa)}</h2>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={
                        region.level === 'Extreme' || region.level === 'High' ? 'destructive' :
                        region.level === 'Moderate' ? 'primary' : 'default'
                      }>
                        {region.level}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground flex items-center">
                        Signal: {region.signal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center min-w-[80px]">
                    <div className="text-xs font-bold text-blue-500 uppercase mb-1">24h</div>
                    <div className="text-2xl font-black text-blue-700">{region.snow24h ?? 0}<span className="text-xs font-medium ml-0.5">cm</span></div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center min-w-[80px]">
                    <div className="text-xs font-bold text-indigo-500 uppercase mb-1">48h</div>
                    <div className="text-2xl font-black text-indigo-700">{region.snow48h ?? 0}<span className="text-xs font-medium ml-0.5">cm</span></div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center min-w-[80px]">
                    <div className="text-xs font-bold text-purple-500 uppercase mb-1">72h</div>
                    <div className="text-2xl font-black text-purple-700">{region.snow72h ?? 0}<span className="text-xs font-medium ml-0.5">cm</span></div>
                  </div>
                </div>
                
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
