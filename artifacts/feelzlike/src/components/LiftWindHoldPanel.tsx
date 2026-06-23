import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cable, ChevronDown, AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react";
import {
  predictMountainLifts,
  summariseMountainWindHold,
  type WindHoldStatus,
  type WindHoldPrediction,
  type HourlyWindSample,
} from "@/lib/windHoldPrediction";
import { getLiftsForMountain, type LiftSeed } from "@/data/lifts";
import { computeLiftOperationStatus, type LiftOperationStatus as OperationStatus } from "@/lib/skiSeason";

interface LiftWindHoldPanelProps {
  mountainId: string;
  /** Mountain's reference elevation (resort base) in metres. */
  resortElevationM: number;
  /** Hourly wind samples - uses the first 24 entries. */
  hourly: HourlyWindSample[];
  sectionNumber?: string;
  t?: (en: string, ja?: string) => string;
  /**
   * Whether the resort's ski season is open (deterministic by country, from
   * `isLiftSeasonOpen`). When false the panel never claims lifts are open - it
   * reframes the wind read as a conditional "for when the resort is running"
   * outlook. Required so the panel cannot show "lifts likely open" off-season.
   */
  seasonOpen: boolean;
  /** Latest snow depth in cm if known. null/undefined = unknown (NOT zero). */
  snowDepthCm?: number | null;
  /** Real lift count currently open, when an authoritative feed exists (AU). */
  actualLiftsOpen?: number | null;
  /** Real total lift count, when an authoritative feed exists (AU). */
  actualTotalLifts?: number | null;
  /**
   * Whether this resort has a VERIFIED live lift-status source. Defaults to
   * true (JP resorts, and AU resorts once opted in). When false the panel never
   * asserts a specific operational reason it can't verify (open / closed /
   * no-snow) - it reframes as a conditional "for when lifts are running" wind
   * outlook and points users to the resort's own report.
   */
  liveStatusKnown?: boolean;
}

const STATUS_STYLES: Record<WindHoldStatus, { dot: string; badge: string; icon: typeof CheckCircle2; label: string; labelJa: string }> = {
  likely_open: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    icon: CheckCircle2,
    label: "Likely open",
    labelJa: "運行見込み",
  },
  possible_hold: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    icon: AlertCircle,
    label: "Possible hold",
    labelJa: "停止の可能性",
  },
  likely_held: {
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-700 border-rose-500/30",
    icon: AlertTriangle,
    label: "Likely held",
    labelJa: "停止見込み",
  },
};

/**
 * Wind-framed labels for the NON-operating states. Same colour semantics as
 * STATUS_STYLES (green = wind fine, amber/red = windy) but the words describe
 * wind only - never "open" - so we don't imply a closed lift is running.
 */
const WIND_LABELS: Record<WindHoldStatus, { en: string; ja: string }> = {
  likely_open: { en: "Wind OK", ja: "風は問題なし" },
  possible_hold: { en: "Possible wind hold", ja: "風で停止の可能性" },
  likely_held: { en: "Wind hold likely", ja: "風で停止見込み" },
};

const NON_OPERATING_COPY: Record<Exclude<OperationStatus, "operating">, {
  chip: { en: string; ja: string };
  banner: { en: string; ja: string };
}> = {
  off_season: {
    chip: { en: "Out of season", ja: "シーズン外" },
    banner: {
      en: "Lifts aren't running out of season. The wind outlook below is for when the resort is open.",
      ja: "シーズン外のためリフトは運行していません。下記の風の予測は営業期間中の参考です。",
    },
  },
  no_lifts_open: {
    chip: { en: "No lifts reported open", ja: "運行中のリフトなし" },
    banner: {
      en: "No lifts are reported open right now. The wind outlook below is for when they're running.",
      ja: "現在運行中のリフトの報告はありません。下記の風の予測は運行時の参考です。",
    },
  },
  no_snow: {
    chip: { en: "No snow reported", ja: "積雪の報告なし" },
    banner: {
      en: "Not enough snow has been reported to run lifts. The wind outlook below is for when conditions allow.",
      ja: "リフト運行に十分な積雪の報告がありません。下記の風の予測は条件が整った際の参考です。",
    },
  },
};

/**
 * Copy for the honest "no verified live status" case (AU resorts without a live
 * feed). We don't assert a reason - we point users to the resort's own report.
 */
