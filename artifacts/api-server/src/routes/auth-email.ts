import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { db, usersTable, alertSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RequestEmailSignInBody } from "@workspace/api-zod";
import { issueAuthEmailToken, verifyAuthEmailToken } from "../lib/authEmailTokens.js";
import { sendEmail } from "../lib/emailSender.js";
import { signInEmail } from "../lib/emailTemplates.js";
import { getAppPublicUrl } from "../lib/appUrl.js";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth.js";

/**
 * Passwordless email sign-in (magic link) · the "soft member gate" account
 * flow. Clicking the emailed link proves inbox ownership, which:
 *   - finds-or-creates a `users` row (authProvider "email"),
 *   - claims any existing alert subscription for that email (marks it
 *     verified if the double-opt-in was never completed), and
 *   - opens a normal `sid` session · the same session the Replit-OIDC flow
 *     uses, so `req.user` / `requireEntitlement` work identically.
 */

const router: IRouter = Router();

function isValidEmail(s: unknown): s is string {
  return typeof s === "string" && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value.length > 512 ? "/" : value;
}

// Magic-link requests trigger outbound email · rate-limit tighter than the
// global limiter so an abuser can't use us as an email cannon.
const requestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many sign-in requests. Try again in a few minutes." },
});

// ─── POST /auth/email/request ────────────────────────────────────────────
router.post("/auth/email/request", requestLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = RequestEmailSignInBody.safeParse(req.body);
  if (!parsed.success || !isValidEmail(parsed.data.email)) {
    res.status(400).json({ error: "INVALID_EMAIL", message: "A valid email is required." });
    return;
  }
  const email = parsed.data.email.trim().toLowerCase();
  const returnTo = getSafeReturnTo(parsed.data.returnTo);

  try {
    const token = issueAuthEmailToken(email, returnTo);
    const signInUrl = `${getAppPublicUrl()}/api/auth/email/verify?token=${encodeURIComponent(token)}`;
    const tmpl = signInEmail(signInUrl);
    const send = await sendEmail({ to: email, subject: tmpl.subject, html: tmpl.html, text: tmpl.text, tag: "auth_signin" });

    res.json({
      ok: true,
      status: "sent",
      message: "Check your email for a sign-in link. It expires in 30 minutes.",
      emailDelivered: send.delivered,
      // Dev convenience only · lets the developer click through without an
      // inbox. Never present in production responses.
      ...(process.env.NODE_ENV !== "production" && !send.delivered ? { devVerifyUrl: signInUrl } : {}),
    });
  } catch (err) {
    console.error("[/auth/email/request] error:", err);
    res.status(500).json({ error: "SIGNIN_REQUEST_FAILED", message: "Could not send the sign-in link. Try again shortly." });
  }
});

// ─── GET /auth/email/verify?token=… ──────────────────────────────────────
// Browser navigation target (clicked from the email) · redirects, never JSON.
router.get("/auth/email/verify", async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyAuthEmailToken(token);
  if (!result.ok) {
    res.redirect(`${getAppPublicUrl()}/premium?signin=${result.reason === "expired" ? "expired" : "invalid"}`);
    return;
  }
  const email = result.email.trim().toLowerCase();

  try {
    // Find-or-create by email. Email is globally unique across providers, so
    // an existing Replit-OIDC account with this email is simply signed into ·
    // that's the "claim your account" path for alert subscribers too.
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({
          authProvider: "email",
          externalAuthId: email,
          email,
          emailVerified: true,
        })
        .onConflictDoUpdate({
          target: usersTable.email,
          set: { emailVerified: true },
        })
        .returning();
    } else if (!user.emailVerified) {
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
    }
    if (!user) throw new Error("user upsert returned no row");

    // Claim any existing alert subscription: clicking the sign-in link proves
    // the same inbox ownership the alert double-opt-in asks for, so complete
    // a pending verification while we're here.
    try {
      const [sub] = await db
        .select({ id: alertSubscribersTable.id, verifiedAt: alertSubscribersTable.verifiedAt })
        .from(alertSubscribersTable)
        .where(eq(alertSubscribersTable.email, email))
        .limit(1);
      if (sub && sub.verifiedAt === null) {
        await db.update(alertSubscribersTable).set({ verifiedAt: new Date() }).where(eq(alertSubscribersTable.id, sub.id));
      }
    } catch (err) {
      // Fail-soft · the account sign-in must not break on a subscriber hiccup.
      console.warn("[/auth/email/verify] subscriber claim failed:", err);
    }

    const sessionData: SessionData = {
      user: {
        id: user.id,
        email: user.email ?? email,
        firstName: user.displayName ?? null,
        lastName: null,
        profileImageUrl: user.avatarUrl ?? null,
      },
      access_token: "",
      provider: "email",
    };
    const sid = await createSession(sessionData);
    res.cookie(SESSION_COOKIE, sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL,
    });
    res.redirect(`${getAppPublicUrl()}${result.returnTo}`);
  } catch (err) {
    console.error("[/auth/email/verify] error:", err);
    res.redirect(`${getAppPublicUrl()}/premium?signin=error`);
  }
});

export default router;
