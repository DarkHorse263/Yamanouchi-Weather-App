/**
 * First-party engagement pings · POST /api/engagement/ping.
 *
 * Cookieless aggregate counting for the owner's admin dashboard (real
 * visitor + page-view totals for partner conversations). Sends ONLY a
 * coarse section label - never the full URL, never any identifier - so it
 * is an anonymous tally and, like the promo counter, NOT consent-gated.
 * Fire-and-forget: failures are irrelevant to the visitor.
 */

function ping(body: Record<string, string>): void {
  try {
    void fetch(`${import.meta.env.BASE_URL}api/engagement/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* noop */
  }
}

/**
 * Collapse a route path into a coarse section label:
 *   "/"                      → "home"
 *   "/snowy-mountains/..."   → "snowy-mountains" (region pages)
 *   "/plan", "/premium", ... → their own label
 *   "/admin..."              → not counted (owner traffic isn't engagement)
 */
export function pageLabelFor(path: string): string | null {
  const clean = path.split(/[?#]/)[0] || "/";
  if (clean === "/") return "home";
  const first = clean.split("/").filter(Boolean)[0] ?? "";
  if (!first || first === "admin") return null;
  return first.toLowerCase().slice(0, 40);
}

let lastPinged = "";

export function pingPageView(path: string): void {
  const page = pageLabelFor(path);
  if (!page) return;
  // Dedupe immediate repeats of the SAME path (trailing-slash rewrites,
  // query/state-only navigations) so one screen isn't double-counted, while
  // still counting moves between pages inside the same section.
  const key = (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  if (key === lastPinged) return;
  lastPinged = key;
  ping({ kind: "view", page });
}

export function pingPwaEvent(kind: "pwa_install" | "pwa_launch"): void {
  ping({ kind });
}
