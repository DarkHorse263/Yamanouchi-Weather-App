import { useLanguage } from "@workspace/feelzlike-shell";
import { useSeason } from "@workspace/feelzlike-shell";
import { motion } from "framer-motion";
import { ExternalLink, Camera, Video, AlertTriangle } from "lucide-react";

type CamDef = {
  id: string;
  title: string;
  titleJa: string;
  subtitle: string;
  subtitleJa: string;
  url: string;
  embedUrl: string;
  icon: typeof Camera;
  color: string;
  note: string | null;
  noteJa: string | null;
  externalOnly: boolean;
  location: string;
  locationJa: string;
  vantage: "village" | "road" | "mountain";
  source: string;
  sourceJa: string;
  sourceType: "official tourism" | "public authority" | "official resort";
  verifiedAt: string;
};

const VERIFIED_AT = "2026-08-27";

const WINTER_CAMS: CamDef[] = [
  {
    id: "yudanaka-station",
    title: "Yudanaka Station · village",
    titleJa: "湯田中駅前 · 街なか",
    subtitle: "Live view outside Yudanaka Station · not a ski-slope camera",
    subtitleJa: "湯田中駅前のライブ映像 · スキー場のカメラではありません",
    url: "https://www.youtube.com/watch?v=lAWdqnXJ0w0",
    embedUrl: "https://www.youtube-nocookie.com/embed/lAWdqnXJ0w0?rel=0",
    icon: Video,
    color: "from-blue-700 to-sky-600",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Yudanaka Station, Yamanouchi",
    locationJa: "山ノ内町 湯田中駅前",
    vantage: "village",
    source: "Yamanouchi Tourism Bureau",
    sourceJa: "山ノ内まちづくり観光局",
    sourceType: "official tourism",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "road",
    title: "Road Cameras",
    titleJa: "道路カメラ",
    subtitle: "Hokushin Area - Nagano Prefecture live road conditions",
    subtitleJa: "北信エリア - 長野県道路ライブカメラ",
    url: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    embedUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    icon: Camera,
    color: "from-amber-600 to-orange-600",
    note: "Opens Nagano Prefecture's live road camera network covering routes to Yamanouchi and Shiga Kogen.",
    noteJa: "山ノ内・志賀高原へのルートをカバーする長野県道路カメラネットワーク。",
    externalOnly: true,
    location: "Hokushin, Nagano Prefecture",
    locationJa: "長野県 北信地域",
    vantage: "road",
    source: "Nagano Prefecture",
    sourceJa: "長野県",
    sourceType: "public authority",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "shiga-live",
    title: "Shiga Kogen Ski Cams",
    titleJa: "志賀高原スキーライブカメラ",
    subtitle: "Official live cameras across Shiga Kogen ski areas",
    subtitleJa: "志賀高原各スキー場の公式ライブカメラ",
    url: "https://www.shigakogen.gr.jp/live/index.html",
    embedUrl: "https://www.shigakogen.gr.jp/live/index.html",
    icon: Camera,
    color: "from-blue-600 to-indigo-700",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Shiga Kogen",
    locationJa: "志賀高原",
    vantage: "mountain",
    source: "Shiga Kogen Tourism Association",
    sourceJa: "志賀高原観光協会",
    sourceType: "official tourism",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "youtube",
    title: "Ryuoo Live Stream",
    titleJa: "竜王ライブ配信",
    subtitle: "YouTube live stream - Ryuoo ski area conditions",
    subtitleJa: "YouTube ライブ配信 - 竜王スキーパーク状況",
    url: "https://www.youtube.com/watch?v=z71WU9uXdEM",
    embedUrl: "https://www.youtube.com/embed/z71WU9uXdEM?rel=0&modestbranding=1",
    icon: Video,
    color: "from-red-600 to-rose-700",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Ryuoo Ski Park",
    locationJa: "竜王スキーパーク",
    vantage: "mountain",
    source: "Ryuoo Ski Park",
    sourceJa: "竜王スキーパーク",
    sourceType: "official resort",
    verifiedAt: VERIFIED_AT,
  },
];

