import { Router, type Request, type Response } from "express";

const router = Router();

const ALLOWED_TRANSPARENCY = /^IDR\d+\.\w+\.png$/;
const ALLOWED_RADAR = /^IDR\d+\.T\.\d+\.png$/;
const ALLOWED_LOOP = /^IDR\d+\.gif$/;
const ALLOWED_RADAR_ID = /^IDR\d+$/;

const BOM_HEADERS = {
  // BOM blocks bot-style UAs on radar imagery; emulate a real browser.
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Accept: "image/png,image/*,*/*;q=0.8",
  "Accept-Language": "en-AU,en;q=0.9",
  Referer: "http://www.bom.gov.au/products/IDR403.loop.shtml",
};

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

  try {
    const response = await fetch(bomUrl, { headers: BOM_HEADERS });

    if (!response.ok) {
      res.status(response.status).json({ error: "BOM radar image not available" });
      return;
    }

    const contentType = response.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=60");

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(502).json({ error: "Failed to fetch BOM radar image" });
  }
});

// ─── Frame discovery ────────────────────────────────────────────────────
// BOM publishes radar PNGs every 6 minutes on the wall clock (00, 06, 12,
// ..., 54 UTC) with a 1-2 minute publishing latency. Filenames follow
// IDR<id>.T.YYYYMMDDHHMM.png (e.g. IDR403.T.202605080230.png).
//
// We HEAD-check the candidate frames so the client only ever asks for
// frames that actually exist - 404s on the radar tile would otherwise
// flicker the loop.
//
// Cached for 30s server-side; the client refreshes the frame list every
// 5 min, which lines up with the next radar publication.
interface FrameCacheEntry {
  frames: { ts: string; file: string; url: string }[];
  fetchedAt: number;
}
const frameCache = new Map<string, FrameCacheEntry>();
const FRAME_CACHE_MS = 30_000;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function buildCandidateTimestamps(count: number): string[] {
  // BOM publishes radar frames at 6-min wall-clock marks (00, 06, 12, ...
  // 54 UTC) but the actual cadence per radar varies - some sites publish
  // every 6 min, others (like IDR403) effectively every 10-30 min with
  // gaps. We over-generate candidates by a wide margin and let the HEAD
  // check filter to whatever actually exists.
  //
  // Algorithm:
  //   1. Take "now" minus 2 min publishing buffer.
  //   2. Round that down to the nearest 6-min wall-clock mark.
  //   3. Walk back `count` slots from there.
  // Working in epoch milliseconds avoids the negative-minute / overflow
  // bugs that come from setUTCMinutes() arithmetic.
  const SLOT_MS = 6 * 60 * 1000;
  const PUBLISH_BUFFER_MS = 2 * 60 * 1000;
  const anchorMs = Math.floor((Date.now() - PUBLISH_BUFFER_MS) / SLOT_MS) * SLOT_MS;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(anchorMs - i * SLOT_MS);
    const ts =
      t.getUTCFullYear().toString() +
      pad(t.getUTCMonth() + 1) +
      pad(t.getUTCDate()) +
      pad(t.getUTCHours()) +
      pad(t.getUTCMinutes());
    out.push(ts);
  }
  return out.reverse(); // oldest first → newest last (animation order)
}

async function headExists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", headers: BOM_HEADERS });
    return r.ok;
  } catch {
    return false;
  }
}

router.get("/bom-radar/frames", async (req: Request, res: Response) => {
  const radarId = (req.query.radar as string) || "IDR403";
  // `count` is the *target* number of real frames to return; `window` is
  // how many candidate 6-min slots we probe to find them. IDR403 has
  // gaps so we probe a 2-hour window to reliably surface 4-6 frames.
  const count = Math.min(12, Math.max(1, parseInt(req.query.count as string) || 6));
  const probeWindow = Math.min(40, Math.max(count, parseInt(req.query.window as string) || 20));

  if (!ALLOWED_RADAR_ID.test(radarId)) {
    res.status(400).json({ error: "Invalid radar id" });
    return;
  }

  const cacheKey = `${radarId}:${count}:${probeWindow}`;
  const cached = frameCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < FRAME_CACHE_MS) {
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json({ radarId, frames: cached.frames });
    return;
  }

  try {
    const candidates = buildCandidateTimestamps(probeWindow);
    const checks = await Promise.all(
      candidates.map(async (ts) => {
        const file = `${radarId}.T.${ts}.png`;
        const ok = await headExists(`https://www.bom.gov.au/radar/${file}`);
        return ok
          ? {
              ts,
              file,
              url: `/api/bom-radar?type=image&file=${file}`,
            }
          : null;
      }),
    );
    // Keep only the most recent `count` real frames (preserve oldest →
    // newest order for the animation).
    const allFrames = checks.filter((f): f is NonNullable<typeof f> => f !== null);
    const frames = allFrames.slice(-count);

    frameCache.set(cacheKey, { frames, fetchedAt: Date.now() });
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json({ radarId, frames });
  } catch (err) {
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
