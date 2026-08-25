import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { readFileSync } from "fs";
import rateLimit from "express-rate-limit";
import * as Sentry from "@sentry/node";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { getAuth } from "@clerk/express";
import router from "./routes";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";
import { setSubscriptionResolver } from "./middlewares/require-entitlement.js";
import { resolvePromoSubscription } from "./lib/promo.js";
import { publishedCatalogueRecords, travelRegions } from "@workspace/japan-ski-catalogue/public-runtime";

const CATALOGUE_MOUNTAIN_IDS_BY_REGION = new Map<string, Set<string>>();
for (const record of publishedCatalogueRecords) {
  const ids = CATALOGUE_MOUNTAIN_IDS_BY_REGION.get(record.travelRegionId) ?? new Set<string>();
  ids.add(record.publicId);
  for (const alias of record.aliases) ids.add(alias);
  CATALOGUE_MOUNTAIN_IDS_BY_REGION.set(record.travelRegionId, ids);
}
const CATALOGUE_TRAVEL_REGION_IDS = new Set(travelRegions.map((region) => region.travelRegionId));

// Entitlement resolver · the soft member gate. During the launch promo every
// premium feature is free, but only for signed-in members (free email
// sign-up) · anonymous visitors get 401 AUTH_REQUIRED from
// `requireEntitlement(...)` so the client can prompt a free sign-up instead
// of a paywall. After the promo closes this returns null even for members
// (free tier → real 402 paywall). When billing lands, replace the post-promo
// branch with the real subscription lookup off `req`.
// SECURITY: use only auth.userId (Clerk's immutable, server-verified principal).
// Session claims are user-editable custom data and MUST NOT be used for
// authorization or entitlement decisions.
setSubscriptionResolver((req) => {
  const auth = getAuth(req);
  return resolvePromoSubscription(!!auth.userId);
});

const app: Express = express();

// Helmet adds the standard security-header set (HSTS, nosniff,
// Referrer-Policy etc). CSP, COEP and frameguard are off because:
//  - the SPA inlines Vite-hashed bundles and would need a per-build nonce,
//  - the Replit workspace previews the app inside a cross-origin iframe
//    (so SAMEORIGIN frameguard would blank the preview), and
//  - in production the same server serves the SPA, so a strict
//    X-Frame-Options would also block any future embed-the-widget use case.
// All other helmet defaults (HSTS, nosniff, Referrer-Policy, etc.) stay on.
// Clerk proxy: must come before body parsers so it can stream raw bytes.
// Handles /api/__clerk/* requests by proxying to Clerk's FAPI in production.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

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
  // Production custom domain. Browsers send an Origin header on same-origin
  // POST/PUT/DELETE (but not GET), so leaving this out breaks every mutation
  // on the live site (e.g. admin dashboard deletes → INTERNAL_ERROR) while
  // reads keep working · July 2026 incident.
  /^https:\/\/(www\.)?feelzlike\.com$/,
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
  // Credentials enabled so Clerk's session cookie is sent on cross-origin
  // requests from the SPA (preview iframe / *.replit.dev).
  // CSRF risk is bounded by:
  //   - the strict origin allowlist above (no `*` reflection),
  //   - SameSite=Lax on the session cookie (no top-level POST CSRF), and
  //   - all auth-mutating endpoints requiring a session+admin allowlist.
  credentials: true,
}));
// The Resend webhook needs the RAW request body to verify its Svix HMAC
// signature (see routes/resend-webhook.ts, which mounts its own express.raw).
// Skip the app-wide JSON/urlencoded parsers for that one path so the bytes
// Resend signed reach the route untouched · every other route still gets
// parsed bodies as before.
const RESEND_WEBHOOK_PATH = "/api/webhooks/resend";
const skipForResendWebhook =
  (parser: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => {
    if (req.path === RESEND_WEBHOOK_PATH) return next();
    return parser(req, res, next);
  };
app.use(skipForResendWebhook(express.json({ limit: "100kb" })));
app.use(skipForResendWebhook(express.urlencoded({ extended: true, limit: "100kb" })));

// Clerk middleware: validates the session token and exposes auth state via
// getAuth(req). Resolves the publishable key from the request host so the
// same server can serve multiple Clerk custom domains.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

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

// Same story for WillyWeather radar discovery: every cache-miss is a billed
// call against the owner's WillyWeather subscription. The route's own 0.5°-cell
// cache absorbs normal traffic (one lookup per pan/refresh, 120s TTL), so
// 20/min/IP only bites a client deliberately cycling distinct cells to force
// misses. Layered ON TOP of `apiLimiter` (both must pass).
const willyRadarLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "RATE_LIMITED", message: "Too many radar lookups, slow down." },
});

