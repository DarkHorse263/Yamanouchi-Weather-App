// ─────────────────────────────────────────────────────────────────────────────
// openNow.test.ts — unit tests for the timezone-aware open/closed classifier.
//
// Run with:
//   pnpm --filter @workspace/feelzlike test:openNow
//
// Same harness convention as `affiliateLinks.test.ts` — tsx + node:assert,
// no vitest dependency. Each test injects a fixed `now` Date so the
// timezone math is deterministic across machines and CI.
//
// Coverage matrix:
//   1.  AU (Sydney): single-range, open during morning hours
//   2.  AU (Sydney): single-range, closed before opening (same day)
//   3.  AU (Sydney): single-range, closed after closing → opens tomorrow
//   4.  AU (Sydney): closing_soon within 30 min threshold
//   5.  AU (Sydney): exactly at close minute → closed
//   6.  AU (Sydney): exactly at open minute → open
//   7.  JP (Tokyo): two-range lunch/dinner, open during dinner
//   8.  JP (Tokyo): two-range lunch/dinner, closed during the gap
//   9.  JP (Tokyo): two-range, opens later today (next range)
//  10.  Overnight bar: open past midnight (yesterday's range bleeds in)
//  11.  Overnight bar: closed in the afternoon
//  12.  Overnight bar: closing_soon at 01:45 (closes 02:00)
//  13.  24h venue ("00:00–00:00") always open
//  14.  Empty hours → unknown
//  15.  Free-form day string ("By appointment only") → falls back to next day
//  16.  Multiple consecutive closed days → finds opening within 7-day window
//  17.  Region timezone difference: 09:00 UTC = 18:00 JST vs 19:00 AEST
//  18.  parseHoursDay: standalone parser handles en-dash / hyphen / em-dash
//  19.  parseHoursDay: silently drops malformed segments
//  20.  nextChange is set on open/closed (for re-render scheduling)
// ─────────────────────────────────────────────────────────────────────────────

import assert from "node:assert/strict";
import { isOpenNow, parseHoursDay } from "../openNow.ts";
import type { Eat, EatAU, EatJP } from "../../types/stayEat.ts";

// ── Test fixtures ────────────────────────────────────────────────────────────

function baseEatFields() {
  return {
    name_local: null,
    short_description: "",
    long_description: "",
    address: null,
    lat: null,
    lng: null,
    phone: null,
    website: null,
    price_band: "$$" as const,
    photos: [] as string[],
    source_urls: [] as string[],
    cuisine: [] as string[],
    last_order_time: null,
    reservation: null,
    reservation_link: null,
    payment: null,
    english_menu: null,
    signature_dishes: [] as string[],
    notes: null,
  };
}

function makeAU(id: string, hours: NonNullable<Eat["hours"]>): EatAU {
  return {
    ...baseEatFields(),
    country: "AU",
    id,
    name: id,
    type: "cafe",
    town: "jindabyne",
    region: "snowy_mountains",
    hours,
    apres_ski: null,
    takeaway: null,
    groceries: null,
  };
}

function makeJP(id: string, hours: NonNullable<Eat["hours"]>): EatJP {
  return {
    ...baseEatFields(),
    country: "JP",
    id,
    name: id,
    type: "ramen",
    town: "yudanaka",
    region: "yamanouchi",
    hours,
    vegetarian_friendly: null,
    kid_friendly: null,
  };
}

/**
 * Construct a UTC Date that, when interpreted in the given timezone, is
 * exactly `weekday hh:mm` local. We pick UTC offsets that match real-world
 * usage:
 *   AU/Sydney: AEST = UTC+10 (no DST in the winter ski season we care about)
 *   JP/Tokyo:  JST = UTC+9 (year-round, no DST)
 *
 * ISO format:  YYYY-MM-DDTHH:MM:00Z, where HH = local - offset.
 * 2024-07-15 (Mon) is a real Monday, used as the canonical anchor day.
 */
