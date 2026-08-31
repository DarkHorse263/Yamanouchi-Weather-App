import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { X, BellRing, ArrowUpRight } from "lucide-react";
import { useLanguage, useRegion } from "@workspace/feelzlike-shell";
import { track } from "@/lib/analytics";
import { shouldCountImpression, IMPRESSION_MIN_RATIO } from "@/lib/promoImpression";
import { pingAlertFunnel } from "@/lib/engagement";

/**
 * First-party funnel ping · anonymous aggregate counter for the admin Stats
 * tab (no cookie, no profile token, no identifier of any kind is sent, so
 * this is not consent-gated the way the GA mirror inside track() is).
 * Fire-and-forget: failures are irrelevant to the visitor.
 */
function pingPromoCounter(event: "shown" | "clicked" | "dismissed"): void {
  try {
    void fetch(`${import.meta.env.BASE_URL}api/promo/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
      keepalive: true, // survives the navigation on "clicked"
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

/**
 * AlertPromoBanner · a small dismissible inline card inviting the visitor to
 * subscribe to free snow-alert emails. Shown on forecast/weather pages only
 * (never the landing page), once per visitor: dismissing it persists in
 * localStorage and it never reappears on that device.
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
  const [dismissed, setDismissed] = useState(readDismissed);
  const visible = !dismissed;

  // Impression event · fired once per page view, but only when the banner
  // actually scrolls INTO VIEW (>=half visible). It used to fire on mount,
  // which over-counted badly: the banner sits below the fold on both weather
  // and mountain pages, so "shown" counted page loads, not people who saw it
  // (47 shown / 0 clicked / 0 dismissed in prod was mount-counting, not a
  // broken counter). The ref guards StrictMode double-invocation; a fresh
  // page view remounts and can fire again — that's the funnel denominator.
  const shownRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!visible || shownRef.current) return;
    const el = rootRef.current;
    const fire = () => {
      if (shownRef.current) return;
      shownRef.current = true;
      track("alert_promo_shown", { category: "alert" });
      pingPromoCounter("shown");
      pingAlertFunnel("banner_shown", "banner");
    };
    // Ancient browsers without IntersectionObserver: keep the old mount count
    // rather than silently counting nothing.
    if (!el || typeof IntersectionObserver === "undefined") {
      fire();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        // threshold alone isn't enough: observers also deliver an initial
        // entry (and boundary-cross entries) below the threshold, so
        // shouldCountImpression re-checks the ratio itself.
        if (shouldCountImpression(entries)) {
          fire();
          io.disconnect();
        }
      },
      { threshold: IMPRESSION_MIN_RATIO },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
    track("alert_promo_dismissed", { category: "alert" });
    pingPromoCounter("dismissed");
    pingAlertFunnel("banner_dismissed", "banner");
  };

  return (
    <div ref={rootRef} className="mt-4 rounded-2xl border border-primary/25 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="byline text-primary uppercase">{t("powder alerts", "降雪アラート")}</p>
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
            {t(
              "get emailed when a dump is coming · set your own snow threshold",
              "まとまった降雪の前にメールでお知らせ · しきい値は自由に設定",
            )}
          </p>
          <Link
            href={`~/${region.id}/alerts`}
            onClick={() => {
              track("alert_promo_clicked", { category: "alert" });
              pingPromoCounter("clicked");
              pingAlertFunnel("banner_clicked", "banner");
            }}
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
