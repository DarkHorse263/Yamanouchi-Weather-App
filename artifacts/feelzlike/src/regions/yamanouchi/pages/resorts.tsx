import { useGetResorts } from "@workspace/api-client-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { useSeason } from "@workspace/feelzlike-shell";
import { LoadingScreen, ErrorScreen } from "../components/ui-elements";
import { HourlyTimeline } from "../components/hourly-timeline";
import { ExternalLink, CalendarDays, BedDouble, TreePine, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { bookingRegionUrl } from "../lib/booking";
import { useState } from "react";

// Maps a region label (as returned by the resorts API) to a representative
// /resort/:id slug for the region's "live" deep-link. After the Option B
// 22-mountain refactor, the umbrella `shiga-kogen` and `kita-shiga` slugs no
// longer exist as mountain entries - we link to the headline sub-area instead.
const REGION_LIVE_MAP: Record<string, { slug: string; label: string; labelJa: string }> = {
  "Shiga Kogen": { slug: "shiga-yakebitaiyama", label: "Yakebitaiyama live", labelJa: "焼額山ライブ" },
  "Ryuoo": { slug: "ryuoo", label: "Ryuoo live", labelJa: "竜王ライブ" },
  "Kita Shiga": { slug: "ryuoo", label: "Ryuoo live", labelJa: "竜王ライブ" },
  "Kita-Shiga": { slug: "ryuoo", label: "Ryuoo live", labelJa: "竜王ライブ" },
};

const SNOW_LEVELS = {
  heavy:    { color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
  moderate: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  light:    { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  none:     { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
};

const REGION_COLORS: Record<string, string> = {
  'Shiga Kogen': '#6366F1',
  'Ryuoo':       '#0EA5E9',
  'Yomase':      '#10B981',
};

const GREEN_POIS = [
  { name: "Jigokudani Monkey Park", nameJa: "地獄谷野猿公苑", type: "wildlife", icon: "🐒" },
  { name: "SORA Terrace", nameJa: "SORAテラス", type: "viewpoint", icon: "☁️" },
  { name: "Shiga Kogen Marshlands", nameJa: "志賀高原湿原", type: "hiking", icon: "🥾" },
  { name: "Shibu Onsen", nameJa: "渋温泉", type: "onsen", icon: "♨️" },
  { name: "Yudanaka Onsen", nameJa: "湯田中温泉", type: "onsen", icon: "♨️" },
  { name: "Ryuoo Gondola", nameJa: "竜王ゴンドラ", type: "viewpoint", icon: "🚡" },
  { name: "Kumanoyu Onsen", nameJa: "熊の湯温泉", type: "onsen", icon: "♨️" },
  { name: "Yokoteyama Summit", nameJa: "横手山山頂", type: "hiking", icon: "⛰️" },
  { name: "Magarikawa Firefly Park", nameJa: "まがりかわホタル公園", type: "nature", icon: "✨" },
  { name: "Kaede no Mori", nameJa: "カエデの森", type: "nature", icon: "🍁" },
];

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
  const { isWinter } = useSeason();
  const { data: resorts, isLoading, error } = useGetResorts({ query: { refetchInterval: 600000, enabled: isWinter } });

  if (isWinter && isLoading) return <LoadingScreen />;
  if (isWinter && error) return <ErrorScreen message={(error as any)?.message || "Network error"} />;

  const grouped = isWinter && resorts ? resorts.reduce((acc, resort) => {
    const region = resort.region;
    if (!acc[region]) acc[region] = [];
    acc[region].push(resort);
    return acc;
  }, {} as Record<string, typeof resorts>) : {};

  const maxBase = isWinter && resorts ? Math.max(...resorts.map(r => r.baseDepth ?? 0), 1) : 1;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      <div className="mb-5">
        <h1 className="text-3xl font-black text-slate-900">
          {isWinter ? t("Ski Resorts", "スキー場") : t("Activities & Spots", "アクティビティ・スポット")}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isWinter
            ? t("Live conditions · Yamanouchi areas", "山ノ内町全エリアのライブ状況")
            : t("Green season highlights · Yamanouchi", "グリーンシーズンの見どころ · 山ノ内町")
          }
        </p>
      </div>

      {!isWinter && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-1">
            <TreePine className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t("Things to Do", "おすすめスポット")}</h2>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {GREEN_POIS.map((poi, idx) => (
              <motion.div
                key={poi.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 hover:border-emerald-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 text-lg">
                  {poi.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {t(poi.name, poi.nameJa)}
                  </h3>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">{poi.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isWinter && (
        <>
          <div className="mb-6">
            <HourlyTimeline lastUpdatedAt={resorts[0]?.sourceUpdatedAt} />
          </div>

          <div className="space-y-8">
            {Object.entries(grouped).map(([region, regionResorts], regionIdx) => {
              const live = REGION_LIVE_MAP[region];
              return (
              <div key={region}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    {t(region, regionResorts[0]?.regionJa)}
                  </h2>
                  {live && (
                    <Link
                      href={`/resort/${live.slug}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                    >
                      <Activity className="w-3 h-3" />
                      {t(live.label, live.labelJa)}
                    </Link>
                  )}
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
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {t(resort.name, resort.nameJa)}
                          </h3>
                          {resort.rank === 1 && <span className="shrink-0 text-base">🥇</span>}
                        </div>

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
                            <p className="text-base font-black text-slate-700">{resort.temp ?? '-'}°</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Temp °C</p>
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-500">{resort.wind ?? '-'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wind km/h</p>
                          </div>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-1">
                          <div
                            className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                            style={{ width: `${basePct}%` }}
                          />
                        </div>

                        {resort.snowTomorrow !== null && resort.snowTomorrow > 0 && (
                          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <CalendarDays className="w-3 h-3" />
                              <span className="text-xs font-bold">{t("Tomorrow", "明日")}</span>
                            </div>
                            <span className="text-xs font-black text-blue-700">+{resort.snowTomorrow} cm</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2">
                          <div className="flex items-center gap-3">
                            {resort.websiteUrl && (
                              <a
                                href={resort.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                {t("Website", "公式")}
                              </a>
                            )}
                            <a
                              href={bookingRegionUrl(resort.region)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <BedDouble className="w-2.5 h-2.5" />
                              {t("Stay Nearby", "周辺宿泊")}
                            </a>
                          </div>
                          <span className="text-[9px] text-slate-300 font-medium tabular-nums">
                            {safeTime(resort.sourceUpdatedAt)}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
