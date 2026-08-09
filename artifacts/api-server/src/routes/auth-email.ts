import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, alertSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyAuthEmailToken } from "../lib/authEmailTokens.js";
import { getAppPublicUrl } from "../lib/appUrl.js";

/**
 * Legacy email-link helper — POST /auth/email/request removed.
 *
 * GET /auth/email/verify handles any in-flight magic-link tokens that were
 * issued before the Clerk migration. Clicking such a link proves inbox
 * ownership (claims any pending alert-subscriber row), then redirects to
 * /sign-in to complete authentication via Clerk. Sessions are no longer
 * created here — Clerk owns session issuance entirely.
 *
 * New sign-in uses Clerk's hosted flow at /sign-in; no server-side
 * magic-link endpoint is needed or provided.
 */

const router: IRouter = Router();

// ─── GET /auth/email/verify?token=… ──────────────────────────────────────────
// Browser navigation target (clicked from a legacy magic-link email). Proves
// inbox ownership, claims any pending alert subscription, then redirects to
// /sign-in (with the original returnTo preserved) so the user completes
// authentication via Clerk. Sessions are no longer issued here.
router.get("/auth/email/verify", async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query["token"] === "string" ? req.query["token"] : "";
  const result = verifyAuthEmailToken(token);
  if (!result.ok) {
    res.redirect(`${getAppPublicUrl()}/sign-in?notice=${result.reason === "expired" ? "expired" : "invalid"}`);
    return;
  }
  const email = result.email.trim().toLowerCase();

  try {
    // Mark existing email-magic-link users as verified (no-op for Clerk users).
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (user && !user.emailVerified) {
      await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, user.id));
    }

    // Claim any pending alert subscription (proves inbox ownership).
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
      console.warn("[/auth/email/verify] subscriber claim failed:", err);
    }

    // Redirect to Clerk sign-in, preserving the original destination so the
    // user lands where they intended after authenticating. Clerk's SignIn
    // component honours the ?redirect_url= query parameter.
    const redirectUrl =
      result.returnTo && result.returnTo !== "/"
        ? `${getAppPublicUrl()}/sign-in?redirect_url=${encodeURIComponent(result.returnTo)}`
        : `${getAppPublicUrl()}/sign-in`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("[/auth/email/verify] error:", err);
    res.redirect(`${getAppPublicUrl()}/sign-in?notice=error`);
  }
});

export default router;
