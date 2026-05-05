// ─────────────────────────────────────────────────────────────────────────────
// reservationLinks.test.ts — unit tests for the reservation deep-link builder.
//
// Run with:
//   pnpm --filter @workspace/feelzlike test:reservation
//
// Same harness as `affiliateLinks.test.ts` and `openNow.test.ts`: tsx + node:assert.
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";
import { buildReservationLinks } from "../reservationLinks.ts";
import type { Eat, EatAU, EatJP } from "../../types/stayEat.ts";

function baseEatFields() {
  return {
    name_local: null,
    short_description: "",
    long_description: "",
    address: null,
    lat: null,
    lng: null,
    phone: null as string | null,
    website: null,
    price_band: "$$" as const,
    photos: [] as string[],
    source_urls: [] as string[],
    cuisine: [] as string[],
    hours: {},
    last_order_time: null,
    reservation: null as null | "required" | "recommended" | "not_needed" | "not_accepted",
    reservation_link: null as string | null,
    payment: null,
    english_menu: null,
    signature_dishes: [] as string[],
    notes: null,
  };
}

function makeAU(overrides: Partial<EatAU>): EatAU {
  return {
    ...baseEatFields(),
    country: "AU",
    id: "au-test",
    name: "AU Test",
    type: "restaurant",
    town: "jindabyne",
    region: "snowy_mountains",
    apres_ski: null,
    takeaway: null,
    groceries: null,
    ...overrides,
  } as EatAU;
}

function makeJP(overrides: Partial<EatJP>): EatJP {
  return {
    ...baseEatFields(),
    country: "JP",
    id: "jp-test",
    name: "JP Test",
    type: "ramen",
    town: "yudanaka",
    region: "yamanouchi",
    vegetarian_friendly: null,
    kid_friendly: null,
    ...overrides,
  } as EatJP;
}

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    if (err instanceof Error) console.error(`    ${err.message}`);
    failed++;
  }
}

console.log("\nreservationLinks.ts — unit tests\n");

test("Tabelog deep-link → primary = Tabelog", () => {
  const eat: Eat = makeJP({
    reservation: "required",
    reservation_link: "https://tabelog.com/nagano/A2001/A200104/20011710/",
    phone: "+81-269-33-6230",
  });
  const r = buildReservationLinks(eat);
  assert.equal(r.status, "reservable");
  assert.equal(r.primary?.provider, "tabelog");
  assert.equal(r.primary?.label, "Reserve on Tabelog");
  assert.equal(r.primary?.url, "https://tabelog.com/nagano/A2001/A200104/20011710/");
  assert.equal(r.statusLabel, "Reserve on Tabelog");
  // Phone is offered as a secondary option.
  assert.equal(r.all.length, 2);
  assert.equal(r.all[1].provider, "phone");
});

test("TableCheck deep-link → primary = TableCheck", () => {
  const r = buildReservationLinks(
    makeJP({
      reservation_link: "https://www.tablecheck.com/en/gonki",
      phone: "+81-269-38-0246",
    }),
  );
  assert.equal(r.primary?.provider, "tablecheck");
  assert.equal(r.primary?.label, "Reserve on TableCheck");
});

test("Hotpepper deep-link → primary = Hotpepper (sub-domain support)", () => {
  const r = buildReservationLinks(
    makeJP({ reservation_link: "https://www.hotpepper.jp/strJ001234567/" }),
  );
  assert.equal(r.primary?.provider, "hotpepper");
});

test("OpenTable AU deep-link → primary = OpenTable", () => {
  const r = buildReservationLinks(
    makeAU({ reservation_link: "https://www.opentable.com.au/r/example-jindabyne" }),
  );
  assert.equal(r.primary?.provider, "opentable");
  assert.equal(r.primary?.label, "Reserve on OpenTable");
});

test("TheFork deep-link → primary = TheFork", () => {
  const r = buildReservationLinks(
    makeAU({ reservation_link: "https://www.thefork.com.au/restaurant/example-12345" }),
  );
  assert.equal(r.primary?.provider, "thefork");
});

test("Direct restaurant URL → primary = official site", () => {
  const r = buildReservationLinks(
    makeAU({
      reservation_link: "https://phasthai.com.au",
      phone: "+61 2 6452 5489",
    }),
  );
  assert.equal(r.primary?.provider, "official");
  assert.equal(r.primary?.label, "Book on official site");
  assert.equal(r.all.length, 2);
});

test("reservation_link is itself a tel: URI → emit phone, no duplicate", () => {
  const r = buildReservationLinks(
    makeAU({
      reservation_link: "tel:+61264561420",
      phone: "+61 2 6456 1420",
    }),
  );
  assert.equal(r.primary?.provider, "phone");
  assert.equal(r.primary?.label, "Call to reserve");
  // De-dup: the curated phone matches the tel: link, so we get exactly one option.
  assert.equal(r.all.length, 1);
});

test("Phone-only (no reservation_link) → primary = phone", () => {
  const r = buildReservationLinks(
    makeAU({
      reservation: "recommended",
      phone: "+61 2 6452 1234",
    }),
  );
  assert.equal(r.primary?.provider, "phone");
  assert.equal(r.primary?.url, "tel:+61264521234");
  assert.equal(r.primary?.label, "Call to reserve");
});

test("reservation === 'not_accepted' → status walk_in, no options", () => {
  const r = buildReservationLinks(
    makeAU({
      reservation: "not_accepted",
      phone: "+61 2 6452 1234", // present but ignored
      reservation_link: "https://example.com",
    }),
  );
  assert.equal(r.status, "walk_in");
  assert.equal(r.primary, null);
  assert.equal(r.all.length, 0);
  assert.equal(r.statusLabel, "Walk-in only");
});

test("reservation === 'not_needed' → status not_needed, no options", () => {
  const r = buildReservationLinks(makeAU({ reservation: "not_needed" }));
  assert.equal(r.status, "not_needed");
  assert.equal(r.primary, null);
  assert.equal(r.statusLabel, "No reservation needed");
});

test("No reservation_link, no phone → status = unknown", () => {
  const r = buildReservationLinks(makeAU({ reservation: "recommended" }));
  assert.equal(r.status, "unknown");
  assert.equal(r.primary, null);
  assert.equal(r.statusLabel, "See website");
});

test("Malformed reservation_link → falls back to 'official' label without throwing", () => {
  const r = buildReservationLinks(
    makeAU({ reservation_link: "not a url at all" }),
  );
  // URL constructor throws → detectUrlProvider returns 'official' fallback
  assert.equal(r.primary?.provider, "official");
});

test("Phone normalization — surrounding whitespace, spaces, parens, dashes stripped", () => {
  const r = buildReservationLinks(
    makeAU({ phone: "  +61 (2) 6452-1234  " }),
  );
  assert.equal(r.primary?.url, "tel:+61264521234");
});

test("All-options ordering: link first, phone second", () => {
  const r = buildReservationLinks(
    makeJP({
      reservation_link: "https://tabelog.com/example",
      phone: "+81-269-33-6230",
    }),
  );
  assert.deepEqual(
    r.all.map((o) => o.provider),
    ["tabelog", "phone"],
  );
});

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