const UNKNOWN_LIVE_COPY = {
  chip: { en: "No live status", ja: "ライブ情報なし" },
  banner: {
    en: "We don't have live lift status for this resort yet. The wind outlook below is for when lifts are running - check the resort's report for today's operations.",
    ja: "この施設のライブなリフト運行情報はまだありません。下記の風の予測は運行時の参考です。当日の運行状況は各施設の公式情報をご確認ください。",
  },
};

const TYPE_LABEL: Record<LiftSeed["type"], { en: string; ja: string }> = {
  gondola: { en: "Gondola", ja: "ゴンドラ" },
  detachable: { en: "Detachable", ja: "高速リフト" },
  fixed_grip_chair: { en: "Fixed-grip chair", ja: "固定循環式リフト" },
  "t-bar": { en: "T-bar", ja: "Tバー" },
  rope_tow: { en: "Rope tow", ja: "ロープトウ" },
};

/**
 * Conditional wind detail used when the resort is NOT operating: pure wind
 * facts (peak gusts vs hold threshold), with no "open"/"held" verdict word so
 * the line stays honest about a lift that isn't running.
 */
function windDetail(pred: WindHoldPrediction, t: (en: string, ja?: string) => string): string {
  if (!pred.worstHour) return t("No wind forecast available", "風の予測データなし");
  const g = pred.worstHour.effectiveGustKmh;
  const thr = pred.effectiveThresholdKmh;
  const base = t(
    `Peak ${g}km/h gusts at top · hold threshold ${thr}km/h`,
    `最大瞬間風速 ${g}km/h（山頂）· 停止しきい値 ${thr}km/h`,
  );
  if (pred.hoursAtRisk > 0) {
    return base + t(` · ${pred.hoursAtRisk}h above threshold`, ` · しきい値超過 ${pred.hoursAtRisk}時間`);
  }
  return base;
}

