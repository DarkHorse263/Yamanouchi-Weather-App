import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { plannerForecastAsOf, tripForecastQuery } from "../tripForecastData";

const day = {
  date: "2026-09-21", tempMaxMean: 2, tempMinMean: -4,
  feelsLikeMaxMean: 0, feelsLikeMinMean: -7, feelsLikeSources: ["ECMWF"],
  precipMean: 5, snowMean: 3, snowSpread: 1, sourcesCount: 1, confidence: "low",
};
const forecast = {
  days: [day], generatedAt: "2026-09-21T01:30:00Z", timezone: "America/Vancouver",
};

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