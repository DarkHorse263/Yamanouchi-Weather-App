import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Provider-agnostic consent context. Tracks the user's choices for tracking
 * categories so any later integration (Google Analytics, AdSense, Mediavine,
 * Meta Pixel, etc.) can ask `useConsent()` before firing.
 *
 * Categories follow the IAB TCF v2.2 / GDPR convention:
 *   - `necessary` — always true; cookies required for core functionality
 *   - `analytics` — first-party analytics (PostHog, GA, Plausible)
 *   - `ads` — third-party advertising and personalisation
 *
 * Decision is persisted to localStorage with a schema version, so we can
 * re-prompt users if our cookie/ads policy materially changes.
 */

const STORAGE_KEY = "feelzlike.consent.v1";

export interface ConsentChoices {
  necessary: true;
  analytics: boolean;
  ads: boolean;
  /** ISO timestamp the choice was recorded. */
  decidedAt: string;
}

export interface ConsentApi {
  choices: ConsentChoices | null;
  hasDecided: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setChoices: (next: { analytics: boolean; ads: boolean }) => void;
  reopen: () => void;
}

const ConsentContext = createContext<ConsentApi | null>(null);

function load(): ConsentChoices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      ads: !!parsed.ads,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function save(choices: ConsentChoices) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
  } catch {
    /* storage disabled — silently no-op, banner will reappear next visit */
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [choices, setStateChoices] = useState<ConsentChoices | null>(() => load());

  // Multi-tab sync: if the consent choice changes (set, updated, or cleared)
  // in another tab, mirror it into this tab's state so all open windows agree
  // on what tracking is allowed. This matters for ad/analytics gating —
  // without it a user could revoke consent in one tab and continue to be
  // tracked in another.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setStateChoices(load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const acceptAll = useCallback(() => {
    const next: ConsentChoices = { necessary: true, analytics: true, ads: true, decidedAt: new Date().toISOString() };
    save(next);
    setStateChoices(next);
  }, []);

  const rejectAll = useCallback(() => {
    const next: ConsentChoices = { necessary: true, analytics: false, ads: false, decidedAt: new Date().toISOString() };
    save(next);
    setStateChoices(next);
  }, []);

  const setChoices = useCallback((partial: { analytics: boolean; ads: boolean }) => {
    const next: ConsentChoices = { necessary: true, ...partial, decidedAt: new Date().toISOString() };
    save(next);
    setStateChoices(next);
  }, []);

  const reopen = useCallback(() => setStateChoices(null), []);

  const api = useMemo<ConsentApi>(
    () => ({
      choices,
      hasDecided: choices !== null,
      acceptAll,
      rejectAll,
      setChoices,
      reopen,
    }),
    [choices, acceptAll, rejectAll, setChoices, reopen],
  );

  return <ConsentContext.Provider value={api}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentApi {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used inside <ConsentProvider>");
  return ctx;
}

/**
 * Convenience helper for downstream integrations:
 *   if (canUseAds(consent.choices)) loadAdNetwork();
 */
export function canUseAnalytics(choices: ConsentChoices | null): boolean {
  return !!choices && choices.analytics;
}

export function canUseAds(choices: ConsentChoices | null): boolean {
  return !!choices && choices.ads;
}

// Re-export the storage key for tests / debugging
export const CONSENT_STORAGE_KEY = STORAGE_KEY;
