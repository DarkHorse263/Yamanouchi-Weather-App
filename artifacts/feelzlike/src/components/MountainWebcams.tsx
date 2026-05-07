import { useEffect, useMemo, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ExternalLink, MapPin, Pause, Play, RefreshCw, X } from "lucide-react";
import { getMountainWebcams, type MountainWebcam } from "@/data/webcams";

interface MountainWebcamsProps {
  mountainId: string;
  /** Section number rendered in the byline (e.g. "06"). */
  sectionNumber?: string;
  /** Translation function from useLanguage. Defaults to English-only. */
  t?: (en: string, ja?: string) => string;
  /** Optional fallback page URL surfaced when no curated cams exist. */
  fallbackPageUrl?: string;
}

/**
 * Grid of curated mountain webcams with click-to-expand modal and an
 * auto-rotate carousel mode for ambient display.
 *
 * EMBED HONESTY: Most resort cams are hotlink-protected, so we degrade
 * cleanly. Each card tries the configured embedType, and if it fails
 * (image error, iframe blocked) we surface the branded "Open live cam"
 * card so users still get to the source in one tap.
 */
export function MountainWebcams({
  mountainId,
  sectionNumber = "06",
  t: tProp,
  fallbackPageUrl,
}: MountainWebcamsProps) {
  const t = tProp ?? ((en: string) => en);
  const cams = useMemo(() => getMountainWebcams(mountainId), [mountainId]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const headingId = useId();

  // Auto-rotate cycles every 8s - pauses while modal is open.
  useEffect(() => {
    if (!autoRotate || cams.length < 2 || activeIdx !== null) return;
    const i = setInterval(() => {
      setCarouselIdx((c) => (c + 1) % cams.length);
    }, 8000);
    return () => clearInterval(i);
  }, [autoRotate, cams.length, activeIdx]);

  // Empty state - no curated cams. Surface the resort website fallback if
  // one was provided. Otherwise the section is hidden entirely.
  if (cams.length === 0) {
    if (!fallbackPageUrl) return null;
    return (
      <section className="mt-10" aria-labelledby={headingId}>
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <p className="byline text-muted-foreground/70">
              {sectionNumber} · {t("Live cams", "ライブカメラ")}
            </p>
            <h2
              id={headingId}
              className="font-display font-semibold text-2xl tracking-tight"
            >
              {t("Webcams", "ライブカメラ")}
            </h2>
          </div>
        </div>
        <a
          href={fallbackPageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-border bg-white p-5 hover:border-primary/40 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-display font-semibold text-base text-foreground">
                  {t("View live cams on resort site", "公式サイトでライブカメラを見る")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    "We don't have curated embeds for this mountain yet.",
                    "このスキー場の埋め込みは未対応です。",
                  )}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </a>
      </section>
    );
  }

  const activeCam = activeIdx !== null ? cams[activeIdx] : null;

  return (
    <section className="mt-10" aria-labelledby={headingId}>
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="byline text-muted-foreground/70">
            {sectionNumber} · {t("Live cams", "ライブカメラ")}
          </p>
          <h2
            id={headingId}
            className="font-display font-semibold text-2xl tracking-tight"
          >
            {t(`${cams.length} webcams`, `ライブカメラ ${cams.length}基`)}
          </h2>
        </div>
        {cams.length > 1 && (
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              autoRotate
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border bg-white hover:border-foreground/30"
            }`}
            aria-pressed={autoRotate}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {autoRotate
              ? t("Pause carousel", "カルーセル停止")
              : t("Auto-rotate", "自動切替")}
          </button>
        )}
      </div>

      {/* Carousel hero (only when autoRotate is on) */}
      {autoRotate && cams.length > 1 && (
        <div className="mb-4 rounded-3xl border border-border bg-white overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={cams[carouselIdx].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <WebcamMedia cam={cams[carouselIdx]} t={t} large />
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-1.5 py-3 border-t border-border">
            {cams.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCarouselIdx(i)}
                aria-label={t(`Show webcam ${i + 1}`, `${i + 1}番目のカメラを表示`)}
                className={`h-1.5 rounded-full transition-all ${
                  i === carouselIdx ? "w-6 bg-foreground" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cams.map((cam, idx) => (
          <button
            key={cam.id}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className="group text-left rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col"
            aria-label={t(`Open ${cam.name}`, `${cam.nameJa ?? cam.name}を開く`)}
          >
            <div className="relative aspect-video bg-secondary overflow-hidden">
              <WebcamMedia cam={cam} t={t} />
              {cam.vantage && (
                <div className="absolute top-2.5 left-2.5 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
                  <MapPin className="w-3 h-3" />
                  {t(cam.vantage, vantageJa(cam.vantage))}
                  {cam.elevation && (
                    <span className="text-muted-foreground tabular-nums">· {cam.elevation}m</span>
                  )}
                </div>
              )}
            </div>
            <div className="p-3.5 flex-1 flex flex-col">
              <h3 className="font-display font-semibold text-sm text-foreground leading-tight">
                {t(cam.name, cam.nameJa ?? cam.name)}
              </h3>
              {(cam.description || cam.descriptionJa) && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t(cam.description ?? "", cam.descriptionJa ?? cam.description ?? "")}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-2 tabular-nums">
                {t("Source", "ソース")}: {cam.source} · {t("verified", "確認")} {cam.verifiedAt}
              </p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/70 mt-3">
        {t(
          "Many resort cams are hotlink-protected - we link out to the source page where embeds fail.",
          "多くのスキー場ライブカメラは外部参照を制限しています。埋め込みできない場合はソースページへ移動します。",
        )}
      </p>

      {/* Modal */}
      <AnimatePresence>
        {activeCam && (
          <motion.div
            key="webcam-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveIdx(null)}
            role="dialog"
            aria-modal="true"
            aria-label={t(activeCam.name, activeCam.nameJa ?? activeCam.name)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl rounded-3xl bg-white overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setActiveIdx(null)}
                className="absolute top-3 right-3 z-10 rounded-full bg-white/90 backdrop-blur-md w-9 h-9 inline-flex items-center justify-center shadow-md hover:bg-white transition-colors"
                aria-label={t("Close", "閉じる")}
              >
                <X className="w-4 h-4" />
              </button>
              <WebcamMedia cam={activeCam} t={t} large />
              <div className="p-5">
                <h3 className="font-display font-semibold text-xl text-foreground">
                  {t(activeCam.name, activeCam.nameJa ?? activeCam.name)}
                </h3>
                {(activeCam.description || activeCam.descriptionJa) && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {t(activeCam.description ?? "", activeCam.descriptionJa ?? activeCam.description ?? "")}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t("Source", "ソース")}: {activeCam.source} · {t("verified", "確認")} {activeCam.verifiedAt}
                  </p>
                  <a
                    href={activeCam.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 py-2 text-xs font-semibold hover:bg-foreground/90 transition-colors"
                  >
                    {t("Open live cam", "ライブカメラを開く")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * Renders the actual media (image / iframe / external-card) for one cam.
 * Used by both the grid tiles, the carousel hero, and the modal.
 */
function WebcamMedia({
  cam,
  t,
  large = false,
}: {
  cam: MountainWebcam;
  t: (en: string, ja?: string) => string;
  large?: boolean;
}) {
  const [errored, setErrored] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Reset error when cam changes (carousel rotates)
  useEffect(() => {
    setErrored(false);
    setRefreshKey(0);
  }, [cam.id]);

  const aspectClass = large ? "aspect-video" : "h-full w-full";

  if (cam.embedType === "image" && cam.embedUrl && !errored) {
    return (
      <div className={`relative ${large ? aspectClass : "absolute inset-0"} bg-secondary`}>
        <img
          src={`${cam.embedUrl}${cam.embedUrl.includes("?") ? "&" : "?"}_=${refreshKey}`}
          alt={cam.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
        {large && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRefreshKey((k) => k + 1);
            }}
            className="absolute top-3 right-3 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm hover:bg-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            {t("Refresh", "更新")}
          </button>
        )}
      </div>
    );
  }

  if (cam.embedType === "iframe" && cam.embedUrl && !errored) {
    return (
      <div className={`relative ${large ? aspectClass : "absolute inset-0"} bg-secondary`}>
        <iframe
          src={cam.embedUrl}
          title={cam.name}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className="w-full h-full border-0"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  // External / fallback card - branded teaser pointing to the source.
  return (
    <div
      className={`relative ${
        large ? aspectClass : "absolute inset-0"
      } bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 flex flex-col items-center justify-center p-4 text-center`}
    >
      <Camera className={`${large ? "w-12 h-12" : "w-8 h-8"} text-foreground/30 mb-2`} />
      <p className={`${large ? "text-sm" : "text-[11px]"} font-semibold text-foreground/70`}>
        {t("Live cam available on resort site", "公式サイトでライブカメラ配信中")}
      </p>
      {large && (
        <a
          href={cam.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-semibold hover:bg-foreground/90 transition-colors"
        >
          {t("Open live cam", "ライブカメラを開く")}
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

function vantageJa(v: "base" | "mid" | "summit" | "village"): string {
  switch (v) {
    case "base":
      return "ベース";
    case "mid":
      return "中腹";
    case "summit":
      return "山頂";
    case "village":
      return "村中心";
  }
}
