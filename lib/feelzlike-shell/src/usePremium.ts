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
 * Falls back to the launch promo default below if unset. Set the var to
 * an empty string to disable the promo entirely.
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

import { DEFAULT_PROMO_STARTS_AT, DEFAULT_PROMO_ENDS_AT } from "@workspace/promo-constants";

function readPreview(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Parse a promo boundary date.
 * - `kind="start"` → date-only resolves to LOCAL midnight (promo opens at the
 *   start of that day, user's clock).
 * - `kind="end"`   → date-only resolves to LOCAL end-of-day (promo runs
 *   through the end of that day, user's clock).
 *
 * Date-only "YYYY-MM-DD" would otherwise be parsed by `new Date()` as UTC
 * midnight, which would silently flip the boundary hours early for users east
 * of UTC. Full ISO timestamps (with explicit time + offset) are parsed as-is.
 */
function parsePromoBoundary(raw: string, kind: "start" | "end"): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  if (dateOnly) {
    const [y, m, day] = trimmed.split("-").map(Number);
    return kind === "end"
      ? new Date(y, m - 1, day, 23, 59, 59, 999)
      : new Date(y, m - 1, day, 0, 0, 0, 0);
  }
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return d;
}

function readBoundary(
  envKey: string,
  defaultVal: string,
  kind: "start" | "end",
): Date | null {
  // Vite injects VITE_* vars at build time. Guard for SSR / non-vite.
  // Falls back to default if the var is undefined; treat an explicit empty
  // string as "boundary disabled".
  const envVal =
    typeof import.meta !== "undefined"
      ? (import.meta as any)?.env?.[envKey]
      : undefined;
  const raw = envVal === undefined ? defaultVal : envVal;
  return parsePromoBoundary(raw, kind);
}

const PROMO_STARTS_AT = readBoundary(
  "VITE_PREMIUM_PROMO_STARTS_AT",
  DEFAULT_PROMO_STARTS_AT,
  "start",
);
const PROMO_ENDS_AT = readBoundary(
  "VITE_PREMIUM_PROMO_ENDS_AT",
  DEFAULT_PROMO_ENDS_AT,
  "end",
);

interface PromoState {
  isPromoPeriod: boolean;
  isPromoUpcoming: boolean;
  daysLeftInPromo: number;
  promoStartsAt: Date | null;
  promoEndsAt: Date | null;
}

function computePromoState(now: Date = new Date()): PromoState {
  const base = {
    isPromoPeriod: false,
    isPromoUpcoming: false,
    daysLeftInPromo: 0,
    promoStartsAt: PROMO_STARTS_AT,
    promoEndsAt: PROMO_ENDS_AT,
  };
  if (!PROMO_ENDS_AT) return base;
  // Not started yet → upcoming.
  if (PROMO_STARTS_AT && now.getTime() < PROMO_STARTS_AT.getTime()) {
    return { ...base, isPromoUpcoming: true };
  }
  const msLeft = PROMO_ENDS_AT.getTime() - now.getTime();
  if (msLeft <= 0) return base;
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  return { ...base, isPromoPeriod: true, daysLeftInPromo: daysLeft };
}

export interface PremiumState {
  isPremium: boolean;
  isPromoPeriod: boolean;
  isPromoUpcoming: boolean;
  daysLeftInPromo: number;
  promoStartsAt: Date | null;
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
    isPromoUpcoming: promo.isPromoUpcoming,
    daysLeftInPromo: promo.daysLeftInPromo,
    promoStartsAt: promo.promoStartsAt,
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
