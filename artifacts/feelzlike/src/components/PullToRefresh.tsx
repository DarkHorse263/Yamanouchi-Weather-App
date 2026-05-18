import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.5;
const SW_WAIT_MS = 2000;

/**
 * PullToRefresh
 *
 * Native-feeling pull-down gesture mounted at the app root. Only
 * fires when the page is already scrolled to the very top
 * (matches iPhone Mail / Twitter behaviour) so it never fights
 * normal scrolling.
 *
 * On release past the threshold:
 *   1. asks the registered service worker to check for a new build
 *      (`reg.update()`),
 *   2. waits up to SW_WAIT_MS for `controllerchange` (i.e. a fresh
 *      worker took over) so a newly-installed shell can swap in,
 *   3. hard-reloads the page so live data + the radar iframe also
 *      pick up the latest.
 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    const setPullBoth = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    const doRefresh = async () => {
      refreshingRef.current = true;
      setRefreshing(true);
      // Snap the indicator back so the spinner sits cleanly at the top
      // and the page doesn't feel frozen mid-pull while we work.
      setPullBoth(0);
      try {
        if (!("serviceWorker" in navigator)) {
          window.location.reload();
          return;
        }
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          window.location.reload();
          return;
        }
        // Subscribe BEFORE calling update() so a fast takeover can't fire
        // controllerchange before we're listening (race fix from review).
        const initialController = navigator.serviceWorker.controller;
        const waited = new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            navigator.serviceWorker.removeEventListener(
              "controllerchange",
              finish,
            );
            resolve();
          };
          navigator.serviceWorker.addEventListener("controllerchange", finish);
          window.setTimeout(finish, SW_WAIT_MS);
          // If the controller swapped between subscribe-time and now, bail
          // early so we don't wait the full timeout for an event that
          // already happened.
          if (
            navigator.serviceWorker.controller !== initialController &&
            navigator.serviceWorker.controller !== null
          ) {
            finish();
          }
        });
        await reg.update().catch(() => {});
        await waited;
      } catch {
        /* best-effort */
      }
      window.location.reload();
    };

    const isInsideEditable = (node: EventTarget | null): boolean => {
      let el = node as HTMLElement | null;
      while (el) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
        if (el.isContentEditable) return true;
        el = el.parentElement;
      }
      return false;
    };

    // Walk up from the touch target. If any ancestor is itself a
    // vertically-scrollable container that is NOT already at its top,
    // the user is mid-scroll inside that container · let it handle the
    // gesture instead of hijacking it for pull-to-refresh.
    const hasScrolledAncestor = (node: EventTarget | null): boolean => {
      let el = node as HTMLElement | null;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.scrollHeight > el.clientHeight) {
          const style = window.getComputedStyle(el);
          const oy = style.overflowY;
          if ((oy === "auto" || oy === "scroll") && el.scrollTop > 0) {
            return true;
          }
        }
        el = el.parentElement;
      }
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      if (isInsideEditable(e.target)) return;
      if (hasScrolledAncestor(e.target)) return;
      const t = e.touches[0];
      if (!t) return;
      startYRef.current = t.clientY;
      activeRef.current = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!activeRef.current || startYRef.current === null) return;
      const t = e.touches[0];
      if (!t) return;
      const dy = t.clientY - startYRef.current;
      if (dy <= 0) {
        if (pullRef.current !== 0) setPullBoth(0);
        return;
      }
      const dist = Math.min(MAX_PULL, dy * RESISTANCE);
      setPullBoth(dist);
      if (e.cancelable) e.preventDefault();
    };
    const onTouchEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      startYRef.current = null;
      if (pullRef.current >= THRESHOLD) {
        void doRefresh();
      } else {
        setPullBoth(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const visible = pull > 0 || refreshing;
  if (!visible) return null;
  const progress = Math.min(1, pull / THRESHOLD);
  const armed = pull >= THRESHOLD;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      style={{
        transform: `translateY(${Math.max(0, pull - 24)}px)`,
        transition: refreshing ? "none" : "none",
      }}
    >
      <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-slate-200">
        {refreshing || armed ? (
          <Loader2
            className={`h-4 w-4 text-sky-600 ${refreshing ? "animate-spin" : ""}`}
          />
        ) : (
          <ArrowDown
            className="h-4 w-4 text-slate-500"
            style={{
              transform: `rotate(${progress * 180}deg)`,
              transition: "transform 120ms ease",
            }}
          />
        )}
      </div>
    </div>
  );
}

export default PullToRefresh;
