import { Router, type Request, type Response } from "express";

const router = Router();

const ALLOWED_TRANSPARENCY = /^IDR\d+\.\w+\.png$/;
const ALLOWED_RADAR = /^IDR\d+\.T\.\d+\.png$/;
const ALLOWED_LOOP = /^IDR\d+\.gif$/;
const ALLOWED_RADAR_ID = /^IDR\d+$/;

// Allowlist of BOM radar PRODUCT ids (IDR<2-digit site><1-digit range>) the
// frames endpoint will probe. MIRRORS the client catalogue in
// feelzlike/src/lib/bom-radar.ts (BOM_RADARS) · site id × each published range ·
// which also covers the curated region radars (IDR403/493/714/762). Without it,
// /bom-radar/frames would HEAD-probe ~17 urls for ANY syntactically valid IDR id
// a caller invents, letting one client fan out radar ids and trigger BOM's
// whole-egress IP-403 (the exact failure this animation work must avoid). Drift
// is graceful: a product missing here just degrades that radar to the
// still/link-out, it never breaks a working one.
const RADAR_SITE_RANGES: Record<string, number[]> = {
  "02": [1, 2, 3, 4], "03": [1, 2, 3, 4], "04": [1, 2, 3, 4], "06": [1, 2, 3, 4],
  "08": [1, 2, 3, 4], "14": [1, 2, 3], "15": [1, 2, 3, 4], "16": [1, 2, 3],
  "17": [1, 2, 3, 4], "19": [1, 2, 3, 4], "22": [1, 2, 3, 4], "23": [1, 2, 3],
  "24": [1, 2, 3], "25": [1, 2, 3], "26": [1, 2, 3, 4], "27": [1, 2, 3],
  "28": [1, 2, 3], "31": [1, 2, 3, 4], "32": [1, 2, 3, 4], "33": [1, 2, 3, 4],
  "36": [1, 2, 3], "37": [1, 2, 3], "38": [1, 2, 3, 4], "39": [1, 2, 3],
  "40": [1, 2, 3, 4], "41": [1, 2, 3], "42": [1, 2, 3], "44": [1, 2, 3],
  "46": [1, 2, 3], "48": [1, 2, 3, 4], "49": [1, 2, 3, 4], "50": [1, 2, 3, 4],
  "53": [1, 2, 3], "55": [1, 2, 3], "56": [1, 2, 3], "58": [1, 2, 3, 4],
  "62": [1, 2, 3], "63": [1, 2, 3, 4], "64": [1, 2, 3, 4], "66": [1, 2, 3, 4],
  "67": [1, 2, 3], "68": [1, 2, 3], "69": [1, 2, 3, 4], "70": [1, 2, 3, 4],
  "71": [1, 2, 3, 4], "72": [1, 2, 3, 4], "74": [1, 2, 3, 4], "75": [1, 2, 3, 4],
  "76": [1, 2, 3, 4], "77": [1, 2, 3, 4], "78": [1, 2, 3, 4], "79": [1, 2, 3, 4],
  "93": [1, 2, 3, 4], "94": [1, 2, 3, 4], "95": [1, 2, 3, 4], "96": [1, 2, 3, 4],
  "97": [1, 2, 3, 4], "98": [1, 2, 3, 4],
};
const KNOWN_RADAR_IDS = new Set<string>(
  Object.entries(RADAR_SITE_RANGES).flatMap(([id, ranges]) =>
    ranges.map((r) => `IDR${id}${r}`),
  ),
);

// BOM blocks bot-style UAs on radar imagery; emulate a real browser. The
// Referer is set per-radar to the matching product's loop page (BOM doesn't
// strictly require it to match, but it keeps the request realistic).
function bomHeaders(radarId: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    Accept: "image/png,image/*,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    Referer: `http://www.bom.gov.au/products/${radarId}.loop.shtml`,
  };
}

function radarIdFromFile(file: string): string {
  const m = file.match(/^(IDR\d+)\./);
  return m ? m[1] : "IDR403";
}

