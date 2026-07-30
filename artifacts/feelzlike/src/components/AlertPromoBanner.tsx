import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { X, BellRing, ArrowUpRight } from "lucide-react";
import { useLanguage, useRegion, useOptionalSeason } from "@workspace/feelzlike-shell";
import { track } from "@/lib/analytics";

/**
 * AlertPromoBanner · a small dismissible inline card inviting the visitor to
 * subscribe to free snow-alert emails. Shown on forecast/weather pages only
 * (never the landing page), once per visitor: dismissing it persists in
 * localStorage and it never reappears on that device.
 *
 * Hidden in green season - powder alerts are snow-only (mirrors the alerts
 * tile on TownHome).
 *
 * Dismissal is a cooldown, not forever: we store the dismissal timestamp and
 * the banner becomes eligible again after 14 days - conditions change enough
 * in two weeks that the reminder reads fresh rather than naggy. Legacy "1"
 * values (pre-cooldown format) are treated as dismissed-now.
 */

const DISMISSED_KEY = "feelzlike:alertPromoDismissedAt";
const LEGACY_DISMISSED_KEY = "feelzlike:alertPromoDismissed";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

function readDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    if (raw) {
      const at = Number(raw);
      // Unparseable value → treat as dismissed-now rather than re-nagging.
      if (!Number.isFinite(at)) return true;
      return Date.now() - at < COOLDOWN_MS;
    }
    // Migrate the original boolean key: treat as dismissed-now so existing
    // dismissers get the full cooldown before the banner returns.
    if (window.localStorage.getItem(LEGACY_DISMISSED_KEY) === "1") {
      window.localStorage.removeItem(LEGACY_DISMISSED_KEY);
      window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    /* noop - private mode etc. */
  }
}

export function AlertPromoBanner() {
  const { t } = useLanguage();
  const { region } = useRegion();
  const seasonCtx = useOptionalSeason();
  const [dismissed, setDismissed] = useState(readDismissed);

  // Snow-only feature · hide when the region is in green season.
  const isGreen = region.seasons && seasonCtx?.season === "green";
  const visible = !dismissed && !isGreen;

  // Impression event · fired once per page view (mount), only when the banner
  // actually renders. The ref guards against StrictMode double-invocation and
  // re-renders; a fresh page view remounts the component and fires again,
  // which is exactly the "shown" denominator the funnel wants.
  const shownRef = useRef(false);
  useEffect(() => {
    if (visible && !shownRef.current) {
      shownRef.current = true;
      track("alert_promo_shown", { category: "alert" });
    }
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
    track("alert_promo_dismissed", { category: "alert" });
  };

  return (
    <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="byline text-primary uppercase">{t("free snow alerts", "無料降雪アラート")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
            {t(
              "get emailed when a dump is coming · set your own snow threshold",
              "まとまった降雪の前にメールでお知らせ · しきい値は自由に設定",
            )}
          </p>
          <Link
            href={`~/${region.id}/alerts`}
            onClick={() => track("alert_promo_clicked", { category: "alert" })}
            className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            {t("set up alerts", "アラートを設定")}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("Dismiss alerts prompt", "アラート案内を閉じる")}
          className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
