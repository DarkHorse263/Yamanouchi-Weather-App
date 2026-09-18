/**
 * Smoke test for the curated Stay + Eat dataset.
 *
 * Runs with the project's existing node:test + tsx runner.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CURATED_COUNTS,
  getAllEats,
  getAllStays,
  getEatsByTown,
  getRegions,
  getStaysByTown,
  getTowns,
} from "@/data";
import { TOWNS_BY_REGION, type TownSlug } from "@/types/stayEat";

const EXPECTED_TOWNS: TownSlug[] = [
  "jindabyne",
  "berridale",
  "cooma",
  "yudanaka",
  "shibu_onsen",
  "yomase",
];

describe("curated stay + eat dataset", () => {
  it("has 107 total stays", () => {
    assert.equal(CURATED_COUNTS.stays, 107);
    assert.equal(getAllStays().length, 107);
  });

  it("has 120 total eats after the approved Berridale listing removal", () => {
    assert.equal(CURATED_COUNTS.eats, 120);
    assert.equal(getAllEats().length, 120);
    assert.equal(getEatsByTown("berridale").length, 12);
    assert.ok(!getAllEats().some((eat) => eat.id === "out-of-bounds-berridale-pizza"));
  });

  it("has 227 entries combined", () => {
    assert.equal(CURATED_COUNTS.total, 227);
  });

  it("covers all 6 expected towns", () => {
    const allTowns = getRegions().flatMap((region) => getTowns(region));
    assert.deepEqual([...allTowns].sort(), [...EXPECTED_TOWNS].sort());
  });

  for (const town of EXPECTED_TOWNS) {
    it(`town ${town} has at least one stay and one eat`, () => {
      assert.ok(getStaysByTown(town).length > 0);
      assert.ok(getEatsByTown(town).length > 0);
    });
  }

  it("every stay has a booking_links object with at least one key", () => {
    for (const stay of getAllStays()) {
      assert.ok(stay.booking_links);
      assert.ok(Object.keys(stay.booking_links).length > 0);
    }
  });

  it("at most 15 stays have all-null booking_links values (known curation gap)", () => {
    // 10 stays at v0.4 have booking_links keys present but all values null
    // (3 Berridale motels, 3 Cooma motels, 2 Yudanaka ryokan, 2 Yomase hotels).
    // Tolerated up to 15 to allow small curation drift; fail loud if it grows.
    const allNull = getAllStays().filter((s) => {
      const links = Object.values(s.booking_links).filter(
        (v): v is string => typeof v === "string" && v.length > 0,
      );
      return links.length === 0;
    });
    assert.ok(allNull.length <= 15);
  });

  it("every entry's region matches its town's region", () => {
    for (const stay of getAllStays()) {
      const expectedRegion = (Object.entries(TOWNS_BY_REGION) as [
        keyof typeof TOWNS_BY_REGION,
        readonly TownSlug[],
      ][]).find(([, towns]) => towns.includes(stay.town))?.[0];
      assert.equal(stay.region, expectedRegion);
    }
    for (const eat of getAllEats()) {
      const expectedRegion = (Object.entries(TOWNS_BY_REGION) as [
        keyof typeof TOWNS_BY_REGION,
        readonly TownSlug[],
      ][]).find(([, towns]) => towns.includes(eat.town))?.[0];
      assert.equal(eat.region, expectedRegion);
    }
  });
});
