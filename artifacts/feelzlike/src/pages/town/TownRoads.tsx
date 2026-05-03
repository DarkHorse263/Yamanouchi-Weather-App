import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGetRoadConditions } from "@workspace/api-client-react";
import { AlertTriangle, Car, ExternalLink, MapPin, Navigation } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";

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

export function TownRoads() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const query = useGetRoadConditions();

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
              {t("Roads", "道路")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Live conditions on the routes from ${town?.name ?? "town"} to the mountain.`,
                `${town ? t(town.name, town.nameJa) : "町"}から山までのルートの最新状況。`,
              )}
            </p>
          </div>
          <LiveBadge label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {query.isLoading && <RoadsSkeleton />}

      {query.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-foreground">
            {t("Couldn't load road conditions.", "道路状況を読み込めませんでした。")}
          </p>
        </div>
      )}

      {!query.isLoading && query.data && roads.length > 0 && (
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
                  {t("View on Live Traffic", "ライブトラフィックで見る")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </motion.article>
          ))}
        </div>
      )}

      {!query.isLoading && query.data && roads.length === 0 && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          <Car className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">
            {t(
              `No road advisories matching ${town?.name ?? "this town"} right now.`,
              `${town ? t(town.name, town.nameJa) : "この町"}に該当する道路情報は現在ありません。`,
            )}
          </p>
        </div>
      )}

      {query.data?.lastUpdated && (
        <p className="text-xs text-muted-foreground/70 mt-6 inline-flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {t("Source", "情報源")}: {t("Live Traffic NSW", "Live Traffic NSW")}
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
