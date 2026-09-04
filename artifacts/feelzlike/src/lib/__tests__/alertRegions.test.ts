import assert from "node:assert/strict";
import test from "node:test";
import { projectAlertRegions } from "../alertRegionProjection";

test("country totals include all canonical regions while alert choices remain eligible-only", () => {
  const regions = [
    { id: "au-live", name: "Australian Alps", subtitle: "Victoria · Australia" },
    { id: "nz-live", name: "Canterbury", subtitle: "Canterbury · New Zealand" },
    { id: "nz-directory", name: "Auckland", subtitle: "Auckland · New Zealand" },
    { id: "ca-live", name: "Alberta", subtitle: "Alberta · Canada" },
    { id: "us-live", name: "Colorado", subtitle: "Colorado · United States" },
  ] as const;
  const countries = {
    "au-live": "AU",
    "nz-live": "NZ",
    "nz-directory": "NZ",
    "ca-live": "CA",
    "us-live": "US",
  } as const;
  const projection = projectAlertRegions(regions, countries, (id) => id !== "nz-directory");

  assert.deepEqual(projection.countryRegionTotals, { AU: 1, JP: 0, NZ: 2, CA: 1, US: 1 });
  assert.deepEqual(projection.alertRegions.map((region) => region.id), [
    "au-live", "nz-live", "ca-live", "us-live",
  ]);
  assert.equal(projection.alertRegions.find((region) => region.id === "nz-live")?.country, "NZ · Canterbury");
});

test("duplicate canonical region ids are rejected", () => {
  assert.throws(
    () => projectAlertRegions(
      [
        { id: "duplicate", name: "One", subtitle: "NSW · Australia" },
        { id: "duplicate", name: "Two", subtitle: "Victoria · Australia" },
      ],
      { duplicate: "AU" },
      () => true,
    ),
    /Duplicate canonical alert region id: duplicate/,
  );
});