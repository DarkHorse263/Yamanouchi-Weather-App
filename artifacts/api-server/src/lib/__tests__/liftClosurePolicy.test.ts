import { test } from "node:test";
import assert from "node:assert/strict";
import { getResortData } from "../../routes/lifts.js";
import {
  shouldCheckLiveLiftCanary,
  validateClosedLiftProbe,
} from "../liftPolicy.js";

test("lift API catalogue applies the 2026 AU closure to every covered Snowy resort", () => {
  const resorts = getResortData(new Date("2026-09-16T00:00:00Z"));
  const byId = new Map(resorts.map((resort) => [resort.locationId, resort]));

  for (const id of ["thredbo", "charlottes-pass", "selwyn"]) {
    const resort = byId.get(id);
    assert.ok(resort, `${id} should be present in the lift catalogue`);
    assert.equal(resort.seasonStatus, "closed");
    assert.equal(resort.operatingHours, undefined);
    assert.equal(resort.liveStatusVerified, false);
    assert.equal(
      resort.lifts.every((lift) => lift.openingTime === undefined && lift.closingTime === undefined),
      true,
    );
    assert.equal(resort.lifts.every((lift) => lift.status === "closed"), true);
  }
});

test("lift API keeps Perisher on its live-season path as the policy exception", () => {
  const resort = getResortData(new Date("2026-09-16T00:00:00Z")).find(
    (candidate) => candidate.locationId === "perisher",
  );
  assert.ok(resort);
  assert.equal(resort.seasonStatus, "late-season");
  assert.equal(resort.liveStatusVerified, false);
});

test("lift API closure is inactive before the effective date and next season", () => {
  const before = getResortData(new Date("2026-09-15T13:59:59Z")).find(
    (candidate) => candidate.locationId === "thredbo",
  );
  const nextSeason = getResortData(new Date("2027-09-16T00:00:00Z")).find(
    (candidate) => candidate.locationId === "thredbo",
  );
  assert.ok(before);
  assert.ok(nextSeason);
  assert.equal(before.seasonStatus, "late-season");
  assert.equal(nextSeason.seasonStatus, "late-season");
});

test("smoke keeps checking policy-closed AU canaries through October and December, then resets in January", () => {
  const thredbo = { id: "thredbo", liveFeed: true } as const;
  assert.equal(shouldCheckLiveLiftCanary(thredbo, new Date("2026-09-16T00:00:00Z")), true);
  assert.equal(shouldCheckLiveLiftCanary(thredbo, new Date("2026-10-01T00:00:00Z")), true);
  assert.equal(shouldCheckLiveLiftCanary(thredbo, new Date("2026-12-31T00:00:00Z")), true);
  assert.equal(shouldCheckLiveLiftCanary(thredbo, new Date("2027-01-01T00:00:00Z")), false);

  const perisher = { id: "perisher", liveFeed: true } as const;
  assert.equal(shouldCheckLiveLiftCanary(perisher, new Date("2026-10-01T00:00:00Z")), false);
});

test("smoke rejects contradictory closed probes with open counts or open rows", () => {
  const base = {
    seasonStatus: "closed",
    liveStatusVerified: false,
    totalLifts: 2,
    lifts: [{ status: "closed" }, { status: "closed" }],
  };
  assert.equal(validateClosedLiftProbe({ ...base, liftsOpen: 1 }).ok, false);
  assert.equal(
    validateClosedLiftProbe({
      ...base,
      liftsOpen: 0,
      lifts: [{ status: "open" }, { status: "closed" }],
    }).ok,
    false,
  );
  assert.equal(validateClosedLiftProbe({ ...base, liftsOpen: 0 }).ok, true);
});