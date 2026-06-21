import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { readFileSync } from "fs";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import router from "./routes";
import { authMiddleware } from "./middlewares/authMiddleware.js";

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
  // Helmet's default Referrer-Policy is `no-referrer`, which strips Referer
  // on same-origin GETs. The admin origin-pinning guard relies on Origin
  // OR Referer to detect same-origin browser fetches, so we relax to
  // `strict-origin-when-cross-origin` (modern browser default).
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
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
  // Credentials enabled so the session cookie issued by Replit Auth is sent
  // on cross-origin requests from the SPA (preview iframe / *.replit.dev).
  // CSRF risk is bounded by:
  //   - the strict origin allowlist above (no `*` reflection),
  //   - SameSite=Lax on the session cookie (no top-level POST CSRF), and
  //   - all auth-mutating endpoints requiring a session+admin allowlist.
  credentials: true,
}));
app.use(cookieParser());
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
// authMiddleware loads req.user from the session cookie/bearer token before
// any route handler runs. Mounted on /api so every API route can inspect
// `req.isAuthenticated()` / `req.user`. Public routes simply ignore it.
app.use("/api", apiLimiter, authMiddleware, router);

// ── SPA static serving (production) ───────────────────────────────────────
//
// Route validation: return real 404s for unknown paths so crawlers don't
// mistake every bad URL for a valid page (soft-404 risk). Known routes get
// their index.html served with injected per-route meta tags (title,
// description, canonical, Open Graph) so social bots and AI crawlers see
// meaningful head content on the initial HTML response, not the generic
// home-page shell.
//
// Keep this block in sync with:
//   - App.tsx route list
//   - RegionLayout.tsx (region sub-routes)
//   - TownLayout.tsx (town sub-routes)
//   - scripts/generate-sitemap.mjs (KNOWN_REGIONS registry)