// ─── BOM image cache ────────────────────────────────────────────────────
// The animated official radar loads ~4 static layers + ~6 frame PNGs per view,
// so without a server-side cache every visitor would multiply our BOM GET
// volume (and BOM IP-rate-limits the WHOLE Replit egress under load · once
// tripped it 403s everything for a while). So cache responses by file:
//   · a frame PNG and a transparency layer are IMMUTABLE once published, so
//     they can be held a long time;
//   · the composite loop gif rotates, so keep it short.
// Identical concurrent misses are de-duped, and on an upstream 403/404/blip we
// serve a stale copy if we have one rather than breaking the radar. The cache
// is size-capped (oldest-fetched evicted) so the rotating frame files can't
// grow it without bound.
interface ImageCacheEntry {
  buffer: Buffer;
  contentType: string;
  fetchedAt: number;
}
const imageCache = new Map<string, ImageCacheEntry>();
const imageInflight = new Map<string, Promise<ImageCacheEntry | null>>();
const IMAGE_CACHE_MAX = 300;

function imageTtlMs(type: string): number {
  if (type === "transparency") return 6 * 60 * 60 * 1000; // layers ~static
  if (type === "image") return 60 * 60 * 1000; // a frame PNG is immutable once published
  return 60_000; // loop gif rotates
}

function pruneImageCache(): void {
  if (imageCache.size <= IMAGE_CACHE_MAX) return;
  const oldestFirst = [...imageCache.entries()].sort(
    (a, b) => a[1].fetchedAt - b[1].fetchedAt,
  );
  for (const [key] of oldestFirst.slice(0, imageCache.size - IMAGE_CACHE_MAX)) {
    imageCache.delete(key);
  }
}

async function fetchBomImage(
  bomUrl: string,
  radarId: string,
): Promise<ImageCacheEntry | null> {
  const response = await fetch(bomUrl, { headers: bomHeaders(radarId) });
  if (!response.ok) return null; // 403 (rate-limit) / 404 (aged out)
  const contentType = response.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType, fetchedAt: Date.now() };
}

