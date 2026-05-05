import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Snowflake,
  Wind,
  Thermometer,
  CloudFog,
  Car,
  Sparkles,
  ExternalLink,
  Trophy,
  TrendingUp,
  UserCog,
} from "lucide-react";
import {
  useRegion,
  useLanguage,
  useBaseTown,
  useSeason,
  LiveBadge,
} from "@workspace/feelzlike-shell";
import { useGetWeather } from "@workspace/api-client-react";

import { clamp, type MountainScore } from "@/lib/mountainScore";
import {
  scoreMountainPersonalised,
  buildWhyCopy,
  type PersonalisedMountainScore,
} from "@/lib/personalisedScore";
import { useProfile } from "@/hooks/useProfile";
import { ProfileSheet } from "@/components/ProfileSheet";
import type { MountainTags } from "@/types/profile";

/* ------------------------------------------------------------------ */
/*  Row shape (page-local: weather + score per mountain)              */
/* ------------------------------------------------------------------ */

interface MountainRow {
  id: string;
  name: string;
  nameJa?: string;
  elevationM?: number;
  blurb?: string;
  blurbJa?: string;
  websiteUrl?: string;
  parentId?: string;
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
  /** PersonalisedMountainScore extends MountainScore — carries the same
   * total/tone/headline fields plus baseTotal + modifiers. Existing reads
   * of `.total`, `.tone`, `.headline`, `.headlineJa` all keep working. */
  score: PersonalisedMountainScore;
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

function estimateMinutes(km: number): number {
  return Math.round((km / 50) * 60);
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function TodaysCall() {
  const { region } = useRegion();
  const { t, language } = useLanguage();
  const { town } = useBaseTown();
  const { season } = useSeason();
  const weatherQ = useGetWeather({ region: region.id });

  // Sprint 4.1 — personalisation state
  const { profile, hasOnboarded, isLoaded } = useProfile();
  /** When false, the matrix scores all mountains with `personalised=false`
   * so users can A/B compare against the raw weather-only ranking. */
  const [personalised, setPersonalised] = useState(true);
  const [sheetMode, setSheetMode] = useState<"onboarding" | "edit" | null>(null);
  /** Once the user has interacted with onboarding in this tab session
   * (Skip / Save / closed via X), suppress the auto-open until next page
   * load. Belt-and-braces against re-open loops if hasOnboarded stays
   * stale for a render. */
  const [dismissedThisSession, setDismissedThisSession] = useState(false);

  // Auto-open onboarding sheet on first /today visit. Now that useProfile
  // is a shared store, hasOnboarded propagates synchronously after Save —
  // but we keep the session guard for safety against future refactors.
  useEffect(() => {
    if (isLoaded && !hasOnboarded && !dismissedThisSession && sheetMode === null) {
      setSheetMode("onboarding");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, hasOnboarded, dismissedThisSession]);

  const rows: MountainRow[] = useMemo(() => {
    const mountains = region.mountains ?? [];
    // When the toggle is off OR onboarding hasn't been completed, run the
    // scorer with an empty-priorities profile so all modifier branches
    // short-circuit — i.e. behaviourally identical to the base scoreMountain.
    const effectiveProfile = personalised
      ? profile
      : { ...profile, priorities: [], skill_level: "intermediate" as const, risk_tolerance: "medium" as const };
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
        const tags: MountainTags = {
          beginner_friendly: m.beginner_friendly,
          expert_only: m.expert_only,
          kids_lessons: m.kids_lessons,
          terrain_park: m.terrain_park,
          backcountry_access: m.backcountry_access,
        };
        return {
          id: m.id,
          name: m.name,
          nameJa: m.nameJa,
          elevationM: m.elevationM,
          blurb: m.blurb,
          blurbJa: m.blurbJa,
          websiteUrl: m.websiteUrl,
          parentId: m.parentId,
          w,
          // Prefer config coords, fall back to weather location
          lat: m.lat ?? entry?.location.latitude,
          lng: m.lng ?? entry?.location.longitude,
          score: scoreMountainPersonalised(w, season, tags, effectiveProfile),
        };
      })
      .sort((a, b) => b.score.total - a.score.total);
  }, [region.mountains, weatherQ.data, season, profile, personalised]);

  const winner = rows[0];

  // Per-metric leaders so we can highlight the column winner in the matrix.
  const leaders = useMemo(() => {
    const valid = rows.filter((r) => r.w);
    if (valid.length === 0) return null;
    const max = (arr: MountainRow[], pick: (r: MountainRow) => number) =>
      Math.max(...arr.map(pick));
    const min = (arr: MountainRow[], pick: (r: MountainRow) => number) =>
      Math.min(...arr.map(pick));
    return {
      snow: max(valid, (r) => r.w!.snowDepth),
      wind: min(valid, (r) => r.w!.windSpeed),
      // Coldest temp wins in winter, warmest in green
      temp:
        season === "winter"
          ? min(valid, (r) => r.w!.temperature)
          : max(valid, (r) => Math.abs(r.w!.temperature - 17) * -1),
      cloud: min(valid, (r) => r.w!.cloudCover ?? 100),
    };
  }, [rows, season]);

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-7xl mx-auto">
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
              {personalised && hasOnboarded && (
                <span className="ml-3 align-middle inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-medium font-sans tracking-normal">
                  <Sparkles className="w-3 h-3" />
                  {t("personalised for you", "あなた仕様")}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              {t(
                `Every mountain in ${region.name}, scored on live snow, wind, temperature and visibility. ${town?.name ? `Drive estimates from ${town.name}.` : ""} Higher score = better day on the hill.`,
                `${region.name}の全スキー場をライブ気象（積雪・風・気温・視界）でスコア化。${town?.name ? `${t(town.name, town.nameJa)}からの所要時間付き。` : ""}高得点ほど好条件です。`,
              )}
            </p>
            {/* Personalisation affordances: edit profile + show non-personalised toggle */}
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={() => setSheetMode("edit")}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30 transition-colors"
              >
                <UserCog className="w-3.5 h-3.5" />
                {hasOnboarded
                  ? t("Edit profile", "プロフィール編集")
                  : t("Personalise", "パーソナライズ")}
              </button>
              {hasOnboarded && (
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!personalised}
                    onChange={(e) => setPersonalised(!e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border accent-primary"
                  />
                  {t("Show non-personalised", "汎用ランキングを表示")}
                </label>
              )}
            </div>
          </div>
          <LiveBadge label={weatherQ.isFetching ? t("Loading", "読込中") : t("Live", "ライブ")} />
        </div>
        <div className="rule mt-6 mb-8" />
      </motion.header>

      {/* Sprint 4.1 — UserProfile sheet (onboarding + edit modes share one component) */}
      <ProfileSheet
        open={sheetMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            // Mark this session as dismissed regardless of mode — prevents
            // the auto-open effect from re-firing if hasOnboarded is briefly stale.
            if (sheetMode === "onboarding") setDismissedThisSession(true);
            setSheetMode(null);
          }
        }}
        mode={sheetMode ?? "edit"}
      />

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
          {t(
            "No mountains configured for this region yet.",
            "この地域にはまだスキー場が登録されていません。",
          )}
        </p>
      )}

