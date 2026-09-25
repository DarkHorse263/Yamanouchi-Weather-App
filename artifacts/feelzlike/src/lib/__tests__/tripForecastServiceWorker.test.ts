import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../../../public/sw.js", import.meta.url), "utf8");

function route(fetch: typeof globalThis.fetch) {
  const listeners: Record<string, (event: unknown) => void> = {};
  vm.runInNewContext(source, {
    self: {
      location: { origin: "https://example.test" },
      addEventListener: (name: string, handler: (event: unknown) => void) => { listeners[name] = handler; },
    },
    URL, fetch,
    caches: { open: () => { throw new Error("forecast must not access SW cache"); } },
  });
  let result: Promise<Response> | undefined;
  listeners.fetch({
    request: new Request("https://example.test/api/forecast/perisher?elevationM=1800"),
    respondWith: (value: Promise<Response>) => { result = value; },
  });
  assert.ok(result);
  return result;
}

test("offline forecast never becomes an unlabelled cached success", async () => {
  await assert.rejects(route(async () => { throw new Error("offline"); }), /offline/);
});

test("slow forecast waits for labelled server data instead of a SW timeout cache hit", async () => {
  let resolve!: (value: Response) => void;
  const pending = route(async (_request, init) => {
    assert.equal(init?.cache, "reload");
    return new Promise<Response>((done) => { resolve = done; });
  });
  const body = { generatedAt: "2026-09-21T01:30:00Z", _stale: { ageSeconds: 3600 } };
  resolve(new Response(JSON.stringify(body)));
  assert.deepEqual(await (await pending).json(), body);
});

test("personalized weather and elevation responses bypass service-worker cache", () => {
  for (const endpoint of ["/api/weather", "/api/weather/perisher?snowElevationM=1887", "/api/elevation-forecast?lat=1", "/api/town-ensemble?lat=1&lng=1"]) {
    const listeners: Record<string, (event: unknown) => void> = {};
    vm.runInNewContext(source, {
      self: {
        location: { origin: "https://example.test" },
        addEventListener: (name: string, handler: (event: unknown) => void) => { listeners[name] = handler; },
      },
      URL,
      caches: { open: () => { throw new Error("personalized response was cached"); } },
    });
    let intercepted = false;
    listeners.fetch({
      request: new Request(`https://example.test${endpoint}`),
      respondWith: () => { intercepted = true; },
    });
    assert.equal(intercepted, false, endpoint);
  }
});

test("weather provider credential stays outside Vite's client env allowlist", () => {
  const config = readFileSync(new URL("../../../vite.config.ts", import.meta.url), "utf8");
  const envPrefix = config.match(/envPrefix:\s*\[([\s\S]*?)\]/)?.[1];
  assert.ok(envPrefix, "Vite must declare a restricted client env allowlist");
  assert.ok(envPrefix.includes("VITE_CLERK_PUBLISHABLE_KEY"));
  assert.ok(!envPrefix.includes("VITE_OWM_API_KEY"));
  assert.ok(!envPrefix.includes('"VITE_"'));
});