app.use("/api/places", placesLimiter);
app.use("/api/willy-radar", willyRadarLimiter);
// clerkMiddleware (mounted above) validates the session token and exposes
// auth state via getAuth(req) to every route handler. Public routes simply
// ignore it.
app.use("/api", apiLimiter, router);

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
  // Mirrors the region data in artifacts/feelzlike/src/regions/ (all 12
  // regions). Keep in sync with feelzlike/scripts/seo-regions.mjs.
  const KNOWN_REGIONS: Record<string, { name: string; towns: Record<string, string> }> = {
    // Australia
    "snowy-mountains": {
      name: "Snowy Mountains",
      towns: { jindabyne: "Jindabyne", berridale: "Berridale", cooma: "Cooma" },
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
    "tasmania": {
      name: "Tasmania",
      towns: { "ben-lomond-base": "Ben Lomond Base", launceston: "Launceston", hobart: "Hobart" },
    },
    // Japan
    "yamanouchi": {
      name: "Yamanouchi",
      towns: { yudanaka: "Yudanaka", "shibu-onsen": "Shibu Onsen", yomase: "Yomase" },
    },
    "nozawa-onsen": {
      name: "Nozawa Onsen",
      towns: { "nozawa-onsen-village": "Nozawa Onsen" },
    },
    "iiyama": {
      name: "Iiyama",
      towns: {
        iiyama: "Iiyama",
        "madarao-kogen": "Madarao Kogen",
        "togari-onsen-village": "Togari Onsen",
        "kijimadaira-village": "Kijimadaira",
      },
    },
    "hakuba-valley": {
      name: "Hakuba Valley",
      towns: { hakuba: "Hakuba", otari: "Otari", omachi: "Omachi" },
    },
    "myoko": {
      name: "Myoko",
      towns: {
        akakura: "Akakura Onsen",
        "ikenotaira-onsen": "Ikenotaira Onsen",
        suginosawa: "Suginosawa",
        arai: "Arai",
      },
    },
    "niseko": {
      name: "Niseko",
      towns: {
        hirafu: "Hirafu",
        kutchan: "Kutchan",
        "niseko-town": "Niseko Town",
      },
    },
    "furano": {
      name: "Furano",
      towns: {
        furano: "Furano",
        kitanomine: "Kitanomine",
      },
    },
    "sapporo": {
      name: "Sapporo",
      towns: {
        sapporo: "Sapporo",
        jozankei: "Jozankei",
      },
    },
    "tomamu-sahoro": {
      name: "Tomamu & Sahoro",
      towns: {
        "tomamu-village": "Tomamu",
        shimukappu: "Shimukappu",
      },
    },
    "asahikawa": {
      name: "Asahikawa",
      towns: {
        asahikawa: "Asahikawa",
        higashikawa: "Higashikawa",
      },
    },
    "rusutsu-kiroro": {
      name: "Rusutsu & Kiroro",
      towns: {
        rusutsu: "Rusutsu",
        kiroro: "Kiroro",
      },
    },
    "yuzawa": {
      name: "Yuzawa",
      towns: {
        "echigo-yuzawa": "Echigo-Yuzawa",
        ishiuchi: "Ishiuchi",
        mitsumata: "Mitsumata",
      },
    },
    "zao-onsen": {
      name: "Zao Onsen",
      towns: {
        "zao-onsen": "Zao Onsen",
      },
    },
    "hakkoda-aomori-spring": {
      name: "Hakkoda & Aomori Spring",
      towns: {
        aomori: "Aomori",
        "sukayu-onsen": "Sukayu Onsen",
        ajigasawa: "Ajigasawa",
      },
    },
    "appi-shizukuishi": {
      name: "Appi & Shizukuishi",
      towns: {
        "appi-kogen": "Appi Kogen",
        shizukuishi: "Shizukuishi",
        morioka: "Morioka",
      },
    },
    "bandai": {
      name: "Bandai",
      towns: {
        inawashiro: "Inawashiro",
        urabandai: "Urabandai",
      },
    },
    "daisen": {
      name: "Daisen",
      towns: {
        daisenji: "Daisenji",
        yonago: "Yonago",
      },
    },
    "minakami": {
      name: "Minakami",
      towns: { minakami: "Minakami" },
    },
    "kusatsu-manza": {
      name: "Kusatsu & Manza",
      towns: {
        "kusatsu-onsen": "Kusatsu Onsen",
        "manza-onsen": "Manza Onsen",
      },
    },
    "hachimantai": {
      name: "Hachimantai",
      towns: { hachimantai: "Hachimantai" },
    },
    // New Zealand
    "queenstown": {
      name: "Queenstown",
      towns: { queenstown: "Queenstown" },
    },
    "wanaka": {
      name: "Wanaka",
      towns: { wanaka: "Wanaka" },
    },
    "mt-hutt": {
      name: "Mt Hutt",
      towns: { methven: "Methven" },
    },
    "ruapehu": {
      name: "Ruapehu",
      towns: { ohakune: "Ohakune" },
    },
    // Canada · BC + Alberta
    "whistler": {
      name: "Whistler",
      towns: { whistler: "Whistler" },
    },
    "powder-highway": {
      name: "Powder Highway",
      towns: {
        revelstoke: "Revelstoke",
        golden: "Golden",
        fernie: "Fernie",
        nelson: "Nelson",
        kimberley: "Kimberley",
        invermere: "Invermere",
      },
    },
    "okanagan": {
      name: "Okanagan",
      towns: {
        kelowna: "Kelowna",
        vernon: "Vernon",
        penticton: "Penticton",
        kamloops: "Kamloops",
        "sun-peaks": "Sun Peaks",
      },
    },
    "vancouver": {
      name: "Vancouver & the Island",
      towns: { "vancouver-city": "Vancouver", courtenay: "Courtenay" },
    },
    "banff-lake-louise": {
      name: "Banff & Lake Louise",
      towns: { banff: "Banff", "lake-louise": "Lake Louise" },
    },
    "canmore": {
      name: "Canmore",
      towns: { canmore: "Canmore" },
    },
    "jasper": {
      name: "Jasper",
      towns: { jasper: "Jasper" },
    },
    "quebec-laurentians": {
      name: "Laurentians",
      towns: { "mont-tremblant": "Mont-Tremblant" },
    },
    "quebec-charlevoix": {
      name: "Charlevoix",
      towns: {
        beaupre: "Beaupré",
        "petite-riviere-saint-francois": "Petite-Rivière-Saint-François",
      },
    },
    "quebec-eastern-townships": {
      name: "Eastern Townships",
      towns: { bromont: "Bromont", sutton: "Sutton" },
    },
    // USA · Colorado
    "summit-county": {
      name: "Summit County",
      towns: { breckenridge: "Breckenridge", keystone: "Keystone", "copper-mountain": "Copper Mountain", georgetown: "Georgetown" },
    },
    "vail-valley": {
      name: "Vail Valley",
      towns: { vail: "Vail", avon: "Avon" },
    },
    "aspen-snowmass": {
      name: "Aspen Snowmass",
      towns: { aspen: "Aspen", "snowmass-village": "Snowmass Village" },
    },
    "steamboat": {
      name: "Steamboat",
      towns: { "steamboat-springs": "Steamboat Springs" },
    },
    "winter-park": {
      name: "Winter Park",
      towns: { "winter-park": "Winter Park" },
    },
    "crested-butte": {
      name: "Crested Butte",
      towns: { "crested-butte-town": "Crested Butte" },
    },
    "telluride": {
      name: "Telluride",
      towns: { "telluride-town": "Telluride" },
    },
    "durango": {
      name: "Durango",
      towns: { "durango-town": "Durango" },
    },
    "boulder-front-range": {
      name: "Boulder / Front Range",
      towns: { nederland: "Nederland" },
    },
    "cottonwood-canyons": {
      name: "Cottonwood Canyons",
      towns: { "salt-lake-city": "Salt Lake City", sandy: "Sandy" },
    },
    "park-city": {
      name: "Park City",
      towns: { "park-city-town": "Park City" },
    },
    "ogden-valley": {
      name: "Ogden Valley",
      towns: { ogden: "Ogden", eden: "Eden" },
    },
    "provo": {
      name: "Provo",
      towns: { "provo-town": "Provo", "sundance-town": "Sundance" },
    },
    "cache-valley": {
      name: "Cache Valley",
      towns: { logan: "Logan" },
    },
    "north-lake-tahoe": {
      name: "North Lake Tahoe",
      towns: { truckee: "Truckee" },
    },
    "south-lake-tahoe": {
      name: "South Lake Tahoe",
      towns: { "south-lake-tahoe-town": "South Lake Tahoe" },
    },
    "mammoth-lakes": {
      name: "Mammoth Lakes",
      towns: { "mammoth-lakes-town": "Mammoth Lakes" },
    },
    "big-bear": {
      name: "Big Bear",
      towns: { "big-bear-lake": "Big Bear Lake" },
    },
    "bear-valley": {
      name: "Bear Valley",
      towns: { arnold: "Arnold" },
    },
    "mt-shasta": {
      name: "Mt. Shasta",
      towns: { "mount-shasta": "Mount Shasta" },
    },
    "killington-pico": {
      name: "Killington/Pico",
      towns: { killington: "Killington" },
    },
    "stowe-smugglers-notch": {
      name: "Stowe/Smugglers' Notch",
      towns: { stowe: "Stowe", jeffersonville: "Jeffersonville" },
    },
    "mad-river-valley": {
      name: "Mad River Valley",
      towns: { warren: "Warren", waitsfield: "Waitsfield" },
    },
    "southern-vermont": {
      name: "Southern Vermont",
      towns: { stratton: "Stratton", "west-dover": "West Dover", "peru-vt": "Peru", "manchester-vt": "Manchester" },
    },
    "okemo": {
      name: "Okemo",
      towns: { ludlow: "Ludlow" },
    },
    "jay-peak-nek": {
      name: "Jay Peak/Northeast Kingdom",
      towns: { jay: "Jay", "east-burke": "East Burke" },
    },
    "jackson-hole": {
      name: "Jackson Hole",
      towns: { jackson: "Jackson", "teton-village": "Teton Village" },
    },
    "grand-targhee": {
      name: "Grand Targhee",
      towns: { "alta-wy": "Alta" },
    },
    "big-sky": {
      name: "Big Sky",
      towns: { "big-sky-town": "Big Sky" },
    },
    "bozeman-bridger-bowl": {
      name: "Bozeman",
      towns: { bozeman: "Bozeman" },
    },
    "whitefish": {
      name: "Whitefish",
      towns: { "whitefish-town": "Whitefish" },
    },
    "red-lodge": {
      name: "Red Lodge",
      towns: { "red-lodge-town": "Red Lodge" },
    },
    "taos": {
      name: "Taos",
      towns: { "taos-ski-valley-town": "Taos Ski Valley" },
    },
    "angel-fire": {
      name: "Angel Fire",
      towns: { "angel-fire": "Angel Fire" },
    },
    "santa-fe": {
      name: "Santa Fe",
      towns: { "santa-fe": "Santa Fe" },
    },
    "albuquerque-sandia": {
      name: "Albuquerque",
      towns: { "albuquerque": "Albuquerque" },
    },
    "harbor-springs": { name: "Harbor Springs", towns: { "harbor-springs-town": "Harbor Springs" } },
    "keweenaw-peninsula": { name: "Keweenaw Peninsula", towns: { mohawk: "Mohawk" } },
    "poconos": { name: "Poconos", towns: { tannersville: "Tannersville", "pocono-manor": "Pocono Manor" } },
    "laurel-highlands": { name: "Laurel Highlands", towns: { "seven-springs-town": "Seven Springs" } },
    "berkshires": { name:"Berkshires", towns:{hancock:"Hancock","great-barrington":"Great Barrington"} },
    "central-massachusetts": { name:"Central Massachusetts", towns:{"princeton-ma":"Princeton"} },
    "lutsen-north-shore": { name:"Lutsen / North Shore", towns:{lutsen:"Lutsen"} },
    "wausau": { name:"Wausau", towns:{"wausau-town":"Wausau"} },
    "wisconsin-dells": { name:"Wisconsin Dells", towns:{portage:"Portage"} },
    "vernon": { name:"Vernon", towns:{"vernon-nj":"Vernon"} },
    "litchfield-hills": { name:"Litchfield Hills", towns:{"cornwall-ct":"Cornwall"} },
    "juneau": { name:"Juneau", towns:{"juneau-town":"Juneau"} },
    "girdwood": { name:"Girdwood", towns:{"girdwood-town":"Girdwood"} },
    "black-hills": { name:"Black Hills", towns:{"lead-deadwood":"Lead / Deadwood"} },
    "white-mountains-az": { name:"White Mountains", towns:{"greer-az":"Greer"} },
    "flagstaff": { name:"Flagstaff", towns:{"flagstaff-town":"Flagstaff"} },
    "lake-tahoe-nevada": { name:"Lake Tahoe Nevada", towns:{"incline-village":"Incline Village"} },
    "shenandoah-valley": { name:"Shenandoah Valley", towns:{"mcgaheysville":"McGaheysville"} },
    "blue-ridge": { name:"Blue Ridge", towns:{"wintergreen-town":"Wintergreen"} },
    "maggie-valley": { name:"Maggie Valley", towns:{"maggie-valley-town":"Maggie Valley"} },
    "high-country": { name:"High Country", towns:{"banner-elk-beech-mountain":"Banner Elk / Beech Mountain"} },
    "canaan-valley": { name:"Canaan Valley", towns:{"canaan-valley-town":"Davis / Canaan Valley"} },
    "snowshoe": { name:"Snowshoe", towns:{"snowshoe-town":"Snowshoe"} },
    "mt-hood": {
      name: "Mt. Hood",
      towns: { "government-camp": "Government Camp" },
    },
    "bend": {
      name: "Bend",
      towns: { "bend": "Bend" },
    },
    "crystal-mountain": {
      name: "Crystal Mountain",
      towns: { "enumclaw": "Enumclaw" },
    },
    "snoqualmie-pass": {
      name: "Snoqualmie Pass",
      towns: { "snoqualmie-pass-town": "Snoqualmie Pass" },
    },
    "stevens-pass": {
      name: "Stevens Pass",
      towns: { "skykomish": "Skykomish" },
    },
    "mt-baker": {
      name: "Mt. Baker",
      towns: { "glacier": "Glacier" },
    },
    "sun-valley": {
      name: "Sun Valley",
      towns: { "ketchum": "Ketchum" },
    },
    "sandpoint": {
      name: "Sandpoint",
      towns: { "sandpoint": "Sandpoint" },
    },
    "boise": {
      name: "Boise",
      towns: { "boise": "Boise" },
    },
    "donnelly-mccall": {
      name: "Donnelly / McCall",
      towns: { "donnelly": "Donnelly" },
    },

    "white-mountains": { name: "White Mountains", towns: { "north-conway": "North Conway" } },
    "franconia-notch": { name: "Franconia Notch", towns: { franconia: "Franconia", "bretton-woods-town": "Bretton Woods" } },
    "waterville-valley": { name: "Waterville Valley", towns: { "waterville-valley-town": "Waterville Valley" } },
    "lakes-region": { name: "Lakes Region", towns: { gilford: "Gilford" } },
    "carrabassett-valley": { name: "Carrabassett Valley", towns: { "carrabassett-valley-town": "Carrabassett Valley" } },
    "newry-bethel": { name: "Newry / Bethel", towns: { newry: "Newry" } },
    "rangeley": { name: "Rangeley", towns: { rangeley: "Rangeley" } },
    "lake-placid": { name: "Lake Placid", towns: { "lake-placid": "Lake Placid", wilmington: "Wilmington" } },
    "north-creek": { name: "North Creek", towns: { "north-creek": "North Creek" } },
    "hunter": { name: "Hunter", towns: { hunter: "Hunter" } },
    "windham": { name: "Windham", towns: { windham: "Windham" } },
    "highmount": { name: "Highmount", towns: { highmount: "Highmount" } },
  };

  // Top-level routes handled by the SPA (before the /:region catch-all).
  const KNOWN_TOP_LEVEL = new Set([
    "/", "/countries", "/about", "/au", "/jp", "/nz", "/ca", "/ca/all-ski-areas", "/us", "/near-you",
    "/compare", "/legal/privacy", "/legal/terms",
    "/premium",
    "/alerts/verify", "/alerts/manage", "/alerts/unsubscribed",
    "/account",
    "/admin",
    // Clerk authentication routes. The Clerk-hosted UI mounts at /sign-in and
    // /sign-up, and uses subpaths for OAuth callbacks and multi-step flows
    // (e.g. /sign-in/sso-callback, /sign-in/factor-one). These MUST serve the
    // SPA index.html so the Clerk React component handles them correctly. They
    // are noIndex so crawlers don't index the auth shell pages.
    "/sign-in", "/sign-up",
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

    // Clerk uses sub-paths under /sign-in and /sign-up for OAuth callbacks and
    // multi-step flows (e.g. /sign-in/sso-callback, /sign-in/factor-one).
    // All of these must serve the SPA so the Clerk React component handles them.
    if (p.startsWith("/sign-in/") || p.startsWith("/sign-up/")) return true;

    const parts = p.split("/").filter(Boolean);
    if (parts.length === 0) return true;

    const regionSlug = parts[0];
    const regionData = KNOWN_REGIONS[regionSlug];
    const isCatalogueRegion = CATALOGUE_TRAVEL_REGION_IDS.has(regionSlug);
    if (!regionData && !isCatalogueRegion) return false; // unknown region → 404

    if (parts.length === 1) return true;          // /:region home

    const sub1 = parts.slice(1).join("/");

    // /:region/mountains, /:region/alerts, etc.
    if (VALID_REGION_SUBS.has(sub1)) return true;

    // /:region/mountain/:id or /:region/resort/:id
    if (/^(?:mountain|resort)\/[^/]+$/.test(sub1)) {
      // Catalogue-only regions retain strict path validation: a published id
      // (or its collision-checked safe alias) must belong to this exact region.
      if (isCatalogueRegion) {
        const locationId = parts[2];
        return !!locationId && (CATALOGUE_MOUNTAIN_IDS_BY_REGION.get(regionSlug)?.has(locationId) ?? false);
      }
      return true;
    }

    // /:region/:town
    const townSlug = parts[1];
    if (!regionData || !regionData.towns[townSlug]) return false; // unknown town → 404

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
      description: "Live weather, road conditions, and lift status for resort towns across Australia, Japan, and New Zealand. Towns first, mountains second.",
    },
    "/countries": {
      title: "browse resort regions by country · feelzlike",
      description: "Choose a country to explore resort town weather and conditions · Australia, Japan, and New Zealand.",
    },
    "/au": {
      title: "Australia · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns across Australia · Snowy Mountains (NSW), Victoria's High Country (VIC), and Tasmania (TAS).",
    },
    "/jp": {
      title: "Japan · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns in Japan · Yamanouchi, Nozawa Onsen, Iiyama, Hakuba Valley (Nagano), and Myoko (Niigata).",
    },
    "/nz": {
      title: "New Zealand · resort town weather · feelzlike",
      description: "Live weather and conditions for resort towns across New Zealand · Queenstown, Wanaka (Otago), Mt Hutt (Canterbury), and Ruapehu (Central Plateau).",
    },
    "/near-you": {
      title: "weather near you · local resort conditions · feelzlike",
      description: "See live weather and a radar for your current location, plus nearby resort regions.",
    },
    "/premium": {
      title: "feelzlike premium · snow alerts for your towns · feelzlike",
      description: "feelzlike premium · email snow and powder alerts for your favourite resort towns across Australia, Japan, and New Zealand.",
    },
    "/compare": {
      title: "compare mountains · snow side by side · feelzlike",
      description: "Compare the next week of fresh snow and temps across the mountains you're choosing between.",
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
    "/sign-in": {
      title: "sign in · feelzlike",
      description: "Sign in to your feelzlike account.",
      noIndex: true,
    },
    "/sign-up": {
      title: "create account · feelzlike",
      description: "Create a free feelzlike account.",
      noIndex: true,
    },
    "/account": {
      title: "your account · feelzlike",
      description: "Manage your feelzlike account, alerts, and profile.",
      noIndex: true,
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

    // Server-side 301 redirect: /plan was renamed to /compare in Aug 2026
    // (the page is a snow comparison tool, not a trip planner). Server-side
    // so crawlers and old links land on the canonical URL.
    if (/^\/plan\/?$/.test(urlPath)) {
      res.redirect(301, "/compare/");
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
  // Always log the real error server-side · the JSON envelope below is
  // deliberately generic, so without this line production 500s are
  // undiagnosable (the July 2026 admin-delete INTERNAL_ERROR took a
  // publish cycle to trace for exactly this reason).
  console.error(
    `[errorHandler] ${_req.method} ${_req.originalUrl} →`,
    err instanceof Error ? (err.stack ?? err.message) : err,
  );
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
