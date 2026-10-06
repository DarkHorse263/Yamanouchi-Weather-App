import assert from "node:assert/strict";
import test from "node:test";
import { fetchOpenMeteo } from "../openMeteoClient";
import { redactWeatherCredentials } from "../redactWeatherCredentials";

test("paid endpoint, secret safety, abort options and missing-key failure", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPEN_METEO_API_KEY;
  try {
    process.env.OPEN_METEO_API_KEY = "test-only-key";
    let calls = 0;
    const signal = new AbortController().signal;
    globalThis.fetch = async (input, init) => {
      calls++;
      const url = new URL(String(input));
      assert.equal(url.hostname, "customer-api.open-meteo.com");
      assert.equal(url.searchParams.get("apikey"), "test-only-key");
      assert.equal(url.searchParams.get("models"), "gfs_seamless");
      assert.equal(init?.signal, signal);
      assert.equal(init?.redirect, "error");
      return Response.json({ current: { temperature_2m: 2 } });
    };
    const result = await fetchOpenMeteo("https://api.open-meteo.com/v1/forecast?models=gfs_seamless", { signal });
    assert.equal(result.url, "");
    assert.equal((await result.json()).current.temperature_2m, 2);
    delete process.env.OPEN_METEO_API_KEY;
    await assert.rejects(fetchOpenMeteo("https://api.open-meteo.com/v1/forecast"), /not configured/);
    assert.equal(calls, 1);
    process.env.OPEN_METEO_API_KEY = "test-only-key";
    globalThis.fetch = async () => { throw new Error("https://example.test/?apikey=test-only-key"); };
    await assert.rejects(fetchOpenMeteo("https://api.open-meteo.com/v1/forecast"), e => !String(e).includes("test-only-key"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPEN_METEO_API_KEY;
    else process.env.OPEN_METEO_API_KEY = originalKey;
  }
});

test("telemetry removes API key from nested URLs and fields", () => {
  const result = redactWeatherCredentials({ spans: [{ url: "https://example.test/?apikey=test-only-key&x=1", apikey: "test-only-key" }] });
  assert.ok(!JSON.stringify(result).includes("test-only-key"));
});
