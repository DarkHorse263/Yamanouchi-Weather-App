import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Snowflake,
  Wind,
  Thermometer,
  CloudFog,
  Mountain as MountainIcon,
  Car,
  Sparkles,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  useSeason,
  LiveBadge,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";

/* ------------------------------------------------------------------ */
/*  Scoring                                                            */
/* ------------------------------------------------------------------ */

interface MountainScore {
  /** 0–100 composite score. Higher = better day on this mountain. */
  total: number;
  /** Individual sub-scores so we can show what drove the call. */
  sub: {
    snow: number;     // depth + freshness
    wind: number;     // calmer = better
    temp: number;     // cold-but-not-stupid = better
    visibility: number; // less cloud = better
  };
  /** Short headline e.g. "POWDER DAY" or "BLUEBIRD" */
  headline: string;
  headlineJa: string;
  /** Tone class for the headline */
  tone: "powder" | "bluebird" | "fair" | "marginal" | "no-go";
}

interface MountainRow {
  id: string;
  name: string;
  nameJa?: string;
  elevationM?: number;
  blurb?: string;
  blurbJa?: string;
  /** Live weather snapshot (may be undefined if API hasn't returned this mountain) */
  w: {
    temperature: number;
    feelsLike: number;
    windSpeed: number;
    windGust?: number;
    snowDepth: number;
    weatherCode: number;
    cloudCover?: number;
    freezingLevel?: number | null;
  } | null;
  lat?: number;
  lng?: number;
  score: MountainScore;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Snowfall-implying weather codes (Open-Meteo / WMO) */
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function scoreMountain(
  w: MountainRow["w"],
  season: "winter" | "green",
): MountainScore {
  if (!w) {
    return {
      total: 0,
      sub: { snow: 0, wind: 0, temp: 0, visibility: 0 },
      headline: "No data",
      headlineJa: "データなし",
      tone: "marginal",
    };
  }

  const isSnowing = SNOW_CODES.has(w.weatherCode);

  // ── Snow / surface (40 pts in winter, 0 in green) ────────────────
  let snow = 0;
  if (season === "winter") {
    const depthScore = clamp(w.snowDepth * 25, 0, 30); // 1.2m+ → max
    const fallBonus = isSnowing ? 10 : 0;
    snow = clamp(depthScore + fallBonus, 0, 40);
  }

  // ── Wind (25 pts; 0 km/h = best, ≥60 = unrideable) ───────────────
  const wind = clamp(25 - (w.windSpeed / 60) * 25, 0, 25);

  // ── Temperature (20 pts) ─────────────────────────────────────────
  // Winter sweet spot: -8 to -2 °C. Green sweet spot: 12 to 22 °C.
  let temp = 0;
  if (season === "winter") {
    const t = w.temperature;
    if (t <= -15) temp = 5;
    else if (t < -8) temp = 14;
    else if (t <= -2) temp = 20;
    else if (t < 2) temp = 14;
    else temp = clamp(8 - (t - 2) * 2, 0, 8);
  } else {
    const t = w.temperature;
    if (t >= 12 && t <= 22) temp = 20;
    else if (t > 22 && t <= 28) temp = 14;
    else if (t >= 6 && t < 12) temp = 14;
    else temp = clamp(8 - Math.abs(t - 17) * 0.5, 0, 8);
  }

  // ── Visibility (15 pts; less cloud = better) ─────────────────────
  const visibility = w.cloudCover !== undefined
    ? clamp(15 - (w.cloudCover / 100) * 15, 0, 15)
    : 8;

  const total = Math.round(
    season === "winter"
      ? snow + wind + temp + visibility
      : wind + temp + visibility + 40, /* no snow penalty in green */
  );

  // ── Headline & tone ──────────────────────────────────────────────
  let headline = "Fair";
  let headlineJa = "まずまず";
  let tone: MountainScore["tone"] = "fair";

  if (season === "winter") {
    if (isSnowing && w.snowDepth > 0.5 && w.windSpeed < 40) {
      headline = "POWDER DAY";
      headlineJa = "パウダーデー";
      tone = "powder";
    } else if (
      (w.cloudCover ?? 100) < 30 &&
      w.windSpeed < 25 &&
      w.snowDepth > 0.3
    ) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (w.windSpeed > 60 || total < 30) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = total < 20 ? "no-go" : "marginal";
    }
  } else {
    if ((w.cloudCover ?? 100) < 30 && w.windSpeed < 20 && w.temperature > 12) {
      headline = "BLUEBIRD";
      headlineJa = "快晴";
      tone = "bluebird";
    } else if (w.windSpeed > 50 || total < 40) {
      headline = "MARGINAL";
      headlineJa = "厳しい";
      tone = "marginal";
    }
  }

