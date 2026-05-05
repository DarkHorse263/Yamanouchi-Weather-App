import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  MapPin,
  Mountain as MountainIcon,
  Sparkles,
  Car,
  ExternalLink,
  Snowflake,
  Wind,
  Thermometer,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  useSeason,
  LiveBadge,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";
import { useMemo } from "react";

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

interface MiniScore {
  total: number;
  tone: "powder" | "bluebird" | "fair" | "marginal" | "no-go";
  headline: string;
  headlineJa: string;
}

function quickScore(
  c: {
    temperature: number;
    windSpeed: number;
    snowDepth?: number;
    weatherCode: number;
    cloudCover?: number;
  } | null,
  season: "winter" | "green",
): MiniScore {
  if (!c) {
    return { total: 0, tone: "marginal", headline: "No data", headlineJa: "データなし" };
  }
  const isSnowing = SNOW_CODES.has(c.weatherCode);
  const depth = c.snowDepth ?? 0;
  let snow = 0;
  if (season === "winter") {
    snow = clamp(depth * 25, 0, 30) + (isSnowing ? 10 : 0);
  }
  const wind = clamp(25 - (c.windSpeed / 60) * 25, 0, 25);
  let temp = 0;
  if (season === "winter") {
    const t = c.temperature;
    if (t <= -15) temp = 5;
    else if (t < -8) temp = 14;
    else if (t <= -2) temp = 20;
    else if (t < 2) temp = 14;
    else temp = clamp(8 - (t - 2) * 2, 0, 8);
  } else {
    const t = c.temperature;
    if (t >= 12 && t <= 22) temp = 20;
    else if (t > 22 && t <= 28) temp = 14;
    else if (t >= 6 && t < 12) temp = 14;
    else temp = clamp(8 - Math.abs(t - 17) * 0.5, 0, 8);
  }
  const visibility =
    c.cloudCover !== undefined ? clamp(15 - (c.cloudCover / 100) * 15, 0, 15) : 8;
  const total = Math.round(
    season === "winter" ? snow + wind + temp + visibility : wind + temp + visibility + 40,
  );

  let headline = "Fair";
  let headlineJa = "まずまず";
  let tone: MiniScore["tone"] = "fair";
  if (season === "winter") {
    if (isSnowing && depth > 0.5 && c.windSpeed < 40) {
      headline = "POWDER";
      headlineJa = "パウダー";
      tone = "powder";
    } else if ((c.cloudCover ?? 100) < 30 && c.windSpeed < 25 && depth > 0.3) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (c.windSpeed > 60 || total < 30) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = total < 20 ? "no-go" : "marginal";
    }
  } else {
    if ((c.cloudCover ?? 100) < 30 && c.windSpeed < 20 && c.temperature > 12) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (c.windSpeed > 50 || total < 40) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = "marginal";
    }
  }
  return { total, tone, headline, headlineJa };
}