function tzDate(country: "AU" | "JP", isoLocalDate: string, hh: number, mm: number): Date {
  // Offsets used for tests (winter for AU = no DST, year-round for JP).
  const offset = country === "AU" ? 10 : 9;
  const utcHour = hh - offset;
  const dateStr = isoLocalDate;
  // Handle wrap to previous day if utcHour < 0.
  if (utcHour < 0) {
    // Subtract a day from isoLocalDate, add 24 hours to utcHour.
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return new Date(
      `${y}-${mo}-${da}T${String(utcHour + 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`,
    );
  }
  if (utcHour >= 24) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const da = String(d.getUTCDate()).padStart(2, "0");
    return new Date(
      `${y}-${mo}-${da}T${String(utcHour - 24).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`,
    );
  }
  return new Date(
    `${dateStr}T${String(utcHour).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`,
  );
}

// Anchor: 2024-07-15 is a Monday. All tests use offsets from this day so the
// weekday math is unambiguous (Mon = 2024-07-15, Tue = 2024-07-16, etc.).
const MON = "2024-07-15";
const TUE = "2024-07-16";
const SAT = "2024-07-20";

// Standard cafe: 06:30–14:00 every day.
const cafeHours: NonNullable<Eat["hours"]> = {
  monday:    "06:30–14:00",
  tuesday:   "06:30–14:00",
  wednesday: "06:30–14:00",
  thursday:  "06:30–14:00",
  friday:    "06:30–14:00",
  saturday:  "06:30–14:00",
  sunday:    "06:30–14:00",
};

// JP soba: lunch + dinner ranges every day.
const sobaHours: NonNullable<Eat["hours"]> = {
  monday:    "11:30–15:00, 18:00–23:30",
  tuesday:   "11:30–15:00, 18:00–23:30",
  wednesday: "11:30–15:00, 18:00–23:30",
  thursday:  "11:30–15:00, 18:00–23:30",
  friday:    "11:30–15:00, 18:00–23:30",
  saturday:  "11:30–15:00, 18:00–23:30",
  sunday:    "11:30–15:00, 18:00–23:30",
};

// Late-night bar: 17:00 → 02:00 next day.
const barHours: NonNullable<Eat["hours"]> = {
  monday:    "17:00–02:00",
  tuesday:   "17:00–02:00",
  wednesday: "17:00–02:00",
  thursday:  "17:00–02:00",
  friday:    "17:00–02:00",
  saturday:  "17:00–02:00",
  sunday:    "17:00–02:00",
};

// 24-hour venue.
const allDayHours: NonNullable<Eat["hours"]> = {
  monday: "00:00–00:00",
  tuesday: "00:00–00:00",
  wednesday: "00:00–00:00",
  thursday: "00:00–00:00",
  friday: "00:00–00:00",
  saturday: "00:00–00:00",
  sunday: "00:00–00:00",
};

// ── Tests ────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    if (err instanceof Error) {
      console.error(`    ${err.message}`);
    }
    failed++;
  }
}

console.log("\nopenNow.ts — unit tests\n");

test("AU cafe: open at 09:00 local (Mon)", () => {
  const eat = makeAU("cafe1", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 9, 0));
  assert.equal(r.status, "open");
  assert.match(r.message, /until 14:00/);
  assert.ok(r.nextChange instanceof Date);
});

test("AU cafe: closed before opening (Mon 05:00)", () => {
  const eat = makeAU("cafe2", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 5, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /opens 06:30/);
});

test("AU cafe: closed after closing (Mon 18:00) → opens tomorrow", () => {
  const eat = makeAU("cafe3", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 18, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /tomorrow 06:30/);
});

test("AU cafe: closing_soon at 13:45 (15 min to 14:00 close)", () => {
  const eat = makeAU("cafe4", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 13, 45));
  assert.equal(r.status, "closing_soon");
  assert.match(r.message, /Closes at 14:00/);
});

test("AU cafe: exactly at 14:00 close → closed", () => {
  const eat = makeAU("cafe5", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 14, 0));
  assert.equal(r.status, "closed");
});

test("AU cafe: exactly at 06:30 open → open (or closing_soon)", () => {
  const eat = makeAU("cafe6", cafeHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 6, 30));
  // 06:30 is the open minute; 7h30m to close → "open"
  assert.equal(r.status, "open");
});

test("JP soba: open during dinner (Mon 19:30)", () => {
  const eat = makeJP("soba1", sobaHours);
  const r = isOpenNow(eat, tzDate("JP", MON, 19, 30));
  assert.equal(r.status, "open");
  assert.match(r.message, /until 23:30/);
});

