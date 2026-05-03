import express, { type Express, type Request } from "express";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import router from "./routes";

const app: Express = express();

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

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use("/api", apiLimiter, router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(__dirname, "../../feelzlike/dist/public");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Sentry's express error handler must be registered AFTER all controllers and
// before any other error middleware. It captures unhandled exceptions thrown
// from request handlers (sync or async) and reports them with full request
// context. No-ops if SENTRY_DSN_API is unset.
Sentry.setupExpressErrorHandler(app);

export default app;
