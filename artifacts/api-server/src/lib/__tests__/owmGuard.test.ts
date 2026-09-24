import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OpenWeatherGuard, postgresQuotaStore, cooldownMs, validOwmTile } from "../owm-guard.js";

// Mock PostgreSQL transaction/row locking, shared by independent store instances.
function database() {
  let summary = '{"admissions":[],"blockedUntil":0}';
  let time = 100_000;
  let tail = Promise.resolve();
  let failed = false;
  return {
    advance(ms: number) { time += ms; },
    fail() { failed = true; },
    now: () => time,
    connect: async () => {
      if (failed) throw new Error("private database connection details");
      let unlock: () => void = () => {};
      return {
        release() {},
        async query(sql: string, params?: unknown[]) {
          if (sql === "BEGIN") {
            const previous = tail;
            tail = new Promise<void>(resolve => { unlock = resolve; });
            await previous;
          }
          if (sql === "COMMIT" || sql === "ROLLBACK") unlock();
          if (sql.startsWith("SELECT summary")) return { rows: [{ summary }] };
          if (sql.startsWith("SELECT extract")) return { rows: [{ now: time }] };
          if (sql.startsWith("UPDATE")) summary = String(params![1]);
          return { rows: [] };
        },
      };
    },
  };
}
const target = (id = 0) => new URL(`https://api.openweathermap.org/data/2.5/weather?lat=${id}&appid=not-a-real-key`);
const jsonFetch: typeof fetch = async () => new Response('{"weather":[]}');

test("two independent PostgreSQL stores enforce one rolling budget, including boundary", async () => {
  const db = database();
  const stores = [postgresQuotaStore(db.connect), postgresQuotaStore(db.connect)];
  const admitted = await Promise.all(Array.from({ length: 100 }, (_, i) => stores[i % 2].admit()));
  assert.equal(admitted.filter(Boolean).length, 40);
  db.advance(59_999);
  assert.equal(await stores[1].admit(), false);
  db.advance(1);
  assert.equal(await stores[1].admit(), true);
});

test("independent guards share budget; successful JSON cached and concurrent requests coalesced", async () => {
  const db = database();
  let calls = 0;
  const upstream: typeof fetch = async () => { calls++; return jsonFetch(""); };
  const guards = [0, 1].map(() => new OpenWeatherGuard(postgresQuotaStore(db.connect), upstream, db.now));
  await Promise.all(Array.from({ length: 20 }, () => guards[0].request(target())));
  assert.equal(calls, 1);
  await guards[0].request(target());
  assert.equal(calls, 1);
  const results = await Promise.allSettled(Array.from({ length: 60 }, (_, i) => guards[i % 2].request(target(i + 1))));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 39);
  assert.equal(calls, 40);
  db.advance(600_000);
  await guards[0].request(target());
  assert.equal(calls, 41);
});

for (const status of [429, 401]) {
  test(`${status} cooldown survives a new guard and expires; Retry-After honored`, async () => {
    const db = database();
    const first = new OpenWeatherGuard(postgresQuotaStore(db.connect),
      async () => new Response("private upstream message", { status, headers: { "Retry-After": "1200" } }), db.now);
    await assert.rejects(first.request(target()), /temporarily unavailable/);
    let calls = 0;
    const second = new OpenWeatherGuard(postgresQuotaStore(db.connect), async () => { calls++; return jsonFetch(""); }, db.now);
    await assert.rejects(second.request(target(1)));
    db.advance(1_199_999);
    await assert.rejects(second.request(target(2)));
    assert.equal(calls, 0);
    db.advance(1);
    await second.request(target(3));
    assert.equal(calls, 1);
  });
}

test("database failure closes guard without upstream requests or leaking errors", async () => {
  const db = database();
  db.fail();
  let calls = 0;
  const guard = new OpenWeatherGuard(postgresQuotaStore(db.connect), async () => { calls++; return jsonFetch(""); }, db.now);
  await assert.rejects(guard.request(target()), { message: "OpenWeather temporarily unavailable" });
  assert.equal(calls, 0);
});

test("cached successful data survives database outage; cooldown cannot be shortened", async () => {
  const db = database();
  const store = postgresQuotaStore(db.connect);
  const guard = new OpenWeatherGuard(store, jsonFetch, db.now);
  const cached = await guard.request(target());
  await store.cooldown(900_000);
  await postgresQuotaStore(db.connect).cooldown(60_000);
  db.advance(60_000);
  assert.equal(await store.admit(), false);
  db.fail();
  assert.deepEqual(await guard.request(target()), cached);
  await assert.rejects(guard.request(target(1)));
});