router.get("/bom-radar", async (req: Request, res: Response) => {
  const type = req.query.type as string;
  const file = req.query.file as string;

  if (!type || !file) {
    res.status(400).json({ error: "Missing type and file query params" });
    return;
  }

  let bomUrl: string;

  if (type === "transparency" && ALLOWED_TRANSPARENCY.test(file)) {
    bomUrl = `https://www.bom.gov.au/products/radar_transparencies/${file}`;
  } else if (type === "image" && ALLOWED_RADAR.test(file)) {
    bomUrl = `https://www.bom.gov.au/radar/${file}`;
  } else if (type === "loop" && ALLOWED_LOOP.test(file)) {
    bomUrl = `https://www.bom.gov.au/radar/${file}`;
  } else {
    res.status(400).json({ error: "Invalid type or file" });
    return;
  }

  const cacheKey = `${type}:${file}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < imageTtlMs(type)) {
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(cached.buffer);
    return;
  }

  // Frame PNGs and transparency layers are immutable once published, so a
  // stale copy is always correct. The composite loop gif ROTATES though ·
  // re-serving one that's hours old during a long BOM outage would show
  // "last night's radar" as if it were live, so cap how old a stale loop
  // may be before we'd rather fail (the client degrades to link-out).
  const STALE_LOOP_MAX_MS = 30 * 60 * 1000;

  function sendStaleOr(status: number): boolean {
    // Serve an expired copy on upstream failure rather than breaking the radar.
    if (cached && (type !== "loop" || Date.now() - cached.fetchedAt < STALE_LOOP_MAX_MS)) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=30");
      res.send(cached.buffer);
      return true;
    }
    res.status(status).json({ error: "BOM radar image not available" });
    return false;
  }

  try {
    let inflight = imageInflight.get(cacheKey);
    if (!inflight) {
      inflight = fetchBomImage(bomUrl, radarIdFromFile(file)).finally(() =>
        imageInflight.delete(cacheKey),
      );
      imageInflight.set(cacheKey, inflight);
    }
    const fresh = await inflight;
    if (!fresh) {
      sendStaleOr(502);
      return;
    }
    imageCache.set(cacheKey, fresh);
    pruneImageCache();
    res.setHeader("Content-Type", fresh.contentType);
    res.setHeader("Cache-Control", "public, max-age=60");
    res.send(fresh.buffer);
  } catch {
    sendStaleOr(502);
  }
});

// ─── Frame discovery ────────────────────────────────────────────────────
// BOM publishes per-frame radar PNGs at /radar/IDR<id>.T.<YYYYMMDDHHMM>.png
// (UTC), keeping roughly the last ~50-60 min so its own loop pages can
// animate. The publish CADENCE is per-radar: some sites update every 6 min on
// the wall clock (00,06,...,54), others every 10 min at :X4 (04,14,24,34,44,
// 54). To stay cadence-agnostic we probe the UNION of both mark sets over a
// short window and HEAD-filter to whatever actually exists, so the client only
// ever loads real frames (a 404 would flicker the loop).
//
// Keep this GENTLE: BOM IP-rate-limits (403s) the whole egress under request
// volume, so the window is bounded, results are cached ~2 min, identical
// in-flight lookups are de-duped, and a stale list is served if a refresh
// fails. Never expose an unbounded probe window to the client.
interface Frame {
  ts: string;
  file: string;
  url: string;
}
interface FrameCacheEntry {
  frames: Frame[];
  fetchedAt: number;
}
const frameCache = new Map<string, FrameCacheEntry>();
const frameInflight = new Map<string, Promise<Frame[]>>();
const FRAME_CACHE_MS = 120_000;
const FRAME_WINDOW_MIN = 75;
// Cap how old a previously-discovered frame list may be before we stop
// re-serving it as a stale fallback. Without this, a long BOM 403 outage
// keeps replaying e.g. last night's loop all morning as if it were live ·
// past the cap we return an empty list so the client degrades honestly
// (still → link-out) instead of animating hours-old frames.
const STALE_FRAMES_MAX_MS = 90 * 60 * 1000;

function isServablyFresh(entry: FrameCacheEntry): boolean {
  return Date.now() - entry.fetchedAt < STALE_FRAMES_MAX_MS;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function buildCandidateTimestamps(): string[] {
  // Walk back minute-by-minute over the window and keep the marks matching
  // either the 6-min cadence (minute % 6 === 0) or the 10-min :X4 cadence
  // (minute % 10 === 4) — ~17 candidates for a 75-min window. A ~90s publish
  // buffer skips the not-yet-published current scan.
  const MIN_MS = 60_000;
  const PUBLISH_BUFFER_MS = 90_000;
  const anchorMs = Math.floor((Date.now() - PUBLISH_BUFFER_MS) / MIN_MS) * MIN_MS;
  const out: string[] = [];
  for (let i = 0; i <= FRAME_WINDOW_MIN; i++) {
    const t = new Date(anchorMs - i * MIN_MS);
    const m = t.getUTCMinutes();
    if (m % 6 === 0 || m % 10 === 4) {
      out.push(
        t.getUTCFullYear().toString() +
          pad(t.getUTCMonth() + 1) +
          pad(t.getUTCDate()) +
          pad(t.getUTCHours()) +
          pad(m),
      );
    }
  }
  return out.reverse(); // oldest → newest (animation order)
}

async function headExists(url: string, radarId: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", headers: bomHeaders(radarId) });
    return r.ok;
  } catch {
    return false;
  }
}

// Discover the FULL set of currently-published frames in the window (oldest →
// newest). The result is cached per-radar and sliced to the caller's `count`
// per request, so varying `count` can never force a fresh probe batch · only a
// new radar id (capped at one ~17-HEAD batch per FRAME_CACHE_MS) can.
async function discoverFrames(radarId: string): Promise<Frame[]> {
  const candidates = buildCandidateTimestamps();
  const checks = await Promise.all(
    candidates.map(async (ts) => {
      const file = `${radarId}.T.${ts}.png`;
      const ok = await headExists(`https://www.bom.gov.au/radar/${file}`, radarId);
      return ok
        ? { ts, file, url: `/api/bom-radar?type=image&file=${file}` }
        : null;
    }),
  );
  return checks.filter((f): f is Frame => f !== null); // oldest → newest
}

