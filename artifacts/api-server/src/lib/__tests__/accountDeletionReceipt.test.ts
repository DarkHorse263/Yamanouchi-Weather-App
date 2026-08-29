import assert from "node:assert/strict";
import test from "node:test";
import { sendAccountDeletionReceipt } from "../accountDeletionReceipt.js";

test("dispatches a branded deletion receipt to the former member", () => {
  let sent: {
    to: string;
    subject: string;
    html: string;
    text: string;
    tag: string;
  } | undefined;

  sendAccountDeletionReceipt("former@example.com", async (message) => {
    sent = message;
    return { delivered: true };
  });

  assert.equal(sent?.to, "former@example.com");
  assert.equal(sent?.tag, "account-deleted");
  assert.match(sent?.subject ?? "", /account was deleted/i);
  assert.match(sent?.html ?? "", /branding\/wordmark-inline\.png/);
  assert.match(sent?.html ?? "", /account and data were deleted/i);
  assert.match(sent?.text ?? "", /powder-alert subscription/i);
});

test("a receipt send failure is contained and does not throw", async () => {
  const originalError = console.error;
  const logged: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    logged.push(args);
  };

  try {
    assert.doesNotThrow(() => {
      sendAccountDeletionReceipt("former@example.com", async () => {
        throw new Error("provider unavailable");
      });
    });

    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(logged.length, 1);
    assert.match(String(logged[0]?.[0]), /non-fatal/);
  } finally {
    console.error = originalError;
  }
});