test("negative caching retries after five seconds; error bodies never returned", async () => {
  const db = database();
  let calls = 0;
  const guard = new OpenWeatherGuard(postgresQuotaStore(db.connect), async () => {
    calls++;
    return new Response("private", { status: 502 });
  }, db.now);
  await assert.rejects(guard.request(target()));
  await assert.rejects(guard.request(target()));
  assert.equal(calls, 1);
  db.advance(5000);
  await assert.rejects(guard.request(target()));
  assert.equal(calls, 2);
});

test("tiles cached for five minutes; oversized/invalid payload rejected; fetch bounded", async () => {
  const db = database();
  let calls = 0;
  const guard = new OpenWeatherGuard(postgresQuotaStore(db.connect), async (_input, init) => {
    calls++;
    assert.ok(init?.signal);
    assert.equal(init?.redirect, "error");
    return new Response(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));
  }, db.now);
  await guard.request(target(), true);
  db.advance(299_999);
  await guard.request(target(), true);
  assert.equal(calls, 1);
  db.advance(1);
  await guard.request(target(), true);
  assert.equal(calls, 2);
  const invalid = new OpenWeatherGuard(postgresQuotaStore(db.connect), jsonFetch, db.now);
  await assert.rejects(invalid.request(target(), true));
  const large = new OpenWeatherGuard(postgresQuotaStore(db.connect), async () => new Response("x".repeat(524289)), db.now);
  await assert.rejects(large.request(target()));
});

test("Retry-After dates, malformed values and bounds", () => {
  assert.equal(cooldownMs(429, new Date(300_000).toUTCString(), 100_000), 200_000);
  assert.equal(cooldownMs(429, "invalid", 0), 60_000);
  assert.equal(cooldownMs(401, null, 0), 900_000);
  assert.equal(cooldownMs(429, "999999999", 0), 86_400_000);
});

test("tile layer/zoom/coordinates reject abuse before upstream admission", () => {
  assert.ok(validOwmTile("snow", "0", "0", "0"));
  assert.ok(validOwmTile("temp_new", "12", "4095", "4095"));
  for (const args of [
    ["other", "1", "0", "0"], ["snow", "13", "0", "0"],
    ["snow", "12", "4096", "0"], ["snow", "-1", "0", "0"],
    ["snow", "1", "0", "1.png"], ["snow", "1", "01", "0"],
    ["snow", "1", "0", "../0"], ["snow", "1e1", "0", "0"],
  ]) assert.equal(validOwmTile(args[0], args[1], args[2], args[3]), false);
});

test("cache and in-flight growth bounded; thrown network errors sanitized", async () => {
  const store = { admit: async () => true, cooldown: async () => {} };
  let calls = 0;
  const guard = new OpenWeatherGuard(store, async () => { calls++; return jsonFetch(""); });
  for (let i = 0; i < 257; i++) await guard.request(target(i));
  await guard.request(target(0));
  assert.equal(calls, 258);
  let finish!: () => void;
  const waiting = new Promise<void>(resolve => { finish = resolve; });
  const busy = new OpenWeatherGuard(store, async () => { await waiting; return jsonFetch(""); });
  const works = Array.from({ length: 64 }, (_, i) => busy.request(target(i)));
  await assert.rejects(busy.request(target(64)), /busy/);
  finish();
  await Promise.all(works);
  const broken = new OpenWeatherGuard(store, async () => { throw new Error("secret URL from timeout"); });
  await assert.rejects(broken.request(target()), { message: "OpenWeather temporarily unavailable" });
});

test("all three callers use central client; only client owns upstream OWM hosts", () => {
  const sources = [
    ["../openweathermap.ts", 'owmJson("weather"', 'owmJson("forecast"'],
    ["../../routes/regions.ts", 'owmJson("reverse"'],
    ["../../routes/weather-tiles.ts", "owmTile(", 'res.set("Cache-Control", "no-store")'],
  ];
  for (const [file, ...needles] of sources) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(!source.includes("openweathermap.org"));
    for (const needle of needles) assert.ok(source.includes(needle), needle);
  }
});