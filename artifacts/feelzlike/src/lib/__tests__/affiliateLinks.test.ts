// ─────────────────────────────────────────────────────────────────────────────
// affiliateLinks.test.ts - unit tests for the affiliate URL helper.
//
// Run with:
//   pnpm --filter @workspace/feelzlike test:affiliate
//
// We deliberately do NOT use vitest/jest here - the project already uses
// `tsx` + `node:assert/strict` for its `data:smoke` script, and adding
// vitest just for one helper would mean a new dev dependency, a config
// file, and a test harness in CI. Same pattern, zero new deps.
//
// Test cases cover the playbook spec PLUS architect-flagged hybrid policy:
//   1. Default mode: only curated providers appear; absent ones omitted
//   2. discoverAll mode: every applicable provider appears (search fallback)
//   3. JP-only providers return null for AU stays and vice versa
//   4. Affiliate ID is correctly injected (curated URL + search URL)
//   5. Builder gracefully handles a stay missing optional fields
//   6. Curated URLs already containing the affiliate param aren't double-written
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";
import {
  AFFILIATE_IDS,
  PROVIDERS,
  affiliateStatus,
  buildBookingLinks,
  hasAffiliateId,
  type Provider,
} from "../affiliateLinks.ts";
import type { Stay } from "../../types/stayEat.ts";

// ── Test fixtures ────────────────────────────────────────────────────────────

function baseStayFields() {
  return {
    name_local: null as string | null,
    short_description: "",
    long_description: "",
    address: null,
    lat: null,
    lng: null,
    phone: null,
    website: "https://example.com" as string | null,
    price_band: null,
    photos: [] as string[],
    source_urls: [] as string[],
    amenities: [] as string[],
    booking_links: {},
  };
}

// AU stay with NO curated booking_links - only `website` (so `official`
// is the lone curated provider in default mode).
const auStayNoLinks: Stay = {
  ...baseStayFields(),
  country: "AU",
  id: "banjo-paterson-inn",
  name: "Banjo Paterson Inn",
  type: "hotel",
  town: "jindabyne",
  region: "snowy_mountains",
};

// AU stay with TWO curated booking links - booking_com + agoda.
const auStayCurated: Stay = {
  ...auStayNoLinks,
  id: "the-station-jindabyne",
  name: "The Station Jindabyne",
  booking_links: {
    booking_com: "https://www.booking.com/hotel/au/the-station-jindabyne.html",
    agoda: "https://www.agoda.com/the-station-jindabyne/hotel/jindabyne-au.html",
  },
};

// JP stay with name_local + curated rakuten only.
const jpStay: Stay = {
  ...baseStayFields(),
  country: "JP",
  id: "shimaya-ryokan",
  name: "Shimaya Ryokan",
  name_local: "島屋旅館",
  type: "ryokan",
  town: "yudanaka",
  region: "yamanouchi",
  booking_links: {
    rakuten: "https://travel.rakuten.co.jp/HOTEL/12345/12345.html",
  },
};

const jpStayNoLocal: Stay = {
  ...jpStay,
  id: "no-local",
  name_local: null,
};

const stayNoWebsite: Stay = {
  ...auStayNoLinks,
  id: "no-website",
  website: null,
};

// AU stay where the curated booking URL ALREADY contains an affiliate aid -
// the helper must not double-write it.
const auStayPreAid: Stay = {
  ...auStayNoLinks,
  id: "pre-aid",
  booking_links: {
    booking_com: "https://www.booking.com/hotel/au/example.html?aid=PRESET",
  },
};

// ── Test runner (tiny, self-contained) ────────────────────────────────────────

const failures: string[] = [];
let passed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push(`${name}: ${msg}`);
    process.stdout.write(`  ✗ ${name}\n    ${msg}\n`);
  }
}

process.stdout.write("\naffiliateLinks.ts\n");

// ── 1. Default mode: curated-only ────────────────────────────────────────────

test("DEFAULT: stay with no curated booking_links shows only `official` (from website)", () => {
  const links = buildBookingLinks(auStayNoLinks);
  // `official` (= website) is the only curated link
  assert.equal(links.official, "https://example.com", "official should equal stay.website");
  // OTAs not curated - must NOT appear in default mode
  for (const p of ["booking_com", "agoda", "expedia", "hotels_com", "trip_com", "airbnb"] as Provider[]) {
    assert.equal(links[p], undefined, `${p} should be omitted in default mode (no curated URL)`);
  }
});

