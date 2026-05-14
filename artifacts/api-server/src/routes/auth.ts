import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth.js";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

interface ResolvedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

/**
 * Upsert into the project's existing provider-agnostic `users` table.
 *
 * The skill template assumes a simpler schema (id = OIDC sub directly), but
 * this project's `users` table uses an internal UUID `id` and stores the
 * OIDC subject in `externalAuthId` with `authProvider = 'replit'`. We honour
 * that design so users created here interop with subscriptions, alerts, etc.
 * The composite (authProvider, externalAuthId) unique index is the conflict
 * target.
 */
async function upsertUser(claims: Record<string, unknown>): Promise<ResolvedUser> {
  const sub = String(claims.sub ?? "");
  if (!sub) {
    throw new Error("OIDC claims missing `sub`");
  }
  const email = (claims.email as string) || null;
  const firstName = (claims.first_name as string) || null;
  const lastName = (claims.last_name as string) || null;
  const profileImageUrl =
    ((claims.profile_image_url as string) || (claims.picture as string)) ?? null;

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || email || sub;

  // Existing user with this provider+sub?
  const existing = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.authProvider, "replit"),
        eq(usersTable.externalAuthId, sub),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(usersTable)
      .set({
        email,
        emailVerified: true,
        displayName,
        avatarUrl: profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, existing[0].id))
      .returning();
    return {
      id: updated.id,
      email: updated.email ?? null,
      firstName,
      lastName,
      profileImageUrl,
    };
  }

  const [inserted] = await db
    .insert(usersTable)
    .values({
      authProvider: "replit",
      externalAuthId: sub,
      email,
      emailVerified: true,
      displayName,
      avatarUrl: profileImageUrl,
    })
    .returning();

  return {
    id: inserted.id,
    email: inserted.email ?? null,
    firstName,
    lastName,
    profileImageUrl,
  };
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;

    const returnTo = getSafeReturnTo(req.query.returnTo);

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
      state,
      nonce,
    });

    setOidcCookie(res, "code_verifier", codeVerifier);
    setOidcCookie(res, "nonce", nonce);
    setOidcCookie(res, "state", state);
    setOidcCookie(res, "return_to", returnTo);

    res.redirect(redirectTo.href);
  } catch (err) {
    console.error("[auth/login] failed", err);
    res.status(500).json({ error: "AUTH_INIT_FAILED" });
  }
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;

    const codeVerifier = req.cookies?.code_verifier;
    const nonce = req.cookies?.nonce;
    const expectedState = req.cookies?.state;

    if (!codeVerifier || !expectedState) {
      res.redirect("/api/login");
      return;
    }

    const currentUrl = new URL(
      `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
    );

    let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
    try {
      tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedNonce: nonce,
        expectedState,
        idTokenExpected: true,
      });
    } catch (err) {
      console.error("[auth/callback] code exchange failed", err);
      res.redirect("/api/login");
      return;
    }

    const returnTo = getSafeReturnTo(req.cookies?.return_to);

    res.clearCookie("code_verifier", { path: "/" });
    res.clearCookie("nonce", { path: "/" });
    res.clearCookie("state", { path: "/" });
    res.clearCookie("return_to", { path: "/" });

    const claims = tokens.claims();
    if (!claims) {
      res.redirect("/api/login");
      return;
    }

    const dbUser = await upsertUser(
      claims as unknown as Record<string, unknown>,
    );

    const now = Math.floor(Date.now() / 1000);
    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.redirect(returnTo);
  } catch (err) {
    console.error("[auth/callback] unexpected error", err);
    res.redirect("/api/login");
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  try {
    const config = await getOidcConfig();
    const origin = getOrigin(req);

    const sid = getSessionId(req);
    await clearSession(res, sid);

    const endSessionUrl = oidc.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: origin,
    });

    res.redirect(endSessionUrl.href);
  } catch (err) {
    console.error("[auth/logout] failed", err);
    res.redirect("/");
  }
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      console.error("[auth/mobile-token-exchange] failed", err);
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

export default router;
