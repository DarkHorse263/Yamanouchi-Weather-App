import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
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
 * SOFT MEMBER GATE:
 * For signed-out visitors the premium section renders BLURRED (Aug 2026
 * owner request · content stays in the layout but is unreadable) and any
 * tap inside opens the account sign-up prompt instead of interacting.
 * Signed-in members pass straight through un-blurred while the host app's
 * premium access policy allows the feature.
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
  // usePremium's `isPremium` is true during the promo window for everyone
  // client-side · the lock decision here is purely "does this visitor have
  // an account".
  const previewUnlocked = isPreviewFlagSet();
  const open = access.isLoading || access.isAuthenticated || previewUnlocked;

  if (open) return <>{children}</>;

  const prompt = () => access.promptSignUp({ feature: title });

  return (
    <div className="relative">
      {/* Blurred for signed-out visitors · unreadable but the layout keeps
          its shape so the page doesn't jump. aria-hidden + inert keep the
          blurred controls away from screen readers and the tab order (the
          spread keeps `inert` compatible with React 18's prop types). */}
      <div
        className="blur-[6px] select-none opacity-90"
        aria-hidden="true"
        {...({ inert: true } as Record<string, boolean>)}
      >
        {children}
      </div>
      {/* Full-area invisible button · a tap anywhere on the blurred section
          opens the account sign-up prompt (inert children can't receive events,
          so this overlay carries the interaction instead). */}
      <button
        type="button"
        onClick={prompt}
        aria-label={`${title} · account required · sign up`}
        className="absolute inset-0 z-[5] cursor-pointer bg-transparent"
      />
      <button
        type="button"
        onClick={prompt}
        className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/25 transition"
      >
        <Sparkles className="w-3 h-3" />
        member access
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
