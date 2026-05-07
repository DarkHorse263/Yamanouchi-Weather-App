/**
 * Lightweight analytics layer over Sentry breadcrumbs.
 *
 * We deliberately don't ship a third-party analytics SDK (Plausible, GA,
 * PostHog) - that would mean another consent decision, another vendor, and
 * another network call on every page. Sentry is already loaded for crash
 * reporting; piggy-backing breadcrumbs on it gives us:
 *
 *   - free temporal context attached to every error report
 *   - no PII leaving the page (we generate an anon profile token in
 *     localStorage; no email, no IP-derived data)
 *   - zero additional bundle weight
 *
 * If/when we later want richer funnels we can pipe `track()` to a real
 * analytics backend - the call sites won't need to change.
 *
 * Consent: this layer respects the `analytics` choice from `lib/consent`.
 * When the user hasn't opted in, breadcrumbs are still added (Sentry
 * crashes need them for debugging), but no `setUser` call happens, so we
 * don't tie events to a stable identifier.
 */

import * as Sentry from "@sentry/react";

const PROFILE_TOKEN_KEY = "feelzlike:profileToken";

function newToken(): string {
  // Crypto-random 16 bytes → base36; ~25 chars, no PII.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Stable per-browser anonymous identifier. Lazily generated on first call. */
export function getProfileToken(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const existing = window.localStorage.getItem(PROFILE_TOKEN_KEY);
    if (existing) return existing;
    const t = newToken();
    window.localStorage.setItem(PROFILE_TOKEN_KEY, t);
    return t;
  } catch {
    return "no-storage";
  }
}

/**
 * Attach the anon profile token to the Sentry scope so every error report
 * is grouped per device. Idempotent - call from App on mount, plus after
 * the user grants analytics consent.
 *
 * Consent gating: when `analyticsConsent` is false we explicitly clear the
 * Sentry user (so any previously-set token is removed within the session)
 * and skip writing a stable identifier. Crash reports still flow - they
 * just won't be grouped per device.
 */
export function identifyAnonUser(opts: { analyticsConsent: boolean } = { analyticsConsent: false }): void {
  Sentry.setTag("analytics_consent", String(opts.analyticsConsent));
  if (!opts.analyticsConsent) {
    // Explicitly null out - covers the case where consent was previously
    // granted then revoked within the same page lifetime.
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: getProfileToken() });
}

/** The categories of events we track. Keep this list short; expand as needed. */
export type AnalyticsCategory =
  | "navigation"
  | "filter"
  | "view"
  | "affiliate"
  | "alert"
  | "weather"
  | "ui";

export interface TrackOptions {
  /** Bucket the event for filtering inside Sentry's breadcrumb panel. */
  category?: AnalyticsCategory;
  /** Arbitrary structured payload - keep keys snake_case, values primitive. */
  data?: Record<string, string | number | boolean | null | undefined>;
  /** "info" by default; bump to "warning" for soft errors worth surfacing. */
  level?: "info" | "warning" | "error";
}

/**
 * Record a user-meaningful event. Shows up in Sentry breadcrumbs and (when
 * a future analytics backend is wired) any registered listeners.
 *
 * Examples:
 *   track("filter_changed", { category: "filter", data: { facet: "vibe", value: "powder" } });
 *   track("affiliate_click", { category: "affiliate", data: { vendor: "booking", region: "snowy-mountains" } });
 */
export function track(name: string, options: TrackOptions = {}): void {
  Sentry.addBreadcrumb({
    category: options.category || "ui",
    message: name,
    level: options.level || "info",
    data: options.data,
    timestamp: Date.now() / 1000,
  });
}

/** Convenience wrapper for outbound link clicks (affiliates, third-party sites). */
export function trackOutbound(href: string, source: string): void {
  track("outbound_click", {
    category: "affiliate",
    data: { href, source, host: safeHost(href) },
  });
}

function safeHost(href: string): string | undefined {
  try { return new URL(href).host; } catch { return undefined; }
}
