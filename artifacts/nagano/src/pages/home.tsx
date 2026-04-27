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
  powder_day: "border-l-2 border-l-primary text-primary",
  warning:    "border-l-2 border-l-rose-400 text-rose-300",
  watch:      "border-l-2 border-l-amber-400 text-amber-300",
  info:       "border-l-2 border-l-sky-400 text-sky-300",
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
          {activeAlerts.map((alert) => {
            const accent = ALERT_STYLES[alert.alertLevel] ?? ALERT_STYLES.info;
            return (
              <Link key={alert.id} href="/alerts">
                <div className={`flex items-center justify-between px-5 py-3 rounded-2xl glass cursor-pointer ${accent}`}>
                  <div className="flex items-center gap-3">
                    <BellRing className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="byline opacity-80 block leading-none mb-1">
                        {t(alert.alertLevel.replace("_", " "), alert.alertLevel === "powder_day" ? "パウダーデー" : alert.alertLevel === "warning" ? "警報" : "注意報")}
                      </span>
                      <span className="font-medium text-sm leading-tight text-foreground">
                        {t(alert.message, alert.messageJa)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 pb-1"
      >
        <h2 className="text-sm md:text-base font-light text-muted-foreground tracking-tight leading-snug inline-flex items-center gap-x-1.5 flex-wrap justify-center">
          <span>{t("I wonder what it", "今")}</span>
          <span className="font-display font-medium italic text-foreground">feelz<span className="text-primary not-italic font-semibold">like</span></span>
          <span>{t("in Nagano right now…", "の長野県は…")}</span>
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-secondary"
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
            <p className="text-primary text-lg md:text-xl font-medium max-w-xl">
              {t("Snow Intelligence Platform", "スノーインテリジェンスプラットフォーム")}
            </p>
            <p className="text-white/70 font-medium text-sm mt-1">
              {t("Hakuba · Shiga Kogen · Nozawa · Madarao · and more", "白馬 · 志賀高原 · 野沢 · 斑尾 · その他")}
            </p>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4 mt-8">
            <div className="glass px-4 py-2 rounded-xl inline-flex items-center gap-2 border-white/10">
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
          <Card className="border-l-2 border-l-accent">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="byline text-accent">{t("#1 Ranked", "1位")}</span>
                <h3 className="font-display font-semibold text-2xl text-foreground leading-tight mt-1">
                  {t(data.bestResort.name, data.bestResort.nameJa)}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t(data.bestResort.region, data.bestResort.regionJa)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-lg">🥇</div>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-3 mt-4 pt-4 border-t border-white/5">
              {[
                { icon: Snowflake, label: t("24h Snow", "24h降雪"), value: `${data.bestResort.snow24h ?? 0} cm` },
                { icon: Ruler, label: t("Base", "積雪"), value: `${data.bestResort.baseDepth ?? 0} cm` },
                { icon: ThermometerSnowflake, label: t("Temp", "気温"), value: `${data.bestResort.temp ?? '--'}°C` },
                { icon: Wind, label: t("Wind", "風速"), value: `${data.bestResort.wind ?? '--'} km/h` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 text-muted-foreground/70 mb-1 byline">
                    <Icon className="w-3 h-3" />
                    {label}
                  </div>
                  <div className="font-display text-xl text-foreground" data-numeric>{value}</div>
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
