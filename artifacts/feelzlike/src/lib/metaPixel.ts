// ─────────────────────────────────────────────────────────────────────────────
// metaPixel.ts - Meta (Facebook) Pixel loader, consent-gated.
//
// WHY THIS EXISTS
// feelzlike runs paid ads on Facebook / Instagram. The Meta Pixel lets Meta
// measure which ad clicks actually landed (PageView events), optimise ad
// delivery toward people who engage, and (later) build retargeting audiences.
// It is ADVERTISING technology, so unlike GA it is gated behind the `ads`
// consent category, not `analytics`.
//
// CONFIG
//   The Pixel ID ships in every visitor's browser, so it is public config, not
//   a secret. It defaults to the ad account's pixel below and can be overridden
//   per-environment with VITE_META_PIXEL_ID. When neither is a valid numeric
//   id, every function is a safe no-op (nothing loads).
//
// CONSENT
//   This module does NOT check consent itself - callers must gate it:
//     if (canUseAds(consent.choices)) loadMetaPixel();
//     else disableMetaPixel();
//   Revoke uses Meta's documented consent API (fbq('consent','revoke')) plus a
//   module flag so our own calls stop immediately within the page lifetime.
//
// PRIVACY · TOKEN SAFETY
//   fbevents.js reports the RAW window.location.href with every event and,
//   unlike gtag, offers no supported way to override it. Alert links carry
//   HMAC tokens (?token=...) that must never reach Meta. Two defences:
//     1. autoConfig is switched OFF before init, so the pixel sends NOTHING
//        automatically (no microdata scraping, no auto button-click events) -
//        the only network hits are our explicit metaPixelPageView() calls.
//     2. metaPixelPageView() refuses to fire while the current URL carries any
//        querystring param outside the closed campaign whitelist (utm_*, ad
//        click ids) - the same whitelist lib/ga.ts uses. Tokened pages simply
//        send no pixel hit at all.
// ─────────────────────────────────────────────────────────────────────────────

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

// Default pixel for the feelzlike ad account ("Navigate Work" pixel). Public
// config (it ships in the HTML), so it lives in source rather than a secret.
const DEFAULT_PIXEL_ID = "1385564256750667";

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

// Meta pixel ids are long numeric strings. Validate so a stray space or typo
// fails loudly in dev rather than silently initialising a broken pixel.
function readPixelId(): string | null {
  const raw = readEnv("VITE_META_PIXEL_ID") ?? DEFAULT_PIXEL_ID;
  const id = raw.trim();
  if (!/^\d{6,20}$/.test(id)) {
    if (isDev()) {
      console.warn(`[meta-pixel] pixel id is not numeric ("${raw}") - Meta Pixel disabled.`);
    }
    return null;
  }
  return id;
}

/** Meta Pixel ID, or null when not configured / invalid. */
export const META_PIXEL_ID: string | null = readPixelId();

/** Whether the pixel is configured (a valid id is set). */
export function metaPixelConfigured(): boolean {
  return META_PIXEL_ID !== null;
}

// DOM id for the injected <script> so we never inject it twice.
const SCRIPT_ID = "meta-pixel";

// Honours a consent revoke within the same page lifetime: fbevents.js cannot
// be unloaded once it has run, so every call site checks this flag and we also
// tell the pixel itself to stop (fbq('consent','revoke')).
let revoked = false;

// Whether fbq('init', id) has already run this page lifetime. A revoke →
// re-grant must NOT re-run init (duplicate-pixel warning, double-processed
// queue) · re-granting consent is enough.
let initialised = false;

// Same closed whitelist as lib/ga.ts campaignSafeLocation(): standard campaign
// params plus ad-network click ids. Any OTHER param in the address bar (the
// alert-link ?token=... HMAC, or anything future) makes the page unsafe for
// pixel hits, because fbevents reports the raw href and cannot be overridden.
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

function urlSafeForPixel(): boolean {
  try {
    for (const [key] of new URLSearchParams(window.location.search)) {
      if (!CAMPAIGN_PARAMS.has(key.toLowerCase())) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Install the fbq stub, disable Meta's automatic data collection, init the
 * pixel and inject fbevents.js - once. No-op when not in a browser, when no
 * valid pixel id is configured, or when already loaded (just re-grants
 * consent after a prior revoke).
 *
 * Does NOT send a PageView - route changes drive that via metaPixelPageView()
 * so tokened URLs can be skipped and the landing page is never double-counted.
 *
 * IMPORTANT: callers MUST confirm `ads` consent first · this does not.
 */
export function loadMetaPixel(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  const id = META_PIXEL_ID;
  if (!id) return false;

  // Re-enable if a prior revoke happened this session. If the pixel was
  // already initialised, re-granting consent is all that's needed · never
  // re-run init or re-inject the script.
  revoked = false;
  if (initialised || document.getElementById(SCRIPT_ID)) {
    window.fbq?.("consent", "grant");
    return true;
  }

  if (typeof window.fbq !== "function") {
    // Canonical Meta stub · like gtag it MUST queue the real `arguments`
    // object; fbevents.js replays the queue on load and ignores plain arrays.
    const stub = function (this: unknown) {
      if (stub.callMethod) {
        // eslint-disable-next-line prefer-rest-params
        stub.callMethod.apply(stub, arguments as unknown as unknown[]);
      } else {
        // eslint-disable-next-line prefer-rest-params
        stub.queue.push(arguments);
      }
    } as Fbq;
    stub.queue = [];
    stub.push = stub;
    stub.loaded = true;
    stub.version = "2.0";
    window.fbq = stub;
    window._fbq = stub;
  }

  // Order matters: consent + autoConfig must be set BEFORE init.
  // autoConfig OFF stops fbevents' automatic collection (microdata scraping,
  // SubscribedButtonClick events) so the only hits are our explicit calls -
  // this is the first half of the ?token= defence (see header).
  window.fbq("consent", "grant");
  window.fbq("set", "autoConfig", false, id);
  window.fbq("init", id);
  initialised = true;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  return true;
}

/**
 * Teardown when the visitor revokes `ads` consent: tells the pixel to stop
 * all cookie + network activity (Meta's documented consent API) and sets the
 * module flag so our own calls no-op. The <script> element is intentionally
 * LEFT in place · fbevents.js cannot be unloaded anyway, removing the tag
 * would make a same-session re-grant re-inject + re-init a duplicate pixel,
 * and a fresh page load never loads the pixel without consent (the loader
 * only runs on grant).
 */
export function disableMetaPixel(): void {
  if (typeof window === "undefined") return;
  revoked = true;
  if (typeof window.fbq === "function") window.fbq("consent", "revoke");
}

/**
 * Send a single PageView for the current route. No-op until the pixel is
 * initialised (i.e. until the visitor granted `ads` consent and
 * loadMetaPixel() ran), after a revoke, and - critically - while the address
 * bar carries any non-campaign querystring param (alert ?token=... links),
 * because fbevents reports the raw URL and cannot be told otherwise.
 */
export function metaPixelPageView(): void {
  if (typeof window === "undefined") return;
  if (revoked || !META_PIXEL_ID || typeof window.fbq !== "function") return;
  if (!urlSafeForPixel()) return;
  window.fbq("track", "PageView");
}
