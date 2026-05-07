import { Router, type Request, type Response } from "express";

const router = Router();

const ALLOWED_TRANSPARENCY = /^IDR\d+\.\w+\.png$/;
const ALLOWED_RADAR = /^IDR\d+\.T\.\d+\.png$/;
const ALLOWED_LOOP = /^IDR\d+\.gif$/;

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
    const response = await fetch(bomUrl, {
      headers: {
        // BOM blocks bot-style UAs on radar imagery; emulate a real browser.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "image/png,image/*,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        Referer: "http://www.bom.gov.au/products/IDR403.loop.shtml",
      },
    });

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

export default router;
