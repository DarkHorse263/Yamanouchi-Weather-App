import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import router from "./routes";

const app: Express = express();

// Helmet adds the standard security-header set (HSTS, nosniff,
// Referrer-Policy etc). CSP, COEP and frameguard are off because:
//  - the SPA inlines Vite-hashed bundles and would need a per-build nonce,
//  - the Replit workspace previews the app inside a cross-origin iframe
//    (so SAMEORIGIN frameguard would blank the preview), and
//  - in production the same server serves the SPA, so a strict
//    X-Frame-Options would also block any future embed-the-widget use case.
// All other helmet defaults (HSTS, nosniff, Referrer-Policy, etc.) stay on.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  frameguard: false,
}));

// Trust proxy hop count is configurable per deployment via TRUST_PROXY_HOPS.
// The right value depends on infra topology:
//   - Direct dev (no proxy):     0
//   - Replit edge only:          1
//   - Replit edge + CDN/WAF:     2
// Setting too low = legitimate users behind shared NAT get throttled together.
// Setting too high (or `true`) = attackers can spoof X-Forwarded-For to bypass.
// Override per environment with the env var; defaults to 1 (works for replit.app deploys).
const trustProxyHops = Number.parseInt(process.env["TRUST_PROXY_HOPS"] ?? "1", 10);
app.set("trust proxy", Number.isFinite(trustProxyHops) ? trustProxyHops : 1);

// CORS - only allow the configured public app URL plus Replit's dev/preview
// domains (for in-workspace previews). Reflecting any origin with
// credentials becomes a CSRF foot-gun the moment we add cookie auth. Any
// request with no Origin header (server-to-server, curl, same-origin) passes.
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /\.repl\.co$/,
];
const explicitAppUrl = (process.env.APP_PUBLIC_URL ?? "").replace(/\/$/, "");
function isOriginAllowed(origin: string): boolean {
  if (explicitAppUrl && origin === explicitAppUrl) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}
app.use(cors({
  origin: (origin, cb) => {
    // No Origin = same-origin / server-side - always allow.
    if (!origin) return cb(null, true);
    if (isOriginAllowed(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin not allowed (${origin})`));
  },
  // No credentials: this API is bearer-token-or-session-token via query/body,
  // never cookie auth. `credentials: true` combined with origin reflection is
  // a CSRF foot-gun and the browser already rejects `Access-Control-Allow-
  // Credentials: true` with `Access-Control-Allow-Origin: *` anyway.
  credentials: false,
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Catch JSON parse errors (and any other body-parser SyntaxError) before they
// bubble into Express's default HTML error page, which would leak a stack
// trace. Returns a clean JSON 400 instead.
app.use((err: unknown, _req: Request, res: Response, next: (e?: unknown) => void) => {
  if (err && typeof err === "object" && "type" in err && (err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "INVALID_JSON" });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: "INVALID_JSON" });
    return;
  }
  next(err);
});

// ── Rate limiting ─────────────────────────────────────────────────────────
// Generous default: 120 req/min per IP across the API. Health probes are exempt
// so external monitors can hammer them. Real abuse will trip this and return 429
// with retry-after; legit users will never see it.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req: Request) => req.path === "/healthz" || req.path === "/readyz",
  message: { error: "RATE_LIMITED", message: "Too many requests, slow down." },
});

// Tighter limiter for Google Places: each request costs real money against the
// Maps Platform quota, and the typical user only needs a handful per session
// (one per Explore/Stay/Eat panel load). 30/min/IP is generous for browsing,
// brutal for scrapers. Layered ON TOP of `apiLimiter` (both must pass).
const placesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many places lookups, slow down." },
});

app.use("/api/places", placesLimiter);
app.use("/api", apiLimiter, router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(__dirname, "../../feelzlike/dist/public");
  app.use(express.static(staticDir));
  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Sentry's express error handler must be registered AFTER all controllers and
// before any other error middleware. It captures unhandled exceptions thrown
// from request handlers (sync or async) and reports them with full request
// context. No-ops if SENTRY_DSN_API is unset.
Sentry.setupExpressErrorHandler(app);

export default app;
