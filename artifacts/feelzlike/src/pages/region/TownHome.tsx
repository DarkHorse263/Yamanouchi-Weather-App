import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
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
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  LiveBadge,
  UpdateStamp,
  PageHeader,
  PremiumGate,
  useOptionalSeason,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";
import { useTownWeather } from "@/lib/town-weather";
import { townNavHasContent } from "@/lib/navContent";
import { PageMeta } from "@/lib/seo/PageMeta";
import { placeSchema, breadcrumbSchema } from "@/lib/seo/jsonLd";
import { DailyPick } from "@/components/DailyPick";
import { FavouriteStar } from "@/components/FavouriteStar";

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

// Display metadata for parent mountain groups (e.g. the Shiga Kogen umbrella
// covering 18 sub-resorts). Kept local so TownHome's panel reads as a
// self-contained unit; the standalone /mountains page has its own card-style
// equivalent in MountainsList.tsx.
const PARENT_GROUP_META: Record<string, { name: string; nameJa: string; blurb: string; blurbJa: string }> = {
  "shiga-kogen": {
    name: "Shiga Kogen Mountain Resort",
    nameJa: "志賀高原マウンテンリゾート",
    blurb: "18 linked resorts · one all-mountain lift pass",
    blurbJa: "18スキー場連結 · オールマウンテン共通リフト券",
  },
  "kita-shiga": {
    name: "Kita-Shiga Kogen Area",
    nameJa: "北志賀高原エリア",
    blurb: "4 resorts on the western slopes · separate from the Shiga pass",
    blurbJa: "西斜面の4スキー場 · 志賀のリフト券とは別系統",
  },
};

// Per-resort colour tints applied behind each row in the "Weather in
// mountains" panel. Kept inside the sky/blue brand family (sky · indigo
// · cyan · blue · teal · slate) so each row reads distinct without
// breaking palette discipline. Keys are mountain ids OR parent-group
// ids (for the Shiga Kogen / Kita Shiga umbrella rows). Class strings
// are written as full literals so Tailwind's JIT can pick them up at
// build time.
const MOUNTAIN_TINTS: Record<string, { bg: string; hover: string; ring: string }> = {
  // Snowy Mountains AU
  perisher:           { bg: "bg-sky-100/70",     hover: "hover:bg-sky-200/70",     ring: "ring-sky-300/50" },
  thredbo:            { bg: "bg-indigo-100/70",  hover: "hover:bg-indigo-200/70",  ring: "ring-indigo-300/50" },
  selwyn:             { bg: "bg-cyan-100/70",    hover: "hover:bg-cyan-200/70",    ring: "ring-cyan-300/50" },
  "charlottes-pass":  { bg: "bg-blue-100/70",    hover: "hover:bg-blue-200/70",    ring: "ring-blue-300/50" },
  // Victoria's High Country AU
  "mt-buller":        { bg: "bg-sky-100/70",     hover: "hover:bg-sky-200/70",     ring: "ring-sky-300/50" },
  "mt-stirling":      { bg: "bg-teal-100/70",    hover: "hover:bg-teal-200/70",    ring: "ring-teal-300/50" },
  "falls-creek":      { bg: "bg-indigo-100/70",  hover: "hover:bg-indigo-200/70",  ring: "ring-indigo-300/50" },
  "mt-hotham":        { bg: "bg-blue-100/70",    hover: "hover:bg-blue-200/70",    ring: "ring-blue-300/50" },
  "lake-mountain":    { bg: "bg-cyan-100/70",    hover: "hover:bg-cyan-200/70",    ring: "ring-cyan-300/50" },
  "mt-donna-buang":   { bg: "bg-slate-100/70",   hover: "hover:bg-slate-200/70",   ring: "ring-slate-300/50" },
  // Yamanouchi JP · parent groups (these render as the umbrella row)
  "shiga-kogen":      { bg: "bg-indigo-100/70",  hover: "hover:bg-indigo-200/70",  ring: "ring-indigo-300/50" },
  "kita-shiga":       { bg: "bg-cyan-100/70",    hover: "hover:bg-cyan-200/70",    ring: "ring-cyan-300/50" },
};

