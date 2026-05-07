// ─────────────────────────────────────────────────────────────────────────────
// reservationLinks.ts - provider-aware reservation deep-link builder.
//
// Curated `reservation_link` strings come in 3 shapes (real-world inventory
// across the 121-entry eat dataset, in order of frequency):
//   1. JP booking platforms (tabelog.com, tablecheck.com, hotpepper.jp)
//   2. `tel:` URIs (e.g. "tel:+61264561420") - common for AU pubs/restaurants
//      where the venue takes bookings by phone only
//   3. Direct restaurant URLs (e.g. "https://phasthai.com.au")
//
// Plus the AU-only surface for OpenTable / TheFork (none in the curated set
// today but they're the dominant AU platforms - included pre-emptively so
// they Just Work the day someone curates one in).
//
// POLICY (the playbook spec, locked here for the Eat page + EatCard detail
// sheet to consume):
//
//   • `reservation === "not_accepted"` → status="walk_in",   primary=null
//   • `reservation === "not_needed"`   → status="not_needed", primary=null
//   • Otherwise: build a ranked list of options
//       1. `reservation_link` → provider-detected (tabelog/tablecheck/…)
//       2. `phone` → `tel:${phone}` as a fallback "Call to reserve"
//       3. `website` is intentionally NOT a reservation channel - pages that
//          only carry a website (no reservation_link, no phone) are treated
//          as `status="unknown"` so the UI can fall back to a neutral
//          "See website" affordance via the existing card-level website link.
//   • The first option becomes `primary` and lights up the prominent CTA.
//   • De-dupe: if `reservation_link` is already a `tel:` URI matching
//     `phone`, we don't emit a second tel: option.
//
// CALLERS: TownEat (page-level "How to reserve" affordance), EatDetailSheet
// (large CTA in the sheet header - preferred over the compact EatCard
// ActionRow which uses a generic "Reserve" label for space reasons).
// ─────────────────────────────────────────────────────────────────────────────

import type { Eat } from "@/types/stayEat";

export type ReservationProvider =
  | "tabelog"
  | "hotpepper"
  | "tablecheck"
  | "opentable"
  | "thefork"
  | "official"
  | "phone";

export type ReservationStatus =
  | "reservable"
  | "walk_in"
  | "not_needed"
  | "unknown";

export interface ReservationOption {
  provider: ReservationProvider;
  url: string;
  label: string;
}

export interface ReservationLinks {
  /** Primary CTA (null when status !== "reservable"). */
  primary: ReservationOption | null;
  /** All available channels in priority order (always [] when not reservable). */
  all: readonly ReservationOption[];
  /** Coarse-grained reservation status for the UI to switch on. */
  status: ReservationStatus;
  /**
   * Human-readable summary of the status - safe to drop into a button or pill
   * regardless of status (e.g. "Reserve on Tabelog", "Walk-in only",
   * "No reservation needed", "See website").
   */
  statusLabel: string;
}

interface ProviderInfo {
  provider: ReservationProvider;
  label: string;
}

/**
 * Map a URL hostname → provider + display label. Hostnames are matched
 * via `endsWith` so subdomains (e.g. `s.tabelog.com`) and TLD variants
 * (`opentable.com.au`) are handled without special-casing.
 */
function detectUrlProvider(url: string): ProviderInfo {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return { provider: "official", label: "Book on official site" };
  }
  if (host.endsWith("tabelog.com")) return { provider: "tabelog", label: "Reserve on Tabelog" };
  if (host.endsWith("hotpepper.jp") || host.endsWith("hotpepper.com")) {
    return { provider: "hotpepper", label: "Reserve on Hotpepper" };
  }
  if (host.endsWith("tablecheck.com")) return { provider: "tablecheck", label: "Reserve on TableCheck" };
  if (host.endsWith("opentable.com") || host.endsWith("opentable.com.au")) {
    return { provider: "opentable", label: "Reserve on OpenTable" };
  }
  if (host.endsWith("thefork.com") || host.endsWith("thefork.com.au")) {
    return { provider: "thefork", label: "Reserve on TheFork" };
  }
  return { provider: "official", label: "Book on official site" };
}

/**
 * Strip everything from a phone string except `+` and digits, so a curated
 * `phone` of `"+61 2 6452 5489"` and a curated `reservation_link` of
 * `"tel:+61264525489"` can be compared for de-duplication.
 */
function normalizePhone(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[^\d+]/g, "");
}

/**
 * Build the reservation surface for an eat. Pure - never reads `Date.now()`
 * or `window`. Safe to call during render and in tests.
 */
export function buildReservationLinks(eat: Eat): ReservationLinks {
  const reservation = eat.reservation ?? null;

  if (reservation === "not_accepted") {
    return {
      primary: null,
      all: [],
      status: "walk_in",
      statusLabel: "Walk-in only",
    };
  }
  if (reservation === "not_needed") {
    return {
      primary: null,
      all: [],
      status: "not_needed",
      statusLabel: "No reservation needed",
    };
  }

  const options: ReservationOption[] = [];
  const seenUrls = new Set<string>();

  const link = eat.reservation_link?.trim() || null;
  const phone = eat.phone?.trim() || null;
  const phoneNorm = normalizePhone(phone);

  // 1) The curated reservation_link wins primacy.
  if (link) {
    if (link.toLowerCase().startsWith("tel:")) {
      // The link is itself a tel: URI - synthesise a phone option directly so
      // we don't double-emit later when we add `tel:${phone}`.
      const url = link;
      if (!seenUrls.has(url)) {
        options.push({ provider: "phone", url, label: "Call to reserve" });
        seenUrls.add(url);
      }
    } else {
      const info = detectUrlProvider(link);
      if (!seenUrls.has(link)) {
        options.push({ provider: info.provider, url: link, label: info.label });
        seenUrls.add(link);
      }
    }
  }

  // 2) Fallback / additional channel: tel:${phone}. De-dupe against any
  //    tel: already emitted via reservation_link.
  if (phoneNorm) {
    const telUrl = `tel:${phoneNorm}`;
    const alreadyHasTel = options.some(
      (o) => o.provider === "phone" && normalizePhone(o.url.replace(/^tel:/i, "")) === phoneNorm,
    );
    if (!alreadyHasTel && !seenUrls.has(telUrl)) {
      options.push({ provider: "phone", url: telUrl, label: "Call to reserve" });
      seenUrls.add(telUrl);
    }
  }

  if (options.length === 0) {
    return {
      primary: null,
      all: [],
      status: "unknown",
      statusLabel: "See website",
    };
  }

  return {
    primary: options[0],
    all: options,
    status: "reservable",
    statusLabel: options[0].label,
  };
}
