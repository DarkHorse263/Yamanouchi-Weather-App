import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useGetRoadConditions, useGetWebcams } from "@workspace/api-client-react";
import { AlertTriangle, Camera, Car, ExternalLink, MapPin, Navigation, Construction } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge, UpdateStamp } from "@workspace/feelzlike-shell";
import { EmptyStateCard } from "@/components/EmptyStateCard";

function statusClasses(c: string): string {
  switch (c) {
    case "open":            return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "closed":          return "bg-red-50 text-red-700 border-red-200";
    case "chains-required": return "bg-amber-50 text-amber-700 border-amber-200";
    case "caution":         return "bg-orange-50 text-orange-700 border-orange-200";
    case "reduced-speed":   return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:                return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function RoadCamCard({ cam, t }: { cam: { id: string; name: string; description?: string; imageUrl: string; pageUrl?: string; roadName?: string }; t: (en: string, ja?: string) => string }) {
  const [imgError, setImgError] = useState(false);
  return (
    <article className="rounded-2xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all flex flex-col">
      <div className="relative aspect-video bg-secondary overflow-hidden">
        {!imgError ? (
          <img
            src={cam.imageUrl}
            alt={cam.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <a
            href={cam.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 hover:bg-secondary/60 transition-colors"
          >
            <Camera className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-semibold text-foreground">
              {t("Open live feed", "ライブ映像を開く")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              {t("Source page", "ソースページ")} <ExternalLink className="w-3 h-3" />
            </p>
          </a>
        )}
        {cam.roadName && (
          <div className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
            <Navigation className="w-3 h-3" />
            {cam.roadName}
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-display font-semibold text-base text-foreground leading-tight">{cam.name}</h4>
        {cam.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">{cam.description}</p>
        )}
        {cam.pageUrl && !imgError && (
          <a
            href={cam.pageUrl}
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

export function TownRoads() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const dataAvailable = region.roadsSource?.dataAvailable ?? true;
  const query = useGetRoadConditions(
    { region: region.id },
    { query: { enabled: dataAvailable } },
  );
  const camsQuery = useGetWebcams({ region: region.id });
  const roadCams = useMemo(() => {
    const loc = camsQuery.data?.locations.find((l) => l.locationId === `${region.id}-roads`);
    return loc?.webcams.filter((w) => w.type === "road") ?? [];
  }, [camsQuery.data, region.id]);
  const roadCamsSourcePageUrl = useMemo(() => {
    return camsQuery.data?.locations.find((l) => l.locationId === `${region.id}-roads`)?.webcamPageUrl;
  }, [camsQuery.data, region.id]);

  const roads = useMemo(() => {
    if (!query.data || !town) return [];
    const regionIds = new Set(region.mountains?.map((m) => m.id) ?? []);
    const nearbyIds = new Set(town.nearbyMountainIds ?? []);
    const allowed = nearbyIds.size > 0 ? nearbyIds : regionIds;
    const townName = town.name.toLowerCase();
    return query.data.roads.filter((r) => {
      const affects = (r.affectedResorts ?? []).some((id) => allowed.has(id));
      const mentioned = r.segment?.toLowerCase().includes(townName) || r.roadName?.toLowerCase().includes(townName);
      return affects || mentioned;
    });
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
              {t("Road conditions & cams", "道路状況・ライブカメラ")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Live route conditions from ${town?.name ?? "town"} to the mountain, plus roadside cams.`,
                `${town ? t(town.name, town.nameJa) : "町"}から山までのルートの最新状況と路傍カメラ。`,
              )}
            </p>
            <UpdateStamp
              lastUpdated={query.data?.lastUpdated ?? null}
              intervalMin={15}
              source={
                region.roadsSource
                  ? t(
                      region.roadsSource.label,
                      region.roadsSource.labelJa ?? region.roadsSource.label,
                    )
                  : undefined
              }
              className="mt-3"
            />
          </div>
          {dataAvailable && (
            <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
          )}
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {!dataAvailable && (
        <EmptyStateCard
          icon={Construction}
          title={t("Live road data coming soon", "道路情報は近日公開")}
          body={t(
            `We don't yet pull live road conditions for ${region.name}. In the meantime, the official source has the most up-to-date information.`,
            `${region.name}のライブ道路情報は現在準備中です。それまでは公式情報源で最新情報をご確認ください。`,
          )}
          ctaLabel={
            region.roadsSource
              ? t(
                  region.roadsSource.label,
                  region.roadsSource.labelJa ?? region.roadsSource.label,
                )
              : undefined
          }
          ctaHref={region.roadsSource?.url}
        />
      )}

      {dataAvailable && query.isLoading && <RoadsSkeleton />}

      {dataAvailable && query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-foreground">
            {t("Couldn't load road conditions.", "道路状況を読み込めませんでした。")}
          </p>
        </div>
      )}

      {dataAvailable && !query.isLoading && query.data && roads.length > 0 && (
        <div className="grid gap-4">
          {roads.map((road, idx) => (
            <motion.article
              key={road.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border border-border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-lg text-foreground">{road.roadName}</h3>
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5 mt-1">
                    <Navigation className="w-3.5 h-3.5" />
                    {road.segment}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider whitespace-nowrap ${statusClasses(road.condition)}`}
                >
                  {road.condition.replace("-", " ")}
                </span>
              </div>

              {road.description && (
                <p className="text-sm text-foreground/90 mt-3 leading-relaxed">{road.description}</p>
              )}

              {road.chainsRequired && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <span className="font-semibold">{t("Chains required", "チェーン必須")}.</span>{" "}
                    {t("2WD vehicles must carry and fit chains where directed.", "2WD車はチェーン携行・装着必須。")}
                  </p>
                </div>
              )}

              {road.detailUrl && (
                <a
                  href={road.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  {t(
                    `View on ${region.roadsSource?.label ?? "official source"}`,
                    `${region.roadsSource?.labelJa ?? region.roadsSource?.label ?? "公式情報"}で見る`,
                  )}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.article>
          ))}
        </div>
      )}

      {dataAvailable && !query.isLoading && query.data && roads.length === 0 && (
        <EmptyStateCard
          icon={Car}
          title={t("All clear", "情報なし")}
          body={t(
            `No road advisories matching ${town?.name ?? "this town"} right now - that's good news. Conditions can change quickly in winter; refresh before you head out.`,
            `${town ? t(town.name, town.nameJa) : "この町"}に該当する道路情報は現在ありません - 朗報です。冬季は状況が急変するため、出発前に再度ご確認ください。`,
          )}
        />
      )}

      {roadCams.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12"
        >
          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-semibold text-2xl text-foreground inline-flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                {t("Roadside cams", "道路ライブカメラ")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t(
                  "Live looks at the actual road surface - chains, slush, ice.",
                  "実際の路面のライブ映像 - チェーン、シャーベット、凍結。",
                )}
              </p>
            </div>
            {roadCamsSourcePageUrl && (
              <a
                href={roadCamsSourcePageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                {t("All road cams", "全カメラ")} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roadCams.map((cam) => (
              <RoadCamCard key={cam.id} cam={cam} t={t} />
            ))}
          </div>
        </motion.section>
      )}

      {/* When the upstream source has no deep-linkable per-camera images
          (e.g. the JP Hokushin road-camera map), surface a single honest
          "open the official map" tile rather than fake duplicate cards. */}
      {roadCams.length === 0 && roadCamsSourcePageUrl && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12"
        >
          <h2 className="font-display font-semibold text-2xl text-foreground inline-flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-primary" />
            {t("Roadside cams", "道路ライブカメラ")}
          </h2>
          <a
            href={roadCamsSourcePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-border bg-white p-6 hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-foreground">
                  {t("Open the official road-camera map", "公式の道路カメラマップを開く")}
                </p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {t(
                    "The official source is an interactive map - pick the camera nearest your route. We don't fake images here.",
                    "公式情報源はインタラクティブマップです。ルート上のカメラを選択してください。当アプリでは画像を捏造しません。",
                  )}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {t("Open map", "マップを開く")}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        </motion.section>
      )}

      {dataAvailable && query.data?.lastUpdated && region.roadsSource && (
        <p className="text-xs text-muted-foreground/70 mt-6 inline-flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {t("Source", "情報源")}:{" "}
          <a
            href={region.roadsSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            {t(region.roadsSource.label, region.roadsSource.labelJa ?? region.roadsSource.label)}
          </a>
        </p>
      )}
    </div>
  );
}

function RoadsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5">
          <div className="h-5 w-1/3 rounded bg-secondary animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-secondary animate-pulse mt-2" />
          <div className="h-3 w-full rounded bg-secondary animate-pulse mt-4" />
        </div>
      ))}
    </div>
  );
}
