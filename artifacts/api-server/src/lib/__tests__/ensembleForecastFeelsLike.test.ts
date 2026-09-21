import assert from "node:assert/strict";
import test from "node:test";
import { getEnsembleForecast, type EnsembleQuery } from "../ensemble-forecast.js";

const baseQuery: EnsembleQuery = {
  latitude: 39.604,
  longitude: -105.821,
  elevation: 3_141,
  region: "JP",
  timezone: "America/Denver",
  days: 2,
};

function response(json: unknown, ok = true, status = ok ? 200 : 503): Response {
  return { ok, status, json: async () => json } as Response;
}

function metSeriesForLocalDay(): unknown[] {
  // All of these UTC timestamps are on local 2026-11-01 in Denver, including
  // timestamps after UTC midnight on the DST transition day.
  return Array.from({ length: 12 }, (_, i) => ({
    time: new Date(Date.UTC(2026, 10, 1, 18 + i)).toISOString(),
    data: {
      instant: { details: { air_temperature: -2 + i / 10 } },
      next_1_hours: { details: { precipitation_amount: 0.1 } },
    },
  }));
}

test("actual ensemble request keeps apparent extrema synchronized and isolates model suffixes", async () => {
  const originalFetch = globalThis.fetch;
  const requested: URL[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    requested.push(url);
    if (url.hostname === "api.met.no") {
      return response({ properties: { timeseries: metSeriesForLocalDay() } });
    }

    return response({
      daily: {
        time: ["2026-11-01", "2026-11-02"],
        temperature_2m_max_ecmwf_ifs025: [3, 4],
        temperature_2m_min_ecmwf_ifs025: [-5, -4],
        apparent_temperature_max_ecmwf_ifs025: [0, 1],
        apparent_temperature_min_ecmwf_ifs025: [-9, -8],
        precipitation_sum_ecmwf_ifs025: [1, 0],
        snowfall_sum_ecmwf_ifs025: [2, 0],

        temperature_2m_max_gfs_seamless: [5, 6],
        temperature_2m_min_gfs_seamless: [-3, -2],
        apparent_temperature_max_gfs_seamless: [Number.NaN, 3],
        apparent_temperature_min_gfs_seamless: [-7, -5],

        // A partial actual pair cannot contribute apparent extrema.
        temperature_2m_max_icon_seamless: [4, 5],
        temperature_2m_min_icon_seamless: [null, -3],
        apparent_temperature_max_icon_seamless: [2, 2],
        apparent_temperature_min_icon_seamless: [-6, -6],

        // An inverted apparent pair is omitted as a pair.
        temperature_2m_max_jma_seamless: [4, 5],
        temperature_2m_min_jma_seamless: [-4, -3],
        apparent_temperature_max_jma_seamless: [-7, Number.POSITIVE_INFINITY],
        apparent_temperature_min_jma_seamless: [-2, -6],

        // An unrelated suffix must never leak into any selected model.
        apparent_temperature_max_best_match: [99, 99],
        apparent_temperature_min_best_match: [88, 88],
      },
      hourly: {},
    });
  }) as typeof fetch;

  try {
    const forecast = await getEnsembleForecast(baseQuery);
    const openMeteoUrl = requested.find((url) => url.hostname === "api.open-meteo.com");
    assert.ok(openMeteoUrl);
    assert.equal(openMeteoUrl.searchParams.get("latitude"), String(baseQuery.latitude));
    assert.equal(openMeteoUrl.searchParams.get("longitude"), String(baseQuery.longitude));
    assert.equal(openMeteoUrl.searchParams.get("elevation"), String(baseQuery.elevation));
    assert.equal(openMeteoUrl.searchParams.get("timezone"), baseQuery.timezone);
    assert.equal(
      openMeteoUrl.searchParams.get("models"),
      "ecmwf_ifs025,gfs_seamless,icon_seamless,jma_seamless",
    );
    const dailyFields = openMeteoUrl.searchParams.get("daily")?.split(",");
    assert.ok(dailyFields?.includes("apparent_temperature_max"));
    assert.ok(dailyFields?.includes("apparent_temperature_min"));

    const first = forecast.days[0];
    assert.equal(first?.date, "2026-11-01");
    assert.equal(first?.feelsLikeMaxMean, 0);
    assert.equal(first?.feelsLikeMinMean, -9);
    assert.deepEqual(first?.feelsLikeSources, ["ECMWF IFS"]);
    assert.deepEqual(
      first?.perSource
        .filter((source) => source.feelsLikeMax !== undefined)
        .map((source) => [source.source, source.feelsLikeMax, source.feelsLikeMin]),
      [["ECMWF IFS", 0, -9]],
    );
    // UTC Nov 2 samples align to Open-Meteo's Nov 1 local day across DST.
    assert.ok(first?.perSource.some((source) => source.source === "MET Norway"));

    const second = forecast.days[1];
    assert.equal(second?.feelsLikeMaxMean, 2);
    assert.equal(second?.feelsLikeMinMean, -6.3);
    assert.deepEqual(second?.feelsLikeSources, ["ECMWF IFS", "GFS", "ICON"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("MET-only fallback keeps air/snow behavior and reports no apparent extrema", async () => {
  const originalFetch = globalThis.fetch;
  const query = { ...baseQuery, latitude: 39.614, region: "OTHER" as const, days: 1 };
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname === "api.open-meteo.com") return response({}, false);
    return response({
      properties: {
        timeseries: metSeriesForLocalDay().map((point: any) => ({
          ...point,
          data: {
            ...point.data,
            instant: { details: { air_temperature: -3 } },
            next_1_hours: { details: { precipitation_amount: 1 } },
          },
        })),
      },
    });
  }) as typeof fetch;

  try {
    const forecast = await getEnsembleForecast(query);
    assert.equal(forecast.days.length, 1);
    assert.equal(forecast.days[0]?.feelsLikeMaxMean, null);
    assert.equal(forecast.days[0]?.feelsLikeMinMean, null);
    assert.deepEqual(forecast.days[0]?.feelsLikeSources, []);
    assert.equal(forecast.days[0]?.snowMean, 8.4);
    assert.deepEqual(forecast.days[0]?.perSource.map((source) => source.source), ["MET Norway"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("total upstream failure returns an empty honest result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => response({}, false)) as typeof fetch;

  try {
    const forecast = await getEnsembleForecast({
      ...baseQuery,
      latitude: 39.624,
      region: "OTHER",
      days: 1,
    });
    assert.deepEqual(forecast.days, []);
    assert.equal(forecast._stale, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("total refresh failure preserves apparent extrema in stale fallback", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  const query = { ...baseQuery, latitude: 39.634, region: "OTHER" as const, days: 1 };
  let fail = false;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (fail) return response({}, false);
    if (url.hostname === "api.met.no") return response({ properties: { timeseries: [] } });
    return response({
      daily: {
        time: ["2026-11-01"],
        temperature_2m_max_ecmwf_ifs025: [2],
        temperature_2m_min_ecmwf_ifs025: [-4],
        apparent_temperature_max_ecmwf_ifs025: [-1],
        apparent_temperature_min_ecmwf_ifs025: [-8],
      },
      hourly: {},
    });
  }) as typeof fetch;

  try {
    const builtAt = originalNow();
    Date.now = () => builtAt;
    const fresh = await getEnsembleForecast(query);
    assert.equal(fresh.days[0]?.feelsLikeMaxMean, -1);

    fail = true;
    Date.now = () => builtAt + 31 * 60 * 1000;
    const stale = await getEnsembleForecast(query);
    assert.equal(stale.days[0]?.feelsLikeMinMean, -8);
    assert.deepEqual(stale.days[0]?.feelsLikeSources, ["ECMWF IFS"]);
    assert.equal(stale._stale?.ageSeconds, 31 * 60);
  } finally {
    Date.now = originalNow;
    globalThis.fetch = originalFetch;
  }
});