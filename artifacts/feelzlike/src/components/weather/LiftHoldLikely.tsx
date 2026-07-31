import { AlertTriangle, Cable, CheckCircle2, Wind } from "lucide-react";
import { useLanguage } from "@workspace/feelzlike-shell";
import { useUnits } from "@/components/auth/UserPrefsProvider";

interface Props {
  windSpeedKmh: number | null | undefined;
  gustKmh?: number | null | undefined;
  /**
   * Visual treatment.
   * - `light` (default) · pastel tinted card on a light page background
   *   (used by the generic Victoria's High Country mountain page).
   * - `dark` · translucent glass card with white-on-aurora text (used by
   *   the snowy-mountains aurora-fintech page where the surrounding
   *   sections all use the `glass` panel treatment).
   */
  variant?: "light" | "dark";
}

type Tone = "ok" | "caution" | "warn" | "alert";

interface Tier {
  tone: Tone;
  label: string;
  labelJa: string;
  detail: string;
  detailJa: string;
}

function classify(g: number): Tier {
  if (g >= 90) {
    return {
      tone: "alert",
      label: "wind-hold likely",
      labelJa: "運休の可能性大",
      detail: "gondolas and chairs likely closed",
      detailJa: "ゴンドラ・リフトとも運休の見込み",
    };
  }
  if (g >= 70) {
    return {
      tone: "warn",
      label: "chairs may hold",
      labelJa: "リフト運休の恐れ",
      detail: "exposed chairlifts at risk",
      detailJa: "稜線寄りのリフトに影響",
    };
  }
  if (g >= 50) {
    return {
      tone: "caution",
      label: "slow operations possible",
      labelJa: "減速運転の可能性",
      detail: "exposed lifts may slow",
      detailJa: "稜線寄りのリフトが減速の恐れ",
    };
  }
  return {
    tone: "ok",
    label: "all clear",
    labelJa: "通常運行",
    detail: "winds within operating limits",
    detailJa: "通常運行の範囲内",
  };
}

const TONE_LIGHT = {
  ok: {
    panel: "border-emerald-200 bg-white",
    chip: "bg-emerald-600",
    text: "text-slate-900",
    detail: "text-slate-600",
    Icon: CheckCircle2,
  },
  caution: {
    panel: "border-amber-300 bg-amber-50",
    chip: "bg-amber-600",
    text: "text-amber-900",
    detail: "text-amber-900/85",
    Icon: Wind,
  },
  warn: {
    panel: "border-orange-300 bg-orange-50",
    chip: "bg-orange-600",
    text: "text-orange-900",
    detail: "text-orange-900/85",
    Icon: AlertTriangle,
  },
  alert: {
    panel: "border-rose-300 bg-rose-50",
    chip: "bg-rose-600",
    text: "text-rose-900",
    detail: "text-rose-900/85",
    Icon: AlertTriangle,
  },
} as const;

const TONE_DARK = {
  ok: {
    panel: "glass border-emerald-400/40",
    chip: "bg-emerald-400",
    text: "text-white",
    detail: "text-slate-200",
    Icon: CheckCircle2,
  },
  caution: {
    panel: "glass border-amber-400/50",
    chip: "bg-amber-400",
    text: "text-amber-300",
    detail: "text-amber-100",
    Icon: Wind,
  },
  warn: {
    panel: "glass border-orange-400/60",
    chip: "bg-orange-400",
    text: "text-orange-300",
    detail: "text-orange-100",
    Icon: AlertTriangle,
  },
  alert: {
    panel: "glass border-rose-400/70",
    chip: "bg-rose-400",
    text: "text-rose-300",
    detail: "text-rose-100",
    Icon: AlertTriangle,
  },
} as const;

/**
 * Lift Hold Likely · a wind-driven prediction of whether exposed
 * chairlifts and gondolas are at risk of holding today. Uses gust
 * when available, falls back to sustained wind speed.
 *
 * Thresholds match the dashboard MountainSnapshot classifier:
 *   < 50 km/h  · all clear
 *   50-69      · slow operations possible
 *   70-89      · chairs may hold
 *   >= 90      · wind-hold likely
 */
export function LiftHoldLikely({
  windSpeedKmh,
  gustKmh,
  variant = "light",
}: Props) {
  const { t } = useLanguage();
  const u = useUnits();

  const wind = typeof windSpeedKmh === "number" ? windSpeedKmh : null;
  const gust = typeof gustKmh === "number" ? gustKmh : null;
  const driver = gust ?? wind;

  if (driver == null) return null;

  const tier = classify(driver);
  const palette = (variant === "dark" ? TONE_DARK : TONE_LIGHT)[tier.tone];
  const PaletteIcon = palette.Icon;
  const radius = variant === "dark" ? "rounded-3xl" : "rounded-2xl";

  return (
    <section
      className={`${variant === "dark" ? "" : "mt-4 "}${radius} border ${palette.panel} p-5`}
      aria-label={t("Lift hold likely overview", "リフト運休見込み")}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1.5 flex-none">
          <Cable
            className={`w-5 h-5 ${palette.text}`}
            strokeWidth={1.75}
          />
          <span className={`w-2 h-2 rounded-full ${palette.chip}`} aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="byline text-muted-foreground/70">
            {t("lift hold likely", "リフト運休見込み")}
          </p>
          <p
            className={`font-display font-semibold text-xl md:text-2xl tracking-tight mt-1 ${palette.text}`}
          >
            {t(tier.label, tier.labelJa)}
          </p>
          <p className={`text-sm mt-1 ${palette.detail}`}>
            {t(tier.detail, tier.detailJa)}
          </p>
        </div>

        <div className={`text-right flex-none ${palette.text}`}>
          <div className="inline-flex items-center gap-1.5">
            <PaletteIcon className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
            <span className="byline opacity-70">
              {gust != null ? t("gust", "突風") : t("wind", "風速")}
            </span>
          </div>
          <p className="font-display font-semibold text-3xl md:text-4xl tracking-tight leading-none mt-2 tabular-nums">
            {u.wind(driver)}
            <span className="text-sm opacity-70 ml-1">{u.windUnit}</span>
          </p>
          {gust != null && wind != null && (
            <p className="text-[11px] opacity-70 mt-1 tabular-nums">
              {t("avg", "平均")} {u.wind(wind)} {u.windUnit}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default LiftHoldLikely;
