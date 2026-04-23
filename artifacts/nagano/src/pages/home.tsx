import { useLanguage } from "@/hooks/use-language";
import { Card, StatTile } from "@/components/ui-elements";
import { HourlyTimeline } from "@/components/hourly-timeline";
import { Trophy, Wind, ThermometerSnowflake, Ruler, Snowflake, Activity, BellRing, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { getSeededResorts, getDashboardData } from "@/data/resorts";
import { ALERTS } from "@/data/seed-data";

const HERO_SLIDES = [
  { src: "hero-slide-1.jpg", label: "Hakuba Valley" },
  { src: "hero-slide-2.jpg", label: "Fresh Powder" },
  { src: "hero-slide-3.jpg", label: "Shiga Kogen" },
  { src: "hero-slide-4.jpg", label: "Snow Country" },
];

function HeroSlideshow({ base }: { base: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence mode="sync">
        <motion.img
          key={current}
          src={`${base}images/${HERO_SLIDES[current].src}`}
          alt={HERO_SLIDES[current].label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}: ${s.label}`}
            aria-current={i === current ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
          />
        ))}
      </div>
    </>
  );
}

const ALERT_STYLES: Record<string, string> = {
  powder_day: "bg-purple-600 border-purple-700",
  warning:    "bg-red-600 border-red-700",
  watch:      "bg-amber-500 border-amber-600",
  info:       "bg-blue-600 border-blue-700",
};

export default function Home() {
  const { t } = useLanguage();

  const data = useMemo(() => {
    const resorts = getSeededResorts();
    return getDashboardData(resorts);
  }, []);

  const activeAlerts = ALERTS.alerts.slice(0, 2);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto">

      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {activeAlerts.map((alert) => (
            <Link key={alert.id} href="/alerts">
              <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border shadow-lg cursor-pointer text-white ${ALERT_STYLES[alert.alertLevel] ?? ALERT_STYLES.info}`}>
                <div className="flex items-center gap-3">
                  <BellRing className="w-4 h-4 shrink-0 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block leading-none mb-0.5">
                      {t(alert.alertLevel.replace("_", " "), alert.alertLevel === "powder_day" ? "パウダーデー" : alert.alertLevel === "warning" ? "警報" : "注意報")}
                    </span>
                    <span className="font-bold text-sm leading-tight">
                      {t(alert.message, alert.messageJa)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-70 shrink-0" />
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 pb-1"
      >
        <h2 className="text-base md:text-lg font-semibold text-slate-700 tracking-tight leading-snug inline-flex items-center gap-x-2 flex-wrap justify-center">
          <span>{t("I wonder what it", "今")}</span>
          <img
            src={`${import.meta.env.BASE_URL}branding/wordmark-inline.png`}
            alt="feelzlike"
            className="inline-block h-5 md:h-6 w-auto"
          />
          <span>{t("in Nagano right now...", "の長野県は…")}</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-mountain-dark"
      >
        <HeroSlideshow base={import.meta.env.BASE_URL} />

        <div className="relative z-10 p-6 md:p-10 flex flex-col min-h-[280px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 font-bold text-xs tracking-widest uppercase">
                LIVE {t("DATA", "データ")}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-2">
              {t("Nagano Prefecture", "長野県")}
            </h1>
            <p className="text-ice-blue text-lg md:text-xl font-medium max-w-xl">
              {t("Snow Intelligence Platform", "スノーインテリジェンスプラットフォーム")}
            </p>
            <p className="text-white/70 font-medium text-sm mt-1">
              {t("Hakuba · Shiga Kogen · Nozawa · Madarao · and more", "白馬 · 志賀高原 · 野沢 · 斑尾 · その他")}
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 mt-8">
            <div className="glass-dark px-4 py-2 rounded-xl inline-flex items-center gap-2 border-white/10">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-white font-bold">{data.totalSkiAreas} {t("Ski Resorts", "スキー場")}</span>
            </div>
            <div className="text-white/60 text-xs text-right">
              {t("Demo data · Seed values", "デモデータ · シード値")}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatTile
          label={t("Avg Temp", "平均気温")}
          value={data.avgTemp}
          unit="°C"
          colorClass="bg-gradient-to-br from-red-500 to-rose-700"
        />
        <StatTile
          label={t("Avg Wind", "平均風速")}
          value={data.avgWind}
          unit="km/h"
          colorClass="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
        <StatTile
          label={t("New Snow Last 24hrs", "新雪(過去24時間)")}
          value={data.topSnow24h}
          unit="cm"
          colorClass="bg-gradient-to-br from-blue-400 to-primary"
        />
        <StatTile
          label={t("Best Base", "最大積雪")}
          value={data.bestBase}
          unit="cm"
          colorClass="bg-gradient-to-br from-indigo-500 to-purple-700"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <HourlyTimeline />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold">{t("Best Snow Right Now", "現在のベストスノー")}</h2>
          </div>
          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">{t("#1 Ranked", "1位")}</span>
                <h3 className="text-2xl font-black text-mountain-dark leading-tight mt-1">
                  {t(data.bestResort.name, data.bestResort.nameJa)}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(data.bestResort.region, data.bestResort.regionJa)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">🥇</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { icon: Snowflake, label: t("24h Snow", "24h降雪"), value: `${data.bestResort.snow24h ?? 0} cm`, color: "text-blue-600" },
                { icon: Ruler, label: t("Base", "積雪"), value: `${data.bestResort.baseDepth ?? 0} cm`, color: "text-indigo-600" },
                { icon: ThermometerSnowflake, label: t("Temp", "気温"), value: `${data.bestResort.temp ?? '--'}°C`, color: "text-red-600" },
                { icon: Wind, label: t("Wind", "風速"), value: `${data.bestResort.wind ?? '--'} km/h`, color: "text-emerald-600" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white/60 p-3 rounded-xl">
                  <div className={`flex items-center gap-1.5 ${color} mb-1`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{label}</span>
                  </div>
                  <div className="text-lg font-black">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">{t("Regional Overview", "エリア概要")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.regions.slice(0, 6).map((region, idx) => (
              <Card key={idx} className="hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">{t(region.name, region.nameJa)}</h3>
                  <span className="text-xs font-bold bg-secondary px-2 py-1 rounded-md text-muted-foreground">
                    {region.resortCount} {t("resorts", "スキー場")}
                  </span>
                </div>
                <div className="flex items-center divide-x divide-border">
                  <div className="flex-1 pr-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{t("New Snow 24h", "新雪24h")}</p>
                    <p className="text-lg font-black text-primary">{region.topSnow} cm</p>
                  </div>
                  <div className="flex-1 px-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{t("Best Base", "最大積雪")}</p>
                    <p className="text-lg font-black text-indigo-600">{region.bestBase} cm</p>
                  </div>
                  <div className="flex-1 pl-3 text-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{t("Avg Temp", "平均気温")}</p>
                    <p className="text-lg font-black text-red-600">{region.avgTemp}°C</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 rounded-xl border border-border bg-muted/40 px-4 py-4"
      >
        <p className="text-xs font-semibold text-foreground/70 mb-1.5">
          {t("Data Sources & Disclaimer", "データソース・免責事項")}
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t(
            "This is a demonstration platform for Nagano Prefecture Snow Intelligence. Data shown is simulated seed data for pitch purposes. In production, snow depth and resort conditions would be sourced from individual ski resort reporting networks and JMA numerical weather models. Always verify conditions directly with individual resorts before skiing or snowboarding.",
            "これは長野県スノーインテリジェンスのデモプラットフォームです。表示されるデータはピッチ目的のシミュレーションデータです。本番では、積雪深やゲレンデ状況は各スキー場の報告ネットワークおよびJMA数値予報モデルから取得されます。滑走前に必ず各スキー場へ直接ご確認ください。"
          )}
        </p>
      </motion.div>
    </div>
  );
}