const GREEN_CAMS: CamDef[] = [
  {
    id: "yudanaka-station",
    title: "Yudanaka Station · village",
    titleJa: "湯田中駅前 · 街なか",
    subtitle: "Live view outside Yudanaka Station · not a mountain camera",
    subtitleJa: "湯田中駅前のライブ映像 · 山岳カメラではありません",
    url: "https://www.youtube.com/watch?v=lAWdqnXJ0w0",
    embedUrl: "https://www.youtube-nocookie.com/embed/lAWdqnXJ0w0?rel=0",
    icon: Video,
    color: "from-blue-700 to-sky-600",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Yudanaka Station, Yamanouchi",
    locationJa: "山ノ内町 湯田中駅前",
    vantage: "village",
    source: "Yamanouchi Tourism Bureau",
    sourceJa: "山ノ内まちづくり観光局",
    sourceType: "official tourism",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "road",
    title: "Road Cameras",
    titleJa: "道路カメラ",
    subtitle: "Hokushin Area - Nagano Prefecture live road conditions",
    subtitleJa: "北信エリア - 長野県道路ライブカメラ",
    url: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    embedUrl: "http://hokushin.pref-nagano-roadcamera.jp/index.htm",
    icon: Camera,
    color: "from-amber-600 to-orange-600",
    note: "Opens Nagano Prefecture's live road camera network covering routes to Yamanouchi and Shiga Kogen.",
    noteJa: "山ノ内・志賀高原へのルートをカバーする長野県道路カメラネットワーク。",
    externalOnly: true,
    location: "Hokushin, Nagano Prefecture",
    locationJa: "長野県 北信地域",
    vantage: "road",
    source: "Nagano Prefecture",
    sourceJa: "長野県",
    sourceType: "public authority",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "shiga-live",
    title: "Shiga Kogen Live Cams",
    titleJa: "志賀高原ライブカメラ",
    subtitle: "Official live cameras across the Shiga Kogen highlands",
    subtitleJa: "志賀高原一帯の公式ライブカメラ",
    url: "https://www.shigakogen.gr.jp/live/index.html",
    embedUrl: "https://www.shigakogen.gr.jp/live/index.html",
    icon: Camera,
    color: "from-emerald-600 to-teal-700",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Shiga Kogen",
    locationJa: "志賀高原",
    vantage: "mountain",
    source: "Shiga Kogen Tourism Association",
    sourceJa: "志賀高原観光協会",
    sourceType: "official tourism",
    verifiedAt: VERIFIED_AT,
  },
  {
    id: "youtube",
    title: "Ryuoo SORA Terrace Live",
    titleJa: "竜王SORAテラス ライブ配信",
    subtitle: "YouTube live stream - Ryuoo mountain & cloud sea views",
    subtitleJa: "YouTube ライブ配信 - 竜王山頂・雲海ビュー",
    url: "https://www.youtube.com/watch?v=z71WU9uXdEM",
    embedUrl: "https://www.youtube.com/embed/z71WU9uXdEM?rel=0&modestbranding=1",
    icon: Video,
    color: "from-red-600 to-rose-700",
    note: null,
    noteJa: null,
    externalOnly: false,
    location: "Ryuoo Ski Park",
    locationJa: "竜王スキーパーク",
    vantage: "mountain",
    source: "Ryuoo Ski Park",
    sourceJa: "竜王スキーパーク",
    sourceType: "official resort",
    verifiedAt: VERIFIED_AT,
  },
];

export default function Cams() {
  const { t } = useLanguage();
  const { isWinter } = useSeason();
  const CAMS = isWinter ? WINTER_CAMS : GREEN_CAMS;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-28">
      <div className="mb-5">
        <h1 className="text-3xl md:text-4xl font-black text-foreground">
          {t("Live Cams", "ライブカメラ")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {isWinter
            ? t("Road & ski conditions · live feeds", "道路・スキー場状況 · ライブ映像")
            : t("Road & mountain conditions · live feeds", "道路・山岳状況 · ライブ映像")
          }
        </p>
      </div>

      <div className="space-y-5">
        {CAMS.map((cam, idx) => {
          const Icon = cam.icon;
          return (
            <motion.div
              key={cam.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.1, 0.35) }}
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
                <div className="px-4 py-4 flex flex-col items-center gap-3 bg-slate-50 text-center">
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
                    {t("Open Road Cameras", "道路カメラを開く")}
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
                <div className="border-t border-border bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-slate-800">
                    {t(cam.location, cam.locationJa)} · {t(cam.vantage, cam.vantage === "village" ? "街なか" : cam.vantage === "road" ? "道路" : "山")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                    {t("Source", "運営")}: {t(cam.source, cam.sourceJa)} · {cam.sourceType} · {t("verified", "確認")} {cam.verifiedAt}
                  </p>
                </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {isWinter
            ? t(
                "Camera feeds are operated by third parties. Availability may vary. Road cameras cover national and prefectural routes leading to Yamanouchi and Shiga Kogen. Check road conditions before driving in winter.",
                "カメラ映像は各運営機関が管理しています。配信状況は変わる場合があります。道路カメラは山ノ内・志賀高原への国道・県道をカバーしています。冬季の運転前に必ずご確認ください。"
              )
            : t(
                "Camera feeds are operated by third parties. Availability may vary. Road cameras cover national and prefectural routes leading to Yamanouchi and Shiga Kogen.",
                "カメラ映像は各運営機関が管理しています。配信状況は変わる場合があります。道路カメラは山ノ内・志賀高原への国道・県道をカバーしています。"
              )
          }
        </p>
      </div>
    </div>
  );
}
