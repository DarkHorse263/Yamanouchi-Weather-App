/**
 * Smoke test for the curated Stay + Eat dataset.
 *
 * Vitest is not currently wired in the workspace; when it is added, this file
 * will be picked up automatically (matches `**\/*.test.ts`). In the meantime,
 * the same invariants are enforced at module load time inside `src/data/index.ts`
 * (Zod validation throws on bad data) and the counts can be eyeballed via
 * `CURATED_COUNTS` in any module that imports them.
 */
import { describe, expect, it } from "vitest";

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
    expect(CURATED_COUNTS.stays).toBe(107);
    expect(getAllStays()).toHaveLength(107);
  });

  it("has 121 total eats", () => {
    expect(CURATED_COUNTS.eats).toBe(121);
    expect(getAllEats()).toHaveLength(121);
  });

  it("has 228 entries combined", () => {
    expect(CURATED_COUNTS.total).toBe(228);
  });

  it("covers all 6 expected towns", () => {
    const allTowns = getRegions().flatMap((region) => getTowns(region));
    expect(allTowns).toEqual(expect.arrayContaining(EXPECTED_TOWNS));
    expect(allTowns).toHaveLength(EXPECTED_TOWNS.length);
  });

  it.each(EXPECTED_TOWNS)("town %s has at least one stay and one eat", (town) => {
    expect(getStaysByTown(town).length).toBeGreaterThan(0);
    expect(getEatsByTown(town).length).toBeGreaterThan(0);
  });

  it("every stay has a booking_links object with at least one key", () => {
    for (const stay of getAllStays()) {
      expect(stay.booking_links).toBeDefined();
      expect(Object.keys(stay.booking_links).length).toBeGreaterThan(0);
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
    expect(allNull.length).toBeLessThanOrEqual(15);
  });

  it("every entry's region matches its town's region", () => {
    for (const stay of getAllStays()) {
      const expectedRegion = (Object.entries(TOWNS_BY_REGION) as [
        keyof typeof TOWNS_BY_REGION,
        readonly TownSlug[],
      ][]).find(([, towns]) => towns.includes(stay.town))?.[0];
      expect(stay.region).toBe(expectedRegion);
    }
    for (const eat of getAllEats()) {
      const expectedRegion = (Object.entries(TOWNS_BY_REGION) as [
        keyof typeof TOWNS_BY_REGION,
        readonly TownSlug[],
      ][]).find(([, towns]) => towns.includes(eat.town))?.[0];
      expect(eat.region).toBe(expectedRegion);
    }
  });
});
