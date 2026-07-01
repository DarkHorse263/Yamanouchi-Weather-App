/**
 * Trip planner · window-ranking tests.
 *
 * Run via: pnpm --filter @workspace/feelzlike run test:tripWindow
 *
 * Pattern: tsx --test + node:assert (matches tripPlanner / mountainScore).
 * The scorer is import-free so it runs clean under tsx --test. Covers ranking,
 * confidence penalties, no-data / error gaps, and 2-vs-3-day generation.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rankTripWindows,
  windowsForMountain,
  scoreDay,
  effectiveConfidence,
  scoreBand,
  type PlannerForecastDay,
  type PlannerMountain,
  type PlannerForecastEntry,
} from "../tripWindowScore";

function day(overrides: Partial<PlannerForecastDay> = {}): PlannerForecastDay {
  return {
    date: "2026-07-01",
    tempMaxMean: -3,
    tempMinMean: -9,
    precipMean: 0,
    snowMean: 0,
    snowSpread: 0,
    sourcesCount: 3,
    confidence: "high",
    ...overrides,
  };
}

/** Build a run of N days with sequential dates in July 2026. */
function series(overridesPerDay: Array<Partial<PlannerForecastDay>>): PlannerForecastDay[] {
  return overridesPerDay.map((o, i) =>
    day({ date: `2026-07-${String(i + 1).padStart(2, "0")}`, ...o }),
  );
}

const mtn = (key: string, name = key): PlannerMountain => ({
  key,
  name,
  regionId: "snowy-mountains",
  regionLabel: "Snowy Mountains",
});

test("effectiveConfidence collapses single-source days to 'single'", () => {
  assert.equal(effectiveConfidence(day({ sourcesCount: 1, confidence: "high" })), "single");
  assert.equal(effectiveConfidence(day({ sourcesCount: 4, confidence: "medium" })), "medium");
});

test("a powder day scores far above a warm wet day", () => {
  const powder = scoreDay(day({ snowMean: 22, tempMaxMean: -4, confidence: "high", sourcesCount: 4 }));
  const slush = scoreDay(day({ snowMean: 0, tempMaxMean: 9, precipMean: 8, confidence: "high", sourcesCount: 4 }));
  assert.ok(powder.score >= 90, `powder should be excellent, got ${powder.score}`);
  assert.ok(slush.score <= 25, `warm+wet should be poor, got ${slush.score}`);
  assert.equal(scoreBand(powder.score), "excellent");
});

test("ranks the best window first across mountains, keeps alternatives", () => {
  // Mountain A: a strong powder block mid-run. Mountain B: consistently fair.
  const a = series([
    { snowMean: 2, tempMaxMean: -2 },
    { snowMean: 25, tempMaxMean: -4 },
    { snowMean: 20, tempMaxMean: -3 },
    { snowMean: 3, tempMaxMean: -1 },
    { snowMean: 0, tempMaxMean: 0 },
    { snowMean: 0, tempMaxMean: 1 },
  ]);
  const b = series([
    { snowMean: 4, tempMaxMean: -2 },
    { snowMean: 4, tempMaxMean: -2 },
    { snowMean: 4, tempMaxMean: -2 },
    { snowMean: 4, tempMaxMean: -2 },
    { snowMean: 4, tempMaxMean: -2 },
    { snowMean: 4, tempMaxMean: -2 },
  ]);
  const result = rankTripWindows([mtn("a", "Alpha"), mtn("b", "Bravo")], {
    a: { status: "ok", days: a },
    b: { status: "ok", days: b },
  });
  assert.ok(result.best, "expected a best window");
  assert.equal(result.best!.mountainKey, "a");
  // Best window should cover the two big days (Jul 2-3).
  assert.ok(result.best!.startDate <= "2026-07-02" && result.best!.endDate >= "2026-07-03");
  assert.ok(result.best!.peakSnowCm >= 20);
  assert.ok(result.alternatives.length > 0, "expected alternatives");
  // Every alternative ranks no higher than best.
  for (const alt of result.alternatives) {
    assert.ok(alt.score <= result.best!.score);
  }
  assert.equal(result.gaps.length, 0);
});