function toneClasses(tone: MiniScore["tone"]) {
  switch (tone) {
    case "powder":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "bluebird":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "fair":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "marginal":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export function RegionOverview() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { towns, town } = useBaseTown();
  const seasonCtx = region.seasons ? useSeason() : null;
  const season = seasonCtx?.season ?? "winter";
  const weatherQ = useGetWeather({ region: region.id });
  const mountains = region.mountains ?? [];

  const scored = useMemo(() => {
    return mountains
      .map((m) => {
        const entry = weatherQ.data?.locations.find(
          (l: { location: { id: string } }) => l.location.id === m.id,
        );
        const c = entry?.current ?? null;
        const lat = m.lat ?? entry?.location.latitude;
        const lng = m.lng ?? entry?.location.longitude;
        const score = quickScore(c, season);
        const km =
          town && lat !== undefined && lng !== undefined
            ? haversineKm({ lat: town.lat, lng: town.lng }, { lat, lng })
            : null;
        return {
          mountain: m,
          c,
          lat,
          lng,
          km,
          driveMin: km !== null ? Math.round((km / 50) * 60) : null,
          score,
        };
      })
      .sort((a, b) => b.score.total - a.score.total);
  }, [mountains, weatherQ.data, season, town]);

  const top3 = scored.slice(0, 3);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl mx-auto">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="byline text-muted-foreground/70">{region.subtitle}</p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {region.name}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                "Region overview · pick the town you're staying in, or jump to a specific mountain.",
                "地域概要 · 滞在中の町を選ぶか、各スキー場へ進んでください。",
              )}
            </p>
          </div>
          <LiveBadge label={weatherQ.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6" />
      </motion.header>

      {/* HERO: Today's call comparison strip — the killer feature, front and centre */}
      {mountains.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mt-8"
        >
          <div className="relative rounded-3xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="p-5 md:p-7">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <p className="byline text-primary inline-flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {t("Today's call", "今日の判断")}
                  </p>
                  <p className="font-display font-semibold text-2xl md:text-3xl tracking-tight text-foreground mt-1">
                    {t(
                      `Where to ski ${town?.name ? `from ${town.name}` : "today"}`,
                      `${town?.name ? `${t(town.name, town.nameJa)}発の` : "今日の"}おすすめスキー場`,
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(
                      `${mountains.length} mountains scored on live snow, wind, temperature & visibility.`,
                      `${mountains.length}スキー場をライブ気象でスコア化（積雪・風・気温・視界）。`,
                    )}
                  </p>
                </div>
                <Link
                  href="/today"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-semibold px-4 py-2 hover:bg-foreground/90 transition-colors"
                >
                  {t("Full comparison", "全比較を見る")}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Top 3 score tiles */}
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {top3.map((row, idx) => (
                  <Link
                    key={row.mountain.id}
                    href={`/mountain/${row.mountain.id}`}
                    className={`group relative rounded-2xl border p-4 transition-all hover:shadow-sm ${
                      idx === 0
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-white hover:border-foreground/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="byline text-muted-foreground/70">
                          #{idx + 1}{idx === 0 ? ` · ${t("WINNER", "1位")}` : ""}
                        </p>
                        <p className="font-display font-semibold text-lg text-foreground truncate mt-0.5">
                          {t(row.mountain.name, row.mountain.nameJa)}
                        </p>
                      </div>
                      <span
                        className={`font-display font-semibold tabular-nums ${
                          idx === 0 ? "text-primary text-3xl" : "text-foreground text-2xl"
                        }`}
                      >
                        {row.score.total}
                      </span>
                    </div>
                    <span
                      className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 byline ${toneClasses(row.score.tone)}`}
                    >
                      {t(row.score.headline, row.score.headlineJa)}
                    </span>
                    <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-muted-foreground tabular-nums">
                      {row.c && (
                        <>
                          <span className="inline-flex items-center gap-1">
                            <Snowflake className="w-3 h-3" />
                            {(row.c.snowDepth ?? 0).toFixed(1)}m
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Wind className="w-3 h-3" />
                            {Math.round(row.c.windSpeed)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            {Math.round(row.c.temperature)}°
                          </span>
                        </>
                      )}
                      {row.driveMin !== null && (
                        <span className="inline-flex items-center gap-1 text-foreground/70 ml-auto">
                          <Car className="w-3 h-3" />
                          {row.driveMin}min
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {towns.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="byline text-muted-foreground/70">
                01 · {t("Where you're staying", "滞在地")}
              </p>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                {t("Base towns", "拠点の町")}
              </h2>
            </div>
            <p className="byline text-muted-foreground/60">
              {towns.length} {t("towns", "町")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {towns.map((tn) => (
              <Link
                key={tn.id}
                href={`/${tn.id}`}
                className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="inline-flex items-center gap-1.5 byline text-primary">
                    <MapPin className="w-3 h-3" /> {t("Town", "町")}
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-3">
                  {t(tn.name, tn.nameJa)}
                </p>
                {tn.blurb && (
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">
                    {t(tn.blurb, tn.blurbJa)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {mountains.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="byline text-muted-foreground/70">
                02 · {t("Where you're skiing", "スキー場")}
              </p>
              <h2 className="font-display font-semibold text-2xl md:text-3xl tracking-tight">
                {t("Mountains", "スキー場")}
              </h2>
            </div>
            <Link href="/mountains" className="byline text-primary hover:underline">
              {t("All mountains", "すべて見る")} →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mountains.map((m) => {
              const km =
                town && m.lat !== undefined && m.lng !== undefined
                  ? haversineKm({ lat: town.lat, lng: town.lng }, { lat: m.lat, lng: m.lng })
                  : null;
              const min = km !== null ? Math.round((km / 50) * 60) : null;
              return (
                <div
                  key={m.id}
                  className="group relative block rounded-2xl border border-border bg-white p-5 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <Link href={`/mountain/${m.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex items-center gap-1.5 byline text-foreground">
                        <MountainIcon className="w-3 h-3" /> {t("Mountain", "スキー場")}
                        {m.parentId && (
                          <span className="byline text-muted-foreground/60">
                            · {t("sub", "サブ")}
                          </span>
                        )}
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-display font-semibold text-xl tracking-tight text-foreground mt-3">
                      {t(m.name, m.nameJa)}
                    </p>
                    {m.elevationM !== undefined && (
                      <p className="byline text-muted-foreground/70 mt-1">ELEV {m.elevationM}M</p>
                    )}
                    {m.blurb && (
                      <p className="text-sm text-muted-foreground mt-2 leading-snug">
                        {t(m.blurb, m.blurbJa)}
                      </p>
                    )}
                    {min !== null && (
                      <div className="mt-3 inline-flex items-center gap-1.5 byline text-muted-foreground">
                        <Car className="w-3 h-3" />
                        <span className="font-semibold text-foreground/80">{min} min</span>
                        <span>
                          · {km!.toFixed(0)} km{" "}
                          {town && t(`from ${town.name}`, `${t(town.name, town.nameJa)}から`)}
                        </span>
                      </div>
                    )}
                  </Link>
                  {m.websiteUrl && (
                    <a
                      href={m.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {t("Resort website", "公式サイト")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