test("DEFAULT: stay with curated booking_com + agoda shows exactly those two + official", () => {
  const links = buildBookingLinks(auStayCurated);
  assert.ok(links.booking_com, "booking_com should appear (curated)");
  assert.ok(links.agoda, "agoda should appear (curated)");
  assert.ok(links.official, "official should appear (website)");
  // Non-curated OTAs must stay omitted
  assert.equal(links.expedia, undefined);
  assert.equal(links.hotels_com, undefined);
  assert.equal(links.airbnb, undefined);
  // Curated URL is preserved (path included)
  assert.ok(
    links.booking_com!.includes("/hotel/au/the-station-jindabyne.html"),
    `expected curated booking_com path preserved, got: ${links.booking_com}`,
  );
});

test("DEFAULT: JP stay with curated rakuten shows rakuten + official only", () => {
  const links = buildBookingLinks(jpStay);
  assert.ok(links.rakuten, "rakuten should appear (curated)");
  assert.ok(links.official, "official should appear");
  assert.equal(links.jalan, undefined, "jalan not curated → omitted");
  assert.equal(links.booking_com, undefined, "booking_com not curated → omitted");
});

// ── 2. discoverAll mode: search URLs for every applicable provider ──────────

test("DISCOVER: AU stay → every AU provider produces an https URL", () => {
  const links = buildBookingLinks(auStayNoLinks, { discoverAll: true });
  const expectedAU: Provider[] = [
    "booking_com", "agoda", "expedia", "hotels_com",
    "trip_com", "airbnb", "tripadvisor", "official",
  ];
  for (const p of expectedAU) {
    assert.ok(links[p], `expected URL for ${p} on AU stay in discoverAll, got ${links[p]}`);
    assert.match(links[p]!, /^https:\/\//);
  }
});

test("DISCOVER: JP stay → every JP provider including jalan + rakuten", () => {
  const links = buildBookingLinks(jpStay, { discoverAll: true });
  const expectedJP: Provider[] = [
    "booking_com", "agoda", "expedia", "hotels_com",
    "trip_com", "airbnb", "jalan", "rakuten", "tripadvisor", "official",
  ];
  for (const p of expectedJP) {
    assert.ok(links[p], `expected URL for ${p} on JP stay in discoverAll, got ${links[p]}`);
    assert.match(links[p]!, /^https:\/\//);
  }
});

test("DISCOVER: search URL contains property name + town label", () => {
  const links = buildBookingLinks(auStayNoLinks, { discoverAll: true });
  const name = encodeURIComponent("Banjo Paterson Inn");
  const town = encodeURIComponent("Jindabyne");
  for (const p of ["booking_com", "agoda", "expedia", "hotels_com", "trip_com", "airbnb"] as Provider[]) {
    assert.ok(
      links[p]!.includes(name) || links[p]!.includes("Banjo+Paterson+Inn"),
      `${p} URL missing property name: ${links[p]}`,
    );
    assert.ok(links[p]!.includes(town), `${p} URL missing town label: ${links[p]}`);
  }
});

// ── 3. Country gating ───────────────────────────────────────────────────────

test("JP-only providers absent from AU stay even in discoverAll mode", () => {
  const links = buildBookingLinks(auStayNoLinks, { discoverAll: true });
  assert.equal(links.jalan, undefined, "jalan should not appear for AU stay");
  assert.equal(links.rakuten, undefined, "rakuten should not appear for AU stay");
});

test("Forced affiliate ID for JP-only provider on AU stay still excluded", () => {
  const links = buildBookingLinks(auStayNoLinks, {
    discoverAll: true,
    idsOverride: { jalan: "FAKE", rakuten: "FAKE" },
  });
  assert.equal(links.jalan, undefined);
  assert.equal(links.rakuten, undefined);
});

// ── 4. Affiliate ID injection (curated + search URLs) ────────────────────────

test("ID injected onto CURATED booking_com URL as `aid`", () => {
  const links = buildBookingLinks(auStayCurated, { idsOverride: { booking_com: "TEST123" } });
  assert.match(links.booking_com!, /[?&]aid=TEST123(?:&|$)/);
  // Original curated path still present
  assert.ok(links.booking_com!.includes("the-station-jindabyne"));
});

test("ID injected onto SEARCH URL (discoverAll) as `aid`", () => {
  const links = buildBookingLinks(auStayNoLinks, {
    discoverAll: true,
    idsOverride: { booking_com: "TEST456" },
  });
  assert.match(links.booking_com!, /[?&]aid=TEST456(?:&|$)/);
  // Search URL marker
  assert.ok(links.booking_com!.includes("searchresults"));
});

test("Per-provider affiliate keys: cid, affcid, allianceid, c", () => {
  const links = buildBookingLinks(auStayNoLinks, {
    discoverAll: true,
    idsOverride: {
      agoda: "AGD-99",
      expedia: "EXP-1",
      hotels_com: "HC-1",
      trip_com: "TC-1",
      airbnb: "AB-1",
    },
  });
  assert.match(links.agoda!, /[?&]cid=AGD-99(?:&|$)/);
  assert.match(links.expedia!, /[?&]affcid=EXP-1(?:&|$)/);
  assert.match(links.hotels_com!, /[?&]affcid=HC-1(?:&|$)/);
  assert.match(links.trip_com!, /[?&]allianceid=TC-1(?:&|$)/);
  assert.match(links.airbnb!, /[?&]c=AB-1(?:&|$)/);
});

test("JP affiliate keys: afid (jalan), scid (rakuten)", () => {
  const links = buildBookingLinks(jpStay, {
    discoverAll: true,
    idsOverride: { jalan: "JAL-1", rakuten: "RAK-1" },
  });
  assert.match(links.jalan!, /[?&]afid=JAL-1(?:&|$)/);
  assert.match(links.rakuten!, /[?&]scid=RAK-1(?:&|$)/);
});

test("No affiliate ID → no affiliate-param leakage", () => {
  const links = buildBookingLinks(auStayNoLinks, { discoverAll: true });
  assert.doesNotMatch(links.booking_com!, /[?&]aid=/);
  assert.doesNotMatch(links.agoda!, /[?&]cid=/);
  assert.doesNotMatch(links.expedia!, /[?&]affcid=/);
});

test("Curated URL with PRE-EXISTING aid → not double-written", () => {
  const links = buildBookingLinks(auStayPreAid, { idsOverride: { booking_com: "OURS" } });
  // Should keep PRESET, not append OURS - single occurrence of `aid=` only
  const matches = links.booking_com!.match(/[?&]aid=/g) ?? [];
  assert.equal(matches.length, 1, `expected single aid= param, got: ${links.booking_com}`);
  assert.ok(links.booking_com!.includes("aid=PRESET"), "PRESET aid should be preserved");
});

// ── 5. JP local-name preference ──────────────────────────────────────────────

test("JP stay with name_local prefers kanji for jalan/rakuten search URLs", () => {
  const links = buildBookingLinks(jpStay, { discoverAll: true });
  assert.ok(
    links.jalan!.includes(encodeURIComponent("島屋旅館")),
    `jalan URL should use kanji name_local: ${links.jalan}`,
  );
  // rakuten is curated for jpStay, so its URL is the curated direct link;
  // name_local is exercised by the next test using jpStayNoLocal-equivalent.
});

test("JP stay WITHOUT name_local falls back to romanised name for jalan/rakuten", () => {
  const links = buildBookingLinks(jpStayNoLocal, { discoverAll: true });
  assert.ok(links.jalan, "jalan URL should still build");
  assert.ok(
    links.jalan!.includes(encodeURIComponent("Shimaya Ryokan")),
    `jalan URL missing romanised name fallback: ${links.jalan}`,
  );
});

test("Global providers always use romanised name (not kanji) for searchability", () => {
  const links = buildBookingLinks(jpStay, { discoverAll: true });
  assert.ok(
    links.booking_com!.includes(encodeURIComponent("Shimaya Ryokan")),
    `booking_com should use romanised name, got: ${links.booking_com}`,
  );
});

// ── 6. Missing optional fields ──────────────────────────────────────────────

test("Stay with no website → official omitted in BOTH default and discoverAll", () => {
  const linksDefault = buildBookingLinks(stayNoWebsite);
  assert.equal(linksDefault.official, undefined);
  const linksDiscover = buildBookingLinks(stayNoWebsite, { discoverAll: true });
  assert.equal(linksDiscover.official, undefined, "official has no search fallback");
  // Non-official providers still build via search
  assert.ok(linksDiscover.booking_com);
});

// ── Helper APIs ─────────────────────────────────────────────────────────────

test("hasAffiliateId returns false for every provider when no env vars set", () => {
  for (const p of PROVIDERS) {
    if (p === "official") continue;
    assert.equal(hasAffiliateId(p), false, `expected hasAffiliateId(${p}) === false in test env`);
  }
});

test("affiliateStatus marks pending providers and active for `official`", () => {
  const status = affiliateStatus();
  for (const p of PROVIDERS) {
    if (p === "official") {
      assert.equal(status[p], "active", "official should always be active");
    } else {
      assert.equal(status[p], "pending", `${p} should be pending in test env (no env vars set)`);
    }
  }
});

test("AFFILIATE_IDS exposes every provider key (Record completeness)", () => {
  for (const p of PROVIDERS) {
    assert.ok(p in AFFILIATE_IDS, `AFFILIATE_IDS missing key ${p}`);
  }
});

// ── Summary ──────────────────────────────────────────────────────────────────

process.stdout.write(
  `\n${passed} passed${failures.length ? `, ${failures.length} failed` : ""}\n`,
);
if (failures.length > 0) {
  process.exit(1);
}
