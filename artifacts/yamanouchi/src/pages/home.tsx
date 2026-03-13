import { useGetDashboard } from "@workspace/api-client-react";
import { useLanguage } from "@/hooks/use-language";
import { Card, StatTile, LoadingScreen, ErrorScreen } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { Trophy, Wind, ThermometerSnowflake, Ruler, Snowflake, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { t } = useLanguage();
  // Poll every 30 minutes to catch each hourly Supabase update (5AM–6PM JST)
  const { data, isLoading, error } = useGetDashboard({ query: { refetchInterval: 1800000 } });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!data) return null;

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      
      {/* HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-mountain-dark"
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-mountains.png`}
          alt="Yamanouchi Mountains" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mountain-dark via-mountain-dark/50 to-transparent" />
        
        <div className="relative z-10 p-6 md:p-10 flex flex-col min-h-[280px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold text-xs tracking-widest uppercase">
                LIVE {t("DATA", "データ")}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2">
              {t("Yamanouchi Town", "山ノ内町")}
            </h1>
            <p className="text-ice-blue text-lg md:text-xl font-medium max-w-xl">
              {t("Gateway to the Mountains", "山々への玄関口")}
            </p>
            <p className="text-white/70 font-medium text-sm mt-1">
              Shiga Kogen • Ryuo • Yomase
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 mt-8">
            <div className="glass-dark px-4 py-2 rounded-xl inline-flex items-center gap-2 border-white/10">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-white font-bold">{data.totalSkiAreas} {t("Ski Areas", "スキー場")}</span>
            </div>
            <div className="text-white/60 text-xs text-right">
              {t("Next update", "次回更新")}: {data.nextUpdate}
            </div>
          </div>
        </div>
      </motion.div>

      {/* STATS GRID */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatTile 
          label={t("Avg Temp", "平均気温")}
          value={data.avgTemp !== null ? data.avgTemp : "--"}
          unit="°C"
          colorClass="bg-gradient-to-br from-red-500 to-rose-700"
        />
        <StatTile 
          label={t("Avg Wind", "平均風速")}
          value={data.avgWind !== null ? data.avgWind : "--"}
          unit="km/h"
          colorClass="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
        <StatTile 
          label={t("Top Snow 24h", "最大降雪(24h)")}
          value={data.topSnow24h !== null ? data.topSnow24h : "--"}
          unit="cm"
          colorClass="bg-gradient-to-br from-blue-400 to-primary"
        />
        <StatTile 
          label={t("Best Base", "最大積雪")}
          value={data.bestBase !== null ? data.bestBase : "--"}
          unit="cm"
          colorClass="bg-gradient-to-br from-indigo-500 to-purple-700"
        />
      </motion.div>

      {/* HOURLY UPDATE TIMELINE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <HourlyTimeline lastUpdatedAt={data.bestResort?.sourceUpdatedAt} />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* BEST SNOW RIGHT NOW */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold">{t("Best Snow Right Now", "現在のベストスノー")}</h2>
          </div>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">#1 Ranked</span>
                <h3 className="text-2xl font-black text-mountain-dark leading-tight mt-1">
                  {t(data.bestResort.name, data.bestResort.nameJa)}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(data.bestResort.region, data.bestResort.regionJa)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
                🥇
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-white/60 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                  <Snowflake className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">24h Snow</span>
                </div>
                <div className="text-xl font-black">{data.bestResort.snow24h ?? 0} <span className="text-sm font-medium text-muted-foreground">cm</span></div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Base</span>
                </div>
                <div className="text-xl font-black">{data.bestResort.baseDepth ?? 0} <span className="text-sm font-medium text-muted-foreground">cm</span></div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-red-600 mb-1">
                  <ThermometerSnowflake className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Temp</span>
                </div>
                <div className="text-xl font-black">{data.bestResort.temp ?? '--'} <span className="text-sm font-medium text-muted-foreground">°C</span></div>
              </div>
              <div className="bg-white/60 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <Wind className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">Wind</span>
                </div>
                <div className="text-xl font-black">{data.bestResort.wind ?? '--'} <span className="text-sm font-medium text-muted-foreground">km/h</span></div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* REGION SUMMARIES */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <h2 className="text-xl font-bold mb-4">{t("Regional Overview", "エリア概要")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.regions.map((region, idx) => (
              <Card key={idx} className="hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">{t(region.name, region.nameJa)}</h3>
                  <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                    {region.resortCount} resorts
                  </span>
                </div>
                <div className="flex items-center divide-x divide-border">
                  <div className="flex-1 pr-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Top Snow</p>
                    <p className="text-lg font-black text-primary">{region.topSnow ?? 0} cm</p>
                  </div>
                  <div className="flex-1 px-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Best Base</p>
                    <p className="text-lg font-black text-indigo-600">{region.bestBase ?? 0} cm</p>
                  </div>
                  <div className="flex-1 pl-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Avg Temp</p>
                    <p className="text-lg font-black text-red-600">{region.avgTemp ?? '--'} °C</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
