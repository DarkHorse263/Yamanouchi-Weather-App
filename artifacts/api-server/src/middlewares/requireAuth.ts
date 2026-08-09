import { getAuth, clerkClient } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      dbUser?: User;
    }
  }
}

// ─── Testable bridge algorithm ────────────────────────────────────────────────
//
// `resolveDbUser` is the core identity-resolution logic, exported so it can
// be tested directly against fake dependency implementations without re-
// implementing it. The Express middleware below is a thin wrapper that wires
// the real DB and Clerk SDK into this function.

export type BridgeDeps = {
  /**
   * Find a user row by (authProvider, externalAuthId). Returns undefined when
   * not found. Used for provider-scoped lookups:
   *   - primary Clerk lookup:  ("clerk", clerkUserId)
   *   - Replit OIDC bridge:    ("replit", replitOidcSub)
   */
  findUserByProvider: (
    authProvider: string,
    externalAuthId: string,
  ) => Promise<User | undefined>;
  /**
   * Find the first user row with the given email regardless of authProvider.
   * Used only in the post-conflict fallback (step 4b) to bridge legacy accounts
   * whose row shape is unknown. The email must come from the Clerk Admin API
   * (server-authoritative), never from session claims.
   */
  findUserByEmail: (email: string) => Promise<User | undefined>;
  /** Migrate a legacy row to Clerk ownership. */
  updateUserToClerk: (
    id: string,
    clerkUserId: string,
    emailBackfill?: string,
  ) => Promise<void>;
  /**
   * JIT-insert a brand-new Clerk user. Returns undefined on any DB conflict
   * (unique-key on (authProvider, externalAuthId) OR on email).
   */
  insertNewClerkUser: (
    clerkUserId: string,
    email: string | null,
  ) => Promise<User | undefined>;
  /**
   * Fetch the Clerk user's externalId (the old Replit OIDC sub stored by
   * migrateReplitAuthToClerk) and their primary email address (server-
   * authoritative — never session claims).
   * Throws on error — requireAuth catches this and fails closed.
   */
  getClerkExternalData: (
    clerkUserId: string,
  ) => Promise<{ externalId: string | null; email: string | null }>;
};

export type ResolveResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string; message: string };

/**
 * Core identity-resolution algorithm (testable, side-effect-free boundary).
 *
 * SECURITY invariants:
 *   - `clerkUserId` is Clerk's immutable, server-verified principal. It is
 *     the ONLY source of truth for "who is signed in."
 *   - All provider-scoped lookups use `authProvider` to prevent IDOR.
 *   - `getClerkExternalData` uses the Clerk Admin API (server-side,
 *     unforgeable), never session claims.
 *   - `findUserByEmail` is used ONLY after a JIT-insert conflict proves a row
 *     with this email already exists; the email itself comes from the Clerk API.
 *   - Fails closed (503) when the Clerk API is unreachable.
 *
 * Bridge algorithm (all historical account shapes → Clerk):
 *
 *   1. Primary lookup: WHERE authProvider='clerk' AND externalAuthId=clerkUserId
 *      Covers: new Clerk users and any previously-bridged user.
 *
 *   2. Clerk API call: get externalId (= old Replit OIDC sub) and trustedEmail.
 *
 *   2a. Replit bridge: WHERE authProvider='replit' AND externalAuthId=externalId
 *       Covers: users migrated from Replit Auth whose Clerk externalId was set
 *       by migrateReplitAuthToClerk(). On hit, UPDATE row to authProvider='clerk'.
 *
 *   3. JIT insert: authProvider='clerk', email from Clerk API.
 *      Succeeds → done.
 *      Returns undefined → some unique constraint conflict; continue to step 4.
 *
 *   4a. Race re-query: WHERE authProvider='clerk' AND externalAuthId=clerkUserId.
 *       Handles a concurrent first request that inserted the row between step 3
 *       and now (conflict on provider+externalAuthId composite key).
 *
 *   4b. Email-conflict fallback: find the first row WHERE email=trustedEmail.
 *       Handles legacy accounts (any authProvider, any externalAuthId shape)
 *       whose globally-unique email conflicted with the JIT insert. The Clerk
 *       API has already verified the email belongs to this Clerk user, so
 *       matching by email here is safe and server-authoritative. On hit,
 *       migrate the row to Clerk so all existing profile/subscription data
 *       is preserved under the same local user ID.
 */
