// ─────────────────────────────────────────────────────────────────────────────
// cj.ts - CJ Affiliate (Commission Junction) deep-link builder.
//
// WHY THIS EXISTS
// Most of feelzlike's accommodation programmes (Booking.com, Agoda, Expedia,
// Hotels.com, Trip.com, ...) live on CJ, not Awin. Unlike Awin's MasterTag -
// which auto-rewrites any outbound link to an approved advertiser by domain
// (see lib/awin.ts) - CJ has NO drop-in "convert any link" tag for publishers.
// Every CJ tracking link must be built explicitly from:
//
//   PID  - your Publisher (Website) id. One per property, set via env. Public
//          config (it appears in every outbound link), not a secret.
//   AID  - an advertiser-specific Ad/Link id (8 digits). It only EXISTS once
//          you have been approved for that advertiser's programme on CJ, and
//          only works if the advertiser "allows URL redirects" (deep linking).
//
// The canonical CJ click URL is:
//   https://www.anrdoezrs.net/click-{PID}-{AID}?url={URL-ENCODED-DESTINATION}&sid={SUBID}
// (anrdoezrs.net / dpbolvw.net / tkqlhce.com / ... are interchangeable CJ
// redirect domains; the destination must be a page on the advertiser's domain.)
//
// IMPORTANT CONSEQUENCES
//   - You can only earn on advertisers you are APPROVED for. Wrapping a link to
//     an advertiser you are not joined to does NOT track (and may error), so we
//     only ever wrap advertisers listed in CJ_ADVERTISER_AIDS below. That map
//     starts EMPTY - until an entry is added, the Stay page serves the plain
//     OTA link exactly as before (no regression, no tracking, no breakage).
//   - A CJ-wrapped link points at a CJ domain (anrdoezrs.net), so Awin's
//     MasterTag will not also convert it - exactly one network handles each
//     merchant. Never give the same merchant both a CJ AID here AND a direct
//     Awin/affiliate id elsewhere.
//
// CONSENT
//   CJ click-throughs set affiliate/marketing cookies, so callers must only
//   build CJ links once the visitor has granted the `ads` consent category
//   (see lib/consent). This module does NOT check consent itself - the caller
//   gates it:  const href = (canUseAds(choices) && cjLinkFor(...)) || plainUrl;
// ─────────────────────────────────────────────────────────────────────────────

import type { StayPlatformId } from "./places";

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

// CJ publisher (website) ids are numeric. Trim + validate so a stray space or
// typo fails loudly in dev rather than silently building a broken click URL
// that tracks nothing.
function readPublisherId(): string | null {
  const raw = readEnv("VITE_CJ_PUBLISHER_ID");
  if (raw === null) return null;
  const id = raw.trim();
  if (!/^\d+$/.test(id)) {
    if (isDev()) {
      console.warn(
        `[cj] VITE_CJ_PUBLISHER_ID is not a numeric id ("${raw}") - CJ links disabled.`,
      );
    }
    return null;
  }
  return id;
}

/** CJ publisher (website) id, or null when not configured / invalid. */
export const CJ_PUBLISHER_ID: string | null = readPublisherId();

/** Default CJ redirect domain. All CJ domains are interchangeable; override
 *  per-advertiser only if a generated link uses a different one. */
export const CJ_DEFAULT_DOMAIN = "www.anrdoezrs.net";

export interface CjAdvertiser {
  /** The advertiser's 8-digit Ad/Link id from CJ (Get Links -> the advertiser). */
  aid: string;
  /** Optional CJ redirect domain override (defaults to CJ_DEFAULT_DOMAIN). */
  domain?: string;
}

/**
 * Per-platform CJ advertiser ids.
 *
 * ADD AN ENTRY ONLY ONCE YOU ARE APPROVED for that advertiser on CJ AND the
 * advertiser allows URL redirects (deep linking). To find the AID: CJ dashboard
 * -> Get Links -> pick the advertiser -> any link that says "Advertiser allows
 * URL redirects" -> the 8-digit number after `click-{PID}-` is the AID.
 *
 * Until an entry exists here, that platform's button stays a plain OTA search
 * link (it still works for travellers; it just doesn't earn yet).
 */
