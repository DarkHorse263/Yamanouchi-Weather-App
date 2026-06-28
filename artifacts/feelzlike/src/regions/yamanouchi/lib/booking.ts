// ─────────────────────────────────────────────────────────────────────────────
// Yamanouchi accommodation links - Booking.com via CJ.
//
// Booking.com is monetised through CJ (Commission Junction), the same network as
// the rest of feelzlike's Stay flow - exactly ONE network per merchant. This
// file builds the PLAIN booking.com search URL; the useYamanouchiBooking() hook
// wraps it in a CJ tracking link once the visitor has granted `ads` consent (see
// lib/cj + lib/consent). Without consent - or if Booking.com isn't in
// CJ_ADVERTISER_AIDS - the plain link is served unchanged: it still works, it
// just doesn't earn. (Previously this used a direct Booking.com affiliate id;
// that was removed so Booking.com lives on a single network.)
// ─────────────────────────────────────────────────────────────────────────────
import { useConsent, canUseAds } from "@/lib/consent";
import { cjLinkFor } from "@/lib/cj";

const REGION_QUERIES: Record<string, string> = {
  "Shiga Kogen": "Shiga Kogen, Yamanouchi, Japan",
  "Ryuoo": "Ryuoo, Yamanouchi, Japan",
  // The resorts API can return "Kita Shiga" / "Kita-Shiga" (see REGION_LIVE_MAP
  // in resorts.tsx). Map both so their "Stay Nearby" link targets the area rather
  // than falling back to the broad Yamanouchi-wide search.
  "Kita Shiga": "Kita Shiga Kogen, Nagano, Japan",
  "Kita-Shiga": "Kita Shiga Kogen, Nagano, Japan",
  "Yomase": "Yomase Onsen, Yamanouchi, Japan",
  "Yudanaka": "Yudanaka Onsen, Yamanouchi, Japan",
  "Shibu Onsen": "Shibu Onsen, Yamanouchi, Japan",
  "Sano": "Yamanouchi, Nagano, Japan",
};

/** Plain booking.com search URL (no affiliate id). */
function bookingSearchUrlPlain(query: string, checkin?: string, checkout?: string): string {
  const params = new URLSearchParams({ ss: query, lang: "en-us" });
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

/** CJ sub-id (sid) for reporting - which Yamanouchi link drove the click. */
function sidFor(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `yamanouchi_${slug || "general"}`;
}

/**
 * Booking.com link builders for Yamanouchi, CJ-tracked once the visitor has
 * granted ads consent (otherwise plain). Use from a component:
 *
 *   const booking = useYamanouchiBooking();
 *   <a href={booking.regionUrl("Shiga Kogen")} ... rel="noopener noreferrer sponsored">
 */
export function useYamanouchiBooking() {
  const { choices } = useConsent();
  const adsOk = canUseAds(choices);
  const wrap = (plain: string, sid: string) =>
    (adsOk && cjLinkFor("booking", plain, { sid })) || plain;
  return {
    searchUrl: (query: string, checkin?: string, checkout?: string) =>
      wrap(bookingSearchUrlPlain(query, checkin, checkout), sidFor(query)),
    regionUrl: (region: string) =>
      wrap(
        bookingSearchUrlPlain(REGION_QUERIES[region] || "Yamanouchi, Nagano, Japan"),
        sidFor(region),
      ),
    generalUrl: () =>
      wrap(bookingSearchUrlPlain("Yamanouchi, Nagano, Japan"), "yamanouchi_general"),
  };
}
