import type { NewsItem } from "@/data/news";

/**
 * Fire-and-forget click telemetry for news cards. Uses navigator.sendBeacon
 * so the request survives the page unload that follows clicking an outbound
 * link. Falls back to fetch with keepalive on browsers without sendBeacon.
 *
 * Never blocks navigation, never throws.
 */
export function trackNewsClick(item: NewsItem, regionId?: string | null): void {
  try {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    const url = `${base}/api/news/click`;
    const body = JSON.stringify({
      newsId: item.id,
      regionId: regionId ?? null,
      category: item.category,
      sponsored: !!item.sponsored,
      source: item.source,
      referrerHost: typeof window !== "undefined" ? window.location.pathname : null,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "include",
    }).catch(() => {});
  } catch {
    /* noop · tracking must never block a click */
  }
}