if (process.env.NODE_ENV === "production") {
  const staticDir = path.join(__dirname, "../../feelzlike/dist/public");
  const CANONICAL_ORIGIN = (process.env.PUBLIC_ORIGIN ?? "https://feelzlike.com").replace(/\/$/, "");

  // ── Known region / town registry ────────────────────────────────────────
  // Mirrors the region data in artifacts/feelzlike/src/regions/.
  const KNOWN_REGIONS: Record<string, { name: string; towns: Record<string, string> }> = {
    "snowy-mountains": {
      name: "Snowy Mountains",
      towns: { jindabyne: "Jindabyne", berridale: "Berridale", cooma: "Cooma" },
    },
    "yamanouchi": {
      name: "Yamanouchi",
      towns: { yudanaka: "Yudanaka", "shibu-onsen": "Shibu Onsen", yomase: "Yomase" },
    },
    "victorias-high-country": {
      name: "Victoria's High Country",
      towns: {
        mansfield: "Mansfield",
        bright: "Bright",
        "mount-beauty": "Mount Beauty",
        harrietville: "Harrietville",
        "dinner-plain": "Dinner Plain",
        marysville: "Marysville",
        warburton: "Warburton",
        omeo: "Omeo",
      },
    },
  };

  // Top-level routes handled by the SPA (before the /:region catch-all).
  const KNOWN_TOP_LEVEL = new Set([
    "/", "/countries", "/au", "/jp", "/nz", "/near-you",
    "/news", "/plan", "/legal/privacy", "/legal/terms",
    "/premium",
    "/alerts/verify", "/alerts/manage", "/alerts/unsubscribed",
    "/newsletter/verify", "/newsletter/unsubscribed",
    "/admin", "/admin/traffic", "/admin/newsletter",
  ]);

  // Valid sub-paths under /:region/ that are indexable pages.
  const VALID_REGION_SUBS = new Set([
    "mountains", "mountains/lifts", "alerts", "stay", "eat", "explore", "sources", "radar",
  ]);

  // Valid sub-paths under /:region/:town/.
  // Note: /cams is NOT listed here — it is handled by a server-side 301
  // redirect to /roads below, so it never reaches the isValidPublicPath check.
  const VALID_TOWN_SUBS = new Set([
    "weather", "stay", "eat", "roads", "transport", "explore",
  ]);

  /** Returns true when the path matches a known public route. */
  function isValidPublicPath(urlPath: string): boolean {
    const p = urlPath.replace(/\/+$/, "") || "/";
    if (KNOWN_TOP_LEVEL.has(p)) return true;

    const parts = p.split("/").filter(Boolean);
    if (parts.length === 0) return true;

    const regionSlug = parts[0];
    const regionData = KNOWN_REGIONS[regionSlug];
    if (!regionData) return false;               // unknown region → 404

    if (parts.length === 1) return true;          // /:region home

    const sub1 = parts.slice(1).join("/");

    // /:region/mountains, /:region/alerts, etc.
    if (VALID_REGION_SUBS.has(sub1)) return true;

    // /:region/mountain/:id or /:region/resort/:id
    if (/^(?:mountain|resort)\/[^/]+$/.test(sub1)) return true;

    // /:region/:town
    const townSlug = parts[1];
    if (!regionData.towns[townSlug]) return false; // unknown town → 404

    if (parts.length === 2) return true;           // /:region/:town home

    // /:region/:town/:subpath
    const townSub = parts.slice(2).join("/");
    return VALID_TOWN_SUBS.has(townSub);
  }

  // ── Per-route meta ───────────────────────────────────────────────────────

  interface RouteMeta { title: string; description: string; noIndex?: boolean }

  const TOP_LEVEL_META: Record<string, RouteMeta> = {
    "/": {
      title: "feelzlike · weather for resort towns",
      description: "Live weather, road conditions, and lift status for resort towns across the Snowy Mountains, Victoria's High Country, and Yamanouchi. Towns first, mountains second.",
    },
    "/countries": {
      title: "browse resort regions by country · feelzlike",
      description: "Choose a country to explore resort town weather and conditions — Australia, Japan, and New Zealand.",
    },
    "/au": {
      title: "Australia · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns across Australia — Snowy Mountains (NSW) and Victoria's High Country.",
    },
    "/jp": {
      title: "Japan · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns in Japan — Yamanouchi, Nagano, gateway to Shiga Kogen.",
    },
    "/nz": {
      title: "New Zealand · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns across New Zealand.",
    },
    "/near-you": {
      title: "weather near you · local resort conditions · feelzlike",
      description: "See live weather and a radar for your current location, plus nearby resort regions.",
    },
    "/news": {
      title: "news & updates · resort towns · feelzlike",
      description: "Latest news, weather events, and updates from resort towns across Australia, Japan, and New Zealand.",
    },
    "/plan": {
      title: "trip planner · find the best conditions · feelzlike",
      description: "Plan a multi-day resort town trip by comparing forecasts across regions and towns.",
    },
    "/legal/privacy": {
      title: "privacy policy · feelzlike",
      description: "How feelzlike handles your data and privacy.",
      noIndex: false,
    },
    "/legal/terms": {
      title: "terms of service · feelzlike",
      description: "Terms and conditions for using feelzlike.",
      noIndex: false,
    },
  };

  function buildPageMeta(urlPath: string): RouteMeta & { canonical: string } {
    const p = urlPath.replace(/\/+$/, "") || "/";
    const canonical = `${CANONICAL_ORIGIN}${p}`;

    if (TOP_LEVEL_META[p]) return { ...TOP_LEVEL_META[p], canonical };

    const parts = p.split("/").filter(Boolean);
    const regionSlug = parts[0];
    const regionData = KNOWN_REGIONS[regionSlug];

    if (regionData) {
      const regionName = regionData.name;

      if (parts.length === 1) {
        return {
          title: `${regionName} · resort town weather & conditions · feelzlike`,
          description: `Live weather, mountain conditions, road status, and town info for the ${regionName}.`,
          canonical,
        };
      }

      const townSlug = parts[1];
      const townName = regionData.towns[townSlug];

      if (townName) {
        const sub = parts[2];
        if (sub === "weather") {
          return {
            title: `${townName} weather · ${regionName} · feelzlike`,
            description: `Live weather forecast and radar for ${townName} in the ${regionName}.`,
            canonical,
          };
        }
        if (sub === "roads") {
          return {
            title: `${townName} roads & cams · ${regionName} · feelzlike`,
            description: `Live road conditions and traffic cameras around ${townName}, ${regionName}.`,
            canonical,
          };
        }
        if (sub) {
          const label = sub.charAt(0).toUpperCase() + sub.slice(1);
          return {
            title: `${townName} · ${label.toLowerCase()} · ${regionName} · feelzlike`,
            description: `${label} options and info for ${townName} in the ${regionName}.`,
            canonical,
          };
        }
        return {
          title: `${townName} · ${regionName} conditions · feelzlike`,
          description: `Live weather, road conditions, and visitor info for ${townName} in the ${regionName}.`,
          canonical,
        };
      }

      // Region sub-page (mountains, alerts, etc.)
      const sub = parts.slice(1).join("/");
      const label = sub.charAt(0).toUpperCase() + sub.slice(1);
      return {
        title: `${regionName} · ${label.toLowerCase()} · feelzlike`,
        description: `${label} info and conditions for the ${regionName}.`,
        canonical,
      };
    }

    // Fallback (valid but unrecognised by this map)
    return {
      title: "feelzlike · weather for resort towns",
      description: "Live weather, road conditions, and lift status for resort towns.",
      canonical,
    };
  }

  // ── Meta injection ───────────────────────────────────────────────────────
  // Replaces the generic home-page meta tags in index.html with per-route
  // values so social bots and AI crawlers see meaningful head content on
  // the initial HTML response rather than after JS execution.

  function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function injectMeta(html: string, meta: RouteMeta & { canonical: string }): string {
    const { title, description, canonical, noIndex } = meta;
    const t = esc(title);
    const d = esc(description);
    const ogImage = `${CANONICAL_ORIGIN}/opengraph.jpg`;

    return html
      .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/i, `$1${d}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/i, `$1${t}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/i, `$1${d}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/i, `$1${t}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/i, `$1${d}$2`)
      .replace(/(<meta property="og:image" content=")[^"]*(")/i, `$1${esc(ogImage)}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/i, `$1${esc(ogImage)}$2`)
      .replace(
        /<\/head>/,
        `  <link rel="canonical" href="${esc(canonical)}" />${noIndex ? '\n  <meta name="robots" content="noindex,nofollow" />' : ""}\n</head>`,
      );
  }

  // Load index.html template once at startup. Warn but don't crash if the
  // build hasn't run yet (e.g. first cold deploy before the build step).
  let indexHtmlTemplate = "";
  const indexHtmlPath = path.join(staticDir, "index.html");
  try {
    indexHtmlTemplate = readFileSync(indexHtmlPath, "utf8");
  } catch {
    console.warn("[spa] index.html not found at", indexHtmlPath, "— serving files only");
  }

  // Serve static assets (JS, CSS, images, manifest, sitemap, prerendered
  // route snapshots, etc.). index:true (default) means express.static
  // automatically serves dist/public/<path>/index.html files that the
  // prerender script generates, so crawlers receive full HTML on first
  // request without hitting the catch-all below.
  app.use(express.static(staticDir));

  app.get("/*splat", (req: Request, res: Response) => {
    const urlPath = req.path;

    // Server-side 301 redirect: /cams was folded into /roads in May 2026.
    // The redirect lives here (not just client-side) so crawlers that
    // follow redirects immediately land on the canonical /roads URL, and
    // link equity is transferred correctly.
    const camsMatch = urlPath.match(/^(\/[^/]+\/[^/]+)\/cams\/?$/);
    if (camsMatch) {
      res.redirect(301, `${camsMatch[1]}/roads`);
      return;
    }

    if (!isValidPublicPath(urlPath)) {
      // Return a real 404 status. If the SPA template is available, send it
      // so the React NotFound component still renders in the browser; the
      // HTTP status is what matters for crawlers.
      const notFoundMeta = {
        title: "page not found · feelzlike",
        description: "The page you are looking for does not exist.",
        canonical: `${CANONICAL_ORIGIN}${urlPath}`,
        noIndex: true,
      };
      if (indexHtmlTemplate) {
        res
          .status(404)
          .setHeader("Content-Type", "text/html; charset=utf-8")
          .send(injectMeta(indexHtmlTemplate, notFoundMeta));
      } else {
        res.status(404).send("Not found");
      }
      return;
    }

    if (!indexHtmlTemplate) {
      // Build hasn't run yet — fall back to sending the raw file.
      res.sendFile(indexHtmlPath);
      return;
    }

    const meta = buildPageMeta(urlPath);
    res
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(injectMeta(indexHtmlTemplate, meta));
  });
}

// Sentry's express error handler must be registered AFTER all controllers and
// before any other error middleware. It captures unhandled exceptions thrown
// from request handlers (sync or async) and reports them with full request
// context. No-ops if SENTRY_DSN_API is unset.
Sentry.setupExpressErrorHandler(app);

// Final catch-all. Without this, anything thrown out of a route (e.g. a Zod
// `.parse()` rejection) reaches Express's default handler, which serves an
// HTML page containing the full stack trace and absolute file paths · a
// classic info-disclosure leak. We always return a generic JSON envelope and
// only include the error message in non-production envs.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: (e?: unknown) => void) => {
  if (res.headersSent) return;
  const isProd = process.env.NODE_ENV === "production";
  const status = (err && typeof err === "object" && "status" in err && typeof (err as { status?: unknown }).status === "number")
    ? (err as { status: number }).status
    : 500;
  // ZodError → 400 by convention (input shape mismatch is a client problem).
  const isZod = err && typeof err === "object" && (err as { name?: string }).name === "ZodError";
  res.status(isZod ? 400 : status).json({
    error: isZod ? "INVALID_INPUT" : "INTERNAL_ERROR",
    ...(isProd ? {} : { message: err instanceof Error ? err.message : String(err) }),
  });
});

export default app;