test("JP soba: closed during lunch-dinner gap (Mon 16:00)", () => {
  const eat = makeJP("soba2", sobaHours);
  const r = isOpenNow(eat, tzDate("JP", MON, 16, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /opens 18:00/);
});

test("JP soba: opens later today (Mon 10:00 → opens 11:30)", () => {
  const eat = makeJP("soba3", sobaHours);
  const r = isOpenNow(eat, tzDate("JP", MON, 10, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /opens 11:30/);
});

test("Overnight bar: open past midnight (Tue 01:00, Mon's range bleeds in)", () => {
  const eat = makeAU("bar1", barHours);
  const r = isOpenNow(eat, tzDate("AU", TUE, 1, 0));
  assert.equal(r.status, "open");
  assert.match(r.message, /until 02:00/);
});

test("Overnight bar: closed in the afternoon (Mon 14:00)", () => {
  const eat = makeAU("bar2", barHours);
  const r = isOpenNow(eat, tzDate("AU", MON, 14, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /opens 17:00/);
});

test("Overnight bar: closing_soon at 01:45 (15 min to 02:00 close)", () => {
  const eat = makeAU("bar3", barHours);
  const r = isOpenNow(eat, tzDate("AU", TUE, 1, 45));
  assert.equal(r.status, "closing_soon");
  assert.match(r.message, /Closes at 02:00/);
});

test("24h venue ('00:00–00:00') is always open", () => {
  const eat = makeAU("alldayam", allDayHours);
  const eat2 = makeAU("alldaypm", allDayHours);
  assert.equal(isOpenNow(eat,  tzDate("AU", MON, 3, 0)).status,  "open");
  assert.equal(isOpenNow(eat2, tzDate("AU", MON, 23, 0)).status, "open");
});

test("Empty hours object → unknown", () => {
  const eat = makeAU("nohrs", {});
  const r = isOpenNow(eat, tzDate("AU", MON, 12, 0));
  assert.equal(r.status, "unknown");
  assert.equal(r.message, "Hours unverified");
  assert.equal(r.nextChange, undefined);
});

test("Free-form day string is treated as closed → falls back to next day", () => {
  const eat = makeAU("freeform", {
    monday: "By appointment only",
    tuesday: "09:00–17:00",
    wednesday: "09:00–17:00",
    thursday: "09:00–17:00",
    friday: "09:00–17:00",
    saturday: "09:00–17:00",
    sunday: "09:00–17:00",
  });
  const r = isOpenNow(eat, tzDate("AU", MON, 10, 0));
  assert.equal(r.status, "closed");
  assert.match(r.message, /tomorrow 09:00/);
});

test("Multiple consecutive closed days → finds opening within 7-day window", () => {
  // Closed Mon-Fri, opens Sat 10:00.
  const eat = makeAU("weekendonly", {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "10:00–18:00",
    sunday: "10:00–18:00",
  });
  const r = isOpenNow(eat, tzDate("AU", MON, 12, 0));
  assert.equal(r.status, "closed");
  // From Mon to Sat is 5 days → labelled by weekday name.
  assert.match(r.message, /Sat 10:00/);
});

test("Region timezone independence: same UTC instant → AU open, JP still closed", () => {
  // Same UTC instant, different wall clocks because of the 1-hour offset.
  //   2024-07-15T20:30Z → AEST (UTC+10) = Tue 06:30 → exactly at open
  //   2024-07-15T20:30Z → JST  (UTC+9)  = Tue 05:30 → 1 hour before open
  // Both eats use the same `cafeHours` (06:30–14:00 every day) so the only
  // thing that differs is the timezone derived from `country`.
  const auEat = makeAU("au-tz", cafeHours);
  const jpEat = makeJP("jp-tz", cafeHours);
  const inst = new Date("2024-07-15T20:30:00Z");
  const ar = isOpenNow(auEat, inst);
  const jr = isOpenNow(jpEat, inst);
  assert.equal(ar.status, "open",   "AU should be open at AEST 06:30");
  assert.equal(jr.status, "closed", "JP should be closed at JST 05:30");
  assert.match(jr.message, /opens 06:30/);
});

test("parseHoursDay: handles en-dash / hyphen / em-dash separators", () => {
  assert.deepEqual(parseHoursDay("06:30–14:00"), [{ openMin: 390, closeMin: 840 }]);
  assert.deepEqual(parseHoursDay("06:30-14:00"), [{ openMin: 390, closeMin: 840 }]);
  assert.deepEqual(parseHoursDay("06:30—14:00"), [{ openMin: 390, closeMin: 840 }]);
  assert.deepEqual(parseHoursDay("06:30 – 14:00"), [{ openMin: 390, closeMin: 840 }]);
});

test("parseHoursDay: drops malformed segments, keeps valid ones", () => {
  const ranges = parseHoursDay("11:30–15:00, broken-string, 18:00–23:30");
  assert.equal(ranges.length, 2);
  assert.deepEqual(ranges[0], { openMin: 690, closeMin: 900 });
  assert.deepEqual(ranges[1], { openMin: 1080, closeMin: 1410 });
});

test("DST: AU summer transition — status classification stays correct via Intl", () => {
  // Australia switches AEST (UTC+10) → AEDT (UTC+11) on the 1st Sunday of
  // October at 02:00 local. 2024-10-06 02:00 AEST → clocks jump to 03:00 AEDT.
  // We can't use the `tzDate()` helper here (its winter-only +10 offset is
  // wrong post-transition), so we hand-build UTC instants for both sides.
  const cafe = makeAU("dst-cafe", cafeHours);

  // Just BEFORE transition: 2024-10-05T22:00Z = Sun 08:00 AEST → open
  const beforeDst = new Date("2024-10-05T22:00:00Z");
  const rBefore = isOpenNow(cafe, beforeDst);
  assert.equal(rBefore.status, "open", "pre-DST: 08:00 AEST should be open");

  // Just AFTER transition: 2024-10-06T22:00Z = Mon 09:00 AEDT (UTC+11) → open
  // (Uses Intl which honours AEDT — verifies status classification is DST-aware.)
  const afterDst = new Date("2024-10-06T22:00:00Z");
  const rAfter = isOpenNow(cafe, afterDst);
  assert.equal(rAfter.status, "open", "post-DST: 09:00 AEDT should be open");

  // Edge: at the moment AEDT begins (2024-10-06T16:00Z = 03:00 AEDT, the
  // skipped local hour 02:00 doesn't exist), the cafe is still pre-open.
  const atTransition = new Date("2024-10-06T16:00:00Z");
  const rAt = isOpenNow(cafe, atTransition);
  assert.equal(rAt.status, "closed", "at-DST: 03:00 AEDT should be pre-open");
  assert.match(rAt.message, /opens 06:30/);

  // KNOWN LIMITATION: nextChange is computed as (now + deltaMinutes*60000)
  // using TZ-minute deltas, which assumes a stable UTC offset. Across DST
  // boundaries this can drift by up to 60 min. The OpenNowPill caps its
  // setTimeout at 15min to bound drift; isOpenNow itself is always correct
  // when re-evaluated. We don't assert exact nextChange across the boundary.
});

test("Midnight close ('17:00–00:00') displays as 'midnight' not '00:00'", () => {
  // Common AU pub pattern: open evening, close at end of day. The parsed
  // closeMin is 1440 (overnight bump from 0). Display must read sensibly.
  const eat = makeAU("midnight-close", {
    monday:    "17:00–00:00",
    tuesday:   "17:00–00:00",
    wednesday: "17:00–00:00",
    thursday:  "17:00–00:00",
    friday:    "17:00–00:00",
    saturday:  "17:00–00:00",
    sunday:    "17:00–00:00",
  });
  const r = isOpenNow(eat, tzDate("AU", MON, 20, 0));
  assert.equal(r.status, "open");
  assert.match(r.message, /until midnight/);
  assert.doesNotMatch(r.message, /00:00/);
});

test("nextChange is set on open and closed states (for re-render scheduling)", () => {
  const eat = makeAU("rerender", cafeHours);
  const open = isOpenNow(eat, tzDate("AU", MON, 9, 0));
  const closed = isOpenNow(eat, tzDate("AU", MON, 18, 0));
  assert.ok(open.nextChange instanceof Date, "open should have nextChange");
  assert.ok(closed.nextChange instanceof Date, "closed should have nextChange");
  // Open: nextChange should be at the close time (14:00 local = 04:00 UTC same day in AU)
  // Just verify it's in the future.
  assert.ok(open.nextChange!.getTime() > tzDate("AU", MON, 9, 0).getTime());
  assert.ok(closed.nextChange!.getTime() > tzDate("AU", MON, 18, 0).getTime());
});

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
