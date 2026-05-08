import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Car,
  Bus,
  BedDouble,
  UtensilsCrossed,
  Compass,
  CloudSun,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  LiveBadge,
  UpdateStamp,
  PremiumGate,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";
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
};

// Vertical-stack section list shown below the live snapshot. Order mirrors
// the May 2026 v2 brief: Weather forecast (radar lives inside) -> Road
// conditions & cams -> Transport -> Stay -> Eat -> Explore. "All mountains"
// and standalone Cams/Radar were removed: mountains accessed via the
// "Weather in mountains" panel; cams + radar embedded inside their parent
// pages.
const SECTIONS: readonly Tile[] = [
  {
    path: "/weather",
    icon: CloudSun,
    label: "Weather forecast",
    labelJa: "天気予報",
    blurb: "Full in-town forecast with snow radar - current, hourly, 7-day",
    blurbJa: "町の総合天気予報・雨雲レーダー - 現在・時間別・7日間",
  },
  {
    path: "/roads",
    icon: Car,
    label: "Road conditions & cams",
    labelJa: "道路状況・ライブカメラ",
    blurb: "Live road conditions to the mountain plus roadside webcams",
    blurbJa: "山への道路状況と路傍ライブカメラ",
  },
  {
    path: "/transport",
    icon: Bus,
    label: "Transport",
    labelJa: "交通",
    blurb: "Buses & shuttles from town to the mountains",
    blurbJa: "町から山へのバス・送迎",
  },
  {
    path: "/stay",
    icon: BedDouble,
    label: "Stay",
    labelJa: "宿泊",
    blurb: "Hotels, ryokan and lodges nearby",
    blurbJa: "近隣の宿泊施設",
  },
  {
    path: "/eat",
    icon: UtensilsCrossed,
    label: "Eat",
    labelJa: "食事",
    blurb: "Restaurants, izakaya, cafés in town",
    blurbJa: "町の飲食店",
  },
  {
    path: "/explore",
    icon: Compass,
    label: "Explore",
    labelJa: "観光",
    blurb: "Off-mountain things to do",
    blurbJa: "山以外のアクティビティ",
  },
];