export function LiftWindHoldPanel({
  mountainId,
  resortElevationM,
  hourly,
  sectionNumber = "",
  t: tProp,
  seasonOpen,
  snowDepthCm,
  actualLiftsOpen,
  actualTotalLifts,
  liveStatusKnown = true,
}: LiftWindHoldPanelProps) {
  const t = tProp ?? ((en: string) => en);
  const headingId = useId();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const lifts = useMemo(() => getLiftsForMountain(mountainId), [mountainId]);

  const samples: HourlyWindSample[] = useMemo(() => {
    return hourly.slice(0, 24).map((h) => ({
      time: h.time,
      windSpeed: h.windSpeed,
      windGust: h.windGust,
    }));
  }, [hourly]);

  const predictions = useMemo(
    () => predictMountainLifts(lifts, samples, resortElevationM),
    [lifts, samples, resortElevationM],
  );
  const summary = useMemo(() => summariseMountainWindHold(predictions), [predictions]);

  // Operational gate (priority: off-season > live feed > known-low snow >
  // operating). Logic lives in computeLiftOperationStatus so it can be unit
  // tested independently of React. See skiSeason.ts for the full priority doc.
  const operationStatus: OperationStatus = useMemo(
    () => computeLiftOperationStatus({ seasonOpen, snowDepthCm, actualLiftsOpen, actualTotalLifts }),
    [seasonOpen, snowDepthCm, actualLiftsOpen, actualTotalLifts],
  );

  // A verified live source is required to claim live operation. Without one we
  // keep the conditional "for when lifts are running" framing even in season.
  const operating = operationStatus === "operating" && liveStatusKnown;

  if (lifts.length === 0) return null;

  const overallTone = operating
    ? summary.openFraction >= 0.8
      ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/30"
      : summary.openFraction >= 0.5
        ? "text-amber-700 bg-amber-500/10 border-amber-500/30"
        : "text-rose-700 bg-rose-500/10 border-rose-500/30"
    : "text-slate-600 bg-slate-500/10 border-slate-500/30";

  const nonOperatingCopy = operating
    ? null
    : operationStatus === "operating"
      ? UNKNOWN_LIVE_COPY
      : NON_OPERATING_COPY[operationStatus];

  return (
    <section className="mt-8" aria-labelledby={headingId}>
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <p className="byline text-muted-foreground/70">
            {sectionNumber ? `${sectionNumber} · ` : ""}
            {operating
              ? t("Wind-hold outlook · next 24h", "ウィンドホールド予測 · 24時間")
              : t("If lifts were running · wind outlook", "運行時の風予測 · 参考")}
          </p>
          <h2
            id={headingId}
            className="font-display font-semibold text-2xl tracking-tight flex items-center gap-2"
          >
            <Cable className="w-5 h-5 text-primary" />
            {t("Will the lifts spin?", "リフトは動くか")}
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${overallTone}`}
        >
          {operating
            ? `${summary.likelyOpen}/${summary.totalLifts} ${t("likely open", "運行見込み")}`
            : t(nonOperatingCopy!.chip.en, nonOperatingCopy!.chip.ja)}
        </span>
      </div>

      {/* Honest operational banner - shown when lifts are NOT running. Replaces
          the "watch the windiest lift" alert so we never imply live operation. */}
      {!operating && nonOperatingCopy && (
        <div className="rounded-2xl border border-slate-500/30 bg-slate-500/10 px-4 py-3 mb-3">
          <p className="text-sm font-medium text-slate-700 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{t(nonOperatingCopy.banner.en, nonOperatingCopy.banner.ja)}</span>
          </p>
        </div>
      )}

      {/* Headline call - only when lifts are genuinely operating. */}
      {operating && summary.worstLift && summary.worstLift.status !== "likely_open" && (
        <div className={`rounded-2xl border px-4 py-3 mb-3 ${STATUS_STYLES[summary.worstLift.status].badge}`}>
          <p className="text-sm font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {t(
                `Watch ${lifts.find((l) => l.id === summary.worstLift?.liftId)?.name ?? "highest lifts"} - ${summary.worstLift.reason}`,
                `${lifts.find((l) => l.id === summary.worstLift?.liftId)?.nameJa ?? lifts.find((l) => l.id === summary.worstLift?.liftId)?.name ?? "高所リフト"} 注意 - ${summary.worstLift.reason}`,
              )}
            </span>
          </p>
        </div>
      )}

      {/* Lift list */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden">
        {lifts.map((lift, idx) => {
          const pred = predictions[idx];
          const style = STATUS_STYLES[pred.status];
          const Icon = style.icon;
          const labelText = operating
            ? { en: style.label, ja: style.labelJa }
            : WIND_LABELS[pred.status];
          const isExpanded = expandedId === lift.id;
          return (
            <div key={lift.id} className={idx > 0 ? "border-t border-border" : ""}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : lift.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left"
                aria-expanded={isExpanded}
                aria-controls={`${headingId}-detail-${lift.id}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {t(lift.name, lift.nameJa ?? lift.name)}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {t(TYPE_LABEL[lift.type].en, TYPE_LABEL[lift.type].ja)} ·{" "}
                      {lift.baseElevation}-{lift.topElevation}m
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {t(labelText.en, labelText.ja)}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </div>
              </button>

              {isExpanded && (
                <motion.div
                  id={`${headingId}-detail-${lift.id}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 pb-4 -mt-1 bg-secondary/20"
                >
                  <span
                    className={`sm:hidden inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-3 ${style.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {t(labelText.en, labelText.ja)}
                  </span>
                  <p className="text-sm text-foreground">
                    {operating ? pred.reason : windDetail(pred, t)}
                  </p>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] tabular-nums">
                    <div>
                      <p className="text-muted-foreground/70 uppercase tracking-wider">{t("Confidence", "信頼度")}</p>
                      <p className="font-semibold text-foreground mt-0.5">{Math.round(pred.confidence * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/70 uppercase tracking-wider">{t("Threshold", "しきい値")}</p>
                      <p className="font-semibold text-foreground mt-0.5">{pred.effectiveThresholdKmh}km/h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/70 uppercase tracking-wider">{t("Hours at risk", "警戒時間")}</p>
                      <p className="font-semibold text-foreground mt-0.5">{pred.hoursAtRisk}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground/70 uppercase tracking-wider">{t("Exposure", "曝露")}</p>
                      <p className="font-semibold text-foreground mt-0.5 capitalize">
                        {lift.exposure.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/70 mt-3 flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>
          {t(
            "Predictions only - lift operation depends on resort decisions. Always check resort site before driving.",
            "予測のみ - リフトの運行は各スキー場の判断によります。出発前に必ず公式サイトをご確認ください。",
          )}
        </span>
      </p>
    </section>
  );
}
