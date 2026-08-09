/**
 * requireAuth · bridge algorithm tests
 *
 * Tests the REAL `resolveDbUser` function exported from requireAuth.ts —
 * not a reimplementation of it. Fake dependency implementations (BridgeDeps)
 * drive an in-memory user store so no real database or Clerk SDK is needed.
 *
 * Covers:
 *   1. Provider-namespace isolation: a Clerk user ID cannot resolve or
 *      overwrite a row owned by a different authProvider, even when the
 *      externalAuthId strings collide.
 *   2. Legacy Replit bridge: migrated Replit user (authProvider='replit', whose
 *      old Replit OIDC sub is stored as externalId on the Clerk user object) is
 *      found and its row is migrated to authProvider='clerk' on first login.
 *   3. JIT provisioning: brand-new Clerk users get a new row inserted.
 *   4a. Race condition: concurrent inserts on provider+externalAuthId resolve
 *       via re-query.
 *   4b. Email-conflict fallback: when JIT insert fails on the globally-unique
 *       email column, the conflicting row is found by email (any authProvider)
 *       and migrated to Clerk. Covers all legacy account shapes — magic-link
 *       email users, Replit users with email but no migrated externalId, etc.
 *   5. Fail-closed: Clerk API errors return 503, not an open gate.
 *   6. Already-bridged: subsequent logins hit the primary lookup, no Clerk API.
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { User } from "@workspace/db";
import type { BridgeDeps, ResolveResult } from "../../middlewares/requireAuth.js";

// ── Import the REAL exported bridge function ──────────────────────────────────
// `requireAuth` also wires production DB dependencies at module scope. These
// bridge tests inject their own in-memory dependencies and never connect, but
// @workspace/db still requires a connection string while the module loads.
// Supply a harmless local URL before the dynamic import so `pnpm test` stays
// self-contained without changing the production configuration requirement.
process.env.DATABASE_URL ??= "postgresql://localhost:5432/feelzlike_test";
const { resolveDbUser } = await import("../../middlewares/requireAuth.js");

// ── In-memory user store ──────────────────────────────────────────────────────

type FakeUser = User;

let fakeStore: FakeUser[] = [];
let nextId = 1;

function freshUser(
  partial: Partial<FakeUser> & { authProvider: string; externalAuthId: string },
): FakeUser {
  return {
    id: String(nextId++),
    email: null,
    emailVerified: false,
    homeRegionId: null,
    units: null,
    createdAt: new Date(),
    ...partial,
  } as unknown as FakeUser;
}

// ── Fake BridgeDeps implementation ────────────────────────────────────────────
//
// This is NOT a reimplementation of the algorithm — it is a faithful
// implementation of the INTERFACE (BridgeDeps) that resolveDbUser depends on.
// The algorithm under test is the real one imported above.

function makeDeps(
  opts: {
    clerkExternalId?: string | null;
    clerkEmail?: string | null;
    clerkApiFails?: boolean;
  } = {},
): BridgeDeps {
  const {
    clerkExternalId = null,
    clerkEmail = "user@example.com",
    clerkApiFails = false,
  } = opts;

  return {
    async findUserByProvider(authProvider, externalAuthId) {
      return fakeStore.find(
        (r) =>
          r.authProvider === authProvider &&
          r.externalAuthId === externalAuthId,
      );
    },
    async findUserByEmail(email) {
      return fakeStore.find(
        (r) => (r as unknown as Record<string, unknown>).email === email,
      );
    },
    async updateUserToClerk(id, clerkUserId, emailBackfill) {
      const row = fakeStore.find((r) => r.id === id);
      if (row) {
        (row as unknown as Record<string, unknown>).authProvider = "clerk";
        (row as unknown as Record<string, unknown>).externalAuthId = clerkUserId;
        if (emailBackfill) {
          (row as unknown as Record<string, unknown>).email = emailBackfill;
          (row as unknown as Record<string, unknown>).emailVerified = true;
        }
      }
    },
    async insertNewClerkUser(clerkUserId, email) {
      // Simulate both unique-constraint conflict paths:
      // (a) provider+externalAuthId composite: another Clerk row for this user
      const clerkConflict = fakeStore.some(
        (r) => r.authProvider === "clerk" && r.externalAuthId === clerkUserId,
      );
      // (b) email unique constraint: any row with this email already exists
      const emailConflict =
        email !== null &&
        fakeStore.some(
          (r) => (r as unknown as Record<string, unknown>).email === email,
        );
      if (clerkConflict || emailConflict) return undefined;
      const row = freshUser({
        authProvider: "clerk",
        externalAuthId: clerkUserId,
        email,
        emailVerified: !!email,
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      });
      fakeStore.push(row);
      return row;
    },
    async getClerkExternalData(_clerkUserId) {
      if (clerkApiFails) throw new Error("Clerk API unavailable");
      return { externalId: clerkExternalId ?? null, email: clerkEmail ?? null };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  fakeStore = [];
  nextId = 1;
});

// ── 1. Primary lookup: existing Clerk user ────────────────────────────────────

describe("primary Clerk-scoped lookup", () => {
  test("finds an existing authProvider='clerk' row by clerkUserId", async () => {
    const existing = freshUser({
      authProvider: "clerk",
      externalAuthId: "user_clerk_abc",
      email: "clerk@example.com",
      emailVerified: true,
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(existing);

    const result = await resolveDbUser("user_clerk_abc", makeDeps());
    assert.ok(result.ok);
    assert.equal(result.user.id, existing.id);
    assert.equal(result.user.authProvider, "clerk");
  });

  test("does NOT match a row with a different authProvider even if externalAuthId matches", async () => {
    // Provider-namespace isolation: same ID string, wrong provider → no match
    fakeStore.push(
      freshUser({
        authProvider: "replit",
        externalAuthId: "user_clerk_abc",
        email: "replit@example.com",
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      }),
    );

    const result = await resolveDbUser(
      "user_clerk_abc",
      makeDeps({ clerkExternalId: null }),
    );
    // Falls through to JIT insert, does NOT hijack the replit row
    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    // A new row was JIT-inserted; the replit row is untouched
    const replitRow = fakeStore.find((r) => r.authProvider === "replit");
    assert.ok(replitRow, "original replit row must remain in the store");
    assert.equal(replitRow!.externalAuthId, "user_clerk_abc");
  });
});

// ── 2. Legacy bridge: migrated Replit user ────────────────────────────────────

describe("legacy Replit→Clerk bridge", () => {
  test("migrated Replit user is found via externalId and their row is updated", async () => {
    const legacyReplitSub = "replit-sub-xyz";
    const clerkUserId = "user_clerk_new";

    // Simulate a row that was in the DB before migration (authProvider='replit')
    // with the Replit OIDC subject as externalAuthId.
    const legacy = freshUser({
      authProvider: "replit",
      externalAuthId: legacyReplitSub,
      email: "member@example.com",
      emailVerified: true,
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(legacy);

    // Clerk's externalId for this user was set to the Replit sub during
    // migrateReplitAuthToClerk(), so the bridge can find the legacy row.
    const result = await resolveDbUser(
      clerkUserId,
      makeDeps({ clerkExternalId: legacyReplitSub }),
    );

    assert.ok(result.ok);
    // The returned user identity is now Clerk-owned
    assert.equal(result.user.authProvider, "clerk");
    assert.equal(result.user.externalAuthId, clerkUserId);
    // The original legacy data is preserved
    assert.equal(result.user.email, "member@example.com");

    // The row in the store was migrated (authProvider updated) so the next
    // request hits the primary lookup directly
    const updatedRow = fakeStore.find((r) => r.id === legacy.id);
    assert.ok(updatedRow);
    assert.equal(
      (updatedRow as unknown as Record<string, unknown>).authProvider,
      "clerk",
    );
    assert.equal(
      (updatedRow as unknown as Record<string, unknown>).externalAuthId,
      clerkUserId,
    );
  });

  test("bridge backfills email when the legacy row had none", async () => {
    const legacySub = "replit-sub-no-email";
    const clerkUserId = "user_clerk_email_backfill";

    fakeStore.push(
      freshUser({
        authProvider: "replit",
        externalAuthId: legacySub,
        email: null,
        emailVerified: false,
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      }),
    );

    const result = await resolveDbUser(
      clerkUserId,
      makeDeps({
        clerkExternalId: legacySub,
        clerkEmail: "backfilled@example.com",
      }),
    );

    assert.ok(result.ok);
    const updatedRow = fakeStore.find(
      (r) =>
        (r as unknown as Record<string, unknown>).authProvider === "clerk",
    );
    assert.ok(updatedRow);
    assert.equal(
      (updatedRow as unknown as Record<string, unknown>).email,
      "backfilled@example.com",
    );
    assert.equal(
      (updatedRow as unknown as Record<string, unknown>).emailVerified,
      true,
    );
  });

  test("bridge does NOT match a replit row if the externalId is null", async () => {
    // No externalId → bridge step is skipped; falls through to JIT insert
    fakeStore.push(
      freshUser({
        authProvider: "replit",
        externalAuthId: "some-sub",
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      }),
    );

    const result = await resolveDbUser(
      "user_clerk_no_ext",
      makeDeps({ clerkExternalId: null }),
    );
    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    // The replit row was NOT migrated
    assert.ok(fakeStore.some((r) => r.authProvider === "replit"));
  });

  test("bridge scopes replit lookup to authProvider='replit' — a 'manual' row with the same ID is not matched", async () => {
    const sharedId = "shared-id-collision";
    fakeStore.push(
      freshUser({
        authProvider: "manual",
        externalAuthId: sharedId,
        email: "manual@example.com",
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      }),
    );

    const result = await resolveDbUser(
      "user_clerk_manual_collision",
      makeDeps({ clerkExternalId: sharedId }),
    );
    // manual row not matched by the replit-scoped bridge → JIT insert
    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    const manualRow = fakeStore.find((r) => r.authProvider === "manual");
    assert.ok(manualRow, "manual row must remain untouched");
  });
});

// ── 3. JIT provisioning ───────────────────────────────────────────────────────

describe("JIT provisioning for brand-new Clerk users", () => {
  test("inserts a new row with authProvider='clerk' when no existing row exists", async () => {
    const result = await resolveDbUser(
      "user_brand_new",
      makeDeps({ clerkEmail: "brand-new@example.com", clerkExternalId: null }),
    );

    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    assert.equal(result.user.externalAuthId, "user_brand_new");
    assert.equal(result.user.email, "brand-new@example.com");
    assert.equal(result.user.emailVerified, true);

    // Exactly one new row was inserted
    assert.equal(fakeStore.length, 1);
  });
});

// ── 4. Race condition: concurrent insert ──────────────────────────────────────

describe("race condition re-query", () => {
  test("when insert returns undefined (conflict), re-queries and returns the conflicting row", async () => {
    // Pre-seed the winning insert so the conflict path is triggered
    const winner = freshUser({
      authProvider: "clerk",
      externalAuthId: "user_race",
      email: "race@example.com",
      emailVerified: true,
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(winner);

    // Custom deps: insert returns undefined (simulates conflict), re-query finds winner
    const deps: BridgeDeps = {
      ...makeDeps({ clerkExternalId: null }),
      async insertNewClerkUser() {
        return undefined; // simulate ON CONFLICT DO NOTHING
      },
    };

    const result = await resolveDbUser("user_race", deps);
    assert.ok(result.ok);
    assert.equal(result.user.id, winner.id);
  });
});

// ── 5. Fail-closed on Clerk API error ─────────────────────────────────────────

describe("fail-closed on Clerk API failure", () => {
  test("returns 503 AUTH_UNAVAILABLE when the Clerk API throws", async () => {
    const result = await resolveDbUser(
      "user_clerk_api_down",
      makeDeps({ clerkApiFails: true }),
    );

    assert.ok(!result.ok);
    assert.equal(result.status, 503);
    assert.equal(result.error, "AUTH_UNAVAILABLE");
  });
});

// ── 4b. Email-conflict fallback: legacy accounts with any authProvider ────────
//
// When the JIT insert (step 3) fails due to the globally-unique email
// constraint, the step 4a re-query by Clerk ID finds nothing (the conflict
// was NOT the concurrent-Clerk-insert path). Step 4b then looks up the
// conflicting row by email (any authProvider) and migrates it to Clerk.
//
// This handles ALL historical account shapes without assumptions about
// authProvider or externalAuthId:
//   - magic-link email users (authProvider='email' or null, externalAuthId varies)
//   - Replit users whose email is in our DB but whose Clerk externalId was never
//     set (so step 2a didn't match them)
//   - manual / support-created rows
//
// The email comes from the Clerk Admin API (server-authoritative), so matching
// by email is safe — Clerk has already verified that email belongs to this user.

describe("email-conflict fallback (step 4b) — legacy accounts of any shape", () => {
  test("legacy magic-link user (authProvider='email') is bridged via email-conflict fallback", async () => {
    const clerkUserId = "user_clerk_email_legacy";
    const emailAddress = "magiclink@example.com";

    // A row created by the old magic-link sign-up flow.
    // We do NOT assume a specific externalAuthId shape here — the production
    // shape was unknown; the fallback works regardless.
    const legacyRow = freshUser({
      authProvider: "email",
      externalAuthId: "some-token-or-email",
      email: emailAddress,
      emailVerified: true,
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(legacyRow);

    // Clerk knows the user's email but has no externalId
    // (email users weren't migrated via migrateReplitAuthToClerk)
    const result = await resolveDbUser(
      clerkUserId,
      makeDeps({ clerkExternalId: null, clerkEmail: emailAddress }),
    );

    // JIT insert fails on email unique constraint → 4a re-query misses →
    // 4b finds the row by email → migrates it
    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    assert.equal(result.user.externalAuthId, clerkUserId);
    // Original local user ID is preserved (profile/subscriptions intact)
    assert.equal(result.user.id, legacyRow.id);

    const migrated = fakeStore.find((r) => r.id === legacyRow.id);
    assert.ok(migrated);
    assert.equal(
      (migrated as unknown as Record<string, unknown>).authProvider,
      "clerk",
    );
  });

  test("Replit user with email but no Clerk externalId is bridged via email-conflict fallback", async () => {
    const clerkUserId = "user_clerk_replit_noid";
    const emailAddress = "replit-noid@example.com";

    // A Replit user whose Replit OIDC sub was not stored as Clerk externalId
    // (e.g., they signed up before migrateReplitAuthToClerk ran, or the
    // migration missed them). They have an email in our DB.
    const replitRow = freshUser({
      authProvider: "replit",
      externalAuthId: "some-other-replit-sub",  // not set on Clerk externalId
      email: emailAddress,
      emailVerified: true,
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(replitRow);

    const result = await resolveDbUser(
      clerkUserId,
      makeDeps({
        clerkExternalId: null,  // NOT set on the Clerk user object
        clerkEmail: emailAddress,
      }),
    );

    // Step 2a (Replit bridge) skipped: no externalId on Clerk user.
    // JIT insert fails on email unique constraint → 4b migrates via email.
    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    assert.equal(result.user.id, replitRow.id);
  });

  test("email-conflict fallback does NOT fire when Clerk has no email (no data to match on)", async () => {
    // Pre-seed a row that would match by email if Clerk had one
    fakeStore.push(
      freshUser({
        authProvider: "email",
        externalAuthId: "tok",
        email: "has-email@example.com",
        emailVerified: true,
      } as Partial<FakeUser> & {
        authProvider: string;
        externalAuthId: string;
      }),
    );

    const result = await resolveDbUser(
      "user_no_clerk_email",
      // email=null → JIT insert also uses null → no email conflict possible →
      // insert succeeds (no email constraint), returning a new Clerk row
      makeDeps({ clerkExternalId: null, clerkEmail: null }),
    );

    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    // The legacy row is untouched
    assert.ok(
      fakeStore.some((r) => r.authProvider === "email"),
      "legacy row must remain",
    );
  });

  test("a brand-new Clerk user with a unique email goes through JIT insert (not fallback)", async () => {
    // No existing row with this email
    const result = await resolveDbUser(
      "user_brand_new_email",
      makeDeps({ clerkExternalId: null, clerkEmail: "totally-new@example.com" }),
    );

    assert.ok(result.ok);
    assert.equal(result.user.authProvider, "clerk");
    assert.equal(result.user.email, "totally-new@example.com");
    // Exactly one row was inserted (the new Clerk row)
    assert.equal(fakeStore.length, 1);
  });
});

// ── 6. Already-bridged user (subsequent login) ────────────────────────────────

describe("already-bridged user (subsequent Clerk logins)", () => {
  test("resolves via primary lookup without hitting the Clerk API or bridge", async () => {
    // After bridge, the row has authProvider='clerk'; subsequent logins hit step 1
    let clerkApiCalled = false;
    const deps: BridgeDeps = {
      ...makeDeps(),
      async getClerkExternalData() {
        clerkApiCalled = true;
        return { externalId: null, email: "test@example.com" };
      },
    };

    const bridged = freshUser({
      authProvider: "clerk",
      externalAuthId: "user_already_clerk",
      email: "already@example.com",
    } as Partial<FakeUser> & {
      authProvider: string;
      externalAuthId: string;
    });
    fakeStore.push(bridged);

    const result = await resolveDbUser("user_already_clerk", deps);
    assert.ok(result.ok);
    assert.equal(result.user.id, bridged.id);
    assert.equal(clerkApiCalled, false, "Clerk API must NOT be called when primary lookup succeeds");
  });
});
