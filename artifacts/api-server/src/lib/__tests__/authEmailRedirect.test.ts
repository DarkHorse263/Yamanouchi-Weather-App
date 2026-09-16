import assert from "node:assert/strict";
import { test } from "node:test";
import { authEmailSignInUrl, safeAuthEmailReturnTo } from "../authEmailRedirect.js";
import { issueAuthEmailToken, verifyAuthEmailToken } from "../authEmailTokens.js";

const safe = [
  "/", "/account", "/snowy-mountains/jindabyne?tab=snow#forecast",
  "/search?q=fresh%20snow", "/caf%C3%A9", "/account?tab=alerts%26weather",
  "/mountain/../account",
];
const unsafe: unknown[] = [
  undefined, null, 42, "", "account", "https://evil.example",
  "https://internal.invalid/account", "//evil.example", "///evil.example",
  "/\\evil.example", "\\\\evil.example", "/foo\\bar", "/\nevil.example",
  "/\t/evil.example", "/account\r\nLocation:https://evil.example", "/\0",
  "/\u007f", "/\u0085", "/%2fevil.example", "/%5cevil.example",
  "/%2F%2Fevil.example", "/%255cevil.example", "/%252fevil.example",
  "/%0a/evil.example", "/%250d", "/%00", "/%7f", "/%C2%85",
  "%2Faccount", "/%zz", "/%", "/%FF", "/a/..//evil.example",
  "/a/%2e%2e//evil.example", "/a/%252e%252e//evil.example",
  "/account?next=%5cevil.example", "/" + "x".repeat(2048),
  "/" + "%25".repeat(10) + "5c",
];

test("ordinary internal paths survive URL query encoding unchanged", () => {
  for (const path of safe) {
    assert.equal(safeAuthEmailReturnTo(path), path);
    const url = new URL(authEmailSignInUrl("https://app.example", { returnTo: path }));
    assert.equal(url.origin, "https://app.example");
    assert.equal(url.pathname, "/sign-in");
    assert.equal(url.searchParams.get("redirect_url"), path === "/" ? null : path);
  }
});

test("unsafe and encoded destinations fall back to home", () => {
  for (const path of unsafe) {
    assert.equal(safeAuthEmailReturnTo(path), "/", JSON.stringify(path));
    assert.equal(authEmailSignInUrl("https://app.example", { returnTo: path }),
      "https://app.example/sign-in");
  }
});

test("valid legacy signatures do not bypass destination checks", () => {
  for (const path of [...safe, ...unsafe.filter((v): v is string =>
    typeof v === "string" && v.length < 1000)]) {
    const token = issueAuthEmailToken("fixture@example.invalid", path);
    assert.deepEqual(verifyAuthEmailToken(token), {
      ok: true, email: "fixture@example.invalid", returnTo: safeAuthEmailReturnTo(path),
    });
  }
  const token = issueAuthEmailToken("fixture@example.invalid", "/account");
  assert.deepEqual(verifyAuthEmailToken(token + "x"), { ok: false, reason: "bad_signature" });
  assert.deepEqual(verifyAuthEmailToken("not-a-token"), { ok: false, reason: "malformed" });
});

test("configured origin is trusted configuration, but must be a bare web origin", () => {
  for (const origin of ["https://app.example", "https://app.example/", "http://localhost:5173"]) {
    assert.equal(new URL(authEmailSignInUrl(origin, { notice: "invalid" })).origin,
      new URL(origin).origin);
  }
  for (const origin of [
    "javascript:alert(1)", "//evil.example", "https://user:pass@app.example",
    "https://app.example/path", "https://app.example?x=1", "https://app.example#x",
    "https://app.example\\evil", "https://app.example\n", " https://app.example",
  ]) assert.throws(() => authEmailSignInUrl(origin), origin);
  for (const notice of ["invalid", "expired", "error"] as const) {
    assert.equal(authEmailSignInUrl("https://app.example", { notice }),
      `https://app.example/sign-in?notice=${notice}`);
  }
});