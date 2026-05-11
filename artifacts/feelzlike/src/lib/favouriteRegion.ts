/**
 * Favourite-region persistence + landing auto-redirect.
 *
 * Per the Apr 2026 brief: a user with a favourite region should land
 * straight inside it on next visit, without an extra click. Implementation
 * notes:
 *
 * - Persistence is via `localStorage` so the favourite survives across
 *   sessions, devices being a non-goal here.
 * - To preserve the ability to *visit* the landing page (e.g. to switch
 *   regions or unfavourite), we set a `sessionStorage` skip-flag once we
 *   redirect. Subsequent navigations back to `/` in the same browser tab
 *   will then show the landing page normally - only a fresh tab/window
 *   will auto-redirect again.
 * - Reading + writing localStorage is wrapped in try/catch because Safari
 *   private mode + some embed contexts throw on access.
 */

const KEY = "feelzlike:favourite-region";
const SESSION_SKIP = "feelzlike:landing-visited";

/**
 * Allow-list of currently-live region IDs. The auto-redirect compares
 * against this so a stale localStorage entry from a renamed/removed
 * region doesn't bounce users to a broken slug. Keep in sync with the
 * region registry in `src/regions/index.ts`.
 */
const KNOWN_REGION_IDS = new Set(["snowy-mountains", "victorias-high-country", "yamanouchi"]);

export function isKnownRegionId(id: string | null | undefined): id is string {
  return typeof id === "string" && KNOWN_REGION_IDS.has(id);
}

export function readFavouriteRegion(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeFavouriteRegion(regionId: string | null): void {
  try {
    if (regionId) {
      localStorage.setItem(KEY, regionId);
    } else {
      localStorage.removeItem(KEY);
    }
    // Toggling the favourite means the user is on the landing page
    // intentionally - mark the session-skip so we don't bounce them out
    // immediately after they pin/unpin.
    markLandingVisited();
  } catch {
    /* swallow - non-fatal */
  }
}

/** Marks the current session as having visited landing - disables auto-redirect for the rest of the tab's life. */
export function markLandingVisited(): void {
  try {
    sessionStorage.setItem(SESSION_SKIP, "1");
  } catch {
    /* ignore */
  }
}

/** True if the current session has already visited landing (so we should *not* auto-redirect). */
export function landingAlreadyVisitedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_SKIP) === "1";
  } catch {
    return false;
  }
}
