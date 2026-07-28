// ─────────────────────────────────────────────────────────────────────────────
// ga.ts - Google Analytics 4 (gtag.js) loader, consent-gated.
//
// WHY THIS EXISTS
// feelzlike uses GA4 for first-party product analytics (page views, aggregate
// usage) via Consent Mode v2: gtag.js loads for EVERY visitor with all consent
// flags defaulted to denied. Decliners/undecideds send only anonymous,
// cookieless pings (no cookies, no client id) that GA4 uses to model true
// visitor totals; granting `analytics` upgrades to full measurement via
// gaConsentUpdate().
//
// CONFIG
//   The GA4 Measurement ID (G-XXXXXXXXXX) ships in every visitor's browser, so
//   it is public config, not a secret. It defaults to the property below and can
//   be overridden per-environment with VITE_GA_MEASUREMENT_ID (e.g. a separate
//   staging property). When neither is a valid G- id, every function is a safe
//   no-op (nothing loads).
//
// CONSENT
//   Consent Mode v2 (see above). This module does NOT read lib/consent itself ·
//   callers call loadGa() once, then gaConsentUpdate({analytics, ads}) whenever
//   the visitor's choices change (grant or revoke, mid-session included).
//
// PRIVACY
//   Page views are sent with the querystring + hash stripped, because alert
//   links carry HMAC tokens (?token=...) that must never reach GA (this mirrors
//   the Sentry breadcrumb rule in lib/analytics + App.tsx). IPs are anonymised.
//   EXCEPTION · a fixed whitelist of ad-campaign params (utm_*, click ids) IS
//   forwarded in page_location, because GA4 derives traffic attribution from
//   it · without them every Facebook/Google ad visit reports as "direct".
//   The whitelist is closed: anything not on it (tokens, emails) stays stripped.
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

// Closed whitelist of querystring params that may reach GA. These are the
// standard campaign-attribution params (Google's utm_* set) plus the ad-network
// click ids GA4 uses to join sessions to ad platforms. NOTHING else passes ·
// in particular the alert-link ?token=... HMAC and any future param are
// stripped by default.
const CAMPAIGN_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "wbraid",
  "gbraid",
  "fbclid",
  "msclkid",
  "ttclid",
]);

/**
 * origin + pathname plus ONLY whitelisted campaign params. This is what we
 * report to GA4 as page_location: attribution params survive (so ad traffic
 * is credited to the right campaign), tokened/unknown params never leave the
 * browser.
 */
function campaignSafeLocation(): string {
  const base = window.location.origin + window.location.pathname;
  try {
    const kept = new URLSearchParams();
    for (const [key, value] of new URLSearchParams(window.location.search)) {
      if (CAMPAIGN_PARAMS.has(key.toLowerCase())) kept.append(key, value);
    }
    const qs = kept.toString();
    return qs ? `${base}?${qs}` : base;
  } catch {
    return base;
  }
}

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
  // Consent Mode v2 defaults · everything DENIED until the visitor chooses.
  // This MUST be queued before `js`/`config`. With storage denied, gtag.js
  // sends only anonymous, cookieless pings (no client id, no device storage) ·
  // Google uses them to model totals for visitors who decline, so the visitor
  // count in GA4 stays honest without recognising anyone. An explicit grant
  // arrives later via gaConsentUpdate().
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  // send_page_view:false · SPA route changes drive page_view manually (see
  // gaPageView) so we can strip tokened querystrings and avoid double-counting
  // the landing page. page_location is pinned to origin + pathname + the
  // campaign-param whitelist · never the raw href · so the AUTOMATIC hits gtag
  // still sends (session_start, first_visit, user_engagement) carry ad
  // attribution but can never carry an alert link's ?token=... HMAC. GA4 does
  // not log or store IP addresses, so no UA-era anonymize_ip flag is needed.
  window.gtag("config", id, {
    send_page_view: false,
    page_location: campaignSafeLocation(),
  });

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  return true;
}

/**
 * Consent Mode v2 update · called whenever the visitor's cookie choices
 * change (grant OR revoke, including mid-session). `analytics` maps to
 * analytics_storage; `ads` maps to the three ad flags (Google-side ad
 * attribution for the whitelisted click ids). Revoking drops gtag back to
 * anonymous cookieless pings · the same state as never having accepted.
 */
export function gaConsentUpdate(opts: { analytics: boolean; ads: boolean }): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("consent", "update", {
    analytics_storage: opts.analytics ? "granted" : "denied",
    ad_storage: opts.ads ? "granted" : "denied",
    ad_user_data: opts.ads ? "granted" : "denied",
    ad_personalization: opts.ads ? "granted" : "denied",
  });
}

/**
 * Hard kill switch (opt-out flag + script removal). No longer used on consent
 * revoke · consent-mode `update` handles that while keeping anonymous counts ·
 * but kept for emergencies/tests.
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
 * string + hash already stripped by the caller). page_location is
 * origin + pathname + whitelisted campaign params only · never the raw href ·
 * so tokened alert URLs (?token=...) never reach GA while ad attribution
 * (utm_*, click ids) survives. No-op until gtag is initialised.
 */
export function gaPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: campaignSafeLocation(),
    page_title: typeof document !== "undefined" ? document.title : undefined,
  });
}

// GA4 event names must be <=40 chars, start with a letter, and contain only
// letters, numbers and underscores. Our names are controlled, but we normalise
// defensively so a stray space or casing never yields a dropped/malformed event.
function normaliseEventName(name: string): string | null {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+/, "")
    .slice(0, 40);
  return /^[a-z][a-z0-9_]*$/.test(cleaned) ? cleaned : null;
}

/**
 * Send a GA4 custom event. `params` become event parameters · keep keys
 * snake_case, values primitive, and NEVER pass PII or tokened URLs. No-op until
 * gtag is initialised (i.e. until the visitor has granted `analytics` consent
 * and loadGa() has run), so callers don't need to check consent themselves.
 *
 * `page_view` is intentionally ignored here: route-change page views are sent by
 * gaPageView (which strips tokened querystrings), so forwarding a `page_view`
 * from the generic track() layer would double-count.
 */
export function gaEvent(
  name: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): void {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;
  if (name === "page_view") return;
  const eventName = normaliseEventName(name);
  if (!eventName) return;
  window.gtag("event", eventName, params ?? {});
}
