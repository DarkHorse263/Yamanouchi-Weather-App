import { useEffect, useState } from "react";

/**
 * Premium subscription state. UI only for now · no payments wired.
 *
 * Three signals:
 *   - `isPremium`            true when the user has a paid sub OR the
 *                            local preview flag is set OR we are inside
 *                            the launch promo window.
 *   - `isPromoPeriod`        true while the launch promo is active. Gates
 *                            should let users through but show a "free
 *                            during launch · ends MMM D" pill so the
 *                            expectation is set.
 *   - `promoEndsAt`          Date | null · the launch promo end date.
 *   - `daysLeftInPromo`      whole days remaining (clamped at 0).
 *
 * Configure the promo window via the env var
 * `VITE_PREMIUM_PROMO_ENDS_AT` (ISO date string, e.g. "2026-07-24").
 * Leave it unset to disable the promo entirely.
 *
 * Demo / preview: set localStorage `feelzlike.premium.preview` to `1` to
 * flip every gated section into the unlocked view. Useful for screenshots
 * and walking the user through what subscribers will see before billing
 * is connected.
 *
 * Future: replace `readPreview()` with a real subscription lookup
 * (Stripe customer + active sub OR RevenueCat entitlement) and keep the
 * same `{ isPremium, isPromoPeriod, ... }` shape so callers don't change.
 */
const STORAGE_KEY = "feelzlike.premium.preview";

function readPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readPromoEndsAt(): Date | null {
  // Vite injects VITE_* vars at build time. Guard for SSR / non-vite.
  const raw =
    typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_PREMIUM_PROMO_ENDS_AT;
  if (!raw || typeof raw !== "string") return null;

  // Date-only "YYYY-MM-DD" is parsed by `new Date()` as UTC midnight, which
  // would silently end the promo hours early for users east of UTC (e.g.
  // AU promo ending Aug 1 would die at 10am Sydney on Jul 31). Detect the
  // date-only shape and treat it as LOCAL end-of-day (23:59:59.999) so the
  // promo runs "through the end of that day, user's clock".
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw.trim());
  if (dateOnly) {
    const [y, m, day] = raw.trim().split("-").map(Number);
    return new Date(y, m - 1, day, 23, 59, 59, 999);
  }

  // Full ISO timestamps (with explicit time + offset) are parsed as-is.
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d;
}

const PROMO_ENDS_AT = readPromoEndsAt();

function computePromoState(now: Date = new Date()): {
  isPromoPeriod: boolean;
  daysLeftInPromo: number;
  promoEndsAt: Date | null;
} {
  if (!PROMO_ENDS_AT) {
    return { isPromoPeriod: false, daysLeftInPromo: 0, promoEndsAt: null };
  }
  const msLeft = PROMO_ENDS_AT.getTime() - now.getTime();
  if (msLeft <= 0) {
    return { isPromoPeriod: false, daysLeftInPromo: 0, promoEndsAt: PROMO_ENDS_AT };
  }
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  return { isPromoPeriod: true, daysLeftInPromo: daysLeft, promoEndsAt: PROMO_ENDS_AT };
}

export interface PremiumState {
  isPremium: boolean;
  isPromoPeriod: boolean;
  daysLeftInPromo: number;
  promoEndsAt: Date | null;
}

export function usePremium(): PremiumState {
  const [preview, setPreview] = useState<boolean>(() => readPreview());
  const [promo, setPromo] = useState(() => computePromoState());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPreview(readPreview());
    };
    window.addEventListener("storage", onStorage);
    // Recompute the promo countdown once per hour so the pill stays accurate
    // for users with long-lived sessions.
    const t = window.setInterval(() => setPromo(computePromoState()), 60 * 60 * 1000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(t);
    };
  }, []);

  const isPremium = preview || promo.isPromoPeriod;

  return {
    isPremium,
    isPromoPeriod: promo.isPromoPeriod,
    daysLeftInPromo: promo.daysLeftInPromo,
    promoEndsAt: promo.promoEndsAt,
  };
}

export function setPremiumPreview(on: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    /* ignore */
  }
}
