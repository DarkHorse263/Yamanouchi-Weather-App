import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

test("production SPA validates authored and catalogue mountain and base-town routes", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const runtimeGlobal = globalThis as typeof globalThis & { __dirname?: string };
  const previousDirname = runtimeGlobal.__dirname;
  runtimeGlobal.__dirname = path.resolve("src");

  const { default: app } = await import("../../app.js");
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const origin = `http://127.0.0.1:${address.port}`;

    const cases = [
      { path: "yamanouchi", id: "shiga-yakebitaiyama", expectedStatus: 200 },
      { path: "yamanouchi", id: "shigakogen-mountain-resort", expectedStatus: 200 },
      { path: "nagano-regional", id: "togakushi-ski-resort", expectedStatus: 200 },
      { path: "nagano-regional", id: "not-a-published-mountain", expectedStatus: 404 },
    ] as const;

    for (const routeKind of ["mountain", "resort"] as const) {
      for (const routeCase of cases) {
        const response = await fetch(`${origin}/${routeCase.path}/${routeKind}/${routeCase.id}`);
        assert.equal(
          response.status,
          routeCase.expectedStatus,
          `${routeKind} route for ${routeCase.path}/${routeCase.id}`,
        );
      }
    }

    const townCases = [
      { path: "nagano-regional/nagano-nagano-nagano", expectedStatus: 200 },
      { path: "niseko/niseko-rankoshi", expectedStatus: 200 },
      { path: "hakuba-valley/hakuba", expectedStatus: 200 },
      { path: "nagano-regional/not-a-published-town", expectedStatus: 404 },
    ] as const;
    for (const routeCase of townCases) {
      const response = await fetch(`${origin}/${routeCase.path}`);
      assert.equal(response.status, routeCase.expectedStatus, `town route for ${routeCase.path}`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousDirname === undefined) Reflect.deleteProperty(runtimeGlobal, "__dirname");
    else runtimeGlobal.__dirname = previousDirname;
  }
});