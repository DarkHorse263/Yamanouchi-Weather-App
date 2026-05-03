const BOOKING_AID = "75fd40675e05769d549b60370a6455d5";

export function bookingSearchUrl(query: string, checkin?: string, checkout?: string): string {
  const params = new URLSearchParams({
    aid: BOOKING_AID,
    ss: query,
    lang: "en-us",
  });
  if (checkin) params.set("checkin", checkin);
  if (checkout) params.set("checkout", checkout);
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
}

export function bookingRegionUrl(region: string): string {
  const regionQueries: Record<string, string> = {
    "Shiga Kogen": "Shiga Kogen, Yamanouchi, Japan",
    "Ryuoo": "Ryuoo, Yamanouchi, Japan",
    "Yomase": "Yomase Onsen, Yamanouchi, Japan",
    "Yudanaka": "Yudanaka Onsen, Yamanouchi, Japan",
    "Shibu Onsen": "Shibu Onsen, Yamanouchi, Japan",
    "Sano": "Yamanouchi, Nagano, Japan",
  };
  return bookingSearchUrl(regionQueries[region] || "Yamanouchi, Nagano, Japan");
}

export function bookingGeneralUrl(): string {
  return bookingSearchUrl("Yamanouchi, Nagano, Japan");
}
