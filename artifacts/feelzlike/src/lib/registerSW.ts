/**
 * Service worker registration. Called once from main.tsx after React mounts.
 *
 * The SW lives at `/sw.js` (registered against scope `/`). We only register
 * in production: in dev, vite's HMR + the SW's cache-first strategy fight
 * each other and you end up serving stale chunks after a code change.
 *
 * The SW itself (public/sw.js) implements push notifications AND offline
 * caching - see that file for the strategy table.
 *
 * In dev, we proactively UNREGISTER any SW from a previous prod build so
 * developers don't get bitten by a stale cache from yesterday's preview.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {
        /* noop - best-effort */
      });
    return;
  }

  // Defer registration until after first paint so we don't fight the
  // initial render for main-thread time.
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Auto-update flow: when the browser detects a new SW, the
        // installing worker fires `updatefound`. We tell it to skipWaiting
        // immediately so the next navigation gets the fresh shell.
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => {
        // Non-fatal - app still works without the SW. Surface to console
        // so prod issues are visible if a user reports trouble.
        // eslint-disable-next-line no-console
        console.warn("[sw] registration failed", err);
      });
  });
}

/** True when the page is rendering inside a home-screen-installed PWA. */
export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  // Modern: matchMedia. Legacy iOS: navigator.standalone.
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  // @ts-expect-error iOS-only legacy property - not in TS lib.
  const ios = window.navigator.standalone === true;
  return mq || ios;
}

/** True when the user is on iOS Safari (which doesn't fire beforeinstallprompt). */
export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}