export async function resolveDbUser(
  clerkUserId: string,
  deps: BridgeDeps,
): Promise<ResolveResult> {
  // ── Step 1: primary lookup — Clerk-scoped ─────────────────────────────
  let user = await deps.findUserByProvider("clerk", clerkUserId);
  if (user) return { ok: true, user };

  // ── Step 2: Clerk API lookup (fail-closed) ────────────────────────────
  let clerkData: { externalId: string | null; email: string | null };
  try {
    clerkData = await deps.getClerkExternalData(clerkUserId);
  } catch (err) {
    console.error(
      "[requireAuth] getClerkExternalData failed — failing closed:",
      err,
    );
    return {
      ok: false,
      status: 503,
      error: "AUTH_UNAVAILABLE",
      message: "Authentication service unavailable. Try again in a moment.",
    };
  }

  // ── Step 2a: Replit OIDC bridge ───────────────────────────────────────
  // Covers users migrated from Replit Auth: the migration tool stored the old
  // Replit OIDC subject as `externalId` on the Clerk user object AND as
  // `externalAuthId` in our DB row (authProvider='replit').
  if (clerkData.externalId) {
    const legacy = await deps.findUserByProvider("replit", clerkData.externalId);
    if (legacy) {
      await deps.updateUserToClerk(
        legacy.id,
        clerkUserId,
        clerkData.email && !legacy.email ? clerkData.email : undefined,
      );
      return {
        ok: true,
        user: { ...legacy, authProvider: "clerk", externalAuthId: clerkUserId },
      };
    }
  }

  // ── Step 3: JIT insert — brand-new Clerk user ─────────────────────────
  const inserted = await deps.insertNewClerkUser(clerkUserId, clerkData.email);
  if (inserted) return { ok: true, user: inserted };

  // ── Step 4a: race re-query — Clerk-scoped ─────────────────────────────
  // Handles concurrent first-logins: another request inserted this Clerk row
  // between step 3's insert attempt and now (conflict on provider+externalAuthId
  // composite key).
  user = await deps.findUserByProvider("clerk", clerkUserId);
  if (user) return { ok: true, user };

  // ── Step 4b: email-conflict fallback — any provider ───────────────────
  // The JIT insert failed but the Clerk-scoped re-query returned nothing.
  // That means the conflict was on the globally-unique `users.email` column:
  // a pre-existing row (any authProvider, any externalAuthId) already holds
  // this email address. Since the email comes from the Clerk Admin API
  // (server-authoritative), ownership is proven; migrate the conflicting row
  // to Clerk so the user's profile/subscription data is preserved.
  //
  // This covers ALL legacy account shapes regardless of authProvider or
  // externalAuthId — email-magic-link users, Replit users who signed up by
  // email without being migrated, manual rows created by support, etc.
  if (clerkData.email) {
    const emailConflict = await deps.findUserByEmail(clerkData.email);
    if (emailConflict) {
      await deps.updateUserToClerk(emailConflict.id, clerkUserId, undefined);
      return {
        ok: true,
        user: {
          ...emailConflict,
          authProvider: "clerk",
          externalAuthId: clerkUserId,
        },
      };
    }
  }

  return {
    ok: false,
    status: 401,
    error: "AUTH_REQUIRED",
    message: "Could not resolve user record.",
  };
}

// ─── Real DB dependency implementation ───────────────────────────────────────

function makeLiveDeps(): BridgeDeps {
  return {
    async findUserByProvider(authProvider, externalAuthId) {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.authProvider, authProvider),
            eq(usersTable.externalAuthId, externalAuthId),
          ),
        )
        .limit(1);
      return row;
    },
    async findUserByEmail(email) {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
      return row;
    },
    async updateUserToClerk(id, clerkUserId, emailBackfill) {
      await db
        .update(usersTable)
        .set({
          authProvider: "clerk",
          externalAuthId: clerkUserId,
          ...(emailBackfill
            ? { email: emailBackfill, emailVerified: true }
            : {}),
        })
        .where(eq(usersTable.id, id));
    },
    async insertNewClerkUser(clerkUserId, email) {
      const [row] = await db
        .insert(usersTable)
        .values({
          authProvider: "clerk",
          externalAuthId: clerkUserId,
          email,
          emailVerified: !!email,
        })
        .onConflictDoNothing()
        .returning();
      return row;
    },
    async getClerkExternalData(clerkUserId) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      return {
        externalId: clerkUser.externalId ?? null,
        email:
          clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ?? null,
      };
    },
  };
}

// ─── Express middleware ───────────────────────────────────────────────────────

/**
 * Clerk-backed auth guard + JIT provisioning.
 *
 * SECURITY: the ONLY trusted identity principal is `auth.userId` — Clerk's
 * server-verified, immutable user ID. Session claims (`sessionClaims.*`) are
 * custom/user-editable data and MUST NOT be used for authorization decisions.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;

  if (!clerkUserId) {
    res.status(401).json({
      error: "AUTH_REQUIRED",
      message: "Sign in to access this resource.",
    });
    return;
  }

  try {
    const result = await resolveDbUser(clerkUserId, makeLiveDeps());
    if (!result.ok) {
      res.status(result.status).json({
        error: result.error,
        message: result.message,
      });
      return;
    }
    req.dbUser = result.user;
    next();
  } catch (err) {
    console.error("[requireAuth] error:", err);
    res.status(500).json({ error: "AUTH_CHECK_FAILED" });
  }
}