      {/* WINNER BANNER */}
      {winner && (
        <motion.div
          key={winner.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <div className="relative rounded-3xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <div className="grid md:grid-cols-[1fr_auto] gap-8 p-6 md:p-8 items-center">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 byline text-primary mb-2">
                  <Trophy className="w-3.5 h-3.5" />
                  {t("Top pick today", "本日のおすすめ")}
                </div>
                <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tight text-foreground">
                  {t(winner.name, winner.nameJa)}
                </h2>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <ToneBadge
                    tone={winner.score.tone}
                    text={t(winner.score.headline, winner.score.headlineJa)}
                  />
                  {winner.elevationM && (
                    <span className="byline text-muted-foreground/70">
                      ELEV {winner.elevationM}M
                    </span>
                  )}
                  {town && winner.lat !== undefined && winner.lng !== undefined && (
                    <span className="byline text-muted-foreground/70 inline-flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {estimateMinutes(
                        haversineKm(
                          { lat: town.lat, lng: town.lng },
                          { lat: winner.lat, lng: winner.lng },
                        ),
                      )}{" "}
                      {t("min from", "分")} {t(town.name, town.nameJa)}
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/mountain/${winner.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background text-xs font-semibold px-4 py-2 hover:bg-foreground/90 transition-colors"
                  >
                    {t("Open mountain detail", "詳細を見る")}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                  {winner.websiteUrl && (
                    <a
                      href={winner.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border text-xs font-semibold px-4 py-2 text-foreground hover:border-foreground/30 transition-colors"
                    >
                      {t("Resort website", "公式サイト")}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <ScoreDial score={winner.score.total} />
            </div>
          </div>
        </motion.div>
      )}

      {/* COMPARISON MATRIX — the killer fintech-dashboard table */}
      {rows.length > 0 && leaders && (
        <ComparisonMatrix
          rows={rows}
          leaders={leaders}
          town={town}
          season={season}
          t={t}
          language={language}
          showWhy={personalised && hasOnboarded}
        />
      )}

      {/* HOW WE SCORE */}
      <details className="mt-10 rounded-2xl border border-border bg-white">
        <summary className="cursor-pointer p-4 byline text-muted-foreground/80 hover:text-foreground transition-colors">
          {t("How we score", "スコアの仕組み")}
        </summary>
        <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
          <p>
            {t(
              "Each mountain gets a 0–100 composite score from live weather:",
              "各スキー場をライブ気象から0〜100点で評価:",
            )}
          </p>
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
/*  Comparison matrix                                                  */
/* ------------------------------------------------------------------ */

function ComparisonMatrix({
  rows,
  leaders,
  town,
  season,
  t,
  language,
  showWhy,
}: {
  rows: MountainRow[];
  leaders: { snow: number; wind: number; temp: number; cloud: number };
  town: { name: string; nameJa?: string; lat: number; lng: number } | null | undefined;
  season: "winter" | "green";
  t: (en: string, ja?: string) => string;
  language: "en" | "ja";
  /** When true, render the per-row "Why this ranks" copy under each name. */
  showWhy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {/* Caption */}
      <div className="flex items-end justify-between gap-3 px-5 md:px-6 py-4 border-b border-border bg-secondary/30">
        <div>
          <p className="byline text-muted-foreground/70 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            {t("Side-by-side comparison", "横並び比較")}
          </p>
          <p className="font-display font-semibold text-lg tracking-tight text-foreground mt-0.5">
            {t(
              `${rows.length} mountains · ranked by score`,
              `${rows.length}スキー場 · スコア順`,
            )}
          </p>
        </div>
        <p className="byline text-muted-foreground/60 hidden md:block">
          {t("▲ = best in column", "▲ = 列内ベスト")}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="byline text-muted-foreground/70 bg-secondary/20 border-b border-border">
              <th className="text-left px-5 py-3 font-semibold">{t("MOUNTAIN", "スキー場")}</th>
              <th className="text-right px-3 py-3 font-semibold">{t("SCORE", "スコア")}</th>
              <th className="text-right px-3 py-3 font-semibold">
                <span className="inline-flex items-center gap-1 justify-end">
                  <Snowflake className="w-3 h-3" /> {t("SNOW", "積雪")}
                </span>
              </th>
              <th className="text-right px-3 py-3 font-semibold">
                <span className="inline-flex items-center gap-1 justify-end">
                  <Wind className="w-3 h-3" /> {t("WIND", "風")}
                </span>
              </th>
              <th className="text-right px-3 py-3 font-semibold">
                <span className="inline-flex items-center gap-1 justify-end">
                  <Thermometer className="w-3 h-3" /> {t("TEMP", "気温")}
                </span>
              </th>
              <th className="text-right px-3 py-3 font-semibold">
                <span className="inline-flex items-center gap-1 justify-end">
                  <CloudFog className="w-3 h-3" /> {t("CLOUD", "雲")}
                </span>
              </th>
              <th className="text-right px-3 py-3 font-semibold">
                <span className="inline-flex items-center gap-1 justify-end">
                  <Car className="w-3 h-3" /> {t("DRIVE", "所要")}
                </span>
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isLeader = idx === 0;
              const km =
                town && row.lat !== undefined && row.lng !== undefined
                  ? haversineKm({ lat: town.lat, lng: town.lng }, { lat: row.lat, lng: row.lng })
                  : null;
              const drive = km !== null ? estimateMinutes(km) : null;

              const w = row.w;
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 ${isLeader ? "bg-primary/5" : "hover:bg-secondary/20"} transition-colors`}
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/mountain/${row.id}`}
                      className="group inline-flex items-center gap-2"
                    >
                      <span className="byline text-muted-foreground/60 w-5 inline-block text-right">
                        {idx + 1}
                      </span>
                      <span className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t(row.name, row.nameJa)}
                      </span>
                      {row.parentId && (
                        <span className="byline text-muted-foreground/50">
                          · {t("sub", "サブ")}
                        </span>
                      )}
                      <ToneBadge
                        tone={row.score.tone}
                        text={t(row.score.headline, row.score.headlineJa)}
                        compact
                      />
                    </Link>
                    {/* Sprint 4.1 — "Why this ranks here for you" line */}
                    {showWhy && (() => {
                      const why = buildWhyCopy(row.score, language);
                      if (!why) return null;
                      return (
                        <p className="mt-1 ml-7 text-xs text-primary/70 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          {idx === 0
                            ? t(`Why #1 for you: ${why}`, `あなた向け1位の理由: ${why}`)
                            : t(`Why for you: ${why}`, `あなた向けの理由: ${why}`)}
                        </p>
                      );
                    })()}
                  </td>
                  <td className="text-right px-3 py-3">
                    <span
                      className={`inline-flex items-center justify-end font-display font-semibold tabular-nums tracking-tight ${
                        isLeader ? "text-primary text-2xl" : "text-foreground text-lg"
                      }`}
                    >
                      {row.score.total}
                    </span>
                  </td>
                  <MetricCell
                    value={w ? `${w.snowDepth.toFixed(1)} m` : "—"}
                    isLeader={
                      season === "winter" && !!w && w.snowDepth === leaders.snow && w.snowDepth > 0
                    }
                  />
                  <MetricCell
                    value={w ? `${Math.round(w.windSpeed)} km/h` : "—"}
                    isLeader={!!w && w.windSpeed === leaders.wind}
                  />
                  <MetricCell
                    value={w ? `${Math.round(w.temperature)}°` : "—"}
                    isLeader={
                      !!w &&
                      (season === "winter"
                        ? w.temperature === leaders.temp
                        : Math.abs(w.temperature - 17) * -1 === leaders.temp)
                    }
                  />
                  <MetricCell
                    value={w?.cloudCover !== undefined ? `${Math.round(w.cloudCover)}%` : "—"}
                    isLeader={!!w && (w.cloudCover ?? 100) === leaders.cloud}
                  />
                  <td className="text-right px-3 py-3 tabular-nums text-foreground/80">
                    {drive !== null ? (
                      <span>
                        {drive} {t("min", "分")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {row.websiteUrl && (
                      <a
                        href={row.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("Resort website", "公式サイト")}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="md:hidden divide-y divide-border">
        {rows.map((row, idx) => {
          const w = row.w;
          const km =
            town && row.lat !== undefined && row.lng !== undefined
              ? haversineKm({ lat: town.lat, lng: town.lng }, { lat: row.lat, lng: row.lng })
              : null;
          const drive = km !== null ? estimateMinutes(km) : null;
          const isLeader = idx === 0;
          return (
            <Link
              key={row.id}
              href={`/mountain/${row.id}`}
              className={`block p-4 ${isLeader ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="byline text-muted-foreground/60 w-5 text-right">
                  {idx + 1}
                </span>
                <span
                  className={`font-display font-semibold tabular-nums tracking-tight w-12 text-right ${
                    isLeader ? "text-primary text-2xl" : "text-foreground text-lg"
                  }`}
                >
                  {row.score.total}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-semibold text-foreground truncate">
                      {t(row.name, row.nameJa)}
                    </p>
                    <ToneBadge
                      tone={row.score.tone}
                      text={t(row.score.headline, row.score.headlineJa)}
                      compact
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Snowflake className="w-3 h-3" />
                      {w ? `${w.snowDepth.toFixed(1)}m` : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wind className="w-3 h-3" />
                      {w ? `${Math.round(w.windSpeed)}` : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Thermometer className="w-3 h-3" />
                      {w ? `${Math.round(w.temperature)}°` : "—"}
                    </span>
                    {drive !== null && (
                      <span className="inline-flex items-center gap-1 text-foreground/70">
                        <Car className="w-3 h-3" />
                        {drive}min
                      </span>
                    )}
                  </div>
                  {/* Sprint 4.1 — mobile "why this ranks" copy */}
                  {showWhy && (() => {
                    const why = buildWhyCopy(row.score, language);
                    if (!why) return null;
                    return (
                      <p className="mt-1 text-xs text-primary/70 inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        {why}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Atoms                                                              */
/* ------------------------------------------------------------------ */

function MetricCell({ value, isLeader }: { value: string; isLeader: boolean }) {
  return (
    <td className="text-right px-3 py-3 tabular-nums">
      <span
        className={
          isLeader
            ? "inline-flex items-center gap-1 font-semibold text-emerald-700"
            : "text-foreground/80"
        }
      >
        {isLeader && <span className="text-emerald-600">▲</span>}
        {value}
      </span>
    </td>
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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 byline ${cls} ${compact ? "" : ""}`}
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
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-secondary"
          strokeWidth="8"
        />
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold text-3xl tracking-tight text-foreground tabular-nums">
          {score}
        </span>
        <span className="byline text-muted-foreground/60 -mt-1">/100</span>
      </div>
    </div>
  );
}

function ScoreSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-white p-6 md:p-8 animate-pulse">
        <div className="h-4 w-24 bg-secondary rounded" />
        <div className="h-10 w-2/3 bg-secondary rounded mt-3" />
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-secondary rounded mb-2" />
        ))}
      </div>
    </div>
  );
}

export default TodaysCall;
