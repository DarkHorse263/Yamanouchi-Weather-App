import assert from "node:assert/strict";
import express from "express";
import test, { type TestContext } from "node:test";

/*
 * These tests deliberately mount the production routers rather than calling
 * copied handler functions.  The database object is patched after the
 * modules load, so no connection (or database credentials) is needed.  The
 * email sender's no-provider path is used as the email double: it records the
 * message to the console and never makes a network request.
 */
process.env.DATABASE_URL ??= "postgresql://localhost:5432/feelzlike_test";
process.env.ALERT_TOKEN_SECRET = "alert-access-control-test-secret";
process.env.RESEND_API_KEY = "";

const [
  { default: subscriptionsRouter },
  { default: pushRouter },
  tokenModule,
  dbModule,
] = await Promise.all([
  import("../../routes/alerts-subscriptions.js"),
  import("../../routes/alerts-push.js"),
  import("../alertTokens.js"),
  import("@workspace/db"),
]);

const { issueToken, isTokenStillValid, verifyToken } = tokenModule;
const { alertSubscribersTable, subscriberSuppressionsTable, db } = dbModule;

type AlertRow = {
  id: string;
  email: string;
  regions: string[];
  mountains: string[];
  snowfallThresholdCm: number;
  horizonHours: number;
  delivery: string;
  timezone: string;
  profileToken: string | null;
  consentCapturedAt: Date | null;
  consentPolicyVersion: string | null;
  consentSurface: string | null;
  verifiedAt: Date | null;
  unsubscribedAt: Date | null;
  unsubscribeReason: string | null;
  lastAlertedAt: Date | null;
  tokensInvalidatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbState = {
  row?: AlertRow;
  insertPayloads: unknown[];
  updatePayloads: Record<string, unknown>[];
  insertConflictTargets: unknown[];
  pushInsertCount: number;
  pushDeleteCount: number;
  transactionCount: number;
  rowLocks: string[];
  lockScheduler?: LockScheduler;
  retainedAlertBlock?: boolean;
  advisoryLockCount?: number;
};

function freshRow(overrides: Partial<AlertRow> = {}): AlertRow {
  const now = new Date("2026-09-14T00:00:00.000Z");
  return {
    id: "subscriber-1",
    email: "owner@example.com",
    regions: ["snowy-mountains"],
    mountains: [],
    snowfallThresholdCm: 15,
    horizonHours: 48,
    delivery: "email",
    timezone: "UTC",
    profileToken: null,
    consentCapturedAt: null,
    consentPolicyVersion: null,
    consentSurface: null,
    verifiedAt: null,
    unsubscribedAt: null,
    unsubscribeReason: null,
    lastAlertedAt: null,
    tokensInvalidatedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

type LockScheduler = {
  acquire(): Promise<void>;
  waitForQueued(count: number): Promise<void>;
  waitForGranted(count: number): Promise<void>;
  releaseCurrent(): void;
  complete(): void;
};

function createLockScheduler(): LockScheduler {
  type Entry = {
    resolve: () => void;
    released: boolean;
  };
  let current: Entry | null = null;
  const queue: Entry[] = [];
  let queuedCount = 0;
  let grantedCount = 0;
  const queuedWaiters: Array<() => void> = [];
  const grantedWaiters: Array<() => void> = [];

  const notify = (waiters: Array<() => void>) => {
    for (const resolve of waiters.splice(0)) resolve();
  };
  const grantNext = () => {
    if (current || queue.length === 0) return;
    current = queue.shift()!;
    grantedCount += 1;
    notify(grantedWaiters);
  };

  return {
    acquire() {
      queuedCount += 1;
      notify(queuedWaiters);
      let resolve!: () => void;
      const promise = new Promise<void>((next) => {
        resolve = next;
      });
      queue.push({ resolve, released: false });
      grantNext();
      return promise;
    },
    waitForQueued(count) {
      if (queuedCount >= count) return Promise.resolve();
      return new Promise<void>((resolve) => queuedWaiters.push(resolve));
    },
    waitForGranted(count) {
      if (grantedCount >= count) return Promise.resolve();
      return new Promise<void>((resolve) => grantedWaiters.push(resolve));
    },
    releaseCurrent() {
      assert.ok(current, "a transaction must hold the simulated row lock");
      assert.equal(current.released, false, "the simulated lock was already released");
      current.released = true;
      current.resolve();
    },
    complete() {
      assert.ok(current, "a transaction must hold the simulated row lock");
      assert.equal(current.released, true, "releaseCurrent must precede transaction completion");
      current = null;
      grantNext();
    },
  };
}

function queryChain<T>(
  getRows: () => T[],
  onLock: (mode: string) => void | Promise<void> = () => undefined,
  onFrom: (table: unknown) => void = () => undefined,
): any {
  let lockReady: Promise<void> | undefined;
  const chain: any = {
    from(_table: unknown) {
      onFrom(_table);
      return chain;
    },
    where(_condition: unknown) {
      return chain;
    },
    limit(_count: number) {
      return chain;
    },
    orderBy(..._ordering: unknown[]) {
      return chain;
    },
    for(mode: string) {
      lockReady = Promise.resolve(onLock(mode));
      return chain;
    },
    then(
      onFulfilled: (value: T[]) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) {
      return (lockReady ?? Promise.resolve())
        .then(() => getRows())
        .then(onFulfilled, onRejected);
    },
    catch(onRejected: (reason: unknown) => unknown) {
      return (lockReady ?? Promise.resolve())
        .then(() => getRows())
        .catch(onRejected);
    },
    finally(onFinally: () => void) {
      return (lockReady ?? Promise.resolve())
        .then(() => getRows())
        .finally(onFinally);
    },
  };
  return chain;
}

function patchDatabase(t: TestContext, state: DbState): void {
  const target = db as unknown as Record<string, (...args: any[]) => any>;
  const originals = new Map<string, (...args: any[]) => any>();
  const patch = (name: string, implementation: (...args: any[]) => any) => {
    originals.set(name, target[name]!);
    target[name] = implementation;
  };

  patch("insert", (table: unknown) => {
    let values: Record<string, unknown> | undefined;
    const builder: any = {
      values(nextValues: Record<string, unknown>) {
        values = nextValues;
        return builder;
      },
      onConflictDoNothing(options: { target?: unknown }) {
        state.insertConflictTargets.push(options.target);
        return builder;
      },
      onConflictDoUpdate(_options: unknown) {
        return Promise.resolve();
      },
      async returning(_projection: unknown) {
        if (table !== alertSubscribersTable) return [];
        assert.ok(values);
        state.insertPayloads.push(values);
        if (state.row && state.row.email === values.email) return [];
        state.row = freshRow({
          id: `subscriber-${state.insertPayloads.length}`,
          email: String(values.email),
          regions: values.regions as string[],
          mountains: values.mountains as string[],
          snowfallThresholdCm: values.snowfallThresholdCm as number,
          horizonHours: values.horizonHours as number,
          delivery: values.delivery as string,
          timezone: values.timezone as string,
          consentCapturedAt: values.consentCapturedAt as Date,
          consentPolicyVersion: values.consentPolicyVersion as string,
          consentSurface: values.consentSurface as string,
        });
        return [state.row];
      },
    };
    return builder;
  });

  patch("select", (...selection: unknown[]) => {
    return queryChain(() => {
      // The email sender supplies a projection and selects the delivery
      // incidents table.  Returning no incidents keeps it in its local
      // (non-delivery) test mode.
      if (selection.length > 0) {
        if (state.row) {
          return [{
            tokensInvalidatedAt: state.row.tokensInvalidatedAt,
            unsubscribedAt: state.row.unsubscribedAt,
          }];
        }
        return [];
      }
      return state.row ? [state.row] : [];
    });
  });

  patch("update", (_table: unknown) => {
    let values: Record<string, unknown> = {};
    const builder: any = {
      set(nextValues: Record<string, unknown>) {
        values = nextValues;
        state.updatePayloads.push(values);
        return builder;
      },
      where(_condition: unknown) {
        if (state.row) Object.assign(state.row, values);
        return Promise.resolve([]);
      },
    };
    return builder;
  });

  patch("transaction", async (callback: (tx: unknown) => Promise<unknown>) => {
    state.transactionCount += 1;
    let transactionHasLock = false;
    const tx = {
      execute: async () => {
        state.advisoryLockCount = (state.advisoryLockCount ?? 0) + 1;
        return { rows: [] };
      },
      select: (...selection: unknown[]) => {
        let selectedTable: unknown;
        return queryChain<AlertRow | { key: string } | Pick<AlertRow, "id" | "tokensInvalidatedAt" | "unsubscribedAt">>(() => {
          if (selectedTable === subscriberSuppressionsTable) {
            assert.ok(state.advisoryLockCount, "suppression lookup must follow the retention advisory lock");
            return state.retainedAlertBlock ? [{ key: "fixture-retained-hmac" }] : [];
          }
          if (!state.row) return [];
          if (selection.length > 0) {
            return [{
              id: state.row.id,
              tokensInvalidatedAt: state.row.tokensInvalidatedAt,
              unsubscribedAt: state.row.unsubscribedAt,
            }];
          }
          return [state.row];
        }, (mode) => {
          transactionHasLock = true;
          state.rowLocks.push(mode);
          return state.lockScheduler?.acquire();
        }, (table) => { selectedTable = table; });
      },
      update: (_table: unknown) => {
        let values: Record<string, unknown> = {};
        const builder: any = {
          set(nextValues: Record<string, unknown>) {
            values = nextValues;
            state.updatePayloads.push(values);
            return builder;
          },
          where(_condition: unknown) {
            if (state.row) Object.assign(state.row, values);
            return builder;
          },
          returning() {
            return Promise.resolve(state.row ? [state.row] : []);
          },
          then(
            onFulfilled: (value: unknown[]) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve([]).then(onFulfilled, onRejected);
          },
          catch(onRejected: (reason: unknown) => unknown) {
            return Promise.resolve([]).catch(onRejected);
          },
          finally(onFinally: () => void) {
            return Promise.resolve([]).finally(onFinally);
          },
        };
        return builder;
      },
      insert: (_table: unknown) => {
        if (_table === alertSubscribersTable) return target.insert!(_table);
        const builder: any = {
          values(_values: unknown) {
            state.pushInsertCount += 1;
            return builder;
          },
          onConflictDoUpdate(_options: unknown) {
            return Promise.resolve();
          },
        };
        return builder;
      },
      delete: (_table: unknown) => ({
        where(_condition: unknown) {
          state.pushDeleteCount += 1;
          return Promise.resolve([]);
        },
      }),
    };
    try {
      return await callback(tx);
    } finally {
      if (transactionHasLock) state.lockScheduler?.complete();
    }
  });

  t.after(() => {
    for (const [name, original] of originals) target[name] = original;
  });
}

function captureEmailOutput(t: TestContext): unknown[][] {
  const output: unknown[][] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args);
  };
  t.after(() => {
    console.log = original;
  });
  return output;
}

async function startServer(t: TestContext): Promise<string> {
  const app = express();
  app.use(express.json());
  app.use(subscriptionsRouter);
  app.use(pushRouter);
  const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return `http://127.0.0.1:${address.port}`;
}

async function request(
  origin: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ status: number; body: Record<string, any>; headers: Headers }> {
  const response = await fetch(`${origin}${path}`, {
    method: init.method ?? "GET",
    headers: init.body === undefined ? undefined : { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return {
    status: response.status,
    body: (await response.json()) as Record<string, any>,
    headers: response.headers,
  };
}

function subscribeBody(email: string) {
  return {
    email,
    consent: true,
    regions: ["snowy-mountains"],
    mountains: [],
    snowfallThresholdCm: 22,
    horizonHours: 72,
    delivery: "both",
    timezone: "Australia/Sydney",
  };
}

function manageBody() {
  return {
    regions: ["snowy-mountains"],
    mountains: [],
    snowfallThresholdCm: 20,
    horizonHours: 48,
    delivery: "email",
    timezone: "UTC",
  };
}

function pushBody(endpoint = "https://push.example.test/endpoint") {
  return {
    endpoint,
    keys: { p256dh: "p256dh", auth: "auth" },
  };
}

function mutationState(
  scheduler: LockScheduler,
  overrides: Partial<AlertRow> = {},
): DbState {
  return {
    row: freshRow({ id: "race-subscriber", verifiedAt: new Date("2026-09-13T00:00:00.000Z"), ...overrides }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
    lockScheduler: scheduler,
  };
}

async function runLockedRace(
  t: TestContext,
  first: "mutation" | "unsubscribe",
  mutationPath: string,
  mutationInit: { method: string; body: unknown },
): Promise<{
  state: DbState;
  mutationResponse: Awaited<ReturnType<typeof request>>;
  unsubscribeResponse: Awaited<ReturnType<typeof request>>;
}> {
  const scheduler = createLockScheduler();
  const state = mutationState(scheduler);
  patchDatabase(t, state);
  const origin = await startServer(t);
  const row = state.row;
  assert.ok(row);
  const token = issueToken(row.id, "manage");
  const mutation = () => request(origin, `${mutationPath}?token=${encodeURIComponent(token)}`, mutationInit);
  const unsubscribe = () => request(origin, `/alerts/unsubscribe?token=${encodeURIComponent(token)}`, {
    method: "POST",
    body: { reason: "requested" },
  });

  const firstRequest = first === "mutation" ? mutation() : unsubscribe();
  await scheduler.waitForGranted(1);
  const secondRequest = first === "mutation" ? unsubscribe() : mutation();
  await scheduler.waitForQueued(2);

  // The first transaction has acquired the simulated row lock but is paused
  // before its SELECT resolves. Let it finish, then let the second transaction
  // acquire the lock and observe the committed first transaction.
  scheduler.releaseCurrent();
  const firstResponse = await firstRequest;
  scheduler.releaseCurrent();
  const secondResponse = await secondRequest;

  return {
    state,
    mutationResponse: first === "mutation" ? firstResponse : secondResponse,
    unsubscribeResponse: first === "mutation" ? secondResponse : firstResponse,
  };
}

test("POST subscribe rejects an existing verified row without email or writes", async (t) => {
  const state: DbState = {
    row: freshRow({ verifiedAt: new Date("2026-09-13T00:00:00.000Z") }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);
  const before = structuredClone(state.row);

  const response = await request(origin, "/alerts/subscribe", {
    method: "POST",
    body: subscribeBody(state.row!.email),
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.error, "SUBSCRIPTION_EXISTS");
  assert.deepEqual(state.row, before);
  assert.equal(state.updatePayloads.length, 0);
  assert.equal(emailOutput.length, 0);
  assert.equal(state.insertConflictTargets.length, 1);
  assert.equal(state.insertConflictTargets[0], alertSubscribersTable.email);
});

test("POST subscribe refuses a retained block after profile deletion without inserting or emailing", async (t) => {
  const state: DbState = {
    retainedAlertBlock: true,
    insertPayloads: [], updatePayloads: [], insertConflictTargets: [],
    pushInsertCount: 0, pushDeleteCount: 0, transactionCount: 0, rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);
  const response = await request(origin, "/alerts/subscribe", {
    method: "POST", body: subscribeBody("previously-deleted@example.com"),
  });
  assert.equal(response.status, 409);
  assert.equal(response.body.error, "SUBSCRIPTION_EXISTS");
  assert.equal(state.row, undefined);
  assert.equal(state.transactionCount, 1);
  assert.equal(state.advisoryLockCount, 1);
  assert.equal(state.insertPayloads.length, 0);
  assert.equal(state.updatePayloads.length, 0);
  assert.equal(emailOutput.length, 0);
});

test("POST subscribe rejects an unsubscribed row even when its token cutoff is absent", async (t) => {
  const state: DbState = {
    row: freshRow({
      unsubscribedAt: new Date("2026-09-13T00:00:00.000Z"),
      unsubscribeReason: "email_link",
      tokensInvalidatedAt: null,
    }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);
  const before = structuredClone(state.row);

  const response = await request(origin, "/alerts/subscribe", {
    method: "POST",
    body: subscribeBody(state.row!.email),
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.error, "SUBSCRIPTION_EXISTS");
  assert.deepEqual(state.row, before);
  assert.equal(state.updatePayloads.length, 0);
  assert.equal(emailOutput.length, 0);
});

test("POST subscribe resends a pending verification without changing saved values", async (t) => {
  const state: DbState = {
    row: freshRow({
      email: "pending@example.com",
      regions: ["hakuba-valley"],
      mountains: ["hakuba-47"],
      snowfallThresholdCm: 9,
      horizonHours: 24,
      delivery: "email",
      timezone: "Asia/Tokyo",
    }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);
  const before = structuredClone(state.row);

  const response = await request(origin, "/alerts/subscribe", {
    method: "POST",
    body: subscribeBody(state.row!.email),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "verification_sent");
  assert.equal(response.body.emailDelivered, false);
  assert.deepEqual(state.row, before);
  assert.equal(state.row!.consentCapturedAt, null);
  assert.equal(state.row!.consentPolicyVersion, null);
  assert.equal(state.row!.consentSurface, null);
  assert.equal(state.updatePayloads.length, 0);
  assert.equal(state.insertConflictTargets[0], alertSubscribersTable.email);
  assert.equal(emailOutput.length, 1);
  assert.match(String(emailOutput[0]?.[0]), /\[emailSender\].*would send/i);
});

test("POST subscribe creates a new pending row and sends its verification", async (t) => {
  const state: DbState = {
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);
  const before = Date.now();

  const response = await request(origin, "/alerts/subscribe", {
    method: "POST",
    body: subscribeBody("New.User@Example.com"),
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, "verification_sent");
  assert.equal(response.body.emailDelivered, false);
  assert.ok(state.row);
  assert.equal(state.row.email, "new.user@example.com");
  assert.deepEqual(state.row.regions, ["snowy-mountains"]);
  assert.equal(state.row.snowfallThresholdCm, 22);
  assert.equal(state.row.horizonHours, 72);
  assert.equal(state.row.delivery, "both");
  assert.equal(state.row.timezone, "Australia/Sydney");
  assert.equal(state.row.consentCapturedAt instanceof Date, true);
  assert.ok(state.row.consentCapturedAt!.getTime() >= before);
  assert.ok(state.row.consentCapturedAt!.getTime() <= Date.now());
  assert.equal(state.row.consentPolicyVersion, "2026-09-23");
  assert.equal(state.row.consentSurface, "api:/alerts/subscribe");
  assert.equal(state.updatePayloads.length, 0);
  assert.equal(state.insertConflictTargets.length, 1);
  assert.equal(state.insertConflictTargets[0], alertSubscribersTable.email);
  assert.equal(emailOutput.length, 1);
});

test("POST subscribe requires explicit consent and records no inferred evidence", async (t) => {
  const state: DbState = {
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const emailOutput = captureEmailOutput(t);
  const origin = await startServer(t);

  const response = await request(origin, "/alerts/subscribe", {
    method: "POST",
    body: { ...subscribeBody("no-consent@example.com"), consent: false },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, "CONSENT_REQUIRED");
  assert.equal(state.row, undefined);
  assert.equal(state.insertPayloads.length, 0);
  assert.equal(emailOutput.length, 0);
});

test("tampered management token cannot read or change subscriber data", async (t) => {
  const state: DbState = {
    row: freshRow({ verifiedAt: new Date("2026-09-13T00:00:00.000Z") }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const origin = await startServer(t);
  const valid = issueToken(state.row!.id, "manage");
  // Change significant signature bits, not the final base64url character's
  // potentially unused padding bits (which can decode to the same signature).
  const [payload, signature] = valid.split(".");
  const tampered = `${payload}.${signature!.startsWith("a") ? "b" : "a"}${signature!.slice(1)}`;

  const read = await request(origin, `/alerts/manage?token=${encodeURIComponent(tampered)}`);
  const write = await request(origin, `/alerts/manage?token=${encodeURIComponent(tampered)}`, {
    method: "PUT",
    body: { ...manageBody(), regions: ["hakuba-valley"] },
  });

  assert.equal(read.status, 400);
  assert.equal(read.body.error, "INVALID_TOKEN");
  assert.equal(write.status, 400);
  assert.equal(write.body.error, "INVALID_TOKEN");
  assert.equal(state.row!.regions[0], "snowy-mountains");
  assert.equal(state.updatePayloads.length, 0);
});

test("GET verify verifies a pending subscriber and mints a management token in a locked transaction", async (t) => {
  const state: DbState = {
    row: freshRow({ id: "verify-me", email: "verify@example.com" }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const origin = await startServer(t);
  const row = state.row;
  assert.ok(row);
  const token = issueToken(row.id, "verify");

  const response = await request(origin, `/alerts/verify?token=${encodeURIComponent(token)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.email, row.email);
  assert.equal(typeof response.body.manageToken, "string");
  assert.equal(row.verifiedAt instanceof Date, true);
  assert.equal(state.transactionCount, 1);
  assert.deepEqual(state.rowLocks, ["update"]);
  assert.equal(state.updatePayloads.length, 1);
  assert.deepEqual(Object.keys(state.updatePayloads[0]!), ["verifiedAt"]);
  const manage = verifyToken(response.body.manageToken, "manage");
  assert.equal(manage.ok, true);
  if (manage.ok) assert.equal(manage.payload.sub, row.id);
});

test("GET verify rejects an unsubscribed row without minting or writing", async (t) => {
  const state: DbState = {
    row: freshRow({
      id: "revoked-verify",
      unsubscribedAt: new Date("2026-09-14T00:00:00.000Z"),
      tokensInvalidatedAt: new Date("2026-09-14T00:00:00.000Z"),
    }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const origin = await startServer(t);
  const row = state.row;
  assert.ok(row);
  const token = issueToken(row.id, "verify");

  const response = await request(origin, `/alerts/verify?token=${encodeURIComponent(token)}`);

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal("manageToken" in response.body, false);
  assert.equal(state.updatePayloads.length, 0);
  assert.deepEqual(state.rowLocks, ["update"]);
});

test("GET verify rejects a token issued in the same cutoff second", async (t) => {
  const state: DbState = {
    row: freshRow({ id: "same-second-verify" }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const origin = await startServer(t);
  const row = state.row;
  assert.ok(row);
  const token = issueToken(row.id, "verify");
  const checked = verifyToken(token, "verify");
  assert.equal(checked.ok, true);
  if (!checked.ok) return;
  row.tokensInvalidatedAt = new Date(checked.payload.iat * 1000 + 999);

  const response = await request(origin, `/alerts/verify?token=${encodeURIComponent(token)}`);

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.updatePayloads.length, 0);
  assert.deepEqual(state.rowLocks, ["update"]);
});

test("isTokenStillValid treats equality with the floored cutoff second as revoked", () => {
  const cutoff = new Date("2026-09-14T00:00:05.999Z");
  const cutoffSecond = Math.floor(cutoff.getTime() / 1000);
  assert.equal(isTokenStillValid({ iat: cutoffSecond }, cutoff), false);
  assert.equal(isTokenStillValid({ iat: cutoffSecond + 1 }, cutoff), true);
  assert.equal(isTokenStillValid({ iat: cutoffSecond }, null), true);
});

test("unsubscribe serializes on the subscriber row and revokes manage and push access", async (t) => {
  const state: DbState = {
    row: freshRow({ id: "unsubscribe-me", verifiedAt: new Date("2026-09-13T00:00:00.000Z") }),
    insertPayloads: [],
    updatePayloads: [],
    insertConflictTargets: [],
    pushInsertCount: 0,
    pushDeleteCount: 0,
    transactionCount: 0,
    rowLocks: [],
  };
  patchDatabase(t, state);
  const origin = await startServer(t);
  const row = state.row;
  assert.ok(row);
  const manageToken = issueToken(row.id, "manage");

  const unsubscribed = await request(
    origin,
    `/alerts/unsubscribe?token=${encodeURIComponent(manageToken)}`,
    { method: "POST", body: { reason: "requested" } },
  );

  assert.equal(unsubscribed.status, 200);
  assert.equal(state.transactionCount, 1);
  assert.deepEqual(state.rowLocks, ["update"]);
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.equal(state.row!.unsubscribeReason, "requested");
  assert.equal(state.row!.tokensInvalidatedAt instanceof Date, true);

  const writesAfterUnsubscribe = state.updatePayloads.length;
  const managePut = await request(origin, `/alerts/manage?token=${encodeURIComponent(manageToken)}`, {
    method: "PUT",
    body: manageBody(),
  });
  assert.equal(managePut.status, 400);
  assert.deepEqual(managePut.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.updatePayloads.length, writesAfterUnsubscribe);

  const manage = await request(origin, `/alerts/manage?token=${encodeURIComponent(manageToken)}`);
  assert.equal(manage.status, 400);
  assert.deepEqual(manage.body, { error: "INVALID_TOKEN", reason: "revoked" });

  const push = await request(origin, `/alerts/push/subscribe?token=${encodeURIComponent(manageToken)}`, {
    method: "POST",
    body: pushBody(),
  });
  assert.equal(push.status, 400);
  assert.deepEqual(push.body, { error: "INVALID_TOKEN", reason: "revoked" });
  const pushDelete = await request(origin, `/alerts/push/subscribe?token=${encodeURIComponent(manageToken)}`, {
    method: "DELETE",
    body: { endpoint: "https://push.example.test/endpoint" },
  });
  assert.equal(pushDelete.status, 400);
  assert.deepEqual(pushDelete.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.pushInsertCount, 0);
  assert.equal(state.pushDeleteCount, 0);
  assert.equal(state.updatePayloads.length, 1);
});

test("manage PUT commits before a later unsubscribe when it wins the row lock", async (t) => {
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "mutation",
    "/alerts/manage",
    { method: "PUT", body: manageBody() },
  );

  assert.equal(mutationResponse.status, 200);
  assert.equal(mutationResponse.body.ok, true);
  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(state.row!.regions[0], "snowy-mountains");
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.equal(state.updatePayloads.length, 2);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});

test("manage PUT is denied without a write when unsubscribe wins the row lock", async (t) => {
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "unsubscribe",
    "/alerts/manage",
    { method: "PUT", body: { ...manageBody(), regions: ["hakuba-valley"] } },
  );

  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(mutationResponse.status, 400);
  assert.deepEqual(mutationResponse.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.row!.regions[0], "snowy-mountains");
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.equal(state.updatePayloads.length, 1);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});

test("push subscribe commits before a later unsubscribe when it wins the row lock", async (t) => {
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "mutation",
    "/alerts/push/subscribe",
    { method: "POST", body: pushBody("https://push.example.test/mutation-first") },
  );

  assert.equal(mutationResponse.status, 200);
  assert.equal(mutationResponse.body.ok, true);
  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(state.pushInsertCount, 1);
  assert.equal(state.updatePayloads.length, 1);
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});

test("push subscribe is denied without a write when unsubscribe wins the row lock", async (t) => {
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "unsubscribe",
    "/alerts/push/subscribe",
    { method: "POST", body: pushBody("https://push.example.test/unsubscribe-first") },
  );

  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(mutationResponse.status, 400);
  assert.deepEqual(mutationResponse.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.pushInsertCount, 0);
  assert.equal(state.updatePayloads.length, 1);
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});

test("push delete commits before a later unsubscribe when it wins the row lock", async (t) => {
  const endpoint = "https://push.example.test/delete-mutation-first";
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "mutation",
    "/alerts/push/subscribe",
    { method: "DELETE", body: { endpoint } },
  );

  assert.equal(mutationResponse.status, 200);
  assert.equal(mutationResponse.body.ok, true);
  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(state.pushDeleteCount, 1);
  assert.equal(state.updatePayloads.length, 1);
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});

test("push delete is denied without a write when unsubscribe wins the row lock", async (t) => {
  const endpoint = "https://push.example.test/delete-unsubscribe-first";
  const { state, mutationResponse, unsubscribeResponse } = await runLockedRace(
    t,
    "unsubscribe",
    "/alerts/push/subscribe",
    { method: "DELETE", body: { endpoint } },
  );

  assert.equal(unsubscribeResponse.status, 200);
  assert.equal(mutationResponse.status, 400);
  assert.deepEqual(mutationResponse.body, { error: "INVALID_TOKEN", reason: "revoked" });
  assert.equal(state.pushDeleteCount, 0);
  assert.equal(state.updatePayloads.length, 1);
  assert.equal(state.row!.unsubscribedAt instanceof Date, true);
  assert.deepEqual(state.rowLocks, ["update", "update"]);
});