import { useLanguage } from "@workspace/feelzlike-shell";
import { motion } from "framer-motion";
import { ExternalLink, Camera, Video, AlertTriangle } from "lucide-react";
import { CAMS_DATA } from "../data/seed-data";

const ICON_MAP = { Camera, Video };

export default function Cams() {
  const { t } = useLanguage();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          {t("Live Cams", "ライブカメラ")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("Road & ski conditions across Nagano Prefecture", "長野県全域の道路・スキー場ライブ映像")}
        </p>
      </div>

      <div className="space-y-6">
        {CAMS_DATA.map((cam, idx) => {
          const Icon = ICON_MAP[cam.icon];
          return (
            <motion.div
              key={cam.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${cam.color} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white/80" />
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">
                      {t(cam.title, cam.titleJa)}
                    </p>
                    <p className="text-white/70 text-[10px]">
                      {t(cam.subtitle, cam.subtitleJa)}
                    </p>
                  </div>
                </div>
                <a
                  href={cam.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("Open", "開く")}
                </a>
              </div>

              {cam.externalOnly ? (
                <div className="px-4 py-5 flex flex-col items-center gap-3 bg-slate-50 text-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {t(cam.note!, cam.noteJa!)}
                  </p>
                  <a
                    href={cam.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t("Open in new tab", "新しいタブで開く")}
                  </a>
                </div>
              ) : (
                <div className="relative" style={{ paddingBottom: "56.25%", height: 0 }}>
                  <iframe
                    src={cam.embedUrl}
                    title={cam.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t(
            "Camera feeds are operated by third parties. Availability may vary. Road cameras cover national and prefectural routes leading to Nagano ski resorts. Check road conditions before driving in winter.",
            "カメラ映像は各運営機関が管理しています。配信状況は変わる場合があります。道路カメラは長野県のスキー場への国道・県道をカバーしています。冬季の運転前に必ずご確認ください。"
          )}
        </p>
      </div>
    </div>
  );
}
