/**
 * Soft member gate · promo-boundary behaviour (task: confirm the sign-up
 * gate still behaves after the free promo ends on 31 december).
 *
 * Covers, with the promo end in the past (a `now` after the default
 * 2026-12-31 end-of-day, plus a subprocess run with PREMIUM_PROMO_ENDS_AT
 * overridden into the past):
 *   - anonymous requests to gated routes still get 401 AUTH_REQUIRED
 *   - signed-in members get 402 PAYMENT_REQUIRED (real paywall)
 * And during the promo:
 *   - a signed-in member passes every requireEntitlement gate on the
 *     pro tier (the synthetic promo subscription)
 */
import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";

import { isPromoActive, resolvePromoSubscription, PROMO_ENDS_AT, PROMO_STARTS_AT } from "../promo";
import { requireEntitlement, setSubscriptionResolver } from "../../middlewares/require-entitlement";
import { TIER_ENTITLEMENTS, type Entitlement } from "../entitlements";

/**
 * Brand symbol Clerk uses to verify req.auth was installed by its own
 * middleware. Matches `Symbol.for("@clerk/express.auth")` in Clerk's source.
 * We brand the mock auth function so getAuth(req) doesn't throw
 * "Clerk's clerkMiddleware() is required".
 */
const CLERK_AUTH_BRAND = Symbol.for("@clerk/express.auth");

// Fixed clocks around the default promo window (1 Jun 2026 → EOD 31 Dec 2026,
// local time).
const DURING_PROMO = new Date(2026, 6, 30, 12, 0, 0); // 30 Jul 2026
const LAST_MOMENT = new Date(2026, 11, 31, 23, 59, 59, 999); // 31 Dec 2026 EOD
const AFTER_PROMO = new Date(2027, 0, 1, 0, 0, 1); // 1 Jan 2027 00:00:01
const BEFORE_PROMO = new Date(2026, 4, 31, 12, 0, 0); // 31 May 2026

describe("isPromoActive · default window boundaries", () => {
  test("sanity: default boundaries are the documented window", () => {
    assert.ok(PROMO_STARTS_AT && PROMO_ENDS_AT, "default promo boundaries must exist");
    assert.equal(PROMO_STARTS_AT!.getFullYear(), 2026);
    assert.equal(PROMO_ENDS_AT!.getFullYear(), 2026);
    assert.equal(PROMO_ENDS_AT!.getMonth(), 11);
    assert.equal(PROMO_ENDS_AT!.getDate(), 31);
  });

  test("inactive before the start, active during, active at the last ms of 31 dec", () => {
    assert.equal(isPromoActive(BEFORE_PROMO), false);
    assert.equal(isPromoActive(DURING_PROMO), true);
    assert.equal(isPromoActive(LAST_MOMENT), true);
  });

  test("inactive from 1 january 2027", () => {
    assert.equal(isPromoActive(AFTER_PROMO), false);
  });
});

describe("isPromoActive · PREMIUM_PROMO_ENDS_AT env override (fresh process)", () => {
  // The boundaries are read from env at module load, so the override paths
  // need a fresh interpreter. Runs the real module via tsx in a child
  // process. Skipped only if tsx cannot be spawned in this environment.
  function probe(env: Record<string, string>): string {
    const res = spawnSync(
      "npx",
      ["tsx", "src/lib/__tests__/helpers/promo-probe.ts"],
      {
        cwd: path.resolve(TEST_DIR, "../../.."),
        env: { ...process.env, ...env },
        encoding: "utf8",
        timeout: 120_000,
      },
    );
    assert.equal(res.status, 0, `probe failed: ${res.stderr}`);
    return res.stdout.trim();
  }

  test("promo end set in the past → promo inactive", () => {
    assert.equal(probe({ PREMIUM_PROMO_ENDS_AT: "2020-01-01", PREMIUM_PROMO_STARTS_AT: "2019-01-01" }), "inactive");
  });

  test("empty end boundary disables the promo entirely", () => {
    assert.equal(probe({ PREMIUM_PROMO_ENDS_AT: "" }), "inactive");
  });
});

describe("resolvePromoSubscription (the resolver app.ts installs)", () => {
  test("signed-in during promo → synthetic pro sub", () => {
    assert.deepEqual(resolvePromoSubscription(true, DURING_PROMO), { tier: "pro", status: "active" });
  });
  test("anonymous during promo → null (free tier)", () => {
    assert.equal(resolvePromoSubscription(false, DURING_PROMO), null);
  });
  test("signed-in after promo → null (free tier, real paywall)", () => {
    assert.equal(resolvePromoSubscription(true, AFTER_PROMO), null);
  });
  test("anonymous after promo → null", () => {
    assert.equal(resolvePromoSubscription(false, AFTER_PROMO), null);
  });
});

// ── requireEntitlement middleware wired to the real resolver ───────────────

interface CapturedResponse {
  statusCode: number | null;
  body: unknown;
}

function makeRes(): { res: Response; captured: CapturedResponse } {
  const captured: CapturedResponse = { statusCode: null, body: null };
  const res = {
    status(code: number) {
      captured.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      captured.body = payload;
      return this;
    },
  } as unknown as Response;
  return { res, captured };
}