test("low model agreement is penalised below an otherwise-identical high one", () => {
  const base = { snowMean: 15, tempMaxMean: -3 };
  const high = series([
    { ...base, confidence: "high", sourcesCount: 4 },
    { ...base, confidence: "high", sourcesCount: 4 },
    { ...base, confidence: "high", sourcesCount: 4 },
  ]);
  const low = series([
    { ...base, confidence: "low", sourcesCount: 4 },
    { ...base, confidence: "low", sourcesCount: 4 },
    { ...base, confidence: "low", sourcesCount: 4 },
  ]);
  const result = rankTripWindows([mtn("hi", "Sure"), mtn("lo", "Shaky")], {
    hi: { status: "ok", days: high },
    lo: { status: "ok", days: low },
  });
  assert.equal(result.best!.mountainKey, "hi");
  const hiWin = result.best!;
  const loWin = result.alternatives.find((w) => w.mountainKey === "lo");
  assert.ok(loWin, "expected the shaky mountain to appear as an alternative");
  assert.ok(hiWin.score > loWin!.score, `high ${hiWin.score} should beat low ${loWin!.score}`);
});

test("error and no-data mountains become honest gaps, not fake windows", () => {
  const good = series([
    { snowMean: 10, tempMaxMean: -3 },
    { snowMean: 8, tempMaxMean: -3 },
  ]);
  const forecasts: Record<string, PlannerForecastEntry> = {
    good: { status: "ok", days: good },
    broke: { status: "error" },
    empty: { status: "ok", days: [] },
    pending: { status: "loading" },
  };
  const result = rankTripWindows(
    [mtn("good", "Good"), mtn("broke", "Broke"), mtn("empty", "Empty"), mtn("pending", "Pending")],
    forecasts,
  );
  assert.equal(result.best!.mountainKey, "good");
  const reasons = Object.fromEntries(result.gaps.map((g) => [g.mountainKey, g.reason]));
  assert.equal(reasons["broke"], "error");
  assert.equal(reasons["empty"], "no-data");
  assert.equal(reasons["pending"], "loading");
  assert.equal(result.gaps.length, 3);
});

test("the generator produces both 2-day and 3-day candidate windows", () => {
  const days = series([
    { snowMean: 5, tempMaxMean: -2 },
    { snowMean: 5, tempMaxMean: -2 },
    { snowMean: 5, tempMaxMean: -2 },
    { snowMean: 5, tempMaxMean: -2 },
  ]);
  const windows = windowsForMountain(mtn("m"), days);
  const lengths = new Set(windows.map((w) => w.lengthDays));
  assert.ok(lengths.has(2), "expected a 2-day candidate");
  assert.ok(lengths.has(3), "expected a 3-day candidate");
  // 4 days → three 2-day + two 3-day = 5 candidates.
  assert.equal(windows.length, 5);
});

test("a tight 2-day peak can beat a diluted 3-day window", () => {
  // Two huge days flanked by nothing · the best window is the 2-day peak,
  // because stretching to 3 days drags the mean down with a dead day.
  const days = series([
    { snowMean: 0, tempMaxMean: 4 },
    { snowMean: 28, tempMaxMean: -4 },
    { snowMean: 26, tempMaxMean: -4 },
    { snowMean: 0, tempMaxMean: 4 },
    { snowMean: 0, tempMaxMean: 4 },
  ]);
  const result = rankTripWindows([mtn("m")], { m: { status: "ok", days } });
  assert.equal(result.best!.lengthDays, 2);
  assert.equal(result.best!.startDate, "2026-07-02");
  assert.equal(result.best!.endDate, "2026-07-03");
});

test("a single mountain returns no overlapping duplicate windows", () => {
  const days = series([
    { snowMean: 6, tempMaxMean: -2 },
    { snowMean: 6, tempMaxMean: -2 },
    { snowMean: 6, tempMaxMean: -2 },
    { snowMean: 6, tempMaxMean: -2 },
  ]);
  const result = rankTripWindows([mtn("m")], { m: { status: "ok", days } });
  const all = [result.best!, ...result.alternatives];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const a = all[i]!;
      const b = all[j]!;
      const overlap = a.startDate <= b.endDate && b.startDate <= a.endDate;
      assert.ok(!overlap, `windows ${a.startDate}..${a.endDate} and ${b.startDate}..${b.endDate} overlap`);
    }
  }
});

test("no saved mountains → empty ranking, no gaps", () => {
  const result = rankTripWindows([], {});
  assert.equal(result.best, null);
  assert.equal(result.alternatives.length, 0);
  assert.equal(result.gaps.length, 0);
});
