import { useGetDashboard, useGetPowderAlerts } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { useSeason } from "@workspace/feelzlike-shell";
import { ErrorScreen } from "../components/ui-elements";
import { HourlyTimeline } from "../components/hourly-timeline";
import {
  Trophy,
  Wind,
  ThermometerSnowflake,
  Ruler,
  Snowflake,
  BellRing,
  ChevronRight,
  TreePine,
  Mountain,
  Waves,
  Bike,
  Camera,
  Bus,
  BookOpen,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useEffect, useState } from "react";

function shortName(name: string): string {
  return name
    .replace(/^Shiga Kogen\s+/i, "")
    .replace(/\s+(Ski Area|Ski Park|Onsen Ski Area|Ski Resort)$/i, "")
    .trim();
}

const HERO_SLIDES = [
  { src: "hero-slide-1.jpg", label: "Shiga Kogen" },
  { src: "hero-slide-2.jpg", label: "Fresh Tracks" },
  { src: "hero-slide-3.jpg", label: "Shiga Kogen" },
  { src: "hero-slide-4.jpg", label: "Snow Monsters" },
];

function HeroSlideshow({ base }: { base: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCurrent((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}: ${s.label}`}
            aria-current={i === current ? "true" : undefined}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-white" : "w-1 bg-white/50"
            }`}
          />
        ))}
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-4 max-w-7xl mx-auto animate-pulse">
      <div className="rounded-3xl bg-secondary min-h-[260px]" />
      <div className="h-20 rounded-2xl bg-secondary" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-secondary" />
        ))}
      </div>
    </div>
  );
}

const ALERT_STYLES: Record<
  string,
  { wrap: string; icon: string; pill: string }
> = {
  powder_day: {
    wrap: "border-l-2 border-l-primary bg-primary/5",
    icon: "text-primary",
    pill: "bg-primary/10 text-primary",
  },
  warning: {
    wrap: "border-l-2 border-l-rose-500 bg-rose-50",
    icon: "text-rose-600",
    pill: "bg-rose-100 text-rose-700",
  },
  watch: {
    wrap: "border-l-2 border-l-amber-500 bg-amber-50",
    icon: "text-amber-600",
    pill: "bg-amber-100 text-amber-700",
  },
  info: {
    wrap: "border-l-2 border-l-sky-500 bg-sky-50",
    icon: "text-sky-600",
    pill: "bg-sky-100 text-sky-700",
  },
};

const GREEN_HIGHLIGHTS = [
  { icon: Mountain, name: "Shiga Kogen Hiking", nameJa: "志賀高原ハイキング", desc: "Alpine trails & wetlands", descJa: "高山トレイルと湿原" },
  { icon: Camera, name: "Snow Monkey Park", nameJa: "地獄谷野猿公苑", desc: "Year-round wild macaques", descJa: "通年 野生のニホンザル" },
  { icon: Waves, name: "SORA Terrace", nameJa: "SORAテラス", desc: "Cloud sea views at 1,770m", descJa: "標高1,770mの雲海" },
  { icon: Bike, name: "Cycling Routes", nameJa: "サイクリングコース", desc: "Valley & mountain roads", descJa: "渓谷と山岳道路" },
  { icon: Waves, name: "9 Bathhouse Tour", nameJa: "外湯めぐり", desc: "Shibu Onsen stone streets", descJa: "渋温泉の石畳" },
  { icon: TreePine, name: "Autumn Colours", nameJa: "紅葉", desc: "Sep–Nov koyo season", descJa: "9〜11月 紅葉シーズン" },
];