const FALLBACK_TINT = { bg: "bg-sky-50/70", hover: "hover:bg-sky-100/70", ring: "ring-sky-200/50" };

function tintFor(id: string): { bg: string; hover: string; ring: string } {
  return MOUNTAIN_TINTS[id] ?? FALLBACK_TINT;
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
//
// Stay/Eat blurbs are region-aware: Japan-specific terms (ryokan, izakaya)
// only show on JP regions; AU regions get country-relevant copy
// (motels, pubs) so a NSW user never sees Japanese accommodation/dining
// terminology.
function buildSections(isJP: boolean): readonly Tile[] {
  return [
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
      blurb: isJP
        ? "Hotels, ryokan and lodges nearby"
        : "Hotels, motels, lodges and apartments nearby",
      blurbJa: "近隣の宿泊施設",
    },
    {
      path: "/eat",
      icon: UtensilsCrossed,
      label: "Eat",
      labelJa: "食事",
      blurb: isJP
        ? "Restaurants, izakaya, cafés in town"
        : "Restaurants, pubs and cafés in town",
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
}

export function TownHome() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const seasonCtx = useOptionalSeason();
  // AU resorts + per-resort snow forecast belong to the snow season only.
  // When the user flips the season pill to green, hide the "Weather in
  // mountains" panel entirely (mirrors the yamanouchi pattern, where the
  // resorts page is wholly replaced in green season).
  const isGreen = region.seasons && seasonCtx?.season === "green";
  // Even in green season some mountains stay open (e.g. Thredbo for chairlift
  // walks to Kosciuszko + downhill MTB). Keep the weather query running if
  // the region has any `summerOpen` mountains so we can still surface them.
  const summerOpenMountainIds = useMemo(
    () => new Set((region.mountains ?? []).filter((m) => m.summerOpen).map((m) => m.id)),
    [region.mountains],
  );
  const hasSummerOpenMountains = summerOpenMountainIds.size > 0;
  const weatherQ = useGetWeather(
    { region: region.id as never },
    { query: { enabled: !isGreen || hasSummerOpenMountains } as never },
  );
  const townWeatherQ = useTownWeather(town?.lat, town?.lng);

  // List every region mountain with live weather data in the region's
  // curated display order (e.g. Snowy Mountains: Perisher, Thredbo,
  // Selwyn, Charlotte's Pass). Distance is shown alongside but doesn't
  // drive sort - the region config owns ordering so flagship resorts
  // always lead even when a closer secondary mountain exists.
  const mountainsByDistance = useMemo(() => {
    if (!town || !weatherQ.data) return [];
    const orderedIds = region.mountains?.map((m) => m.id) ?? [];
    const orderIndex = new Map(orderedIds.map((id, i) => [id, i]));
    const regionIds = new Set(orderedIds);
    const nearbyIds = new Set(town.nearbyMountainIds ?? []);
    const allowed = nearbyIds.size > 0 ? nearbyIds : regionIds;
    // In green season, narrow to only mountains that actually operate in
    // green season (e.g. Thredbo for chairlift walks + MTB). Other resorts
    // genuinely shut, so listing them with stale weather would mislead.
    const greenFilter = (id: string) => !isGreen || summerOpenMountainIds.has(id);
    const candidates = allowed.size > 0
      ? weatherQ.data.locations.filter((l) => allowed.has(l.location.id) && greenFilter(l.location.id))
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
      .sort((a, b) => {
        const ai = orderIndex.get(a.entry.location.id) ?? Number.MAX_SAFE_INTEGER;
        const bi = orderIndex.get(b.entry.location.id) ?? Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.km - b.km;
      });
  }, [town, weatherQ.data, region, isGreen, summerOpenMountainIds]);

  // Fold sub-resorts into their parent group (e.g. Shiga Kogen's 18 areas
  // collapse to one expandable row, Kita-Shiga's 4 collapse to another).
  // Standalone mountains (no parentId) render flat alongside the groups
  // in the region's curated display order.
  type MountainRow = (typeof mountainsByDistance)[number];
  type RenderItem =
    | { kind: "single"; row: MountainRow }
    | { kind: "group"; parentId: string; rows: MountainRow[] };
  const mountainItems = useMemo<RenderItem[]>(() => {
    if (mountainsByDistance.length === 0) return [];
    const idToParent = new Map<string, string | undefined>(
      (region.mountains ?? []).map((m) => [m.id, m.parentId]),
    );
    const out: RenderItem[] = [];
    const groupAt = new Map<string, number>();
    for (const row of mountainsByDistance) {
      const pid = idToParent.get(row.entry.location.id);
      if (!pid) {
        out.push({ kind: "single", row });
        continue;
      }
      const at = groupAt.get(pid);
      if (at !== undefined) {
        const g = out[at]!;
        if (g.kind === "group") g.rows.push(row);
      } else {
        groupAt.set(pid, out.length);
        out.push({ kind: "group", parentId: pid, rows: [row] });
      }
    }
    return out;
  }, [mountainsByDistance, region.mountains]);

  if (!town) {
    return (
      <div className="px-4 md:px-10 py-5 md:py-8 max-w-6xl mx-auto">
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
    <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
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
      <PageHeader
        byline={`${region.name} · ${t("Base town", "拠点の町")}`}
        title={t(town.name, town.nameJa)}
        description={town.blurb ? t(town.blurb, town.blurbJa) : undefined}
        stamp={
          <UpdateStamp
            tone="onDark"
            lastUpdated={lastUpdated}
            intervalMin={10}
            source={
              region.weatherSource
                ? t(
                    region.weatherSource.label,
                    region.weatherSource.labelJa ?? region.weatherSource.label,
                  )
                : "Open-Meteo"
            }
          />
        }
        badge={<LiveBadge tone="onDark" label={t("Live", "ライブ")} />}
      />

      {/* SAVE TO FAVOURITES · pins this town to the landing quick-access
          list (up to 3). Sits right under the header so it reads as an
          action on the town you're looking at. */}
      <div className="mt-4">
        <FavouriteStar
          location={{
            regionId: region.id,
            townId: town.id,
            townName: town.name,
            townNameJa: town.nameJa,
          }}
          label={t("save town", "この町を保存")}
          savedLabel={t("saved", "保存済み")}
          fullHint={t("3 saved \u00b7 remove one first", "3件保存済み \u00b7 1件削除してください")}
        />
      </div>

      {/* DAILY PICK · winter-only callout that surfaces the best resort
          today by fresh snow + low wind. Scoped to this town's nearby
          mountains so the recommendation is genuinely reachable from
          here (Jindabyne sees Snowy resorts, Mount Beauty sees Vic
          High Country, etc). Mirrors the RegionHome mount so a user
          who lands on a town directly still sees the same headline
          pick they would on the region overview. */}
      {seasonCtx?.season === "winter" && mountainsByDistance.length > 0 && (
        <div className="mt-6">
          <DailyPick
            regionId={region.id}
            resorts={mountainsByDistance.map((r) => ({
              id: r.entry.location.id,
              name: r.entry.location.name,
            }))}
            resortHrefPattern={`~/${region.id}/mountain/:id`}
          />
        </div>
      )}

      {/* TEMP IN TOWN NOW - single full-width snapshot tile.
          May 2026 v2 brief: Roads moved out of the strip and lives inside
          "Road conditions & cams" below. The strip is now a single
          attention-grabbing card answering "what does it feel like here
          right now?" before users scan the rest of the page. */}
      <section className="mt-6">
        <TempInTownNow
          label={t("Temp in town now", "町の現在気温")}
          temperature={townWeatherQ.data?.current.temperature ?? null}
          description={townWeatherQ.data?.current.weatherDescription ?? null}
          feelsLike={townWeatherQ.data?.current.feelsLike ?? null}
          isLoading={townWeatherQ.isLoading}
          townName={t(town.name, town.nameJa)}
          loadingLabel={t("Loading…", "読込中…")}
          unavailableLabel={t("Weather unavailable", "天気情報なし")}
          feelsLabel={t("feelzlike", "体感")}
        />
      </section>

      {/* WEATHER IN MOUNTAINS - per-resort drive time + live conditions.
          Each row is a click-through to the resort detail page. Replaces
          the old standalone "All mountains" page; users now reach mountains
          straight from this list.

          Hidden during the green season: snow-only context (resorts, snow
          forecast) doesn't apply once the lifts close. We swap in a tiny
          off-season banner pointing users at the still-relevant town
          surfaces (stay / eat / explore) below. */}
      {isGreen && mountainsByDistance.length === 0 ? (
        <section className="mt-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
            <p className="byline text-emerald-700/80 mb-1">
              {t("Off-season", "シーズンオフ")}
            </p>
            <p className="text-sm text-emerald-900 leading-snug">
              {t(
                "Resorts and the snow forecast pause for green season. Switch the season pill back to winter once snow returns · or scroll on for stay, eat and explore.",
                "シーズンオフはスキー場と降雪予報を一時停止しています。雪が戻ったらシーズン切替を冬に戻してください。",
              )}
            </p>
          </div>
        </section>
      ) : (
      <section className="mt-3">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="byline text-muted-foreground/70">
              {isGreen
                ? t("Open in green season", "グリーンシーズン営業中")
                : t("Weather in mountains", "山の天気")}
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              {t("Tap a resort for full conditions", "リゾート名をタップで詳細")}
            </p>
          </div>
          {isGreen && (
            <p className="text-xs text-emerald-700/80 mb-3 leading-snug">
              {t(
                "Other resorts pause for green season. Switch the season pill back to winter once snow returns.",
                "他のスキー場はグリーンシーズン休業。雪が戻ったらシーズン切替を冬に戻してください。",
              )}
            </p>
          )}
          {weatherQ.isLoading && mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("Loading…", "読込中…")}</p>
          ) : mountainsByDistance.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {t("Mountain conditions unavailable", "山の状況は取得不可")}
            </p>
          ) : (
            <MountainsList items={mountainItems} regionId={region.id} t={t} />
          )}
        </div>
      </section>
      )}

      {/* SECTIONS - vertical stack in the order the brief specifies. */}
      <section className="mt-5 space-y-3">
        {buildSections(region.shortTag?.toUpperCase() === "JP")
          .filter((tile) => !town || townNavHasContent(region, town.id, tile.path))
          .map((tile) => {
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
            users can see the offer without leaving the page.
            Hidden in green season - powder alerts are snow-only. */}
        {!isGreen && (
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
        )}
      </section>
    </div>
  );
}

// Default number of mountain rows surfaced above the fold in TownHome.
// Long lists (Yamanouchi's 22 resorts under Shiga + Kita-Shiga, etc.)
// collapsed past this with a "see all (+N)" toggle so the page no longer
// pushes the stay/eat/explore tiles miles below the fold.
const MOUNTAINS_VISIBLE_DEFAULT = 3;

function MountainsList({
  items,
  regionId,
  t,
}: {
  items: Array<
    | { kind: "single"; row: Parameters<typeof MountainResortRow>[0]["row"] }
    | { kind: "group"; parentId: string; rows: Array<Parameters<typeof MountainResortRow>[0]["row"]> }
  >;
  regionId: string;
  t: (en: string, ja: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(0, items.length - MOUNTAINS_VISIBLE_DEFAULT);
  const visible = expanded ? items : items.slice(0, MOUNTAINS_VISIBLE_DEFAULT);
  return (
    <>
      <ul className="space-y-2">
        {visible.map((item) => {
          if (item.kind === "single") {
            return (
              <li key={item.row.entry.location.id}>
                <MountainResortRow row={item.row} regionId={regionId} t={t} />
              </li>
            );
          }
          return (
            <li key={`group-${item.parentId}`}>
              <MountainParentGroupRow
                parentId={item.parentId}
                rows={item.rows}
                regionId={regionId}
                t={t}
              />
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-sky-700/80 hover:text-sky-700 transition-colors"
        >
          {expanded
            ? t("show fewer", "閉じる")
            : t(`see all (+${hiddenCount})`, `すべて表示 (+${hiddenCount})`)}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </>
  );
}

// Single resort row - compact list item used both at the top level
// (standalone mountains) and inside an expanded parent group.
function MountainResortRow({
  row,
  regionId,
  t,
  indent = false,
}: {
  row: { entry: { location: { id: string; name: string; latitude: number; longitude: number }; current?: { temperature?: number | null; weatherDescription?: string | null } | null }; km: number; min: number };
  regionId: string;
  t: (en: string, ja: string) => string;
  indent?: boolean;
}) {
  const { entry, km, min } = row;
  const temp = entry.current?.temperature;
  const desc = entry.current?.weatherDescription;
  // Indented child rows (inside an expanded parent group) keep the
  // parent's tint so the visual grouping stays clear; only top-level
  // rows get their own per-resort tint.
  const tint = indent ? null : tintFor(entry.location.id);
  return (
    <Link
      href={`~/${regionId}/mountain/${entry.location.id}`}
      className={
        tint
          ? `group flex items-center justify-between gap-3 px-3 py-3 rounded-xl ring-1 ${tint.bg} ${tint.hover} ${tint.ring} transition-colors`
          : `group flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/40 transition-colors ${indent ? "pl-5" : ""}`
      }
    >
      <div className="min-w-0 flex-1">
        <p className={`font-display font-semibold tracking-tight text-foreground truncate group-hover:text-primary transition-colors ${indent ? "text-sm" : "text-base"}`}>
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
          <p className={`font-display font-semibold text-foreground tabular-nums ${indent ? "text-xl" : "text-2xl"}`}>
            {Math.round(temp)}
            <span className="text-sm text-muted-foreground/70">°</span>
          </p>
        ) : null}
        <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

// Parent-group row: collapsed by default, shows aggregate stats. Tap to
// expand and reveal each child resort as its own row.
function MountainParentGroupRow({
  parentId,
  rows,
  regionId,
  t,
}: {
  parentId: string;
  rows: Array<Parameters<typeof MountainResortRow>[0]["row"]>;
  regionId: string;
  t: (en: string, ja: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const meta = PARENT_GROUP_META[parentId] ?? {
    name: parentId,
    nameJa: parentId,
    blurb: "",
    blurbJa: "",
  };
  // Aggregate display: nearest distance + temp range across children that
  // have current readings.
  const minKm = rows.reduce((acc, r) => Math.min(acc, r.km), Number.POSITIVE_INFINITY);
  const minMin = rows.reduce((acc, r) => Math.min(acc, r.min), Number.POSITIVE_INFINITY);
  const temps = rows
    .map((r) => r.entry.current?.temperature)
    .filter((v): v is number => typeof v === "number");
  const tMin = temps.length > 0 ? Math.min(...temps) : null;
  const tMax = temps.length > 0 ? Math.max(...temps) : null;
  const tempBadge =
    tMin !== null && tMax !== null
      ? tMin === tMax
        ? `${Math.round(tMin)}°`
        : `${Math.round(tMin)}° to ${Math.round(tMax)}°`
      : null;
  const tint = tintFor(parentId);

  return (
    <div className={`rounded-xl ring-1 ${tint.bg} ${tint.ring} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`group flex w-full items-center justify-between gap-3 px-3 py-3 ${tint.hover} transition-colors text-left`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-primary/70 shrink-0" aria-hidden />
            <p className="font-display font-semibold text-base tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
              {t(meta.name, meta.nameJa)}
            </p>
          </div>
          <p className="text-[12px] text-muted-foreground/80 mt-0.5">
            {t(
              `${Math.round(minKm)} km · ~${minMin} min · ${rows.length} resorts`,
              `約${Math.round(minKm)}km・約${minMin}分・${rows.length}スキー場`,
            )}
            {tempBadge ? ` · ${tempBadge}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-primary/8 text-primary border border-primary/20">
            {rows.length} {t("resorts", "スキー場")}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground/60 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <ul className="border-t border-white/60 bg-white/40 px-2 py-1 divide-y divide-border/40">
              {rows.map((r) => (
                <li key={r.entry.location.id}>
                  <MountainResortRow row={r} regionId={regionId} t={t} indent />
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
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
