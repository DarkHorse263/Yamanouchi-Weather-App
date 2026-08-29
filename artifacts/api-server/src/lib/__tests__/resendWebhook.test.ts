import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { verifySvixSignature } from "../../routes/resend-webhook.js";

const secret = `whsec_${Buffer.from("test webhook secret").toString("base64")}`;
const body = Buffer.from(JSON.stringify({ type: "email.bounced", data: { to: ["bad@example.com"] } }));

function signature(id: string, timestamp: string): string {
  const decoded = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return crypto
    .createHmac("sha256", decoded)
    .update(`${id}.${timestamp}.${body.toString("utf8")}`)
    .digest("base64");
}

test("accepts a valid current Svix signature", () => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  assert.equal(
    verifySvixSignature({
      secret,
      id: "msg_test",
      timestamp,
      body,
      signatureHeader: `v1,${signature("msg_test", timestamp)}`,
    }),
    true,
  );
});

test("rejects a changed body and stale timestamp", () => {
  const timestamp = String(Math.floor(Date.now() / 1000));
  assert.equal(
    verifySvixSignature({
      secret,
      id: "msg_test",
      timestamp,
      body: Buffer.from("{}"),
      signatureHeader: `v1,${signature("msg_test", timestamp)}`,
    }),
    false,
  );

  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 301);
  assert.equal(
    verifySvixSignature({
      secret,
      id: "msg_test",
      timestamp: staleTimestamp,
      body,
      signatureHeader: `v1,${signature("msg_test", staleTimestamp)}`,
    }),
    false,
  );
});