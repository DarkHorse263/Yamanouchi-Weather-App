import type { ReactNode } from "react";

interface PremiumGateProps {
  /** Title shown on the lock card (kept for call-site compatibility). */
  title: string;
  titleJa?: string;
  /** One-line teaser explaining what the user gets (call-site compatibility). */
  blurb: string;
  blurbJa?: string;
  /** What's actually inside · rendered straight through while premium is off. */
  children: ReactNode;
  /** Optional CTA target (kept for call-site compatibility). */
  ctaHref?: string;
  /** Tight variant flag (kept for call-site compatibility). */
  tight?: boolean;
}

/**
 * PREMIUM HIDDEN UNTIL TRACTION (June 2026):
 * Premium is temporarily switched off across the app while we build an
 * audience. This gate now passes its children straight through for every
 * user · no lock card, no "free during launch" pill, no upgrade CTA · so
 * every gated section renders as a normal free feature.
 *
 * The full prop shape is kept so the (many) call sites don't change. To
 * re-enable premium, restore the gating body from git history · the prior
 * version read usePremium() and rendered the blurred lock card / promo pill
 * for non-premium users, and let subscribers (or promo-period users)
 * through.
 */
export function PremiumGate({ children }: PremiumGateProps) {
  return <>{children}</>;
}