router.get("/bom-radar/frames", async (req: Request, res: Response) => {
  const radarId = (req.query.radar as string) || "IDR403";
  const count = Math.min(10, Math.max(2, parseInt(req.query.count as string) || 6));

  // Only catalogued radar products are probed · see KNOWN_RADAR_IDS above. This
  // is what bounds BOM HEAD volume: a caller can't fan out arbitrary IDR ids to
  // trigger a probe storm.
  if (!ALLOWED_RADAR_ID.test(radarId) || !KNOWN_RADAR_IDS.has(radarId)) {
    res.status(400).json({ error: "Invalid radar id" });
    return;
  }

  // Keep the most recent `count` frames (oldest → newest animation order).
  const slice = (frames: Frame[]): Frame[] => frames.slice(-count);

  const cached = frameCache.get(radarId);
  if (cached && Date.now() - cached.fetchedAt < FRAME_CACHE_MS) {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=240");
    res.json({ radarId, frames: slice(cached.frames) });
    return;
  }

  try {
    let inflight = frameInflight.get(radarId);
    if (!inflight) {
      inflight = discoverFrames(radarId).finally(() => frameInflight.delete(radarId));
      frameInflight.set(radarId, inflight);
    }
    const frames = await inflight;
    if (frames.length === 0) {
      // Prefer a previous non-empty list over a transient empty (blip/403).
      if (cached && cached.frames.length > 0 && isServablyFresh(cached)) {
        res.setHeader("Cache-Control", "public, max-age=30");
        res.json({ radarId, frames: slice(cached.frames), stale: true });
        return;
      }
      // Negative-cache the empty result so an allowlisted-but-currently-empty
      // radar doesn't re-probe BOM (~17 HEADs) on every request for FRAME_CACHE_MS.
      frameCache.set(radarId, { frames: [], fetchedAt: Date.now() });
      res.setHeader("Cache-Control", "public, max-age=30");
      res.json({ radarId, frames: [] });
      return;
    }
    frameCache.set(radarId, { frames, fetchedAt: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=240");
    res.json({ radarId, frames: slice(frames) });
  } catch (err) {
    if (cached && isServablyFresh(cached)) {
      res.setHeader("Cache-Control", "public, max-age=30");
      res.json({ radarId, frames: slice(cached.frames), stale: true });
      return;
    }
    res.status(502).json({ error: "Failed to discover BOM radar frames", detail: String(err) });
  }
});

// ─── RainViewer proxy ───────────────────────────────────────────────────
// Yamanouchi's map uses RainViewer for radar tiles. Proxying the
// weather-maps.json metadata call through the backend keeps the third-party
// host out of the browser CORS surface, lets us cache server-side, and means
// we can swap providers without a frontend release.
//
// The actual tile PNGs are still served direct from RainViewer's CDN
// (response includes an absolute `host`). Only the discovery JSON is proxied.
interface RainViewerCacheEntry {
  payload: unknown;
  fetchedAt: number;
}
let rainViewerCache: RainViewerCacheEntry | null = null;
const RAINVIEWER_CACHE_MS = 60_000;

router.get("/radar/rainviewer", async (_req: Request, res: Response) => {
  if (rainViewerCache && Date.now() - rainViewerCache.fetchedAt < RAINVIEWER_CACHE_MS) {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(rainViewerCache.payload);
    return;
  }
  try {
    const r = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    if (!r.ok) {
      res.status(502).json({ error: "RAINVIEWER_UPSTREAM" });
      return;
    }
    const payload = await r.json();
    rainViewerCache = { payload, fetchedAt: Date.now() };
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(payload);
  } catch {
    res.status(502).json({ error: "RAINVIEWER_FETCH_FAILED" });
  }
});

export default router;
