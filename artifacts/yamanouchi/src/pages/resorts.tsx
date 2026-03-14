import { useGetResorts } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { ExternalLink, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

function safeTime(raw: string | null | undefined): string {
  if (!raw) return "Live";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "Live";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return "Live"; }
}

export default function Resorts() {
  const { t } = useLanguage();
  const { data: resorts, isLoading, error } = useGetResorts({ query: { refetchInterval: 1800000 } });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!resorts) return null;

  const grouped = resorts.reduce((acc, resort) => {
    const region = resort.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(resort);
    return acc;
  }, {} as Record<string, typeof resorts>);

  const maxBase = Math.max(...resorts.map(r => r.baseDepth ?? 0), 1);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-900">{t("Ski Resorts", "スキー場")}</h1>
        <p className="text-slate-400 text-sm mt-1">{t("Live conditions · Yamanouchi areas", "山ノ内町全エリアのライブ状況")}</p>
      </div>

      <div className="mb-6">
        <HourlyTimeline lastUpdatedAt={resorts[0]?.sourceUpdatedAt} />
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([region, regionResorts], regionIdx) => (
          <div key={region}>

            {/* Region header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {t(region, regionResorts[0]?.regionJa)}
              </h2>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {regionResorts.length} {t("resorts", "スキー場")}
              </span>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {regionResorts.map((resort, idx) => {
                const base = resort.baseDepth ?? 0;
                const basePct = maxBase > 0 ? Math.round((base / maxBase) * 100) : 0;

                return (
                  <motion.div
                    key={resort.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (regionIdx * 0.06) + (idx * 0.04) }}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                  >
                    {/* Name row */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {t(resort.name, resort.nameJa)}
                      </h3>
                      {resort.rank === 1 && <span className="shrink-0 text-base">🥇</span>}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-4 text-center">
                      <div>
                        <p className="text-base font-black text-blue-600">{resort.snow24h ?? 0}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">24h cm</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-800">{resort.baseDepth ?? 0}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Base cm</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-700">{resort.temp ?? '—'}°</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Temp °C</p>
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-500">{resort.wind ?? '—'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wind km/h</p>
                      </div>
                    </div>

                    {/* Base depth bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1">
                      <div
                        className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${basePct}%` }}
                      />
                    </div>

                    {/* Tomorrow snow */}
                    {resort.snowTomorrow !== null && resort.snowTomorrow > 0 && (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <CalendarDays className="w-3 h-3" />
                          <span className="text-xs font-bold">{t("Tomorrow", "明日")}</span>
                        </div>
                        <span className="text-xs font-black text-blue-700">+{resort.snowTomorrow} cm</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                      {resort.websiteUrl ? (
                        <a
                          href={resort.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {t("Official Website", "公式サイト")}
                        </a>
                      ) : <span />}
                      <span className="text-[9px] text-slate-300 font-medium tabular-nums">
                        {safeTime(resort.sourceUpdatedAt)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
