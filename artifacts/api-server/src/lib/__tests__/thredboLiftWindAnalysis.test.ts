import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzeThredboLiftWindHistory,
  hasMinimumThredboWindEvidence,
  type CuratedLiftThreshold,
  type LiftWindTransition,
} from "../thredboLiftWindAnalysis.js";
import {
  THREDBO_THRESHOLDS,
  THREDBO_THRESHOLD_SOURCES,
} from "../thredboLiftThresholds.js";
import { parseThredboLiftXml } from "../thredboLiftStatus.js";

const threshold: CuratedLiftThreshold = {
  liveLiftIds: ["lift-a"],
  seedLiftId: "a",
  name: "Lift A",
  thresholdKmh: 70,
  verifiedAt: "2026-05-05",
};

function event(
  previousStatus: string | null,
  status: string,
  topGustKmh: number | null,
  villageGustKmh: number | null = null,
): LiftWindTransition {
  return {
    liftId: "lift-a",
    liftName: "Lift A",
    previousStatus,
    status,
    feedUpdatedAt: new Date("2026-08-30T00:00:00Z"),
    villageWindKmh: null,
    villageGustKmh,
    topWindKmh: null,
    topGustKmh,
  };
}

test("flags empty history as sparse instead of inventing a threshold", () => {
  const [row] = analyzeThredboLiftWindHistory([], [threshold]);
  assert.deepEqual(row?.flags, [
    "no_events",
    "sparse_starts",
    "sparse_releases",
  ]);
  assert.equal(row?.recommendation, null);
  assert.equal(row?.verifiedAt, "2026-05-05");
});

test("recommends a rounded threshold from sufficient separated evidence", () => {
  const rows = [
    event("open", "wind-hold", 82),
    event("open", "wind-hold", 88),
    event("open", "wind-hold", 92),
    event("wind-hold", "open", 62),
    event("wind-hold", "open", 68),
    event("wind-hold", "open", 72),
    event("wind-hold", "closed", 100),
  ];
  const [result] = analyzeThredboLiftWindHistory(rows, [threshold]);
  assert.deepEqual(result?.flags, []);
  assert.deepEqual(result?.windHoldStarts, [82, 88, 92]);
  assert.deepEqual(result?.releases, [62, 68, 72]);
  assert.equal(result?.recommendation?.thresholdKmh, 80);
  assert.equal(hasMinimumThredboWindEvidence(result!), true);
});

test("counts only open to wind-hold transitions as hold starts", () => {
  const rows = [
    event("open", "wind-hold", 82),
    event(null, "wind-hold", 120),
    event("closed", "wind-hold", 115),
    event("scheduled", "wind-hold", 110),
    event("on-hold", "wind-hold", 105),
  ];
  const [result] = analyzeThredboLiftWindHistory(rows, [threshold]);
  assert.deepEqual(result?.windHoldStarts, [82]);
  assert.ok(result?.flags.includes("sparse_starts"));
  assert.equal(result?.recommendation, null);
});

test("every curated official-name alias joins the ID produced by the feed parser", () => {
  const lifts = THREDBO_THRESHOLD_SOURCES.flatMap((source) =>
    source.liveNames.map(
      (name) =>
        `<lift name="${name.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" open="true" status="open" liftType="quad"/>`,
    ),
  ).join("");
  const parsed = parseThredboLiftXml(
    `<liftStatusReport updated="2026-08-30T03:05:00.000Z"><area name="Thredbo">${lifts}</area></liftStatusReport>`,
    Date.parse("2026-08-30T04:00:00Z"),
  );
  assert.ok(parsed);

  let parsedIndex = 0;
  THREDBO_THRESHOLD_SOURCES.forEach((source, thresholdIndex) => {
    const configured = THREDBO_THRESHOLDS[thresholdIndex]!;
    source.liveNames.forEach(() => {
      assert.ok(
        configured.liveLiftIds.includes(parsed.lifts[parsedIndex]!.id),
        `${source.name} alias ${parsed.lifts[parsedIndex]!.name} was not mapped`,
      );
      parsedIndex += 1;
    });
  });
});

test("flags conflicting distributions and mixed station evidence", () => {
  const conflicting = [
    event("open", "wind-hold", 60),
    event("open", "wind-hold", 65),
    event("open", "wind-hold", 70),
    event("wind-hold", "open", 68),
    event("wind-hold", "open", 72),
    event("wind-hold", "open", null, 75),
  ];
  const [result] = analyzeThredboLiftWindHistory(conflicting, [threshold]);
  assert.ok(result?.flags.includes("mixed_wind_stations"));
  assert.ok(result?.flags.includes("conflicting_samples"));
  assert.equal(result?.recommendation, null);
  assert.equal(hasMinimumThredboWindEvidence(result!), true);
});
