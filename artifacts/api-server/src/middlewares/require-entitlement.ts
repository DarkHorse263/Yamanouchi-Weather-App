import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  hasEntitlement,
  type Entitlement,
  type SubscriptionLike,
} from "../lib/entitlements";

/**
 * Adapter the auth layer plugs into. The middleware is intentionally
 * provider-agnostic - when Clerk / Replit Auth / Stripe is wired in, set the
 * resolver on app startup with `setSubscriptionResolver(...)` and every
 * `requireEntitlement(...)` route will start enforcing for real.
 *
 * Until then, the resolver returns `null` (i.e. everyone is on the free tier),
 * which means routes guarded with non-free entitlements correctly return 402
 * Payment Required even before billing is wired. This way we can ship paywalled
 * routes incrementally without leaving them open by accident.
 */
type SubscriptionResolver = (req: Request) => Promise<SubscriptionLike | null> | SubscriptionLike | null;

let resolver: SubscriptionResolver = () => null;

export function setSubscriptionResolver(fn: SubscriptionResolver): void {
  resolver = fn;
}

export function requireEntitlement(ent: Entitlement): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sub = await resolver(req);
      if (hasEntitlement(sub, ent)) {
        return next();
      }
      // Soft member gate: an anonymous visitor is asked to sign in (free
      // account) before we ever talk money. Only signed-in users without the
      // entitlement get the real 402 paywall.
      // SECURITY: use only auth.userId (Clerk's immutable principal) — never
      // session claims, which are user-editable custom data.
      const auth = getAuth(req);
      const isSignedIn = !!auth.userId;
      if (!isSignedIn) {
        res.status(401).json({
          error: "AUTH_REQUIRED",
          message: "Sign in with your free feelzlike account to use this feature.",
          entitlement: ent,
          signInUrl: "/premium",
        });
        return;
      }
      res.status(402).json({
        error: "PAYMENT_REQUIRED",
        message: `This feature requires an active subscription with the "${ent}" entitlement.`,
        entitlement: ent,
        upgradeUrl: "/pricing",
      });
    } catch (err) {
      console.error("[entitlement] resolver error:", err);
      res.status(500).json({ error: "ENTITLEMENT_CHECK_FAILED" });
    }
  };
}