  return {
    total,
    sub: { snow, wind, temp, visibility },
    headline,
    headlineJa,
    tone,
  };
}

/* ------------------------------------------------------------------ */
/*  Journey estimate                                                   */
/* ------------------------------------------------------------------ */

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

/** Rough drive-time estimate: alpine roads avg ~50 km/h door-to-base. */
function estimateMinutes(km: number): number {
  return Math.round((km / 50) * 60);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function TodaysCall() {
  const { region } = useRegion();
  const { t } = useLanguage();
  const { town } = useBaseTown();
  const { season } = useSeason();
  const weatherQ = useGetWeather();

  const rows: MountainRow[] = useMemo(() => {
    const mountains = region.mountains ?? [];
    return mountains
      .map<MountainRow>((m) => {
        const entry = weatherQ.data?.locations.find(
          (l: { location: { id: string } }) => l.location.id === m.id,
        );
        const c = entry?.current;
        const w = c
          ? {
              temperature: c.temperature,
              feelsLike: c.feelsLike,
              windSpeed: c.windSpeed,
              windGust: c.windGust ?? undefined,
              snowDepth: c.snowDepth ?? 0,
              weatherCode: c.weatherCode,
              cloudCover: c.cloudCover,
              freezingLevel:
                (c as { freezingLevel?: number | null }).freezingLevel ?? null,
            }
          : null;
        return {
          id: m.id,
          name: m.name,
          nameJa: m.nameJa,
          elevationM: m.elevationM,
          blurb: m.blurb,
          blurbJa: m.blurbJa,
          w,
          lat: entry?.location.latitude,
          lng: entry?.location.longitude,
          score: scoreMountain(w, season),
        };
      })
      .sort((a, b) => b.score.total - a.score.total);
  }, [region.mountains, weatherQ.data, season]);

  const winner = rows[0];

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
              {region.name} · {town ? t(town.name, town.nameJa) : t("Region", "地域")}
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight text-foreground mt-2">
              {t("Today's call", "今日の判断")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {t(
                `Where to head ${town?.name ? `from ${town.name}` : "today"}, ranked on live conditions. Higher score = better day on the hill.`,
                `${town?.name ?? "今日"}からどこへ向かうか。ライブ気象に基づくスコア順。高いほど好条件。`,
              )}
            </p>
          </div>
          <LiveBadge label={weatherQ.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {weatherQ.isError && (
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm">
            {t("Couldn't load conditions.", "気象データを読み込めませんでした。")}
          </p>
        </div>
      )}

      {weatherQ.isLoading && <ScoreSkeleton />}

      {!weatherQ.isLoading && !weatherQ.isError && rows.length === 0 && (
        <p className="text-muted-foreground">
          {t("No mountains configured for this region yet.", "この地域にはまだスキー場が登録されていません。")}
        </p>
      )}

      {/* WINNER CARD */}
      {winner && (
        <motion.div
          key={winner.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <Link
            href={`/mountain/${winner.id}`}
            className="group relative block rounded-3xl border border-border bg-white overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-2 byline text-primary mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    {t("Top pick today", "本日のおすすめ")}
                  </div>
                  <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-foreground">
                    {t(winner.name, winner.nameJa)}
                  </h2>
                  <ToneBadge tone={winner.score.tone} text={t(winner.score.headline, winner.score.headlineJa)} />
                </div>
                <ScoreDial score={winner.score.total} />
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {winner.w && (
                  <>
                    <Stat icon={Snowflake} label={t("Snow base", "積雪")} value={`${(winner.w.snowDepth ?? 0).toFixed(1)} m`} />
                    <Stat icon={Wind} label={t("Wind", "風")} value={`${Math.round(winner.w.windSpeed)} km/h`} />
                    <Stat icon={Thermometer} label={t("Temp", "気温")} value={`${Math.round(winner.w.temperature)}°`} />
                    <Stat icon={CloudFog} label={t("Cloud", "雲")} value={winner.w.cloudCover !== undefined ? `${Math.round(winner.w.cloudCover)} %` : "—"} />
                  </>
                )}
              </div>
              {town && winner.lat !== undefined && winner.lng !== undefined && (
                <JourneyLine town={town} mountainLat={winner.lat} mountainLng={winner.lng} t={t} />
              )}
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {t("Open mountain", "詳細を見る")}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* RANK LIST */}
      {rows.length > 1 && (
        <div className="space-y-3">
          {rows.slice(1).map((row, idx) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
            >
              <Link
                href={`/mountain/${row.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 md:p-5 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="byline text-muted-foreground/60 w-6 text-center shrink-0">
                  #{idx + 2}
                </div>
                <ScoreChip score={row.score.total} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-display font-semibold text-base md:text-lg tracking-tight text-foreground truncate">
                      {t(row.name, row.nameJa)}
                    </p>
                    <ToneBadge tone={row.score.tone} text={t(row.score.headline, row.score.headlineJa)} compact />
                  </div>
                  <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {row.w && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <Snowflake className="w-3 h-3" /> {(row.w.snowDepth ?? 0).toFixed(1)} m
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wind className="w-3 h-3" /> {Math.round(row.w.windSpeed)} km/h
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Thermometer className="w-3 h-3" /> {Math.round(row.w.temperature)}°
                        </span>
                      </>
                    )}
                    {town && row.lat !== undefined && row.lng !== undefined && (
                      <span className="inline-flex items-center gap-1 text-foreground/70">
                        <Car className="w-3 h-3" />
                        {estimateMinutes(haversineKm({ lat: town.lat, lng: town.lng }, { lat: row.lat, lng: row.lng }))} min
                      </span>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* HOW WE SCORE */}
      <details className="mt-10 rounded-2xl border border-border bg-white">
        <summary className="cursor-pointer p-4 byline text-muted-foreground/80 hover:text-foreground transition-colors">
          {t("How we score", "スコアの仕組み")}
        </summary>
        <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
          <p>{t(
            "Each mountain gets a 0–100 composite score from live weather:",
            "各スキー場をライブ気象から0〜100点で評価:",
          )}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t("Snow base + active snowfall (40 pts in winter)", "積雪 + 降雪 (冬季40点)")}</li>
            <li>{t("Wind speed — calmer is better (25 pts)", "風速 — 弱いほど高得点 (25点)")}</li>
            <li>{t("Temperature sweet spot (20 pts)", "適温帯 (20点)")}</li>
            <li>{t("Cloud cover / visibility (15 pts)", "雲量・視界 (15点)")}</li>
          </ul>
          <p className="pt-2 text-xs text-muted-foreground/70">
            {t(
              "Scores are a starting point — always check official lift status and avalanche advisories before heading out.",
              "スコアはあくまで目安です。出発前に必ず公式リフト運行状況・雪崩情報を確認してください。",
            )}
          </p>
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bits                                                               */
/* ------------------------------------------------------------------ */

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="byline text-muted-foreground/70 inline-flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <p className="font-display font-semibold text-2xl tracking-tight text-foreground mt-1">
        {value}
      </p>
    </div>
  );
}

function ToneBadge({
  tone,
  text,
  compact,
}: {
  tone: MountainScore["tone"];
  text: string;
  compact?: boolean;
}) {
  const cls =
    tone === "powder"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : tone === "bluebird"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : tone === "fair"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : tone === "marginal"
            ? "bg-orange-50 text-orange-700 border-orange-200"
            : "bg-rose-50 text-rose-700 border-rose-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 byline ${cls} ${compact ? "" : "mt-3"}`}
    >
      {text}
    </span>
  );
}

function ScoreDial({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamp(score, 0, 100) / 100);
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-secondary" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-semibold text-2xl tracking-tight text-foreground">
          {score}
        </span>
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  return (
    <div className="shrink-0 w-12 h-12 rounded-xl border border-border bg-secondary/40 flex items-center justify-center">
      <span className="font-display font-semibold text-lg tracking-tight text-foreground">
        {score}
      </span>
    </div>
  );
}

function JourneyLine({
  town,
  mountainLat,
  mountainLng,
  t,
}: {
  town: { name: string; nameJa?: string; lat: number; lng: number };
  mountainLat: number;
  mountainLng: number;
  t: (en: string, ja?: string) => string;
}) {
  const km = haversineKm({ lat: town.lat, lng: town.lng }, { lat: mountainLat, lng: mountainLng });
  const min = estimateMinutes(km);
  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs">
      <Car className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">
        {t(`From ${town.name}`, `${t(town.name, town.nameJa)}から`)}
      </span>
      <span className="font-semibold text-foreground">
        {min} min · {km.toFixed(0)} km
      </span>
      <span className="text-muted-foreground/60">{t("(est. drive)", "(目安)")}</span>
    </div>
  );
}

function ScoreSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8 animate-pulse">
        <div className="h-4 w-24 bg-secondary rounded" />
        <div className="h-10 w-2/3 bg-secondary rounded mt-3" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded" />
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl border border-border bg-white animate-pulse" />
      ))}
    </div>
  );
}

export default TodaysCall;
