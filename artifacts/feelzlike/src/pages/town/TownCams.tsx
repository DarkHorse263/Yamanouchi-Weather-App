import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGetWebcams } from "@workspace/api-client-react";
import { Camera, ExternalLink, MapPin, RefreshCw } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

interface Webcam {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  pageUrl?: string;
  elevation?: number;
}

function WebcamCard({ webcam, t }: { webcam: Webcam; t: (en: string, ja?: string) => string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <article className="rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {!imgError ? (
          <img
            src={webcam.imageUrl}
            alt={webcam.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <Camera className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              {t("Feed unavailable", "映像取得不可")}
            </p>
          </div>
        )}
        {webcam.elevation && (
          <div className="absolute top-3 left-3 rounded-full bg-white/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm">
            <MapPin className="w-3 h-3" />
            {webcam.elevation}m
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-semibold text-base text-foreground leading-tight">{webcam.name}</h3>
        {webcam.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{webcam.description}</p>
        )}
        {webcam.pageUrl && (
          <a
            href={webcam.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            {t("Open source page", "ソースページを開く")}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  );
}

export function TownCams() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const query = useGetWebcams();

  const locations = useMemo(() => {
    if (!query.data || !town) return [];
    const regionIds = new Set(region.mountains?.map((m) => m.id) ?? []);
    const nearbyIds = new Set(town.nearbyMountainIds ?? []);
    const allowed = nearbyIds.size > 0 ? nearbyIds : regionIds;
    if (allowed.size === 0) return [];
    return query.data.locations.filter((loc) => allowed.has(loc.locationId));
  }, [query.data, town, region]);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {town ? t(town.name, town.nameJa) : t("Town", "町")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Cams", "ライブカメラ")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Live mountain cams reachable from ${town?.name ?? "town"}.`,
                `${town ? t(town.name, town.nameJa) : "町"}からアクセス可能な山のライブカメラ。`,
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground hover:border-foreground/30 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${query.isFetching ? "animate-spin" : ""}`} />
              {t("Refresh", "更新")}
            </button>
            <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
          </div>
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm">{t("Couldn't load webcams.", "ライブカメラを読み込めませんでした。")}</p>
        </div>
      )}

      {query.isLoading && <CamsSkeleton />}

      {!query.isLoading && locations.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <Camera className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            {t("No cams configured for this town yet.", "この町のライブカメラはまだ設定されていません。")}
          </p>
        </div>
      )}

      <div className="space-y-12">
        {locations.map((loc, idx) => (
          <motion.section
            key={loc.locationId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display font-semibold text-xl text-foreground">{loc.locationName}</h2>
              {loc.webcamPageUrl && (
                <a
                  href={loc.webcamPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  {t("All cams", "全て")} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {loc.webcams.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loc.webcams.map((w) => (
                  <WebcamCard key={w.id} webcam={w} t={t} />
                ))}
              </div>
            ) : (
              loc.webcamPageUrl && (
                <a
                  href={loc.webcamPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-border bg-white p-6 hover:border-primary/40 hover:shadow-md transition-all text-center"
                >
                  <Camera className="w-7 h-7 text-primary mx-auto" />
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {t(`View ${loc.locationName} cams`, `${loc.locationName}のカメラを見る`)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Live feeds on the resort website.", "リゾート公式サイトのライブ映像。")}
                  </p>
                </a>
              )
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
}

function CamsSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="aspect-video bg-secondary animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-secondary animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
