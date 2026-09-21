import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { plannerForecastAsOf, plannerSnapshotDays, tripForecastQuery } from "../tripForecastData";
import { toPlannerDay } from "../tripForecastDay";

const day = {
  date: "2026-09-21", tempMaxMean: 2, tempMinMean: -4,
  feelsLikeMaxMean: 0, feelsLikeMinMean: -7, feelsLikeSources: ["ECMWF"],
  precipMean: 5, snowMean: 3, snowSpread: 1, sourcesCount: 1, confidence: "low",
};
const forecast = {
  days: [day], generatedAt: "2026-09-21T01:30:00Z", timezone: "America/Vancouver",
};

test("stale snapshots drop yesterday at mountain midnight before slicing and summing", () => {
  const data = {
    ...forecast, timezone: "Asia/Tokyo", _stale: { ageSeconds: 6 * 3600 },
    days: Array.from({ length: 9 }, (_, i) => toPlannerDay({
      ...day, confidence: "low", date: `2026-09-${20 + i}`, snowMean: i === 0 ? 100 : 2,
    })),
  };
  const before = plannerSnapshotDays(data, 7, new Date("2026-09-20T14:59:59Z"));
  assert.equal(before[0].date, "2026-09-20");
  const after = plannerSnapshotDays(data, 7, new Date("2026-09-20T15:00:00Z"));
  assert.deepEqual(after.map((d) => d.date),
    ["21", "22", "23", "24", "25", "26", "27"].map((d) => `2026-09-${d}`));
  assert.equal(after.reduce((sum, d) => sum + d.snowMean, 0), 14);
  assert.equal(data.days.length, 9);
  assert.equal(plannerSnapshotDays({ ...data, _stale: null }, 7,
    new Date("2026-09-20T15:00:00Z"))[0].date, "2026-09-21");
});

test("snapshots use response timezone, including DST and year boundaries", () => {
  const data = {
    ...forecast, _stale: null,
    days: ["2026-12-31", "2027-01-01"].map((date) => toPlannerDay({ ...day, confidence: "low", date })),
  };
  const now = new Date("2027-01-01T00:30:00Z");
  assert.equal(plannerSnapshotDays(data, 7, now).length, 2); // still December in Vancouver
  assert.equal(plannerSnapshotDays({ ...data, timezone: "Pacific/Auckland" }, 7, now).length, 1);
  const dst = { ...data, days: ["2026-03-07", "2026-03-08", "2026-03-09"].map((date) =>
    toPlannerDay({ ...day, confidence: "low", date })) };
  for (const time of ["2026-03-08T09:59:59Z", "2026-03-08T10:00:00Z"]) {
    assert.equal(plannerSnapshotDays(dst, 7, new Date(time))[0].date, "2026-03-08");
  }
  assert.deepEqual(plannerSnapshotDays(data, 7, new Date("2027-01-02T12:00:00Z")), []);
  assert.deepEqual(plannerSnapshotDays({ ...data, days: [] }, 7, now), []);
  assert.deepEqual(plannerSnapshotDays({ ...data, timezone: null }, 7, now), []);
  assert.deepEqual(plannerSnapshotDays({ ...data, timezone: "invalid" }, 7, now), []);
});

test("refresh preserves old source time and all metrics, then clears stale on recovery", async (t) => {
  let response: object = forecast;
  let failed = false;
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.equal(init.cache, "reload");
    return new Response(JSON.stringify(response), { status: failed ? 503 : 200 });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const options = tripForecastQuery("/api/forecast/test");
  const observer = new QueryObserver(client, { queryKey: ["trip-test"], ...options, enabled: false });
  const unsubscribe = observer.subscribe(() => {});
  try {
    const fresh = await observer.refetch();
    assert.equal(fresh.data?._stale, null);
    assert.equal(fresh.data?.generatedAt, forecast.generatedAt);
    response = { ...forecast, _stale: { ageSeconds: 3600 } };
    const stale = await observer.refetch();
    assert.deepEqual(stale.data?.days, fresh.data?.days);
    assert.equal(stale.data?.generatedAt, forecast.generatedAt);
    assert.deepEqual(stale.data?._stale, { ageSeconds: 3600 });
    assert.equal(options.staleTime({ state: { data: stale.data } }), 60_000);
    assert.equal(options.refetchInterval({ state: { data: stale.data } }), 60_000);
    response = { ...forecast, generatedAt: "2026-09-21T02:30:00Z" };
    const recovered = await observer.refetch();
    assert.equal(recovered.data?._stale, null);
    assert.equal(recovered.data?.generatedAt, "2026-09-21T02:30:00Z");
    assert.equal(options.refetchInterval({ state: { data: recovered.data } }), false);
    failed = true;
    assert.equal((await observer.refetch()).isError, true);
  } finally {
    unsubscribe();
    client.clear();
  }
});

test("source date is mountain-local across midnight, not browser-local", () => {
  const data = { ...forecast, days: [], _stale: null };
  assert.match(plannerForecastAsOf(data)!, /20 Sept 2026/);
  assert.match(plannerForecastAsOf({ ...data, timezone: "Asia/Tokyo" })!, /21 Sept 2026/);
  assert.match(plannerForecastAsOf({ ...data, timezone: "Australia/Sydney" })!, /21 Sept 2026/);
  assert.equal(plannerForecastAsOf({ ...data, generatedAt: null }), null);
  assert.equal(plannerForecastAsOf({ ...data, timezone: null }), null);
  assert.equal(plannerForecastAsOf({ ...data, timezone: "invalid" }), null);
});

test("empty and legacy responses never manufacture a source timestamp", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ days: [] })));
  const result = await tripForecastQuery("/test").queryFn();
  assert.deepEqual(result.days, []);
  assert.equal(result.generatedAt, null);
  assert.equal(plannerForecastAsOf(result), null);
});