function GreenHome({ t }: { t: (en: string, ja: string) => string }) {
  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto">
      {/* Editorial intro */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <h2 className="text-sm md:text-base font-light text-muted-foreground tracking-tight inline-flex items-center gap-x-1.5 flex-wrap justify-center">
          <span>{t("I wonder what it", "今")}</span>
          <span className="font-display font-medium italic text-foreground">
            feelz<span className="text-primary not-italic font-semibold">like</span>
          </span>
          <span>{t("in Yamanouchi right now…", "の山ノ内町は…")}</span>
        </h2>
      </motion.div>

      {/* GREEN HERO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(15,23,42,0.25)]"
        style={{ minHeight: 280 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/hero-slide-1.jpg`}
          alt="Yamanouchi green season"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,33,28,0.7) 0%, rgba(8,18,30,0.45) 60%, rgba(8,18,30,0.25) 100%)",
          }}
        />
        <div className="relative z-10 p-6 md:p-8 flex flex-col min-h-[280px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TreePine className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-white/80 font-semibold text-[10px] tracking-[0.18em] uppercase">
                {t("Green Season · Yamanouchi Town", "グリーンシーズン · 山ノ内町")}
              </span>
            </div>
            <h1
              className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight leading-[1.05] mb-2"
            >
              {t("Yamanouchi Town", "山ノ内町")}
            </h1>
            <p className="text-white/85 text-sm md:text-base font-medium">
              {t("Hiking, Onsen & Mountain Culture", "ハイキング・温泉・山岳文化")}
            </p>
            <p className="text-white/60 text-xs font-medium mt-1">
              Shiga Kogen · Ryuoo · Shibu Onsen · Yudanaka
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <div className="text-white">
              <span className="display-number text-4xl">8</span>
              <span className="text-white/70 text-sm font-medium ml-1.5">
                {t("activities", "アクティビティ")}
              </span>
            </div>
            <Link href="/activities">
              <span className="text-white/90 text-xs font-semibold hover:text-white flex items-center gap-1">
                {t("View all", "すべて見る")} <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* GREEN HIGHLIGHTS */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <div className="flex items-center gap-2 mb-3">
          <TreePine className="w-3.5 h-3.5 text-primary" />
          <h2 className="byline text-muted-foreground">{t("Things to Do", "おすすめアクティビティ")}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GREEN_HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                <Link href="/activities">
                  <div className="rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer h-full shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                    <div className="w-8 h-8 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-display font-medium text-sm text-foreground leading-tight">
                      {t(item.name, item.nameJa)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t(item.desc, item.descJa)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* QUICK LINKS - town-centric */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/transport", icon: Bus,      label: t("Getting Here", "アクセス"),  sub: t("Trains & Buses",  "電車・バス") },
            { href: "/cams",      icon: Video,    label: t("Live Cams",    "ライブカメラ"), sub: t("See it now",      "今の様子") },
            { href: "/guide",     icon: BookOpen, label: t("Town Guide",   "ガイド"),    sub: t("Tips & Info",     "お役立ち情報") },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="rounded-2xl border border-border bg-card p-4 text-center cursor-pointer hover:border-primary/30 hover:-translate-y-0.5 transition-all shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="font-semibold text-sm text-foreground">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{link.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* DISCLAIMER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-secondary px-4 py-3">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t(
            "Weather data from the Japan Meteorological Agency. Activity information is for reference - confirm opening dates and conditions directly with operators.",
            "気象データは気象庁提供。アクティビティ情報は参考用です。営業日と状況は各施設へ直接ご確認ください。"
          )}
        </p>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const { data, isLoading, error } = useGetDashboard({ query: { refetchInterval: 600000, enabled: isWinter } as never });
  const { data: alertData } = useGetPowderAlerts({ region: "yamanouchi" }, { query: { refetchInterval: 600000, enabled: isWinter } as never });

  if (!isWinter) return <GreenHome t={t} />;

  if (isLoading) return <HomeSkeleton />;
  if (error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;
  if (!data) return null;

  const activeAlerts = alertData?.alerts?.slice(0, 2) ?? [];

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto">

      {/* ALERTS */}
      {activeAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {activeAlerts.map((alert) => {
            const style = ALERT_STYLES[alert.alertLevel] ?? ALERT_STYLES.info;
            return (
              <Link key={alert.id} href="/alerts">
                <div className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer text-foreground ${style.wrap}`}>
                  <div className="flex items-center gap-3">
                    <BellRing className={`w-4 h-4 shrink-0 animate-pulse ${style.icon}`} />
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest block leading-none mb-0.5 px-1.5 py-0.5 rounded ${style.pill}`}>
                        {alert.alertLevel.replace("_", " ")}
                      </span>
                      <span className="font-semibold text-sm mt-1 block">{t(alert.message, alert.messageJa)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}

      {/* Editorial intro */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <h2 className="text-sm md:text-base font-light text-muted-foreground tracking-tight inline-flex items-center gap-x-1.5 flex-wrap justify-center">
          <span>{t("I wonder what it", "今")}</span>
          <span className="font-display font-medium italic text-foreground">
            feelz<span className="text-primary not-italic font-semibold">like</span>
          </span>
          <span>{t("in Yamanouchi right now…", "の山ノ内町は…")}</span>
        </h2>
      </motion.div>

      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-[0_2px_4px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(15,23,42,0.25)]"
        style={{ minHeight: 280 }}
      >
        <HeroSlideshow base={import.meta.env.BASE_URL} />
        <div className="relative z-10 p-6 md:p-8 flex flex-col min-h-[280px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/85 font-semibold text-[10px] tracking-[0.18em] uppercase">
                LIVE · {t("Yamanouchi Town", "山ノ内町")}
              </span>
            </div>
            <h1 className="font-display font-semibold text-white text-4xl md:text-5xl tracking-tight leading-[1.05] mb-2">
              {t("Yamanouchi Town", "山ノ内町")}
            </h1>
            <p className="text-white/90 text-sm md:text-base font-medium">
              {t("Gateway to the Mountains", "山々への玄関口")}
            </p>
            <p className="text-white/65 text-xs font-medium mt-1">
              Shiga Kogen · Ryuoo · Yomase
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <div className="text-white">
              <span className="display-number text-4xl">{data.totalSkiAreas}</span>
              <span className="text-white/75 text-sm font-medium ml-1.5">{t("ski areas", "スキー場")}</span>
            </div>
            <p className="text-white/60 text-[11px]">
              {t("Next update", "次回更新")} · {data.nextUpdate}
            </p>
          </div>
        </div>
      </motion.div>

      {/* CONDITIONS RAIL */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
      >
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            { label: t("Avg Temp", "平均気温"),  value: data.avgTemp     != null ? `${data.avgTemp}°` : "-",  sub: "°C",   resort: null },
            { label: t("Avg Wind", "平均風速"),   value: data.avgWind     != null ? `${data.avgWind}`  : "-",  sub: "km/h", resort: null },
            // `bestResort` is the only resort-context object the dashboard
            // returns, so we tag both snow stats with it (the legacy
            // `topSnowResort` field was removed from the schema).
            { label: t("New Snow", "新雪 24h"),   value: data.topSnow24h  != null ? `${data.topSnow24h}` : "-", sub: "cm",   resort: data.bestResort },
            { label: t("Best Base", "最大積雪"),  value: data.bestBase    != null ? `${data.bestBase}`  : "-",  sub: "cm",   resort: data.bestResort },
          ].map(({ label, value, sub, resort }) => (
            <div key={label} className="px-2 py-4 text-center flex flex-col items-center justify-center">
              <p className="byline text-muted-foreground mb-1.5 leading-tight">{label}</p>
              <p className="display-number text-2xl text-foreground" data-numeric>
                {value}
                <span className="text-xs font-medium text-muted-foreground ml-0.5">{sub}</span>
              </p>
              {resort && (
                <p className="text-[9px] font-semibold text-muted-foreground mt-1.5 leading-tight truncate w-full px-0.5 uppercase tracking-wider">
                  {t(shortName(resort.name), shortName(resort.nameJa ?? resort.name))}
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* HOURLY TIMELINE */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <HourlyTimeline lastUpdatedAt={data.bestResort?.sourceUpdatedAt} />
      </motion.div>

      {/* BEST RESORT + REGIONS */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* Best Resort */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <h2 className="byline text-muted-foreground">{t("Best Snow Right Now", "ベストスノー")}</h2>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.16em] mb-1">#1 Ranked</p>
                <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                  {t(data.bestResort.name, data.bestResort.nameJa)}
                </h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {t(data.bestResort.region, data.bestResort.regionJa)}
                </p>
              </div>
              <span className="text-2xl">🥇</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Snowflake,            label: t("24h Snow", "24h降雪"), value: `${data.bestResort.snow24h ?? 0} cm`,    color: "text-sky-600" },
                { icon: Ruler,                label: t("Base", "積雪"),         value: `${data.bestResort.baseDepth ?? 0} cm`,  color: "text-indigo-600" },
                { icon: ThermometerSnowflake, label: t("Temp", "気温"),         value: `${data.bestResort.temp ?? '--'}°C`,    color: "text-foreground" },
                { icon: Wind,                 label: t("Wind", "風速"),         value: `${data.bestResort.wind ?? '--'} km/h`, color: "text-foreground" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-secondary rounded-xl px-3 py-2.5">
                  <div className={`flex items-center gap-1 ${color} mb-1`}>
                    <Icon className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-base font-bold text-foreground" data-numeric>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Regional overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="byline text-muted-foreground">{t("Regional Overview", "エリア概要")}</h2>
          </div>
          <div className="space-y-3">
            {data.regions.map((region) => (
              <div key={region.name} className="rounded-2xl border border-border bg-card px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-semibold text-foreground">{t(region.name, region.nameJa)}</h3>
                  <span className="text-[10px] font-semibold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                    {region.resortCount} {t("resorts", "スキー場")}
                  </span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  <div className="pr-4 text-center">
                    <p className="byline text-muted-foreground mb-1">{t("New Snow", "新雪")}</p>
                    <p className="display-number text-lg text-sky-600" data-numeric>
                      {region.topSnow ?? 0}
                      <span className="text-xs font-medium text-muted-foreground ml-0.5">cm</span>
                    </p>
                  </div>
                  <div className="px-4 text-center">
                    <p className="byline text-muted-foreground mb-1">{t("Best Base", "最大積雪")}</p>
                    <p className="display-number text-lg text-foreground" data-numeric>
                      {region.bestBase ?? 0}
                      <span className="text-xs font-medium text-muted-foreground ml-0.5">cm</span>
                    </p>
                  </div>
                  <div className="pl-4 text-center">
                    <p className="byline text-muted-foreground mb-1">{t("Avg Temp", "平均気温")}</p>
                    <p className="display-number text-lg text-foreground" data-numeric>
                      {region.avgTemp != null ? region.avgTemp.toFixed(1) : '--'}
                      <span className="text-xs font-medium text-muted-foreground ml-0.5">°C</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* TOWN-FIRST QUICK LINKS */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/transport", icon: Bus,      label: t("Getting Here",  "アクセス"),    sub: t("Trains & Buses", "電車・バス") },
            { href: "/cams",      icon: Video,    label: t("Live Cams",     "ライブカメラ"), sub: t("See it now",     "今の様子") },
            { href: "/guide",     icon: BookOpen, label: t("Town Guide",    "ガイド"),     sub: t("Tips & Info",    "お役立ち情報") },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className="rounded-2xl border border-border bg-card p-4 text-center cursor-pointer hover:border-primary/30 hover:-translate-y-0.5 transition-all shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                  <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                  <p className="font-semibold text-sm text-foreground">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{link.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* DISCLAIMER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="rounded-xl border border-border bg-secondary px-4 py-3">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t(
            "Snow depth & conditions from resort reporting networks. Temperature, wind & forecasts from the Japan Meteorological Agency. Updated hourly 5 AM–6 PM JST. For informational use only - verify directly with resorts before skiing.",
            "積雪・ゲレンデ状況は各スキー場の報告に基づきます。気温・風・予報は気象庁提供。毎日5時〜18時（JST）更新。参考情報です。滑走前に各スキー場へ直接ご確認ください。"
          )}
        </p>
      </motion.div>

    </div>
  );
}
