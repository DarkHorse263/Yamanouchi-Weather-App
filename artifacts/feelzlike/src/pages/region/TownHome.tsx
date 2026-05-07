import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { ArrowUpRight, Car, Video, Bus, BedDouble, UtensilsCrossed, Compass, CloudSun, Mountain } from "lucide-react";
import { useRegion, useLanguage, useBaseTown, LiveBadge } from "@workspace/feelzlike-shell";
import { useGetWeather, useGetRoadConditions } from "@workspace/api-client-react";
import { useTownWeather } from "@/lib/town-weather";
import { PageMeta } from "@/lib/seo/PageMeta";
import { placeSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Tile = {
  path: string;
  icon: typeof CloudSun;
  label: string;
  labelJa: string;
  blurb: string;
  blurbJa: string;
  /** When true, `path` is interpreted at the region scope (one wouter base
   *  above the town), e.g. `/mountains` -> `/:region/mountains`. */
  regionScoped?: boolean;
};

const TILES: readonly Tile[] = [
  { path: "/weather",   icon: CloudSun,        label: "Weather",       labelJa: "天気",       blurb: "Full in-town forecast - current, hourly, 7-day", blurbJa: "町の総合予報 - 現在・時間別・7日間" },
  { path: "/mountains", icon: Mountain,        label: "All mountains", labelJa: "スキー場一覧", blurb: "Every resort in the region with status & headline", blurbJa: "地域内すべてのスキー場と状況", regionScoped: true },
  { path: "/roads",     icon: Car,             label: "Roads",         labelJa: "道路",       blurb: "Live road conditions to the mountain", blurbJa: "山への道路状況" },
  { path: "/cams",      icon: Video,           label: "Cams",          labelJa: "ライブ",      blurb: "Town and roadside webcams",            blurbJa: "町と路傍のライブカメラ" },
  { path: "/transport", icon: Bus,             label: "Transport",     labelJa: "交通",       blurb: "Buses & shuttles from town",          blurbJa: "町からのバス・送迎" },
  { path: "/stay",      icon: BedDouble,       label: "Stay",          labelJa: "宿泊",       blurb: "Hotels, ryokan and lodges nearby",     blurbJa: "近隣の宿泊施設" },
  { path: "/eat",       icon: UtensilsCrossed, label: "Eat",           labelJa: "食事",       blurb: "Restaurants, izakaya, cafés in town",  blurbJa: "町の飲食店" },
  { path: "/explore",   icon: Compass,         label: "Explore",       labelJa: "観光",       blurb: "Off-mountain things to do",           blurbJa: "山以外のアクティビティ" },
];

export function TownHome() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const weatherQ = useGetWeather({ region: region.id });
  const roadsAvailable = region.roadsSource?.dataAvailable ?? true;
  const roadsQ = useGetRoadConditions({ region: region.id }, { query: { enabled: roadsAvailable } });
  const townWeatherQ = useTownWeather(town?.lat, town?.lng);

  // List every region mountain with live weather data, sorted by distance
  // from this town. Used for the "To the mountains" panel so users can
  // pick which resort to head to, not just the nearest one.
  const mountainsByDistance = useMemo(() => {
    if (!town || !weatherQ.data) return [];
    const regionIds = new Set(region.mountains?.map((m) => m.id) ?? []);
    const nearbyIds = new Set(town.nearbyMountainIds ?? []);
    const allowed = nearbyIds.size > 0 ? nearbyIds : regionIds;
    const candidates = allowed.size > 0
      ? weatherQ.data.locations.filter((l) => allowed.has(l.location.id))
      : [];
    return candidates
      .map((entry) => {
        const km = haversineKm(
          { lat: town.lat, lng: town.lng },
          { lat: entry.location.latitude, lng: entry.location.longitude },
        );
        // ~1.5 min/km is a reasonable alpine-road estimate
        const min = Math.max(5, Math.round(km * 1.5));
        return { entry, km, min };
      })
      .sort((a, b) => a.km - b.km);
  }, [town, weatherQ.data, region]);

  // Roads relevant to this town: open vs total
  const roadsSummary = useMemo(() => {
    if (!town || !roadsQ.data) return null;
    const regionIds = new Set(region.mountains?.map((m) => m.id) ?? []);
    const nearbyIds = new Set(town.nearbyMountainIds ?? []);
    const allowed = nearbyIds.size > 0 ? nearbyIds : regionIds;
    const townName = town.name.toLowerCase();
    const relevant = roadsQ.data.roads.filter((r) => {
      const affects = (r.affectedResorts ?? []).some((id) => allowed.has(id));
      const mentioned = r.segment?.toLowerCase().includes(townName) || r.roadName?.toLowerCase().includes(townName);
      return affects || mentioned;
    });
    if (relevant.length === 0) return null;
    const open = relevant.filter((r) => r.condition === "open").length;
    const closed = relevant.filter((r) => r.condition === "closed").length;
    const warn = relevant.length - open - closed;
    return { total: relevant.length, open, closed, warn };
  }, [town, roadsQ.data, region]);

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <p className="text-muted-foreground">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  const roadValue = !roadsAvailable
    ? "-"
    : roadsSummary
      ? roadsSummary.closed > 0
        ? `${roadsSummary.closed}`
        : `${roadsSummary.open}/${roadsSummary.total}`
      : null;
  const roadUnit = !roadsAvailable
    ? ""
    : roadsSummary
      ? roadsSummary.closed > 0
        ? t("closed", "通行止")
        : t("open", "開通")
      : "";
  const roadHint = !roadsAvailable
    ? t("Coming soon for this region", "この地域は近日公開")
    : roadsSummary
      ? roadsSummary.warn > 0
        ? t(`${roadsSummary.warn} with advisories`, `${roadsSummary.warn}件の警告`)
        : t("All clear", "問題なし")
      : t("Open / closed status", "開通・通行止情報");

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <PageMeta
        title={`${town.name} - weather, stays, roads & cams`}
        description={`${town.name} in ${region.name}: in-town weather, road conditions to the mountain, webcams, transport, plus curated stays and eats.`}
        path={`/${region.id}/${town.id}`}
        jsonLd={[
          placeSchema({
            name: town.name,
            url: `https://feelzlike.com/${region.id}/${town.id}`,
            description: town.blurb,
            latLng: town.lat && town.lng ? { lat: town.lat, lng: town.lng } : undefined,
          }),
          breadcrumbSchema([
            { name: "feelzlike", url: "https://feelzlike.com/" },
            { name: region.name, url: `https://feelzlike.com/${region.id}` },
            { name: town.name, url: `https://feelzlike.com/${region.id}/${town.id}` },
          ]),
        ]}
      />
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">
              {region.name} · {t("Base town", "拠点の町")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t(town.name, town.nameJa)}
            </h1>
            {town.blurb && (
              <p className="text-muted-foreground mt-3 max-w-xl">{t(town.blurb, town.blurbJa)}</p>
            )}
          </div>
          <LiveBadge label={t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* Snapshot strip - live conditions
          May 2026: "To the mountain" expanded into its own panel below
          listing every mountain with km + drive time, so users can pick
          where to head, not just see the nearest one. The strip now
          carries In-town weather and the road summary. */}
      <section className="mt-8 grid sm:grid-cols-2 gap-3">
        <SnapshotCard
          label={t("In town now", "町の現在")}
          value={
            townWeatherQ.data?.current.temperature !== undefined && townWeatherQ.data?.current.temperature !== null
              ? Math.round(townWeatherQ.data.current.temperature).toString()
              : "-"
          }
          unit="°"
          hint={
            townWeatherQ.isLoading
              ? t("Loading…", "読込中…")
              : townWeatherQ.data
                ? `${townWeatherQ.data.current.weatherDescription}${
                    townWeatherQ.data.current.feelsLike !== null
                      ? ` · feels ${Math.round(townWeatherQ.data.current.feelsLike)}°`
                      : ""
                  }`
                : t("Weather unavailable", "天気情報なし")
          }
        />
        <SnapshotCard
          label={t("Roads", "道路")}
          value={roadValue ?? "-"}
          unit={roadUnit}
          hint={roadHint}
          tone={
            roadsSummary?.closed
              ? "warn"
              : roadsSummary?.warn
                ? "caution"
                : "ok"
          }
        />
      </section>

      {/* To the mountains - per-resort drive time list */}
      <section className="mt-3">
        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="byline text-muted-foreground/70">
              {t("To the mountains", "山まで")}
            </p>
            <Link
              href={`~/${region.id}/mountains`}
              className="byline text-primary inline-flex items-center gap-1 hover:underline"
            >
              {t("All mountains", "スキー場一覧")} <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {weatherQ.isLoading && mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">{t("Loading…", "読込中…")}</p>
          ) : mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">
              {t("Drive times unavailable", "所要時間なし")}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border/60">
              {mountainsByDistance.map(({ entry, km, min }) => {
                const temp = entry.current?.temperature;
                return (
                  <li
                    key={entry.location.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-base tracking-tight text-foreground truncate">
                        {entry.location.name}
                      </p>
                      <p className="text-[12px] text-muted-foreground/80">
                        {t(
                          `${Math.round(km)} km · ~${min} min`,
                          `約${Math.round(km)}km・約${min}分`,
                        )}
                      </p>
                    </div>
                    {temp !== undefined && temp !== null ? (
                      <p className="font-display font-semibold text-xl text-foreground tabular-nums shrink-0">
                        {Math.round(temp)}
                        <span className="text-sm text-muted-foreground/70">°</span>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Town tiles */}
      <section className="mt-10">
        <p className="byline text-muted-foreground/70 mb-3">
          {t("In and around", "町と周辺")} {t(town.name, town.nameJa)}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            // region-scoped tiles (e.g. "All mountains") sit one wouter base
            // above this town view, so prefix `~` to escape the town base
            // and prepend the region id.
            const href = tile.regionScoped
              ? `~/${region.id}${tile.path}`
              : tile.path;
            return (
              <Link
                key={tile.path}
                href={href}
                className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 byline text-primary">
                    <Icon className="w-3 h-3" /> {t(tile.label, tile.labelJa)}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display font-semibold text-lg tracking-tight text-foreground mt-3">
                  {t(tile.label, tile.labelJa)}
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-snug">
                  {t(tile.blurb, tile.blurbJa)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  unit,
  hint,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
  tone?: "ok" | "caution" | "warn";
}) {
  const valueClass =
    tone === "warn"
      ? "text-red-600"
      : tone === "caution"
        ? "text-amber-600"
        : tone === "ok"
          ? "text-emerald-700"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="byline text-muted-foreground/70">{label}</p>
      <p className={`mt-2 font-display font-semibold text-3xl tracking-tight ${valueClass}`}>
        {value}
        <span className="text-base text-muted-foreground/70 ml-1">{unit}</span>
      </p>
      <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">{hint}</p>
    </div>
  );
}
