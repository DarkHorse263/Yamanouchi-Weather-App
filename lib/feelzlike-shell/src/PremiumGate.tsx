import type { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "./usePremium";
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
  /** Optional CTA target (e.g. /pricing). When omitted, button is a no-op. */
  ctaHref?: string;
  /** Tight variant collapses the blurred preview - use inside small panels. */
  tight?: boolean;
}

/**
 * Wraps premium content with a teaser lock screen for free users and
 * passes through children for premium users. Payment integration is not
 * yet wired - the unlock flow is stubbed via `usePremium`.
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

  return (
    <div className="relative rounded-3xl border border-border bg-white overflow-hidden">
      {/* Blurred peek of the real content underneath */}
      <div
        aria-hidden
        className={tight ? "max-h-32 overflow-hidden" : "max-h-72 overflow-hidden"}
        style={{ filter: "blur(10px)", opacity: 0.55 }}
      >
        <div className="pointer-events-none select-none">{children}</div>
      </div>

      {/* Lock overlay */}
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
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            {t("Start free trial", "無料トライアル開始")}
          </a>
          <p className="text-[11px] text-muted-foreground/70 mt-2.5">
            {t(
              "Monthly subscription · seasonal pass coming soon",
              "月額プラン・シーズンパスは近日公開",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
