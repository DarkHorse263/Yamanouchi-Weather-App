import * as oidc from "openid-client";
import { type Request, type Response, type NextFunction } from "express";
import type { AuthUser } from "@workspace/api-zod";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  updateSession,
  type SessionData,
} from "../lib/auth.js";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

async function refreshIfExpired(
  sid: string,
  session: SessionData,
): Promise<SessionData | null> {
  const now = Math.floor(Date.now() / 1000);
  if (!session.expires_at || now <= session.expires_at) return session;

  if (!session.refresh_token) return null;

  try {
    const config = await getOidcConfig();
    const tokens = await oidc.refreshTokenGrant(
      config,
      session.refresh_token,
    );
    session.access_token = tokens.access_token;
    session.refresh_token = tokens.refresh_token ?? session.refresh_token;
    session.expires_at = tokens.expiresIn()
      ? now + tokens.expiresIn()!
      : session.expires_at;
    await updateSession(sid, session);
    return session;
  } catch {
    return null;
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const sid = getSessionId(req);
  if (!sid) {
    next();
    return;
  }

  try {
    const session = await getSession(sid);
    if (!session?.user?.id) {
      await clearSession(res, sid);
      next();
      return;
    }

    const refreshed = await refreshIfExpired(sid, session);
    if (!refreshed) {
      await clearSession(res, sid);
      next();
      return;
    }

    req.user = refreshed.user;
    next();
  } catch (err) {
    // The session store is DB-backed (getSession/clearSession/refresh all hit
    // Postgres). If the database is briefly unavailable — most commonly the
    // cold-start / just-restarted window of the autoscale deployment, before
    // the connection pool is ready — those calls throw. Without this guard the
    // error escapes to the global error handler and turns EVERY /api request
    // from a logged-in user into an HTTP 500 (INTERNAL_ERROR), including public
    // endpoints like /alerts/subscribe that don't need a session at all.
    // Fail soft: treat the request as anonymous and let it through. The user
    // simply appears logged-out for this one request; the next request, once
    // the DB is warm, re-establishes the session.
    console.error("[authMiddleware] session lookup failed, continuing as anonymous:", err);
    if (!res.headersSent) {
      next();
    }
  }
}