function makeReq(isSignedIn: boolean): Request {
  // req.auth must be a branded callable that returns the Clerk auth object.
  // - typeof req.auth === "function" AND req.auth[CLERK_AUTH_BRAND] === true
  //   are both required by requestHasAuthObject() inside getAuth().
  // - The function is called as req.auth(options) and the return value is
  //   passed through getAuthObjectForAcceptedToken (passthrough when no
  //   acceptsToken constraint is set).
  const userId = isSignedIn ? "user_test_123" : null;
  const sessionClaims = isSignedIn ? { userId } : null;
  // tokenType: "session_token" is REQUIRED — getAuthObjectForAcceptedToken
  // (inside getAuth) checks this against the default acceptsToken constraint
  // (TokenType.SessionToken = "session_token") and returns signedOutAuthObject()
  // (userId: null) when it's absent, even though our mock returns a userId.
  const authFn = Object.assign(
    (_opts?: unknown) => ({
      userId,
      sessionClaims,
      sessionId: isSignedIn ? "sess_test_123" : null,
      tokenType: "session_token" as const,
      has: () => false,
      debug: () => ({}),
    }),
    { [CLERK_AUTH_BRAND]: true },
  );
  return { auth: authFn } as unknown as Request;
}

async function runGate(ent: Entitlement, isSignedIn: boolean, now: Date) {
  setSubscriptionResolver((req) => {
    const auth = getAuth(req);
    return resolvePromoSubscription(!!auth.userId, now);
  });
  const { res, captured } = makeRes();
  let nextCalled = false;
  await requireEntitlement(ent)(makeReq(isSignedIn), res, () => {
    nextCalled = true;
  });
  return { nextCalled, captured };
}

describe("requireEntitlement + promo resolver · during the promo", () => {
  test("signed-in member passes EVERY pro-tier entitlement gate", async () => {
    for (const ent of TIER_ENTITLEMENTS.pro) {
      const { nextCalled, captured } = await runGate(ent, true, DURING_PROMO);
      assert.equal(nextCalled, true, `expected signed-in member to pass gate "${ent}" during promo`);
      assert.equal(captured.statusCode, null);
    }
  });

  test("anonymous visitor gets 401 AUTH_REQUIRED (sign-up prompt), not 402", async () => {
    const { nextCalled, captured } = await runGate("alerts.snow", false, DURING_PROMO);
    assert.equal(nextCalled, false);
    assert.equal(captured.statusCode, 401);
    const body = captured.body as { error: string; signInUrl?: string };
    assert.equal(body.error, "AUTH_REQUIRED");
    assert.ok(body.signInUrl, "401 body must carry the sign-in URL for the client prompt");
  });

  test("team-only entitlement still 402s for a promo member (synthetic sub is pro, not team)", async () => {
    const { nextCalled, captured } = await runGate("api.public", true, DURING_PROMO);
    assert.equal(nextCalled, false);
    assert.equal(captured.statusCode, 402);
  });
});

describe("requireEntitlement + promo resolver · after the promo ends", () => {
  test("anonymous visitor still gets 401 AUTH_REQUIRED (soft gate stays sign-up-first)", async () => {
    const { nextCalled, captured } = await runGate("alerts.snow", false, AFTER_PROMO);
    assert.equal(nextCalled, false);
    assert.equal(captured.statusCode, 401);
    assert.equal((captured.body as { error: string }).error, "AUTH_REQUIRED");
  });

  test("signed-in member without a real sub gets 402 PAYMENT_REQUIRED with upgrade URL", async () => {
    for (const ent of TIER_ENTITLEMENTS.pro.filter((e) => e !== "forecast.basic")) {
      const { nextCalled, captured } = await runGate(ent, true, AFTER_PROMO);
      assert.equal(nextCalled, false, `gate "${ent}" must NOT be open after the promo`);
      assert.equal(captured.statusCode, 402, `gate "${ent}" must 402 for signed-in post-promo`);
      const body = captured.body as { error: string; upgradeUrl?: string };
      assert.equal(body.error, "PAYMENT_REQUIRED");
      assert.ok(body.upgradeUrl, "402 body must carry the upgrade URL");
    }
  });

  test("free-tier entitlement (forecast.basic) stays open for everyone", async () => {
    assert.equal((await runGate("forecast.basic", true, AFTER_PROMO)).nextCalled, true);
    assert.equal((await runGate("forecast.basic", false, AFTER_PROMO)).nextCalled, true);
  });

  test("resolver failure fails CLOSED with 500, not an open gate", async () => {
    setSubscriptionResolver(() => {
      throw new Error("boom");
    });
    const { res, captured } = makeRes();
    let nextCalled = false;
    await requireEntitlement("alerts.snow")(makeReq(true), res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(captured.statusCode, 500);
  });
});

// Leave the module-level resolver in a sane default for any test file that
// runs after this one in the same process.
afterEach(() => {
  setSubscriptionResolver(() => null);
});
