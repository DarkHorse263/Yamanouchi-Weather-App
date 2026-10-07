import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPageServer } from "./serve-pages.mjs";

test("production pages preserve routes, headers, assets and honest HTTP errors", async () => {
  const temp = mkdtempSync(join(tmpdir(), "feelzlike-pages-"));
  const root = join(temp, "public");
  mkdirSync(join(root, "destination"), { recursive: true });
  mkdirSync(join(root, "assets"));
  writeFileSync(join(root, "index.html"), "<html>app</html>");
  writeFileSync(join(root, "destination/index.html"), "<html>destination</html>");
  writeFileSync(join(root, "assets/app-123.js"), "console.log('ok')");
  writeFileSync(join(root, "sw.js"), "// service worker");
  writeFileSync(join(temp, "private.txt"), "private");
  symlinkSync(join(temp, "private.txt"), join(root, "leak.txt"));
  const server = createPageServer({ root, routes: ["/", "/destination", "/account"],
    redirects: { "/old": "/destination/" } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (path, options) => fetch(base + path, { redirect: "manual", ...options });
  try {
    for (const path of ["/", "/destination/", "/sign-in/sso-callback", "/account/"]) {
      const res = await get(path);
      assert.equal(res.status, 200, path);
      assert.equal(res.headers.get("x-content-type-options"), "nosniff");
      assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
      assert.match(res.headers.get("permissions-policy"), /geolocation=\(self\)/);
      assert.match(await res.text(), /<html>/);
    }
    assert.match(await (await get("/destination/")).text(), /destination/);
    const redirect = await get("/destination?utm_source=test");
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get("location"), "/destination/?utm_source=test");
    assert.equal((await get("/old?x=1")).headers.get("location"), "/destination/?x=1");
    for (const path of ["/missing/", "/destination/mountain/fake/", "/assets/missing.js", "/leak.txt", "/app.js.map"]) {
      const res = await get(path);
      assert.equal(res.status, 404, path);
      assert.equal(res.headers.get("x-robots-tag"), "noindex");
    }
    for (const path of ["/%ZZ", "/.env", "/%2e%2e%2fprivate.txt", "//evil.example/", "/foo%5cbar"]) {
      assert.equal((await get(path)).status, 400, path);
    }
    const asset = await get("/assets/app-123.js");
    assert.match(asset.headers.get("content-type"), /javascript/);
    assert.match(asset.headers.get("cache-control"), /immutable/);
    assert.equal((await get("/sw.js")).headers.get("cache-control"), "no-cache");
    assert.equal((await get("/sign-in/sso-callback")).headers.get("cache-control"), "no-store");
    assert.equal((await get("/", { method: "HEAD" })).headers.get("content-length"), "16");
    assert.equal((await get("/", { method: "POST" })).status, 405);
    const range = await get("/assets/app-123.js", { headers: { Range: "bytes=0-6" } });
    assert.equal(range.status, 206);
    assert.equal(await range.text(), "console");
    assert.equal((await get("/", { headers: { Range: "bytes=99999-" } })).status, 416);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    rmSync(temp, { recursive: true, force: true });
  }
});
