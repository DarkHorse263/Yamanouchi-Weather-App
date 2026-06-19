// ─────────────────────────────────────────────────────────────────────────────
// awin.ts - Awin affiliate-network MasterTag loader.
//
// WHY THIS EXISTS
// feelzlike earns affiliate commission through Awin (awin.com). Awin's
// "MasterTag" is a single JS snippet that, once you've been approved for
// advertisers and switched on Convert-a-Link in the Awin dashboard,
// automatically rewrites outbound links to those advertisers into tracked,
// commission-earning links - with no per-link work in the app.
//
// CONFIG
//   Set VITE_AWIN_PUBLISHER_ID to your Awin publisher (account) id - the number
//   shown in your Awin dashboard. The MasterTag URL is
//   https://www.dwin1.com/{publisherId}.js and loads in every visitor's
//   browser, so the id is public config, not a secret.
//   When the id is unset, every function here is a safe no-op (nothing loads).
//
// CONSENT
//   The MasterTag sets advertising/marketing cookies, so it must only load once
//   the visitor has granted the `ads` consent category (see lib/consent).
//   This module does NOT check consent itself - callers must gate it:
//     if (canUseAds(consent.choices)) loadAwinMasterTag();
//     else removeAwinMasterTag();
// ─────────────────────────────────────────────────────────────────────────────

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

// Awin publisher (account) ids are numeric. We trim + validate so a stray
// space or typo fails loudly in dev rather than silently building a broken
// MasterTag URL (https://www.dwin1.com/{id}.js) that loads nothing and earns
// nothing.
function readPublisherId(): string | null {
  const raw = readEnv("VITE_AWIN_PUBLISHER_ID");
  if (raw === null) return null;
  const id = raw.trim();
  if (!/^\d+$/.test(id)) {
    if (isDev()) {
      console.warn(
        `[awin] VITE_AWIN_PUBLISHER_ID is not a numeric id ("${raw}") - MasterTag disabled.`,
      );
    }
    return null;
  }
  return id;
}

/** Awin publisher (account) id, or null when not configured / invalid. */
export const AWIN_PUBLISHER_ID: string | null = readPublisherId();

/** Whether Awin is configured (a publisher id is set). */
export function awinConfigured(): boolean {
  return AWIN_PUBLISHER_ID !== null;
}

// DOM id for the injected <script> so we never inject it twice.
const SCRIPT_ID = "awin-mastertag";

/**
 * Inject the Awin MasterTag into <head>, once. No-op when:
 *   - not in a browser (SSR / tests),
 *   - no publisher id configured,
 *   - the script is already present.
 *
 * Returns true if the tag is present (just injected or already there), false
 * if it could not be loaded.
 *
 * IMPORTANT: callers MUST confirm `ads` consent first - this does not.
 */
export function loadAwinMasterTag(): boolean {
  if (typeof document === "undefined") return false;
  const id = AWIN_PUBLISHER_ID;
  if (!id) return false;
  if (document.getElementById(SCRIPT_ID)) return true;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.type = "text/javascript";
  script.src = `https://www.dwin1.com/${encodeURIComponent(id)}.js`;
  document.head.appendChild(script);
  return true;
}

/**
 * Best-effort teardown when the visitor revokes `ads` consent: removes the
 * injected <script> so it won't re-run on a fresh load. Note that cookies the
 * MasterTag already set are not cleared here - a full revoke takes effect on the
 * next page load, when the tag is simply never injected.
 */
export function removeAwinMasterTag(): void {
  if (typeof document === "undefined") return;
  document.getElementById(SCRIPT_ID)?.remove();
}

/**
 * Config status, mirroring `affiliateStatus()` in affiliateLinks.ts.
 *   "active"  - a publisher id is set; the MasterTag will load (with consent).
 *   "pending" - no publisher id yet; links still work but don't earn.
 */
export function awinStatus(): "active" | "pending" {
  return awinConfigured() ? "active" : "pending";
}
