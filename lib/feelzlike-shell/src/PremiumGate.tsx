import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { usePremium } from "./usePremium";
import { usePremiumAccess } from "./PremiumAccess";

interface PremiumGateProps {
  /** Title shown on the lock card (kept for call-site compatibility). */
  title: string;
  titleJa?: string;
  /** One-line teaser explaining what the user gets (call-site compatibility). */
  blurb: string;
  blurbJa?: string;
  /** What's actually inside · rendered visible either way. */
  children: ReactNode;
  /** Optional CTA target (kept for call-site compatibility). */
  ctaHref?: string;
  /** Tight variant flag (kept for call-site compatibility). */
  tight?: boolean;
}

/**
 * SOFT MEMBER GATE (Japan-season sign-ups, Nov/Dec 2026 run-up):
 * Premium sections stay fully VISIBLE for everyone · no blur, no hard wall ·
 * but for signed-out visitors any tap inside the section opens the free
 * sign-up prompt instead of interacting. Signed-in members (free accounts ·
 * every premium feature is free until the promo ends) pass straight through.
 *
 * The gate never prompts on its own · only on an explicit tap · so a visitor
 * who just reads the page is never interrupted.
 *
 * Auth state comes from `PremiumAccessProvider` (wired by the host app). If
 * no provider is mounted the gate passes children through unchanged, and it
 * also stays open while auth is still loading and when the local premium
 * preview flag (`setPremiumPreview`) is set.
 */
export function PremiumGate({ title, children }: PremiumGateProps) {
  const access = usePremiumAccess();
  const { isPromoPeriod, promoEndsAt } = usePremium();

  // usePremium's `isPremium` is true during the promo window for everyone
  // client-side · the lock decision here is purely "does this visitor have
  // an account".
  const previewUnlocked = isPreviewFlagSet();
  const open = access.isLoading || access.isAuthenticated || previewUnlocked;

  if (open) return <>{children}</>;

  const prompt = () => access.promptSignUp({ feature: title });

  return (
    <div className="relative">
      <div
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prompt();
        }}
        onSubmitCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prompt();
        }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={prompt}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/25 transition"
      >
        <Sparkles className="w-3 h-3" />
        {isPromoPeriod && promoEndsAt
          ? `free with account · until ${promoEndsAt.toLocaleDateString("en-AU", { day: "numeric", month: "short" }).toLowerCase()}`
          : "free with account"}
      </button>
    </div>
  );
}

function isPreviewFlagSet(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("feelzlike.premium.preview") === "1";
  } catch {
    return false;
  }
}
