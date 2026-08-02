import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  useGetRoadConditions,
  useGetWebcams,
  useGetVicEmergencyIncidents,
  getGetVicEmergencyIncidentsQueryKey,
  type VicEmergencyResponse,
  type VicEmergencyIncident,
} from "@workspace/api-client-react";
import {
  AlertTriangle,
  Camera,
  Car,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Navigation,
  Flame,
  CloudRain,
  Snowflake,
  Truck,
  XCircle,
} from "lucide-react";
import type { ChainStatus } from "@workspace/api-client-react";
import { useRegion, useLanguage, useBaseTown, useOptionalSeason, LiveBadge, UpdateStamp, PageHeader, cn } from "@workspace/feelzlike-shell";
import { PageMeta } from "@/lib/seo/PageMeta";
import { EmptyStateCard } from "@/components/EmptyStateCard";
import { REGION_COUNTRY } from "@/regions";

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
  const { t, language } = useLanguage();
  const { town } = useBaseTown();
  const seasonCtx = useOptionalSeason();
  // Hide the chain-fitting section in JP when the user toggles to green
  // season (per-user request). Scoped to JP only so AU regions keep
  // showing chains regardless of the auto-detected hemisphere season -
  // southern-hemisphere AU defaults to "green" in May, but the chain
  // status still has to render for the off-season AU audience checking
  // ahead of winter trips. Driven off REGION_COUNTRY so every JP region
  // (yamanouchi, nozawa-onsen, iiyama, and any future JP additions)
  // is covered automatically.
  const hideChainsForSeason =
    REGION_COUNTRY[region.id] === "JP" && seasonCtx?.isGreen === true;
  const dataAvailable = region.roadsSource?.dataAvailable ?? true;
  // Always fetch Â· even regions without a live per-road table now return
  // structured chain-fitting requirement data, which we want to render.
  const query = useGetRoadConditions(
    { region: region.id as never },
    { query: { enabled: true } as never },
  );
  const camsQuery = useGetWebcams({ region: region.id as never });
  const roadCams = useMemo(() => {
    const loc = camsQuery.data?.locations.find((l) => l.locationId === `${region.id}-roads`);
    return loc?.webcams.filter((w) => w.type === "road") ?? [];
  }, [camsQuery.data, region.id]);
  const roadCamsSourcePageUrl = useMemo(() => {
    return camsQuery.data?.locations.find((l) => l.locationId === `${region.id}-roads`)?.webcamPageUrl;
  }, [camsQuery.data, region.id]);

  // ── Victoria's High Country live alerts ───────────────────────────────
  // VicTraffic has no public per-camera API and doesn't cover the alpine
  // routes. VicEmergency is the only free, keyless feed for closures,
  // crashes, tree-down and fires on the Great Alpine Road etc. We pull it
  // server-side (cached 3 min) and narrow to roads serving this town.
  const isVhc = region.id === "victorias-high-country";
  const vicEmergencyParams = town ? { town: town.id } : undefined;
  const vicEmergencyQuery = useGetVicEmergencyIncidents(vicEmergencyParams, {
    query: {
      queryKey: getGetVicEmergencyIncidentsQueryKey(vicEmergencyParams),
      enabled: isVhc && !!town,
      refetchInterval: 3 * 60_000,
    },
  });
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

  // Chain-fitting requirement, narrowed to the mountains this town actually
  // accesses. Falls back to all region mountains if the town hasn't declared
  // a nearby list. Always shown so visitors know whether to chuck chains in
  // the boot before driving up.
  const chainStatuses = useMemo<ChainStatus[]>(() => {
    if (!query.data?.chainStatuses?.length) return [];
    if (!town) return query.data.chainStatuses;
    // Build the set of mountain IDs this town accesses, AND the parent
    // (umbrella) IDs they roll up into - in JP, sub-areas like
    // `shiga-yakebitaiyama` roll up under `shiga-kogen`, so an umbrella
    // chain status keyed to the parent must still resolve.
    const allMountains = region.mountains ?? [];
    const nearbyIds = new Set(town.nearbyMountainIds ?? allMountains.map((m) => m.id));
    const allowed = new Set<string>(nearbyIds);
    for (const m of allMountains) {
      if (nearbyIds.has(m.id) && m.parentId) allowed.add(m.parentId);
    }
    return query.data.chainStatuses.filter(
      (c) => !c.mountainId || allowed.has(c.mountainId),
    );
  }, [query.data, town, region]);

  // Only claim the chain info "updates live" when at least one status is an
  // actual live scrape. Today every region's chain data is seasonal-rule or
  // pending, so this is false and the empty-state copy says so honestly.
  const hasLiveChainData = useMemo(
    () => chainStatuses.some((c) => c.dataSource === "live"),
    [chainStatuses],
  );

  return (
    <div className={cn("min-h-[100dvh] pb-8 transition-colors duration-500", seasonCtx?.season === "green" ? "bg-[#059669]" : "bg-[#0055FF]")}>
      <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
        {town && (
        <PageMeta
          title={t(`${town.name} road conditions & cams`, `${town.name}の道路状況・カメラ`)}
          description={t(
            `Live road conditions, chain requirements and roadside webcams from ${town.name} to the mountain in ${region.name}.`,
            `${region.name}・${t(town.name, town.nameJa)}から山までの道路状況・チェーン規制・路傍カメラ。`,
          )}
          path={`/${region.id}/${town.id}/roads`}
        />
      )}
      <PageHeader
        byline={`${region.name} · ${town ? t(town.name, town.nameJa) : t("Town", "町")}`}
        title={t("Road conditions & cams", "道路状況・ライブカメラ")}
        description={
          dataAvailable
            ? t(
                `Live route conditions from ${town?.name ?? "town"} to the mountain, plus roadside cams.`,
                `${town ? t(town.name, town.nameJa) : "町"}から山までのルートの最新状況と路傍カメラ。`,
              )
            : t(
                `Seasonal chain rules for the roads from ${town?.name ?? "town"} to the mountain, plus the official road-camera map.`,
                `${town ? t(town.name, town.nameJa) : "町"}から山までの道路の季節ごとのチェーン規制と、公式の道路カメラマップ。`,
              )
        }
        stamp={
          dataAvailable ? (
            <UpdateStamp
              tone="onDark"
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
            />
          ) : undefined
        }
        badge={
          dataAvailable ? (
            <LiveBadge tone="onDark" label={query.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
          ) : undefined
        }
      />
      <div className="mb-6" />

      {/* ── VHC live alerts section ─────────────────────────────────────
          Surfaced above the static "data coming soon" card because it IS
          live data, even though the per-road conditions table isn't wired
          up for VHC yet. Source: VicEmergency (incidents + warnings). */}
      {isVhc && town && (
        <VhcAlertsSection
          query={vicEmergencyQuery}
          townName={t(town.name, town.nameJa)}
          t={t}
        />
      )}

      {/* Chain-fitting requirements only matter in snow season - in JP
          we hide the section entirely when the user toggles to green. */}
      {!hideChainsForSeason && chainStatuses.length > 0 && (
        <div className="mb-6">
          <ChainStatusSection statuses={chainStatuses} t={t} />
        </div>
      )}

      {/* Truth-in-data for JP (and any non-VHC region) when we don't yet
          have a live per-road table wired. JARTIC doesn't expose a free
          public feed, so we render an explicit "not available · check
          official source" panel rather than letting users assume the empty
          page means roads are clear. Chain-fitting status (above) is still
          shown when present · it's a separate official feed. */}
      {!dataAvailable && !isVhc && (
        <EmptyStateCard
          icon={Navigation}
          title={t(
            "live road status not available for this region",
            "この地域のライブ道路状況は取得できません",
          )}
          body={
            language === "ja" ? (
              <>
                公的なライブ道路フィードは未連携です。最新の通行止め・規制情報は下記の公式ソースをご確認ください。
                {chainStatuses.length > 0 && (
                  <>
                    <br />
                    {hasLiveChainData
                      ? "上のチェーン規制情報はリアルタイムで反映されています。"
                      : "上のチェーン規制情報は各道路管理者が公表する季節ごとのルールに基づくものです。"}
                  </>
                )}
              </>
            ) : (
              <>
                no public live road feed wired for this region yet · check the official source below for current closures and restrictions.
                {chainStatuses.length > 0 && (
                  <>
                    <br />
                    {hasLiveChainData
                      ? "the chain-fitting status above does update live."
                      : "the chain-fitting rules above reflect each road authority's published seasonal requirements."}
                  </>
                )}
              </>
            )
          }
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

      {!dataAvailable && isVhc && (
        <EmptyStateCard
          icon={Camera}
          title={t(
            "No live road cameras in the High Country",
            "ハイカントリーにはライブ道路カメラがありません",
          )}
          body={
            language === "ja" ? (
              <>
                VicRoadsとVicTrafficはアルパイン道路にライブカメラを設置していません。上記のライブ警報（VicEmergency）
                <br />
                が、これらのルートの通行止め・火災・危険に関する最新情報です。
              </>
            ) : (
              <>
                VicRoads and VicTraffic don't operate any live cameras on the alpine roads. The live alerts above (from VicEmergency)
                <br />
                are the most current view of closures, fires and hazards on these routes.
              </>
            )
          }
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

      {/* "Live road data coming soon" panel removed - we now ship live
          chain-fitting status above for regions like Yamanouchi, so the
          coming-soon copy contradicted what's already on the page. If a
          future region has neither per-road data nor chain status, add a
          targeted empty state then rather than the old generic panel. */}

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
          className="mt-9"
        >
          <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-semibold text-2xl text-white inline-flex items-center gap-2">
                <Camera className="w-5 h-5 text-white/80" />
                {t("Roadside cams", "道路ライブカメラ")}
              </h2>
              <p className="text-sm text-white/70 mt-1">
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
                className="text-xs font-semibold text-white/90 hover:text-white hover:underline inline-flex items-center gap-1"
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
          className="mt-9"
        >
          <h2 className="font-display font-semibold text-2xl text-white inline-flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-white/80" />
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
        <p className="text-xs text-white/70 mt-5 inline-flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {t("Source", "情報源")}:{" "}
          <a
            href={region.roadsSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white hover:underline text-white/90"
          >
            {t(region.roadsSource.label, region.roadsSource.labelJa ?? region.roadsSource.label)}
          </a>
        </p>
      )}
    </div>
    </div>
  );
}

// ── VHC live alerts section ─────────────────────────────────────────────
// Pulled from VicEmergency (incidents + warnings feeds), filtered server-side
// to alpine road corridors then narrowed to roads serving this town.

function incidentIcon(category: string, subCategory: string | undefined) {
  const c = `${category} ${subCategory ?? ""}`.toLowerCase();
  if (/fire|burn|bushfire|grass/.test(c)) return Flame;
  if (/storm|wind|rain|flood|weather|hail/.test(c)) return CloudRain;
  if (/road|crash|tree|closure|hazard/.test(c)) return AlertTriangle;
  return AlertTriangle;
}

function incidentToneClasses(category: string, subCategory: string | undefined) {
  const c = `${category} ${subCategory ?? ""}`.toLowerCase();
  if (/fire|burn|bushfire/.test(c))
    return "border-red-200 bg-red-50/60 text-red-900";
  if (/storm|wind|flood|weather/.test(c))
    return "border-sky-200 bg-sky-50/60 text-sky-900";
  if (/warning/.test(category.toLowerCase()))
    return "border-amber-200 bg-amber-50/60 text-amber-900";
  return "border-orange-200 bg-orange-50/60 text-orange-900";
}

function formatRelative(iso: string, t: (en: string, ja?: string) => string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  const m = Math.round(diffMs / 60_000);
  if (m < 1) return t("just now", "たった今");
  if (m < 60) return t(`${m} min ago`, `${m}分前`);
  const h = Math.round(m / 60);
  if (h < 24) return t(`${h} hr ago`, `${h}時間前`);
  const days = Math.round(h / 24);
  return t(`${days} d ago`, `${days}日前`);
}

function VhcAlertsSection({
  query,
  townName,
  t,
}: {
  query: {
    data?: VicEmergencyResponse;
    isLoading: boolean;
    isError: boolean;
  };
  townName: string;
  t: (en: string, ja?: string) => string;
}) {
  const { data, isLoading, isError } = query;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-6"
    >
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="font-display font-semibold text-2xl text-white inline-flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white/80" />
            {t("Live alerts on alpine roads", "アルパイン道路のライブ警報")}
          </h2>
          <p className="text-sm text-white/70 mt-1">
            {t(
              `Active VicEmergency incidents and warnings on the access roads to ${townName}.`,
              `${townName}へのアクセス道路に関するVicEmergencyの現在の警報・注意報。`,
            )}
          </p>
        </div>
        {data && (
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white/90 hover:text-white hover:underline inline-flex items-center gap-1"
          >
            {t("VicEmergency", "VicEmergency")}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="h-4 w-1/3 rounded bg-secondary animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-secondary animate-pulse mt-3" />
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-foreground">
            {t(
              "Couldn't reach VicEmergency right now. Try again in a few minutes.",
              "VicEmergencyに接続できませんでした。しばらくしてから再度お試しください。",
            )}
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.incidents.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <p className="text-sm text-emerald-900 inline-flex items-center gap-2">
            <Car className="w-4 h-4" />
            {t(
              `No active alpine-road alerts near ${townName}.`,
              `${townName}付近のアルパイン道路に現在の警報はありません。`,
            )}
          </p>
          <p className="text-xs text-emerald-800/70 mt-1.5">
            {t(
              "Conditions can change quickly - refresh before you head out.",
              "状況は急変することがあります。出発前に再度確認してください。",
            )}
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.incidents.length > 0 && (
        <div className="grid gap-3">
          {data.incidents.map((inc: VicEmergencyIncident, idx: number) => {
            const Icon = incidentIcon(inc.category, inc.subCategory);
            const tone = incidentToneClasses(inc.category, inc.subCategory);
            return (
              <motion.article
                key={inc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`rounded-2xl border p-4 ${tone}`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
                        {inc.category}
                        {inc.subCategory ? ` · ${inc.subCategory}` : ""}
                      </span>
                      {inc.status && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
                          {inc.status}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-base mt-1.5 leading-tight">
                      {inc.roadName ?? toTitleCaseSafe(inc.name)}
                    </h3>
                    {(inc.location || inc.roadName) && inc.name && (
                      <p className="text-xs opacity-80 mt-0.5">
                        {[inc.location, inc.roadName ? toTitleCaseSafe(inc.name) : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    {inc.description && (
                      <p className="text-xs opacity-90 mt-2 leading-relaxed">
                        {inc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] opacity-70 flex-wrap">
                      <span>{formatRelative(inc.updated, t)}</span>
                      {inc.sourceOrg && <span>· {inc.sourceOrg}</span>}
                      {typeof inc.lat === "number" && typeof inc.lng === "number" && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${inc.lat},${inc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-0.5"
                        >
                          <MapPin className="w-3 h-3" />
                          {t("on map", "地図")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {data && (
        <p className="text-[11px] text-muted-foreground/70 mt-3">
          {t("Source", "情報源")}: {data.source}
        </p>
      )}
    </motion.section>
  );
}

function toTitleCaseSafe(s: string): string {
  if (!s) return s;
  // EMV uses ALL CAPS for street names; convert to Title Case for display.
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// ── Chain-status section ────────────────────────────────────────────────
// Modelled after the Mt Hotham public format: per-approach card with an
// OPEN/CLOSED pill, "Am I required to fit chains?" headline, and the
// answer split out for 2WD vs AWD/4WD. Issued time + source attribution
// are shown so visitors can verify against the upstream feed.

function chainBadge(req: ChainStatus["chains2wd"]): { label: string; tone: string; icon: typeof Snowflake } {
  switch (req) {
    case "must-fit":
      return { label: "FITTING CHAINS", tone: "bg-red-50 text-red-800 border-red-300", icon: Snowflake };
    case "must-carry":
      return { label: "CARRY CHAINS", tone: "bg-amber-50 text-amber-800 border-amber-300", icon: AlertTriangle };
    case "not-required":
    default:
      return { label: "NOT FITTING CHAINS", tone: "bg-emerald-50 text-emerald-800 border-emerald-300", icon: CheckCircle2 };
  }
}

function statusBadge(s: ChainStatus["status"]): { label: string; tone: string; icon: typeof CheckCircle2 } {
  if (s === "closed") return { label: "CLOSED", tone: "bg-red-600 text-white border-red-700", icon: XCircle };
  if (s === "seasonal-closure") return { label: "SEASONAL CLOSURE", tone: "bg-slate-600 text-white border-slate-700", icon: XCircle };
  return { label: "OPEN", tone: "bg-emerald-600 text-white border-emerald-700", icon: CheckCircle2 };
}

function dataSourceBadge(d: ChainStatus["dataSource"]): { label: string; tone: string } {
  if (d === "live") return { label: "Live feed", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (d === "seasonal-rule") return { label: "Seasonal rule", tone: "text-sky-700 bg-sky-50 border-sky-200" };
  return { label: "Source pending", tone: "text-amber-700 bg-amber-50 border-amber-200" };
}

function ChainStatusSection({ statuses, t }: { statuses: ChainStatus[]; t: (en: string, ja?: string) => string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="mb-6"
    >
      <div className="mb-3">
        <h2 className="font-display font-semibold text-2xl text-white inline-flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-white/80" />
          {t("Chain-fitting requirement", "チェーン装着要件")}
        </h2>
        <p className="text-sm text-white/70 mt-1">
          {t(
            "Per approach to each mountain, broken down by drivetrain. Carry diamond-pattern chains in your boot during snow season.",
            "各マウンテンへのアプローチごと、駆動方式別。冬季はダイヤモンドパターンのチェーンを車内に常備してください。",
          )}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {statuses.map((cs, idx) => {
          const sb = statusBadge(cs.status);
          const SbIcon = sb.icon;
          const c2 = chainBadge(cs.chains2wd);
          const C2Icon = c2.icon;
          const ca = chainBadge(cs.chainsAwd);
          const CaIcon = ca.icon;
          const ds = dataSourceBadge(cs.dataSource);
          return (
            <motion.article
              key={cs.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <header className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cs.mountainName}
                  </p>
                  <h3 className="font-display font-semibold text-base text-foreground leading-tight mt-0.5">
                    {cs.approach}
                  </h3>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sb.tone}`}>
                  <SbIcon className="w-3 h-3" />
                  {sb.label}
                </span>
              </header>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("Am I required to fit chains?", "チェーン装着は必要ですか？")}
              </p>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Car className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">2WD</span>
                  </div>
                  <span className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${c2.tone}`}>
                    <C2Icon className="w-3 h-3" />
                    {c2.label}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AWD/4WD</span>
                  </div>
                  <span className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${ca.tone}`}>
                    <CaIcon className="w-3 h-3" />
                    {ca.label}
                  </span>
                </div>
              </div>

              {cs.note && (
                <p className="mt-3 text-xs text-foreground/80 leading-relaxed">{cs.note}</p>
              )}

              <footer className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-[10px]">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${ds.tone}`}>
                  {ds.label}
                </span>
                {cs.sourceUrl ? (
                  <a
                    href={cs.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {cs.sourceLabel}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">{cs.sourceLabel}</span>
                )}
              </footer>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
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