export function TownHome() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const weatherQ = useGetWeather({ region: region.id });
  const townWeatherQ = useTownWeather(town?.lat, town?.lng);

  // List every region mountain with live weather data, sorted by distance.
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

  if (!town) {
    return (
      <div className="px-6 md:px-10 py-12 max-w-6xl mx-auto">
        <p className="text-muted-foreground">{t("Loading town…", "読み込み中…")}</p>
      </div>
    );
  }

  // Derive a single freshest timestamp from any of the live queries we
  // actually use on this page. Town weather refreshes every ~10 min; mountain
  // weather every ~15. Pick the genuinely newest by parsed epoch so a stale
  // mountain payload doesn't mask a fresher town reading.
  const lastUpdated = (() => {
    const candidates = [
      (weatherQ.data as any)?.lastUpdated,
      (townWeatherQ.data as any)?.current?.observedAt,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    if (candidates.length === 0) return null;
    return candidates.reduce((newest, ts) => {
      const a = Date.parse(newest);
      const b = Date.parse(ts);
      if (Number.isNaN(b)) return newest;
      if (Number.isNaN(a)) return ts;
      return b > a ? ts : newest;
    });
  })();

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
            <UpdateStamp
              lastUpdated={lastUpdated}
              intervalMin={10}
              source={t("Open-Meteo + BOM", "Open-Meteo・BOM")}
              className="mt-3"
            />
          </div>
          <LiveBadge label={t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* TEMP IN TOWN NOW - single full-width snapshot tile.
          May 2026 v2 brief: Roads moved out of the strip and lives inside
          "Road conditions & cams" below. The strip is now a single
          attention-grabbing card answering "what does it feel like here
          right now?" before users scan the rest of the page. */}
      <section className="mt-8">
        <TempInTownNow
          label={t("Temp in town now", "町の現在気温")}
          temperature={townWeatherQ.data?.current.temperature ?? null}
          description={townWeatherQ.data?.current.weatherDescription ?? null}
          feelsLike={townWeatherQ.data?.current.feelsLike ?? null}
          isLoading={townWeatherQ.isLoading}
          townName={t(town.name, town.nameJa)}
          loadingLabel={t("Loading…", "読込中…")}
          unavailableLabel={t("Weather unavailable", "天気情報なし")}
          feelsLabel={t("feels", "体感")}
        />
      </section>

      {/* WEATHER IN MOUNTAINS - per-resort drive time + live conditions.
          Each row is a click-through to the resort detail page. Replaces
          the old standalone "All mountains" page; users now reach mountains
          straight from this list. */}
      <section className="mt-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="byline text-muted-foreground/70">
              {t("Weather in mountains", "山の天気")}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {t("Tap a resort for full conditions", "リゾート名をタップで詳細")}
            </p>
          </div>
          {weatherQ.isLoading && mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("Loading…", "読込中…")}</p>
          ) : mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {t("Mountain conditions unavailable", "山の状況は取得不可")}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {mountainsByDistance.map(({ entry, km, min }) => {
                const temp = entry.current?.temperature;
                const desc = entry.current?.weatherDescription;
                return (
                  <li key={entry.location.id}>
                    <Link
                      href={`~/${region.id}/mountain/${entry.location.id}`}
                      className="group flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-xl hover:bg-secondary/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-semibold text-base tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                          {entry.location.name}
                        </p>
                        <p className="text-[12px] text-muted-foreground/80 mt-0.5">
                          {t(
                            `${Math.round(km)} km · ~${min} min`,
                            `約${Math.round(km)}km・約${min}分`,
                          )}
                          {desc ? ` · ${desc.toLowerCase()}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {temp !== undefined && temp !== null ? (
                          <p className="font-display font-semibold text-2xl text-foreground tabular-nums">
                            {Math.round(temp)}
                            <span className="text-sm text-muted-foreground/70">°</span>
                          </p>
                        ) : null}
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* SECTIONS - vertical stack in the order the brief specifies. */}
      <section className="mt-6 space-y-3">
        {SECTIONS.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.path}
              href={tile.path}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/8 text-primary inline-flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="byline text-primary uppercase">{t(tile.label, tile.labelJa)}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                  {t(tile.blurb, tile.blurbJa)}
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
            </Link>
          );
        })}

        {/* ALERTS - paywalled. Render the same row look but with a lock so
            users can see the offer without leaving the page. */}
        <PremiumGate
          tight
          title="Powder & weather alerts"
          titleJa="降雪・気象アラート"
          blurb="Get a push when your conditions hit. Set thresholds for snow, wind, freezing level and more."
          blurbJa="条件達成時にプッシュ通知。降雪量・風速・凍結高度などを設定。"
          ctaHref={`~/${region.id}/alerts`}
        >
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/8 text-primary inline-flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="byline text-primary uppercase inline-flex items-center gap-1">
                {t("Alerts", "アラート")} <Lock className="w-3 h-3" />
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                {t(
                  "Powder, wind & freezing-level alerts straight to your phone.",
                  "降雪・風速・凍結高度アラートをスマホに直接配信。",
                )}
              </p>
            </div>
          </div>
        </PremiumGate>
      </section>
    </div>
  );
}

function TempInTownNow({
  label,
  temperature,
  description,
  feelsLike,
  isLoading,
  townName,
  loadingLabel,
  unavailableLabel,
  feelsLabel,
}: {
  label: string;
  temperature: number | null;
  description: string | null;
  feelsLike: number | null;
  isLoading: boolean;
  townName: string;
  loadingLabel: string;
  unavailableLabel: string;
  feelsLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 md:p-7">
      <p className="byline text-muted-foreground/70">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2">
          <p className="font-display font-semibold text-6xl md:text-7xl tracking-tight text-foreground leading-none tabular-nums">
            {temperature !== null ? Math.round(temperature) : isLoading ? "…" : "-"}
          </p>
          <span className="text-2xl md:text-3xl text-muted-foreground/70">°</span>
        </div>
        <div className="text-right min-w-0">
          <p className="font-display font-medium text-lg text-foreground">{townName}</p>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {isLoading
              ? loadingLabel
              : description
                ? `${description}${feelsLike !== null ? ` · ${feelsLabel} ${Math.round(feelsLike)}°` : ""}`
                : unavailableLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
