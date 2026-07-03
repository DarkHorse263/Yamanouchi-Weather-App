// ─────────────────────────────────────────────────────────────────────────────
// ga.ts - Google Analytics 4 (gtag.js) loader, consent-gated.
//
// WHY THIS EXISTS
// feelzlike uses GA4 for first-party product analytics (page views, aggregate
// usage). GA4 is loaded lazily in the browser only after the visitor grants the
// `analytics` consent category, so it never runs for people who decline.
//
// CONFIG
//   The GA4 Measurement ID (G-XXXXXXXXXX) ships in every visitor's browser, so
//   it is public config, not a secret. It defaults to the property below and can
//   be overridden per-environment with VITE_GA_MEASUREMENT_ID (e.g. a separate
//   staging property). When neither is a valid G- id, every function is a safe
//   no-op (nothing loads).
//
// CONSENT
//   GA sets analytics cookies, so it must only load once the visitor has granted
//   the `analytics` consent category (see lib/consent). This module does NOT
//   check consent itself - callers must gate it:
//     if (canUseAnalytics(consent.choices)) loadGa();
//     else disableGa();
//
// PRIVACY
//   Page views are sent with the querystring + hash stripped, because alert
//   links carry HMAC tokens (?token=...) that must never reach GA (this mirrors
//   the Sentry breadcrumb rule in lib/analytics + App.tsx). IPs are anonymised.
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Default GA4 property for feelzlike. Public config (it ships in the HTML), so
// it lives in source rather than a secret. Override per-environment with
// VITE_GA_MEASUREMENT_ID if you ever want a separate staging property.
const DEFAULT_MEASUREMENT_ID = "G-LPLBGHCFZV";

// Read from import.meta.env defensively (works in Vite dev/build; returns null
// in node/test env so this module can be imported without a dev server).
function readEnv(key: string): string | null {
  try {
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    const v = env?.[key];
    return typeof v === "string" && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

function isDev(): boolean {
  try {
    return (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
  } catch {
    return false;
  }
}

// GA4 Measurement IDs are "G-" followed by alphanumerics. We validate so a stray
// space or typo fails loudly in dev rather than silently loading a broken tag.
function readMeasurementId(): string | null {
  const raw = readEnv("VITE_GA_MEASUREMENT_ID") ?? DEFAULT_MEASUREMENT_ID;
  const id = raw.trim();
  if (!/^G-[A-Z0-9]+$/i.test(id)) {
    if (isDev()) {
      console.warn(
        `[ga] measurement id is not a valid G- id ("${raw}") - Google Analytics disabled.`,
      );
    }
    return null;
  }
  return id;
}

/** GA4 Measurement ID, or null when not configured / invalid. */
export const GA_MEASUREMENT_ID: string | null = readMeasurementId();

/** Whether GA is configured (a valid measurement id is set). */
export function gaConfigured(): boolean {
  return GA_MEASUREMENT_ID !== null;
}

// DOM id for the injected <script> so we never inject it twice.
const SCRIPT_ID = "ga-gtag";

// GA's documented per-property opt-out flag. Setting window[`ga-disable-<ID>`]
// to true makes gtag.js drop every hit, even if the script is already loaded ·
// this is how we honour a consent revoke within the same page lifetime.
function disableFlag(id: string): string {
  return `ga-disable-${id}`;
}

/**
 * Load gtag.js and initialise GA4, once. No-op when:
 *   - not in a browser (SSR / tests),
 *   - no valid measurement id configured,
 *   - the script is already present (just clears the opt-out flag).
 *
 * `send_page_view` is disabled so single-page-app route changes drive page
 * views manually via `gaPageView` · that lets us strip tokened querystrings and
 * avoids double-counting the landing page.
 *
 * IMPORTANT: callers MUST confirm `analytics` consent first · this does not.
 */
export function loadGa(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const id = GA_MEASUREMENT_ID;
  if (!id) return false;

  // Re-enable if a prior revoke set the opt-out flag this session.
  (window as unknown as Record<string, unknown>)[disableFlag(id)] = false;

  if (document.getElementById(SCRIPT_ID)) return true;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    // Canonical gtag stub · it MUST push the real `arguments` object. gtag.js
    // only treats Arguments-typed dataLayer entries as commands, so pushing a
    // plain array is silently ignored · GA would load but never initialise and
    // no hit would ever be sent.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  window.gtag("js", new Date());
  // send_page_view:false · SPA route changes drive page_view manually (see
  // gaPageView) so we can strip tokened querystrings and avoid double-counting
  // the landing page. page_location is pinned to origin + pathname · never the
  // raw href · so the AUTOMATIC hits gtag still sends (session_start,
  // first_visit, user_engagement) can never carry an alert link's ?token=...
  // HMAC. GA4 does not log or store IP addresses, so no UA-era anonymize_ip
  // flag is needed.
  window.gtag("config", id, {
    send_page_view: false,
    page_location: window.location.origin + window.location.pathname,
  });

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  return true;
}

/**
 * Best-effort teardown when the visitor revokes `analytics` consent: sets GA's
 * opt-out flag (so any already-loaded gtag.js stops sending hits immediately)
 * and removes the injected <script> so it won't re-run on a fresh load.
 */
export function disableGa(): void {
  if (typeof window === "undefined") return;
  const id = GA_MEASUREMENT_ID;
  if (!id) return;
  (window as unknown as Record<string, unknown>)[disableFlag(id)] = true;
  document.getElementById(SCRIPT_ID)?.remove();
}

/**
 * Send a single GA4 page_view for `path` (an app-relative path with the query
 * string + hash already stripped by the caller). We override page_location with
 * origin + pathname only · never the raw href · so tokened alert URLs
 * (?token=...) never reach GA. No-op until gtag is initialised.
 */
export function gaPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  const cleanLocation = window.location.origin + window.location.pathname;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: cleanLocation,
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}