export const CJ_ADVERTISER_AIDS: Partial<Record<StayPlatformId, CjAdvertiser>> = {
  // trivago JP - CJ advertiser 7819798. This AID is the "Evergreen Link for
  // trivago JP" creative (the deep-link / URL-redirect-enabled one), so the
  // button can land on a region-specific trivago page (see TRIVAGO_DESTINATIONS)
  // rather than trivago's generic Japan page.
  trivago: { aid: "17247167" },
  // Hotels.com APAC - CJ advertiser 2612819. AID 11327743 is the
  // "Hotels.com APAC - Deep link" creative (URL-redirect / deep-link enabled).
  // Curl-verified: the ?url= override is honoured AND tracked (cjevent +
  // affcid=HCOM-AU.NETWORK.CJ.101761193, carrying our publisher id) for BOTH
  // www.hotels.com and au.hotels.com - so it earns on our existing
  // www.hotels.com destinations across AU/JP/NZ. Default anrdoezrs.net domain
  // tracks fine (no per-advertiser override needed).
  hotels: { aid: "11327743" },
  // Booking.com APAC - CJ advertiser 7854081. AID 17293139 is the "Evergreen
  // Link for Booking.com APAC" (deep-link / URL-redirect enabled). Curl-verified:
  // the ?url= override lands on our booking.com/searchresults page AND tracks
  // (label carries affnetcj-17293139 + site-101761193 + cjevent) on the default
  // anrdoezrs.net domain. Booking.com credits in-session conversions only (no
  // cookie tracking) - deep links satisfy that. This is the ONLY Booking.com
  // network: the Japan/Yamanouchi pages route through here too (no direct aid).
  booking: { aid: "17293139" },
  // agoda:   { aid: "00000000" },  // Agoda
  // expedia: { aid: "00000000" },  // Expedia
  // trip:    { aid: "00000000" },  // Trip.com
};

/**
 * CJ advertiser Ad/Link ids are 8-digit numbers. Validating before we build a
 * link means a typo in CJ_ADVERTISER_AIDS disables tracking for that platform
 * loudly (dev warning + plain-link fallback) instead of silently shipping a
 * broken click URL that earns nothing. Money-critical config, so fail safe.
 */
export function isValidCjAid(aid: string): boolean {
  return /^\d{8}$/.test(aid.trim());
}

/**
 * Build a CJ Affiliate deep-link tracking URL for a destination on an
 * advertiser's site. Pure (no env / no consent) so it's easy to unit-test.
 *
 *   buildCjDeepLink("https://www.booking.com/searchresults.html?ss=Wanaka",
 *                   { pid: "1234567", aid: "12345678", sid: "wanaka_wanaka" })
 *   -> "https://www.anrdoezrs.net/click-1234567-12345678?url=...&sid=wanaka_wanaka"
 */
export function buildCjDeepLink(
  destinationUrl: string,
  opts: { pid: string; aid: string; domain?: string; sid?: string },
): string {
  const domain = opts.domain ?? CJ_DEFAULT_DOMAIN;
  const encoded = encodeURIComponent(destinationUrl);
  let link = `https://${domain}/click-${opts.pid}-${opts.aid}?url=${encoded}`;
  if (opts.sid) link += `&sid=${encodeURIComponent(opts.sid)}`;
  return link;
}

/**
 * Wrap a plain OTA destination URL in a CJ tracking link for the given stay
 * platform, IF (a) a CJ publisher id is configured and (b) we have an approved
 * advertiser AID for that platform. Returns null otherwise, so callers fall
 * back to the plain link:
 *
 *   const href = (canUseAds(choices) && cjLinkFor(p.id, plain, { sid })) || plain;
 */
export function cjLinkFor(
  platform: StayPlatformId,
  destinationUrl: string,
  opts?: { sid?: string },
): string | null {
  const pid = CJ_PUBLISHER_ID;
  if (!pid) return null;
  const advertiser = CJ_ADVERTISER_AIDS[platform];
  if (!advertiser) return null;
  const aid = advertiser.aid.trim();
  if (!isValidCjAid(aid)) {
    if (isDev()) {
      console.warn(
        `[cj] CJ_ADVERTISER_AIDS["${platform}"].aid is not an 8-digit id ("${advertiser.aid}") - CJ link disabled for this platform.`,
      );
    }
    return null;
  }
  return buildCjDeepLink(destinationUrl, {
    pid,
    aid,
    domain: advertiser.domain,
    sid: opts?.sid,
  });
}

/** Whether CJ is configured (a publisher id is set). */
export function cjConfigured(): boolean {
  return CJ_PUBLISHER_ID !== null;
}

/**
 * Config status, mirroring awinStatus():
 *   "active"  - a publisher id is set; approved advertisers (CJ_ADVERTISER_AIDS)
 *               will route through CJ (with ads consent).
 *   "pending" - no publisher id yet; links still work but don't earn via CJ.
 */
export function cjStatus(): "active" | "pending" {
  return cjConfigured() ? "active" : "pending";
}
