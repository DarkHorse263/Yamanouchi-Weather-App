import type { ReactNode, MouseEvent } from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePremium, setPremiumPreview } from "./usePremium";
import { useLanguage } from "./LanguageProvider";

interface PremiumGateProps {
  /** Title shown on the lock card. */
  title: string;
  titleJa?: string;
  /** One-line teaser explaining what the user gets. */
  blurb: string;
  blurbJa?: string;
  /** What's actually inside (rendered blurred when locked). */
  children: ReactNode;
  /** Optional CTA target (e.g. /pricing). When omitted, the trial flag is
   *  flipped on and the user stays on the same page. */
  ctaHref?: string;
  /** Tight variant renders a compact lock card with no blurred preview -
   *  use inside small panels (e.g. dashboard tiles) where the full
   *  overlay would clip the CTA on narrow viewports. */
  tight?: boolean;
}

/**
 * Wraps premium content with a teaser lock screen for free users and
 * passes through children for premium users.
 *
 * Dev/preview note: payments are not yet wired. Until Stripe is hooked
 * up, tapping "Start free trial" flips the local premium-preview flag
 * on so the user can test gated sections immediately. This keeps the
 * dev loop moving without requiring credentials. Once Stripe is live,
 * swap the click handler for a checkout redirect (see TODO below).
 */
export function PremiumGate({
  title,
  titleJa,
  blurb,
  blurbJa,
  children,
  ctaHref,
  tight,
}: PremiumGateProps) {
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  if (isPremium) return <>{children}</>;

  // TODO(payments): replace with checkout redirect once Stripe is wired.
  const startTrial = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!ctaHref) e.preventDefault();
    setPremiumPreview(true);
  };

  // ── Tight variant ──────────────────────────────────────────────
  // Compact, single-card lock used in narrow panels. No blurred backdrop
  // (which would force the absolutely-positioned overlay to overflow on
  // mobile and clip the CTA - the bug shown in the alerts dashboard tile).
  if (tight) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="byline text-primary inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> {t("Premium", "プレミアム")}
            </p>
            <h3 className="font-display font-semibold text-base text-foreground mt-0.5 leading-snug">
              {t(title, titleJa ?? title)}
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              {t(blurb, blurbJa ?? blurb)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={ctaHref ?? "#"}
                onClick={startTrial}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                {t("Start free trial", "無料トライアル開始")}
              </a>
              <p className="text-[11px] text-muted-foreground/70">
                {t("No card needed during preview", "プレビュー中はカード不要")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Default variant ────────────────────────────────────────────
  // Full-width card with a blurred peek of the locked content behind a
  // centred lock overlay. Used for large feature sections.
  return (
    <div className="relative rounded-3xl border border-border bg-white overflow-hidden">
      <div
        aria-hidden
        className="max-h-72 overflow-hidden"
        style={{ filter: "blur(10px)", opacity: 0.55 }}
      >
        <div className="pointer-events-none select-none">{children}</div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 via-white/85 to-white">
        <div className="text-center px-6 py-8 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <p className="byline text-primary inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> {t("Premium", "プレミアム")}
          </p>
          <h3 className="font-display font-semibold text-xl text-foreground mt-1.5">
            {t(title, titleJa ?? title)}
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {t(blurb, blurbJa ?? blurb)}
          </p>
          <a
            href={ctaHref ?? "#"}
            onClick={startTrial}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("Start free trial", "無料トライアル開始")}
          </a>
          <p className="text-[11px] text-muted-foreground/70 mt-2.5">
            {t(
              "No card needed during preview",
              "プレビュー中はカード不要",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
