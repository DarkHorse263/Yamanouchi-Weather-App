import assert from "node:assert/strict";
import test from "node:test";

test("production alert tokens fail closed when the signing secret is unavailable", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.ALERT_TOKEN_SECRET;
  process.env.NODE_ENV = "production";
  delete process.env.ALERT_TOKEN_SECRET;

  try {
    const tokens = await import(`../alertTokens.js?unconfigured=${Date.now()}`);

    assert.deepEqual(tokens.verifyToken("anything", "manage"), {
      ok: false,
      reason: "unavailable",
    });
    assert.throws(
      () => tokens.issueToken("subscriber-1", "verify"),
      (error: unknown) =>
        error instanceof tokens.AlertTokenConfigurationError &&
        (error as InstanceType<typeof tokens.AlertTokenConfigurationError>).code ===
          "ALERT_TOKEN_SERVICE_UNAVAILABLE",
    );
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret === undefined) delete process.env.ALERT_TOKEN_SECRET;
    else process.env.ALERT_TOKEN_SECRET = originalSecret;
  }
});